/** Tiny MQTT 3.1.1 client over WebSocket. No game server — GitHub Pages stays static. */

const enc = new TextEncoder();
const dec = new TextDecoder();

const BROKERS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
  "wss://test.mosquitto.org:8081/mqtt",
  "wss://mqtt.eclipseprojects.io:443/mqtt",
];

function slug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "main";
}

export function sanitizeName(s) {
  const t = String(s || "")
    .replace(/[^\w \-'.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return t || defaultName();
}

export function defaultName() {
  const n = Math.floor(Math.random() * 90 + 10);
  return `bartender_${n}`;
}

export function siteKey() {
  const loc = globalThis.location || { host: "local", pathname: "/" };
  const path = (loc.pathname || "/")
    .replace(/\/index\.html?$/i, "")
    .replace(/\/+$/, "") || "/";
  return slug(`${loc.host}${path}`);
}

function u16(n) {
  return Uint8Array.of((n >> 8) & 255, n & 255);
}

function mqttStr(s) {
  const b = enc.encode(s);
  const o = new Uint8Array(2 + b.length);
  o.set(u16(b.length));
  o.set(b, 2);
  return o;
}

function remBytes(n) {
  const out = [];
  do {
    let d = n % 128;
    n = Math.floor(n / 128);
    if (n > 0) d |= 128;
    out.push(d);
  } while (n > 0);
  return out;
}

function concat(parts) {
  let n = 0;
  for (const p of parts) n += p.length;
  const o = new Uint8Array(n);
  let i = 0;
  for (const p of parts) {
    o.set(p, i);
    i += p.length;
  }
  return o;
}

function packet(typeFlags, payload) {
  const rem = remBytes(payload.length);
  const p = new Uint8Array(1 + rem.length + payload.length);
  p[0] = typeFlags;
  p.set(rem, 1);
  p.set(payload, 1 + rem.length);
  return p;
}

function readRem(buf, i) {
  let mul = 1;
  let len = 0;
  let n = 0;
  while (n < 4) {
    if (i >= buf.length) return null;
    const b = buf[i++];
    n++;
    len += (b & 127) * mul;
    if ((b & 128) === 0) return { len, i };
    mul *= 128;
  }
  throw new Error("bad remaining length");
}

function readStr(buf, i) {
  const n = (buf[i] << 8) | buf[i + 1];
  const s = dec.decode(buf.subarray(i + 2, i + 2 + n));
  return { s, i: i + 2 + n };
}

export function makeClientId() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function connectNet(opts) {
  const name = sanitizeName(opts.name);
  const room = slug(opts.room || "main");
  const site = siteKey();
  const id = opts.id || makeClientId();
  const root = `ipour/v1/${site}/${room}`;
  const stTopic = `${root}/st/${id}`;
  const evTopic = `${root}/ev`;
  const stFilter = `${root}/st/+`;

  let ws = null;
  let alive = true;
  let ready = false;
  let brokerIndex = 0;
  let pingTimer = 0;
  let retryTimer = 0;
  let buf = new Uint8Array(0);
  let packetId = 1;

  const api = {
    id,
    name,
    room,
    site,
    ready: () => ready,
    sendState(obj) {
      if (!ready || !ws || ws.readyState !== 1) return;
      publish(stTopic, JSON.stringify(obj), true);
    },
    sendEvent(obj) {
      if (!ready || !ws || ws.readyState !== 1) return;
      publish(evTopic, JSON.stringify({ ...obj, from: id }), false);
    },
    leave() {
      alive = false;
      clearInterval(pingTimer);
      clearTimeout(retryTimer);
      try {
        if (ws && ws.readyState === 1) {
          publish(stTopic, "", true);
          ws.send(packet(0xe0, new Uint8Array(0)));
        }
      } catch {
        /* ignore */
      }
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      ready = false;
      opts.onStatus?.("offline");
    },
  };

  function send(bytes) {
    if (ws && ws.readyState === 1) ws.send(bytes);
  }

  function publish(topic, payloadStr, retain) {
    const body = enc.encode(payloadStr);
    const payload = concat([mqttStr(topic), body]);
    send(packet(retain ? 0x31 : 0x30, payload));
  }

  function handle(bufAll) {
    buf = concat([buf, bufAll]);
    if (buf.length > 1_000_000) buf = new Uint8Array(0);
    let guard = 0;
    while (buf.length >= 2 && guard++ < 64) {
      let rem;
      try {
        rem = readRem(buf, 1);
      } catch {
        buf = new Uint8Array(0);
        return;
      }
      if (!rem) return;
      if (rem.len > 200000) {
        buf = new Uint8Array(0);
        return;
      }
      const total = rem.i + rem.len;
      if (total < 2) {
        buf = buf.subarray(1);
        continue;
      }
      if (buf.length < total) return;
      const header = buf[0];
      const type = header >> 4;
      const body = buf.subarray(rem.i, total);
      buf = buf.subarray(total);
      try {
        onPacket(type, body, header);
      } catch (err) {
        console.warn("mqtt packet", err);
      }
    }
  }

  function onPacket(type, body, header) {
    if (type === 2) {
      const code = body.length > 1 ? body[1] : 1;
      if (code !== 0) {
        opts.onStatus?.("offline");
        ws?.close();
        return;
      }
      const pid = packetId++ & 0xffff || 1;
      const sub = concat([
        u16(pid),
        mqttStr(stFilter),
        Uint8Array.of(0),
        mqttStr(evTopic),
        Uint8Array.of(0),
      ]);
      send(packet(0x82, sub));
      return;
    }
    if (type === 9) {
      ready = true;
      opts.onStatus?.("online");
      opts.onReady?.();
      return;
    }
    if (type === 3) {
      const qos = (header >> 1) & 3;
      const topic = readStr(body, 0);
      let i = topic.i;
      if (qos > 0) i += 2;
      const payload = dec.decode(body.subarray(i));
      onPublish(topic.s, payload);
    }
  }

  function onPublish(topic, payload) {
    if (topic === evTopic) {
      if (!payload) return;
      try {
        const msg = JSON.parse(payload);
        if (msg.from === id) return;
        opts.onEvent?.(msg);
      } catch {
        /* ignore */
      }
      return;
    }
    const prefix = `${root}/st/`;
    if (!topic.startsWith(prefix)) return;
    const peerId = topic.slice(prefix.length);
    if (!peerId || peerId === id) return;
    if (!payload) {
      opts.onPeerLeave?.(peerId);
      return;
    }
    try {
      const state = JSON.parse(payload);
      if (state.gone) {
        opts.onPeerLeave?.(peerId);
        return;
      }
      opts.onPeer?.(peerId, state);
    } catch {
      /* ignore */
    }
  }

  function open() {
    if (!alive) return;
    ready = false;
    opts.onStatus?.("connecting");
    const url = BROKERS[Math.floor(brokerIndex / 2) % BROKERS.length];
    const useProto = brokerIndex % 2 === 0;
    let sock;
    try {
      sock = useProto ? new WebSocket(url, ["mqtt"]) : new WebSocket(url);
    } catch {
      failOver();
      return;
    }
    ws = sock;
    sock.binaryType = "arraybuffer";
    const timeout = setTimeout(() => {
      if (sock.readyState !== 1) {
        try {
          sock.close();
        } catch {
          /* ignore */
        }
      }
    }, 5000);
    sock.onopen = () => {
      clearTimeout(timeout);
      buf = new Uint8Array(0);
      const flags = 0x26;
      const keep = 30;
      const vh = concat([mqttStr("MQTT"), Uint8Array.of(4, flags, keep >> 8, keep & 255)]);
      const pl = concat([mqttStr(`ip${id}`), mqttStr(stTopic), mqttStr("")]);
      send(packet(0x10, concat([vh, pl])));
    };
    sock.onmessage = (ev) => {
      const data = ev.data;
      if (data instanceof ArrayBuffer) handle(new Uint8Array(data));
      else if (data instanceof Blob) data.arrayBuffer().then((ab) => handle(new Uint8Array(ab)));
    };
    sock.onerror = () => {};
    sock.onclose = () => {
      clearTimeout(timeout);
      ready = false;
      if (!alive) return;
      opts.onStatus?.("offline");
      failOver();
    };
  }

  function failOver() {
    brokerIndex += 1;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(open, 700 + Math.min(4000, brokerIndex * 400));
  }

  pingTimer = setInterval(() => {
    if (ready && ws && ws.readyState === 1) send(packet(0xc0, new Uint8Array(0)));
  }, 20000);

  window.addEventListener("pagehide", () => api.leave());
  window.addEventListener("beforeunload", () => api.leave());
  open();
  return api;
}

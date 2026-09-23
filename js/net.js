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

  let alive = true;
  let wasOnline = false;
  let lastState = "";
  let packetId = 1;
  let pingTimer = 0;
  const sockets = [];

  function anyReady() {
    return sockets.some((s) => s.ready && s.ws && s.ws.readyState === 1);
  }

  function setStatus() {
    const online = anyReady();
    if (online) {
      if (!wasOnline) {
        wasOnline = true;
        opts.onStatus?.("online");
        opts.onReady?.();
      }
      return;
    }
    if (wasOnline) {
      wasOnline = false;
      opts.onStatus?.(alive ? "connecting" : "offline");
    } else if (alive) {
      opts.onStatus?.("connecting");
    }
  }

  function publishOn(s, topic, payloadStr, retain) {
    if (!s.ready || !s.ws || s.ws.readyState !== 1) return;
    const body = enc.encode(payloadStr);
    const payload = concat([mqttStr(topic), body]);
    try {
      s.ws.send(packet(retain ? 0x31 : 0x30, payload));
    } catch {
      /* ignore */
    }
  }

  const api = {
    id,
    name,
    room,
    site,
    ready: () => anyReady(),
    sendState(obj) {
      lastState = JSON.stringify(obj);
      for (const s of sockets) publishOn(s, stTopic, lastState, true);
    },
    sendEvent(obj) {
      const payload = JSON.stringify({ ...obj, from: id });
      for (const s of sockets) publishOn(s, evTopic, payload, false);
    },
    leave() {
      alive = false;
      clearInterval(pingTimer);
      for (const s of sockets) {
        clearTimeout(s.retryTimer);
        try {
          if (s.ws && s.ws.readyState === 1) {
            publishOn(s, stTopic, "", true);
            s.ws.send(packet(0xe0, new Uint8Array(0)));
          }
        } catch {
          /* ignore */
        }
        try {
          s.ws?.close();
        } catch {
          /* ignore */
        }
        s.ready = false;
        s.ws = null;
      }
      wasOnline = false;
      opts.onStatus?.("offline");
    },
  };

  function handle(s, bufAll) {
    s.buf = concat([s.buf, bufAll]);
    if (s.buf.length > 1_000_000) s.buf = new Uint8Array(0);
    let guard = 0;
    while (s.buf.length >= 2 && guard++ < 64) {
      let rem;
      try {
        rem = readRem(s.buf, 1);
      } catch {
        s.buf = new Uint8Array(0);
        return;
      }
      if (!rem) return;
      if (rem.len > 200000) {
        s.buf = new Uint8Array(0);
        return;
      }
      const total = rem.i + rem.len;
      if (total < 2) {
        s.buf = s.buf.subarray(1);
        continue;
      }
      if (s.buf.length < total) return;
      const header = s.buf[0];
      const type = header >> 4;
      const body = s.buf.subarray(rem.i, total);
      s.buf = s.buf.subarray(total);
      try {
        onPacket(s, type, body, header);
      } catch (err) {
        console.warn("mqtt packet", err);
      }
    }
  }

  function onPacket(s, type, body, header) {
    if (type === 2) {
      const code = body.length > 1 ? body[1] : 1;
      if (code !== 0) {
        s.ready = false;
        try {
          s.ws?.close();
        } catch {
          /* ignore */
        }
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
      try {
        s.ws.send(packet(0x82, sub));
      } catch {
        /* ignore */
      }
      return;
    }
    if (type === 9) {
      s.ready = true;
      if (lastState) publishOn(s, stTopic, lastState, true);
      setStatus();
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

  function openSock(s) {
    if (!alive) return;
    s.ready = false;
    const useProto = s.protoTry === 0;
    let sock;
    try {
      sock = useProto ? new WebSocket(s.url, ["mqtt"]) : new WebSocket(s.url);
    } catch {
      failOver(s);
      return;
    }
    s.ws = sock;
    sock.binaryType = "arraybuffer";
    const timeout = setTimeout(() => {
      if (sock.readyState !== 1) {
        try {
          sock.close();
        } catch {
          /* ignore */
        }
      }
    }, 6000);
    sock.onopen = () => {
      clearTimeout(timeout);
      s.buf = new Uint8Array(0);
      const flags = 0x26;
      const keep = 45;
      const vh = concat([mqttStr("MQTT"), Uint8Array.of(4, flags, keep >> 8, keep & 255)]);
      const pl = concat([mqttStr(`ip${id}`), mqttStr(stTopic), mqttStr("")]);
      try {
        sock.send(packet(0x10, concat([vh, pl])));
      } catch {
        /* ignore */
      }
    };
    sock.onmessage = (ev) => {
      const data = ev.data;
      if (data instanceof ArrayBuffer) handle(s, new Uint8Array(data));
      else if (data instanceof Blob) data.arrayBuffer().then((ab) => handle(s, new Uint8Array(ab)));
    };
    sock.onerror = () => {};
    sock.onclose = () => {
      clearTimeout(timeout);
      if (s.ws === sock) {
        s.ready = false;
        s.ws = null;
      }
      setStatus();
      if (!alive) return;
      failOver(s);
    };
  }

  function failOver(s) {
    s.protoTry = (s.protoTry + 1) % 2;
    s.fails += 1;
    clearTimeout(s.retryTimer);
    s.retryTimer = setTimeout(() => openSock(s), 700 + Math.min(5000, s.fails * 350));
  }

  opts.onStatus?.("connecting");
  for (let i = 0; i < BROKERS.length; i++) {
    const s = {
      url: BROKERS[i],
      protoTry: 0,
      ready: false,
      ws: null,
      buf: new Uint8Array(0),
      retryTimer: 0,
      fails: 0,
    };
    sockets.push(s);
    setTimeout(() => openSock(s), i * 160);
  }

  pingTimer = setInterval(() => {
    for (const s of sockets) {
      if (s.ready && s.ws && s.ws.readyState === 1) {
        try {
          s.ws.send(packet(0xc0, new Uint8Array(0)));
        } catch {
          /* ignore */
        }
      }
    }
  }, 12000);

  window.addEventListener("pagehide", () => api.leave());
  window.addEventListener("beforeunload", () => api.leave());
  return api;
}

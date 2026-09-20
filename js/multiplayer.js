import * as THREE from "three";
import { connectNet, sanitizeName, defaultName } from "./net.js?v=28";

const SHIRTS = [0x3d6ea8, 0xc44b3c, 0x2e8b57, 0xb8860b, 0x7b4b9a, 0xd46aa0, 0x2c6e49, 0xe07a3d];
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const EYE = 1.58;
const BOT_ID = "house-bot";
const BOT_WAYS = [
  { x: 3.2, z: 1.6 },
  { x: 5.4, z: 2.4 },
  { x: 5.4, z: 4.0 },
  { x: 1.5, z: 4.15 },
  { x: -2.15, z: 4.25 },
  { x: -6.05, z: 4.25 },
  { x: -6.05, z: 1.65 },
  { x: -2.15, z: 1.65 },
  { x: 0.5, z: 2.05 },
];

let scene = null;
let camera = null;
let blitText = null;
let toast = null;
let onRestock = null;
let net = null;
let status = "offline";
let local = { name: defaultName(), room: "main", gender: "m" };
const remotes = new Map();
const seenRestock = new Set();
let poseAcc = 0;
let hbAcc = 0;
let lastPose = "";
let forcePose = false;
let heldFn = () => "";
let pouringFn = () => false;
let drunkFn = () => 0;
let poseFn = null;
let gameHandler = null;
let collideFn = (x, z) => [x, z];
let bot = null;
let botAI = null;

export function playerName() {
  return local.name;
}

export function playerGender() {
  return local.gender === "f" ? "f" : "m";
}

export function netStatus() {
  return status;
}

export function onlineCount() {
  return remotes.size + 1 + (bot ? 1 : 0);
}

export function localId() {
  return net?.id || "";
}

export function humanPeers() {
  return [...remotes.values()].map((p) => ({ id: p.id, name: p.name }));
}

export function publishEvent(obj) {
  net?.sendEvent(obj);
}

export function setGameHandler(fn) {
  gameHandler = fn;
}

export function setWorldCollide(fn) {
  collideFn = fn || ((x, z) => [x, z]);
}

export function roster() {
  const rows = [{ id: "you", name: local.name, you: true, drunk: drunkFn() }];
  if (bot) rows.push({ id: BOT_ID, name: bot.name, you: false, drunk: bot.bac || 0, bot: true });
  for (const [id, p] of remotes) rows.push({ id, name: p.name, you: false, drunk: p.drunk || p.bac || 0 });
  return rows;
}

function colorOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SHIRTS[h % SHIRTS.length];
}

function phaseOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 159.15;
}

function clamp(n, a = 0, b = 1) {
  n = Number(n);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
}

function lambert(color) {
  return new THREE.MeshLambertMaterial({ color });
}

function addBox(parent, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(unitBox, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function makeNametag(name) {
  const label = String(name || "?").toUpperCase().slice(0, 16);
  const scale = 2;
  const glyphW = Math.max(1, label.replace(/ /g, "").length * 4 + (label.split(" ").length - 1) * 3);
  const textW = glyphW * scale;
  const w = Math.max(32, textW + 10);
  const h = 14;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(8, 6, 4, 0.84)";
  ctx.fillRect(0, 0, w, h);
  blitText(ctx, label, Math.floor((w - textW) / 2), 4, "#f4ead0", scale);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    sizeAttenuation: true,
  });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(w * 0.018, h * 0.018, 1);
  spr.position.y = 1.8;
  spr.renderOrder = 20;
  spr.userData.label = label;
  return spr;
}

function styleHair(head, hair, gender) {
  if (gender === "f") {
    addBox(head, hair, 0, 0.1, -0.04, 0.32, 0.16, 0.34);
    addBox(head, hair, 0, -0.02, -0.16, 0.12, 0.3, 0.12);
    addBox(head, hair, 0.12, 0.06, 0.04, 0.08, 0.14, 0.16);
    addBox(head, hair, -0.12, 0.06, 0.04, 0.08, 0.14, 0.16);
  } else {
    addBox(head, hair, 0, 0.12, -0.02, 0.3, 0.1, 0.3);
  }
}

function makeBartender(id, name, gender = "m") {
  gender = gender === "f" ? "f" : "m";
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);

  const shirt = lambert(colorOf(id));
  const skin = lambert(0xe8b48a);
  const pantsMat = lambert(0x1d1d28);
  const shoe = lambert(0x121014);
  const hair = lambert(gender === "f" ? 0x3a1a12 : 0x2a1810);
  const eye = lambert(0x1a0c08);
  const starMat = lambert(0xffe066);

  const hipPants = addBox(body, pantsMat, 0, 0.55, 0, 0.34, 0.38, 0.18);
  hipPants.userData.homeY = 0.55;
  addBox(body, shirt, 0, 0.98, 0, gender === "f" ? 0.36 : 0.38, 0.46, 0.22);

  const head = new THREE.Group();
  head.position.set(0, 1.38, 0);
  addBox(head, skin, 0, 0, 0, 0.28, 0.28, 0.28);
  styleHair(head, hair, gender);
  addBox(head, eye, -0.06, 0.02, 0.14, 0.05, 0.04, 0.03);
  addBox(head, eye, 0.06, 0.02, 0.14, 0.05, 0.04, 0.03);
  body.add(head);

  const armL = new THREE.Group();
  addBox(armL, shirt, 0, -0.08, 0, 0.12, 0.36, 0.12);
  addBox(armL, skin, 0, -0.3, 0, 0.1, 0.14, 0.1);
  armL.position.set(-0.26, 1.1, 0);
  body.add(armL);

  const armR = new THREE.Group();
  addBox(armR, shirt, 0, -0.08, 0, 0.12, 0.36, 0.12);
  addBox(armR, skin, 0, -0.3, 0, 0.1, 0.14, 0.1);
  const held = addBox(armR, lambert(0xc47b20), 0, -0.42, 0.02, 0.08, 0.16, 0.08);
  held.visible = false;
  armR.position.set(0.26, 1.1, 0);
  body.add(armR);

  const legL = new THREE.Group();
  addBox(legL, pantsMat, 0, -0.1, 0, 0.12, 0.22, 0.12);
  const shinL = new THREE.Group();
  shinL.position.set(0, -0.22, 0);
  addBox(shinL, pantsMat, 0, -0.12, 0, 0.11, 0.24, 0.11);
  addBox(shinL, shoe, 0, -0.26, 0.04, 0.12, 0.08, 0.16);
  legL.add(shinL);
  legL.position.set(-0.1, 0.42, 0);
  body.add(legL);

  const legR = new THREE.Group();
  addBox(legR, pantsMat, 0, -0.1, 0, 0.12, 0.22, 0.12);
  const shinR = new THREE.Group();
  shinR.position.set(0, -0.22, 0);
  addBox(shinR, pantsMat, 0, -0.12, 0, 0.11, 0.24, 0.11);
  addBox(shinR, shoe, 0, -0.26, 0.04, 0.12, 0.08, 0.16);
  legR.add(shinR);
  legR.position.set(0.1, 0.42, 0);
  body.add(legR);

  const stars = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const m = addBox(stars, starMat, Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22, 0.06, 0.06, 0.06);
    m.castShadow = false;
  }
  stars.position.set(0, 0.28, 0);
  stars.visible = false;
  head.add(stars);

  const peeDrops = [];
  const peeMat = lambert(0xe8d24a);
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(unitBox, peeMat);
    m.scale.set(0.028, 0.07, 0.028);
    m.visible = false;
    m.castShadow = false;
    m.userData.life = 0;
    m.userData.v = new THREE.Vector3();
    g.add(m);
    peeDrops.push(m);
  }

  const tag = makeNametag(name);
  g.add(tag);
  g.userData = {
    body,
    head,
    armL,
    armR,
    legL,
    legR,
    shinL,
    shinR,
    held,
    tag,
    stars,
    skin,
    hipPants,
    peeDrops,
    gender,
    walk: 0,
    peeEmit: 0,
  };
  return g;
}

export function makeAvatar(id, name, gender) {
  return makeBartender(id, name || "you", gender || local.gender);
}

export function tickAvatar(peer, dt, t) {
  if (!peer) return;
  animatePeer(peer, dt, t);
}

function setNametag(peer, name) {
  const next = String(name || "?").toUpperCase().slice(0, 16);
  if (peer.rig.userData.tag.userData.label === next) return;
  const old = peer.rig.userData.tag;
  peer.rig.remove(old);
  old.material.map?.dispose();
  old.material.dispose();
  const tag = makeNametag(next);
  peer.rig.add(tag);
  peer.rig.userData.tag = tag;
}

function spawnPeer(id, state) {
  const name = sanitizeName(state.n || "regular");
  const gender = state.g === "f" ? "f" : "m";
  const rig = makeBartender(id, name, gender);
  const yaw = state.yaw || 0;
  const groundY = Math.max(0, (state.y ?? EYE) - EYE);
  rig.position.set(state.x || 0, groundY, state.z || 0);
  rig.rotation.y = yaw;
  scene.add(rig);
  const peer = {
    id,
    name,
    gender,
    rig,
    tx: state.x || 0,
    tz: state.z || 0,
    ty: state.y ?? EYE,
    tyaw: yaw,
    tpit: state.pit || 0,
    pit: state.pit || 0,
    bac: clamp(state.b, 0, 1.35),
    held: state.h || "",
    pouring: !!state.p,
    last: performance.now(),
    phase: phaseOf(id),
    lx: state.x || 0,
    lz: state.z || 0,
    sit: !!state.s,
    pee: !!state.u,
  };
  remotes.set(id, peer);
  if (remotes.size >= 1) killBot(false);
  peer.rig.userData.held.visible = !!peer.held;
  toast?.(`${name} walked in`);
  return peer;
}

function dropPeer(id, silent) {
  const peer = remotes.get(id);
  if (!peer) return;
  scene.remove(peer.rig);
  remotes.delete(id);
  if (!silent) toast?.(`${peer.name} left the bar`);
}

function applyState(id, state) {
  if (state && typeof state.t === "number" && Math.abs(Date.now() - state.t) > 20000) return;
  let peer = remotes.get(id);
  if (!peer) {
    if (remotes.size >= 20) return;
    peer = spawnPeer(id, state);
  }
  peer.name = sanitizeName(state.n || peer.name);
  setNametag(peer, peer.name);
  peer.tx = state.x ?? peer.tx;
  peer.tz = state.z ?? peer.tz;
  peer.ty = state.y ?? peer.ty;
  peer.tyaw = state.yaw ?? peer.tyaw;
  peer.tpit = state.pit ?? peer.tpit;
  if (state.b != null) peer.bac = clamp(state.b, 0, 1.35);
  peer.held = state.h || "";
  peer.pouring = !!state.p;
  peer.sit = !!state.s;
  peer.pee = !!state.u;
  if (state.g) peer.gender = state.g === "f" ? "f" : "m";
  peer.last = performance.now();
  peer.rig.userData.held.visible = !!peer.held;
}

function slugRoom(s) {
  return (
    String(s || "main")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "main"
  );
}

export function loadIdentity() {
  let name = "";
  let room = "main";
  let gender = "m";
  try {
    name = localStorage.getItem("infinite-pour-name") || "";
    room = localStorage.getItem("infinite-pour-room") || "main";
    gender = localStorage.getItem("infinite-pour-gender") === "f" ? "f" : "m";
  } catch {
    /* ignore */
  }
  if (!name) name = defaultName();
  return { name: sanitizeName(name), room: slugRoom(room), gender };
}

export function bootMultiplayer(opts) {
  scene = opts.scene;
  camera = opts.camera;
  blitText = opts.blitText;
  toast = opts.toast;
  onRestock = opts.onRestock;
  if (opts.collide) collideFn = opts.collide;
  local.name = sanitizeName(opts.name || local.name);
  local.room = slugRoom(opts.room);
  local.gender = opts.gender === "f" ? "f" : "m";
  try {
    localStorage.setItem("infinite-pour-name", local.name);
    localStorage.setItem("infinite-pour-room", local.room);
    localStorage.setItem("infinite-pour-gender", local.gender);
  } catch {
    /* ignore */
  }
  if (net) net.leave();
  for (const id of [...remotes.keys()]) dropPeer(id, true);
  killBot(true);
  status = "connecting";
  net = connectNet({
    name: local.name,
    room: local.room,
    onStatus(s) {
      status = s;
    },
    onReady() {
      lastPose = "";
      forcePose = true;
    },
    onPeer(id, state) {
      try {
        applyState(id, state);
      } catch (err) {
        console.warn("peer", err);
      }
    },
    onPeerLeave(id) {
      dropPeer(id);
    },
    onEvent(msg) {
      if (msg.t === "restock") {
        if (seenRestock.has(msg.id)) return;
        seenRestock.add(msg.id);
        onRestock?.(msg.by || "someone");
        return;
      }
      try {
        gameHandler?.(msg);
      } catch (err) {
        console.warn("game event", err);
      }
    },
  });
}

export function setPoseSources(getHeld, getPouring, getDrunk, getPose) {
  heldFn = getHeld;
  pouringFn = getPouring;
  if (getDrunk) drunkFn = getDrunk;
  if (getPose) poseFn = getPose;
}

function lookYaw() {
  const d = new THREE.Vector3();
  camera.getWorldDirection(d);
  return Math.atan2(d.x, d.z);
}

function lookPitch() {
  const d = new THREE.Vector3();
  camera.getWorldDirection(d);
  return Math.asin(clamp(d.y, -1, 1));
}

function sendPose() {
  if (!net || !camera) return;
  const extra = poseFn?.() || {};
  const pose = {
    n: local.name,
    x: round(extra.x ?? camera.position.x),
    y: round(extra.y ?? camera.position.y),
    z: round(extra.z ?? camera.position.z),
    yaw: round(extra.yaw ?? lookYaw(), 3),
    pit: round(extra.pit ?? lookPitch(), 3),
    b: round(clamp(drunkFn(), 0, 1.35), 2),
    h: String(heldFn() || "").slice(0, 24),
    p: pouringFn() ? 1 : 0,
    s: extra.s ? 1 : 0,
    u: extra.u ? 1 : 0,
    g: extra.g === "f" || local.gender === "f" ? "f" : "m",
    t: Date.now(),
  };
  const key = `${pose.x}|${pose.y}|${pose.z}|${pose.yaw}|${pose.pit}|${pose.b}|${pose.h}|${pose.p}|${pose.s}|${pose.u}|${pose.g}`;
  if (!forcePose && key === lastPose) return;
  lastPose = key;
  forcePose = false;
  net.sendState(pose);
}

function round(n, p = 2) {
  const m = 10 ** p;
  return Math.round(n * m) / m;
}

function poseSit(peer) {
  const u = peer.rig.userData;
  u.body.position.y = -0.38;
  u.body.rotation.set(0.16, 0, 0);
  u.legL.rotation.set(-1.52, 0.1, 0.18);
  u.legR.rotation.set(-1.52, -0.1, -0.18);
  if (u.shinL) u.shinL.rotation.set(1.38, 0, 0);
  if (u.shinR) u.shinR.rotation.set(1.38, 0, 0);
  u.armL.rotation.set(-0.72, 0, 0.22);
  u.armR.rotation.set(peer.pouring ? -1.1 : -0.72, 0, -0.22);
}

function tickPee(peer, dt, t) {
  const u = peer.rig.userData;
  const drops = u.peeDrops || [];
  const girl = (peer.gender || u.gender) === "f";
  if (peer.pee) {
    u.peeEmit -= dt;
    if (u.peeEmit <= 0) {
      u.peeEmit = 0.045;
      const drop = drops.find((m) => !m.visible);
      if (drop) {
        const wob = Math.sin(t * 18 + (peer.phase || 0)) * (0.04 + clamp(peer.bac) * 0.12);
        const hipY = (u.body ? u.body.position.y : 0) + (girl ? 0.44 : 0.52);
        drop.position.set((Math.random() - 0.5) * 0.04 + wob, hipY, 0.12);
        drop.userData.v.set((Math.random() - 0.5) * 0.12 + wob * 1.6, girl ? -1.55 : -0.5, girl ? 0.4 : 1.25 + Math.random() * 0.2);
        drop.userData.life = 0.42 + Math.random() * 0.18;
        drop.visible = true;
      }
    }
  } else {
    u.peeEmit = 0;
  }
  for (const drop of drops) {
    if (!drop.visible) continue;
    drop.userData.life -= dt;
    drop.position.addScaledVector(drop.userData.v, dt);
    drop.userData.v.y -= 9 * dt;
    drop.scale.setScalar(0.7 + drop.userData.life);
    if (drop.userData.life <= 0 || drop.position.y < 0.02) drop.visible = false;
  }
}

function animatePeer(peer, dt, t) {
  const rig = peer.rig;
  const u = rig.userData;
  const drunk = clamp(peer.bac, 0, 1.35);
  const phase = peer.phase || 0;
  const off = Math.max(0, (peer.ty ?? EYE) - EYE);
  const air = !peer.sit && (off > 0.18 || rig.position.y > 0.16);

  const dx = peer.tx - rig.position.x;
  const dz = peer.tz - rig.position.z;
  const k = peer.local ? 1 : Math.min(1, dt * (air ? 16 : 12));
  rig.position.x += dx * k;
  rig.position.z += dz * k;
  const targetY = peer.sit ? 0.22 : air ? off : 0;
  rig.position.y += (targetY - rig.position.y) * (peer.local ? 1 : Math.min(1, dt * 16));

  if (peer.freezeFacing) {
    rig.rotation.y = peer.tyaw;
    peer.pit = peer.tpit || 0;
  } else {
    let dyaw = peer.tyaw - rig.rotation.y;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    rig.rotation.y += dyaw * (peer.local ? 1 : Math.min(1, dt * 12));
    peer.pit += ((peer.tpit || 0) - peer.pit) * Math.min(1, dt * 14);
  }

  const vx = (rig.position.x - peer.lx) / Math.max(dt, 1e-4);
  const vz = (rig.position.z - peer.lz) / Math.max(dt, 1e-4);
  peer.lx = rig.position.x;
  peer.lz = rig.position.z;
  const vel = Math.hypot(vx, vz);
  const moving = !air && !peer.sit && !peer.pee && vel > 0.18;

  if (moving) u.walk += dt * (5.5 + drunk * 3.6) * (0.7 + Math.min(1.4, vel / 2.2));
  else if (drunk > 0.18 && !peer.sit && !peer.pee) u.walk += dt * drunk * 1.8;

  const limp = Math.min(1.2, drunk * 1.15);
  const gait = u.walk;
  const warped = gait + Math.sin(gait) * limp * 0.55;
  const amp = moving ? Math.min(0.9, 0.22 + vel * 0.22) : drunk * 0.18;
  const leftSwing = Math.sin(warped) * amp * (1 - limp * 0.58);
  const rightSwing = Math.sin(warped + Math.PI) * amp * (1 + limp * 0.28);
  const hitch = moving ? Math.max(0, -Math.sin(warped)) * limp * 0.07 : Math.sin(t * 1.3 + phase) * drunk * 0.03;

  if (peer.sit) {
    poseSit(peer);
  } else if (air) {
    if (u.shinL) u.shinL.rotation.set(0.35, 0, 0);
    if (u.shinR) u.shinR.rotation.set(0.45, 0, 0);
    const loft = Math.min(1, rig.position.y / 0.45);
    u.legL.rotation.set(-0.55 - loft * 0.2, 0, limp * 0.08);
    u.legR.rotation.set(-0.32 - loft * 0.15, 0, -limp * 0.04);
    u.armL.rotation.set(0.55 + loft * 0.35, 0, -0.15);
    u.armR.rotation.set(peer.pouring ? -1.1 : 0.42 + loft * 0.25, 0, 0.12);
    u.body.position.y = 0;
    u.body.rotation.set(0.12 * loft, 0, 0);
  } else {
    if (u.shinL) u.shinL.rotation.set(Math.max(0, -leftSwing) * 0.35, 0, 0);
    if (u.shinR) u.shinR.rotation.set(Math.max(0, -rightSwing) * 0.35, 0, 0);
    u.legL.rotation.set(leftSwing, 0, limp * 0.2);
    u.legR.rotation.set(rightSwing, 0, -limp * 0.06);
    u.armL.rotation.set(-leftSwing * (0.7 - limp * 0.2) + Math.sin(t * 2.4 + phase) * drunk * 0.32, 0, drunk * 0.16);
    u.armR.rotation.set(
      peer.pouring ? -1.1 : -rightSwing * 0.65 + Math.sin(t * 1.7 + phase) * drunk * 0.26,
      0,
      -drunk * 0.1
    );
    u.body.position.y = hitch;
    u.body.rotation.set(
      Math.sin(t * 0.9 + phase) * drunk * 0.14 + (moving ? Math.sin(warped) * drunk * 0.08 : 0),
      Math.sin(t * 1.55 + phase) * drunk * 0.32,
      Math.sin(t * 1.25 + phase * 1.7) * drunk * 0.28 + (moving ? Math.sin(warped + 0.6) * limp * 0.16 : 0)
    );
  }

  if (peer.pee && !peer.sit && !air) {
    const girl = (peer.gender || u.gender) === "f";
    const squat = girl ? 0.22 : 0.06;
    u.body.position.y = hitch - squat;
    u.body.rotation.x = girl ? 0.22 : 0.08;
    if (girl) {
      u.legL.rotation.set(-0.95, 0.12, 0.38);
      u.legR.rotation.set(-0.95, -0.12, -0.38);
      if (u.shinL) u.shinL.rotation.set(1.15, 0, 0);
      if (u.shinR) u.shinR.rotation.set(1.15, 0, 0);
    } else {
      u.legL.rotation.set(0.08, 0.1, 0.46);
      u.legR.rotation.set(0.08, -0.1, -0.46);
      if (u.shinL) u.shinL.rotation.set(0.12, 0, 0);
      if (u.shinR) u.shinR.rotation.set(0.12, 0, 0);
    }
    u.armL.rotation.set(-0.55, 0, 0.62);
    u.armR.rotation.set(peer.pouring ? -1.1 : -0.4, 0, -0.5);
  }

  if (u.hipPants) {
    const down = peer.pee && !peer.sit;
    const targetY = down ? 0.14 : u.hipPants.userData.homeY;
    const targetZ = down ? 0.05 : 0;
    u.hipPants.position.y += (targetY - u.hipPants.position.y) * Math.min(1, dt * 8);
    u.hipPants.position.z += (targetZ - u.hipPants.position.z) * Math.min(1, dt * 8);
    u.hipPants.scale.y += ((down ? 0.52 : 1) - u.hipPants.scale.y) * Math.min(1, dt * 8);
    u.hipPants.scale.x += ((down ? 0.9 : 1) - u.hipPants.scale.x) * Math.min(1, dt * 8);
  }

  if (peer.freezeFacing) {
    u.body.rotation.y = 0;
    u.body.rotation.z = 0;
    if (peer.pee) {
      /* keep squat pitch */
    } else {
      u.body.rotation.x = 0;
      u.body.position.y = 0;
    }
  }

  if (peer.freezeHead) {
    u.head.rotation.set(-peer.pit, 0, 0);
  } else {
    u.head.rotation.set(-peer.pit, 0, Math.sin(t * 1.35 + phase) * drunk * 0.08);
  }

  const flush = Math.min(1, drunk * 0.85);
  u.skin.color.setRGB(0.91 + flush * 0.09, 0.706 - flush * 0.5, 0.541 - flush * 0.44);

  if (u.tag?.material) {
    u.tag.material.color.setHSL(0.09 - Math.min(1, drunk) * 0.09, 0.15 + Math.min(1, drunk) * 0.75, 1);
    u.tag.position.y = 1.8 + (u.stars.visible ? 0.08 : 0);
  }

  const showStars = drunk > 0.3;
  u.stars.visible = showStars && u.head.visible;
  if (showStars) {
    u.stars.rotation.y += dt * (1.6 + drunk * 6.2);
    u.stars.position.set(0, 0.22 + Math.sin(t * 5 + phase) * 0.03, 0);
    u.stars.scale.setScalar(0.5 + drunk * 0.7);
  }

  tickPee(peer, dt, t);
}

function killBot(silent) {
  if (!bot) return;
  scene?.remove(bot.rig);
  if (!silent) toast?.(`${bot.name} sat down — real shift walked in`);
  bot = null;
  botAI = null;
}

function ensureBot() {
  if (bot || !scene || !blitText) return;
  if (remotes.size >= 1) return;
  const name = "house_bot";
  const rig = makeBartender(BOT_ID, name, "m");
  rig.position.set(2.2, 0, 1.6);
  scene.add(rig);
  bot = {
    id: BOT_ID,
    name,
    gender: "m",
    rig,
    tx: 2.2,
    tz: 1.6,
    ty: EYE,
    tyaw: Math.PI,
    tpit: 0,
    pit: 0,
    bac: 0.16,
    held: "House Whiskey",
    pouring: false,
    last: performance.now(),
    phase: phaseOf(BOT_ID),
    lx: 2.2,
    lz: 1.6,
    sit: false,
    pee: false,
  };
  bot.rig.userData.held.visible = true;
  botAI = {
    way: 0,
    wait: 0.6,
    vy: 0,
    y: EYE,
    drinkT: 1.1,
    jumpT: 1.2,
    pourT: 6,
    look: 0,
  };
  toast?.("house_bot covers the empty shift");
}

function tickBot(dt, t) {
  if (!bot || !botAI) return;
  const ai = botAI;
  const drunk = bot.bac;
  ai.wait -= dt;
  ai.drinkT -= dt;
  ai.jumpT -= dt;
  ai.pourT -= dt;

  if (ai.drinkT <= 0) {
    bot.bac = Math.min(1.2, bot.bac + 0.1 + Math.random() * 0.06);
    ai.drinkT = 1.6 + Math.random() * 2.2 - drunk * 0.4;
    bot.held = ["House Whiskey", "Twisted Tea", "pint", "shot"][(Math.random() * 4) | 0];
  }
  if (bot.bac > 0.02) bot.bac = Math.max(0.05, bot.bac - dt * 0.006);

  if (ai.y <= EYE + 0.001 && ai.jumpT <= 0) {
    ai.vy = 5.0 + Math.random() * 0.8;
    ai.jumpT = 2.4 + Math.random() * 3.2 - drunk * 0.8;
  }
  ai.vy -= 18 * dt;
  ai.y += ai.vy * dt;
  if (ai.y <= EYE) {
    ai.y = EYE;
    ai.vy = 0;
  }
  bot.ty = ai.y;

  if (ai.pourT <= 0) {
    bot.pouring = !bot.pouring;
    ai.pourT = bot.pouring ? 0.8 + Math.random() * 0.7 : 5 + Math.random() * 6;
  }
  bot.rig.userData.held.visible = !!bot.held;

  ai.look += dt;
  bot.tpit = Math.sin(t * (0.7 + drunk) + bot.phase) * (0.15 + drunk * 0.45);

  if (ai.wait > 0) {
    bot.tyaw += Math.sin(t * 0.8) * drunk * 0.9 * dt;
  } else {
    const w = BOT_WAYS[ai.way % BOT_WAYS.length];
    const dx = w.x - bot.tx;
    const dz = w.z - bot.tz;
    const dist = Math.hypot(dx, dz) || 0.0001;
    if (dist < 0.32) {
      ai.way = (ai.way + 1 + ((Math.random() * 3) | 0)) % BOT_WAYS.length;
      ai.wait = 0.4 + Math.random() * 1.4 + drunk * 0.6;
    } else {
      const spd = (1.55 - drunk * 0.85) * (ai.y > EYE + 0.2 ? 0.7 : 1);
      const slip = (Math.random() - 0.5) * drunk * 0.35;
      let nx = bot.tx + (dx / dist) * spd * dt + slip * dt;
      let nz = bot.tz + (dz / dist) * spd * dt + slip * 0.5 * dt;
      const hit = collideFn(nx, nz, 0.36);
      nx = hit[0];
      nz = hit[1];
      const moved = Math.hypot(nx - bot.tx, nz - bot.tz);
      if (moved < spd * dt * 0.15) {
        ai.way = (ai.way + 1 + ((Math.random() * 4) | 0)) % BOT_WAYS.length;
        ai.wait = 0.2 + Math.random() * 0.5;
      }
      bot.tyaw = Math.atan2(nx - bot.tx || dx, nz - bot.tz || dz) + Math.sin(t * 1.3) * drunk * 0.35;
      bot.tx = nx;
      bot.tz = nz;
    }
  }

  const kept = collideFn(bot.tx, bot.tz, 0.36);
  bot.tx = clamp(kept[0], -6.8, 6.8);
  bot.tz = clamp(kept[1], -1.7, 4.6);
  animatePeer(bot, dt, t);
}

export function tickMultiplayer(dt) {
  if (!camera) return;
  const now = performance.now();
  const t = now * 0.001;
  for (const [id, peer] of remotes) {
    if (now - peer.last > 8000) {
      dropPeer(id);
      continue;
    }
    animatePeer(peer, dt, t);
  }

  if (remotes.size >= 1) {
    if (bot) killBot(false);
  } else {
    ensureBot();
    tickBot(dt, t);
  }

  poseAcc += dt;
  hbAcc += dt;
  if (hbAcc >= 2) {
    hbAcc = 0;
    forcePose = true;
  }
  const y = poseFn?.()?.y ?? camera.position.y;
  const air = y > EYE + 0.06;
  if (forcePose || poseAcc >= (air ? 0.05 : 0.1)) {
    poseAcc = 0;
    sendPose();
  }
}

export function publishRestock() {
  if (!net) return;
  const id = Math.random().toString(36).slice(2, 10);
  seenRestock.add(id);
  net.sendEvent({ t: "restock", id, by: local.name });
}

export { sanitizeName, defaultName };

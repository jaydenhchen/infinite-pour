import * as THREE from "three";
import { connectNet, sanitizeName, defaultName } from "./net.js?v=19";

const SHIRTS = [0x3d6ea8, 0xc44b3c, 0x2e8b57, 0xb8860b, 0x7b4b9a, 0xd46aa0, 0x2c6e49, 0xe07a3d];
const unitBox = new THREE.BoxGeometry(1, 1, 1);

let scene = null;
let camera = null;
let blitText = null;
let toast = null;
let onRestock = null;
let net = null;
let status = "offline";
let local = { name: defaultName(), room: "main" };
const remotes = new Map();
const seenRestock = new Set();
let poseAcc = 0;
let hbAcc = 0;
let lastPose = "";
let forcePose = false;
let heldFn = () => "";
let pouringFn = () => false;

export function playerName() {
  return local.name;
}

export function netStatus() {
  return status;
}

export function onlineCount() {
  return remotes.size + 1;
}

export function roster() {
  const rows = [{ id: "you", name: local.name, you: true }];
  for (const [id, p] of remotes) rows.push({ id, name: p.name, you: false });
  return rows;
}

function colorOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SHIRTS[h % SHIRTS.length];
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

function makeBartender(id, name) {
  const g = new THREE.Group();
  const shirt = lambert(colorOf(id));
  const skin = lambert(0xe8b48a);
  const pants = lambert(0x1d1d28);
  const shoe = lambert(0x121014);
  const hair = lambert(0x2a1810);
  const eye = lambert(0x1a0c08);

  addBox(g, pants, 0, 0.55, 0, 0.34, 0.38, 0.18);
  addBox(g, shirt, 0, 0.98, 0, 0.38, 0.46, 0.22);

  const head = new THREE.Group();
  head.position.set(0, 1.38, 0);
  addBox(head, skin, 0, 0, 0, 0.28, 0.28, 0.28);
  addBox(head, hair, 0, 0.12, -0.02, 0.3, 0.1, 0.3);
  addBox(head, eye, -0.06, 0.02, 0.14, 0.05, 0.04, 0.03);
  addBox(head, eye, 0.06, 0.02, 0.14, 0.05, 0.04, 0.03);
  g.add(head);

  const armL = new THREE.Group();
  addBox(armL, shirt, 0, -0.08, 0, 0.12, 0.36, 0.12);
  addBox(armL, skin, 0, -0.3, 0, 0.1, 0.14, 0.1);
  armL.position.set(-0.26, 1.1, 0);
  g.add(armL);

  const armR = new THREE.Group();
  addBox(armR, shirt, 0, -0.08, 0, 0.12, 0.36, 0.12);
  addBox(armR, skin, 0, -0.3, 0, 0.1, 0.14, 0.1);
  const held = addBox(armR, lambert(0xc47b20), 0, -0.42, 0.02, 0.08, 0.16, 0.08);
  held.visible = false;
  armR.position.set(0.26, 1.1, 0);
  g.add(armR);

  const legL = new THREE.Group();
  addBox(legL, pants, 0, -0.16, 0, 0.12, 0.32, 0.12);
  addBox(legL, shoe, 0, -0.34, 0.02, 0.12, 0.08, 0.16);
  legL.position.set(-0.1, 0.38, 0);
  g.add(legL);

  const legR = new THREE.Group();
  addBox(legR, pants, 0, -0.16, 0, 0.12, 0.32, 0.12);
  addBox(legR, shoe, 0, -0.34, 0.02, 0.12, 0.08, 0.16);
  legR.position.set(0.1, 0.38, 0);
  g.add(legR);

  const tag = makeNametag(name);
  g.add(tag);
  g.userData = { armL, armR, legL, legR, held, tag, walk: 0 };
  return g;
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
  const rig = makeBartender(id, name);
  const yaw = state.yaw || 0;
  rig.position.set(state.x || 0, 0, state.z || 0);
  rig.rotation.y = yaw;
  scene.add(rig);
  const peer = {
    id,
    name,
    rig,
    tx: state.x || 0,
    tz: state.z || 0,
    tyaw: yaw,
    held: state.h || "",
    pouring: !!state.p,
    last: performance.now(),
  };
  remotes.set(id, peer);
  peer.rig.userData.held.visible = !!peer.held;
  toast?.(`${name} walked in`);
  return peer;
}

function dropPeer(id, silent) {
  const peer = remotes.get(id);
  if (!peer) return;
  scene.remove(peer.rig);
  remotes.delete(id);
  if (!silent) toast?.(`${peer.name} clocked out`);
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
  peer.tyaw = state.yaw ?? peer.tyaw;
  peer.held = state.h || "";
  peer.pouring = !!state.p;
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
  try {
    name = localStorage.getItem("infinite-pour-name") || "";
    room = localStorage.getItem("infinite-pour-room") || "main";
  } catch {
    /* ignore */
  }
  if (!name) name = defaultName();
  return { name: sanitizeName(name), room: slugRoom(room) };
}

export function bootMultiplayer(opts) {
  scene = opts.scene;
  camera = opts.camera;
  blitText = opts.blitText;
  toast = opts.toast;
  onRestock = opts.onRestock;
  local.name = sanitizeName(opts.name || local.name);
  local.room = slugRoom(opts.room);
  try {
    localStorage.setItem("infinite-pour-name", local.name);
    localStorage.setItem("infinite-pour-room", local.room);
  } catch {
    /* ignore */
  }
  if (net) net.leave();
  for (const id of [...remotes.keys()]) dropPeer(id, true);
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
      try { applyState(id, state); } catch (err) { console.warn("peer", err); }
    },
    onPeerLeave(id) {
      dropPeer(id);
    },
    onEvent(msg) {
      if (msg.t === "restock") {
        if (seenRestock.has(msg.id)) return;
        seenRestock.add(msg.id);
        onRestock?.(msg.by || "someone");
      }
    },
  });
}

export function setPoseSources(getHeld, getPouring) {
  heldFn = getHeld;
  pouringFn = getPouring;
}

function lookYaw() {
  const d = new THREE.Vector3();
  camera.getWorldDirection(d);
  return Math.atan2(d.x, d.z);
}

function sendPose() {
  if (!net || !camera) return;
  const pose = {
    n: local.name,
    x: round(camera.position.x),
    z: round(camera.position.z),
    yaw: round(lookYaw(), 3),
    h: String(heldFn() || "").slice(0, 24),
    p: pouringFn() ? 1 : 0,
    t: Date.now(),
  };
  const key = `${pose.x}|${pose.z}|${pose.yaw}|${pose.h}|${pose.p}`;
  if (!forcePose && key === lastPose) return;
  lastPose = key;
  forcePose = false;
  net.sendState(pose);
}

function round(n, p = 2) {
  const m = 10 ** p;
  return Math.round(n * m) / m;
}

export function tickMultiplayer(dt) {
  if (!camera) return;
  const now = performance.now();
  for (const [id, peer] of remotes) {
    if (now - peer.last > 8000) {
      dropPeer(id);
      continue;
    }
    const rig = peer.rig;
    const dx = peer.tx - rig.position.x;
    const dz = peer.tz - rig.position.z;
    rig.position.x += dx * Math.min(1, dt * 12);
    rig.position.z += dz * Math.min(1, dt * 12);
    let dyaw = peer.tyaw - rig.rotation.y;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    rig.rotation.y += dyaw * Math.min(1, dt * 12);
    const speed = Math.hypot(dx, dz);
    const u = rig.userData;
    if (speed > 0.004) u.walk += dt * 10;
    const swing = Math.sin(u.walk) * Math.min(0.7, speed * 18);
    u.legL.rotation.x = swing;
    u.legR.rotation.x = -swing;
    u.armL.rotation.x = -swing * 0.7;
    u.armR.rotation.x = peer.pouring ? -1.1 : swing * 0.7;
  }

  poseAcc += dt;
  hbAcc += dt;
  if (hbAcc >= 2) {
    hbAcc = 0;
    forcePose = true;
  }
  if (forcePose || poseAcc >= 0.1) {
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

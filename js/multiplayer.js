import * as THREE from "three";
import { connectNet, sanitizeName, defaultName, makeClientId } from "./net.js?v=39";

const SHIRTS = [0x3d6ea8, 0xc44b3c, 0x2e8b57, 0xb8860b, 0x7b4b9a, 0xd46aa0, 0x2c6e49, 0xe07a3d];
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const DRUNK_NET = 6.75;
const PUNCH_T = 0.32;
const HURT_T = 0.28;
const STUN_T = 0.48;
const KNOCK_VEL = 2.8;
const KNOCK_POP = 0;
const KNOCK_UP = 0.14;
const KNOCK_DRAG = 6;
const peeDropGeo = new THREE.SphereGeometry(0.012, 7, 6);
const peePuddleGeo = new THREE.CircleGeometry(0.15, 14);
const _peeOrigin = new THREE.Vector3();
const _peeFwd = new THREE.Vector3();
const _peeRight = new THREE.Vector3();
const EYE = 1.58;
const EYE_F = 1.45;
const HEAD_YAW_MAX = (75 * Math.PI) / 180;
export function eyeHeight(gender) {
  return gender === "f" ? EYE_F : EYE;
}
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
const leftAt = new Map();
const seenRestock = new Set();
let poseAcc = 0;
let hbAcc = 0;
let lastPose = "";
let forcePose = false;
let poseSeq = 0;
let lastHit = null;
let heldFn = () => "";
let pouringFn = () => false;
let drunkFn = () => 0;
let poseFn = null;
let gameHandler = null;
let carFn = null;
let copFn = null;
let collideFn = (x, z) => [x, z];
let blockFn = null;
let bot = null;
let botAI = null;
let localHitFn = null;
const seenHits = new Set();

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

export function remotePeers() {
  return [...remotes.values()];
}

export function publishEvent(obj) {
  net?.sendEvent(obj);
}

export function setGameHandler(fn) {
  gameHandler = fn;
}

export function setCarHandler(fn) {
  carFn = typeof fn === "function" ? fn : null;
}

export function setCopHandler(fn) {
  copFn = typeof fn === "function" ? fn : null;
}

export function pokePose() {
  lastPose = "";
  forcePose = true;
}

export function setWorldCollide(fn) {
  collideFn = fn || ((x, z) => [x, z]);
}

export function setWorldBlock(fn) {
  blockFn = typeof fn === "function" ? fn : null;
}

export function pathBlocked(x0, z0, x1, z1) {
  if (blockFn) return !!blockFn(x0, z0, x1, z1);
  const dx = (x1 || 0) - (x0 || 0);
  const dz = (z1 || 0) - (z0 || 0);
  const dist = Math.hypot(dx, dz);
  if (dist < 0.34) return false;
  const steps = Math.max(4, Math.ceil(dist / 0.12));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sx = x0 + dx * t;
    const sz = z0 + dz * t;
    const kept = collideFn(sx, sz, 0.16);
    if (Math.hypot(kept[0] - sx, kept[1] - sz) > 0.08) return true;
  }
  return false;
}

let peeDrainFn = () => false;
let localCupFn = null;
let peeFillFn = null;
const CUP_HELD = new Set(["cup", "pint", "shot", "wine", "rocks", "highball", "coupe", "glass"]);
const _cupWorld = new THREE.Vector3();
export function setPeeDrainFn(fn) {
  peeDrainFn = typeof fn === "function" ? fn : () => false;
}

export function setPeeCupHooks(getLocalCups, onFill) {
  localCupFn = typeof getLocalCups === "function" ? getLocalCups : null;
  peeFillFn = typeof onFill === "function" ? onFill : null;
}

export function isCupHeld(name) {
  return CUP_HELD.has(String(name || "").trim().toLowerCase());
}

function cupWorldOf(peer) {
  if (!peer || !peer.rig || !isCupHeld(peer.held)) return null;
  const mesh = peer.rig.userData.cup || peer.rig.userData.held;
  if (!mesh) return null;
  peer.rig.updateMatrixWorld(true);
  mesh.getWorldPosition(_cupWorld);
  return {
    id: peer.id,
    local: !!peer.local,
    x: _cupWorld.x,
    y: _cupWorld.y + 0.055,
    z: _cupWorld.z,
    r: 0.22,
    h: 0.28,
  };
}

export function heldCupWorlds() {
  const out = [];
  const local = localCupFn && localCupFn();
  if (Array.isArray(local)) {
    for (const c of local) if (c) out.push({ ...c, local: true, id: c.id || "you" });
  } else if (local) {
    out.push({ ...local, local: true, id: local.id || "you" });
  }
  for (const peer of remotes.values()) {
    const c = cupWorldOf(peer);
    if (c) out.push(c);
  }
  if (bot) {
    const c = cupWorldOf(bot);
    if (c) out.push(c);
  }
  return out;
}

function dropHitsCup(pos, cup) {
  const dx = pos.x - cup.x;
  const dy = pos.y - cup.y;
  const dz = pos.z - cup.z;
  const r = cup.r || 0.18;
  const h = cup.h || 0.28;
  return dx * dx + dz * dz <= r * r && dy > -h && dy < 0.55;
}

function catchPeeDrop(drop, cups) {
  if (!cups || !cups.length) return false;
  for (const cup of cups) {
    if (!dropHitsCup(drop.position, cup)) continue;
    if (cup.local) peeFillFn && peeFillFn(0.0025);
    return true;
  }
  return false;
}

export function setLocalHitHandler(fn) {
  localHitFn = fn || null;
}

export function roster() {
  const rows = [{ id: "you", name: local.name, you: true, drunk: drunkFn() }];
  if (bot) rows.push({ id: BOT_ID, name: bot.name, you: false, drunk: bot.bac || 0, bot: true });
  for (const [id, p] of remotes) rows.push({ id, name: p.name, you: false, drunk: p.drunk || p.bac || 0 });
  return rows;
}

export function hitImpulse(nx, nz) {
  const len = Math.hypot(nx || 0, nz || 0) || 1;
  const dx = (nx || 0) / len;
  const dz = (nz || 0) / len;
  return { dx, dz, vx: dx * KNOCK_VEL, vz: dz * KNOCK_VEL, px: dx * KNOCK_POP, pz: dz * KNOCK_POP };
}

function killIntoWall(vx, vz, lostX, lostZ) {
  const lost = Math.hypot(lostX, lostZ);
  if (lost < 0.002) return [vx, vz];
  const nx = lostX / lost;
  const nz = lostZ / lost;
  const into = vx * nx + vz * nz;
  if (into > 0) {
    vx -= nx * into;
    vz -= nz * into;
  }
  return [vx, vz];
}

export function stepKnock(x, z, vx, vz, dt, collide, radius = 0.28) {
  const fn = collide || collideFn;
  const wx = x + vx * dt;
  const wz = z + vz * dt;
  const kept = fn(wx, wz, radius);
  const want = Math.hypot(wx - x, wz - z);
  const got = Math.hypot(kept[0] - x, kept[1] - z);
  let nvx = vx * Math.max(0, 1 - KNOCK_DRAG * dt);
  let nvz = vz * Math.max(0, 1 - KNOCK_DRAG * dt);
  [nvx, nvz] = killIntoWall(nvx, nvz, wx - kept[0], wz - kept[1]);
  if (want > 0.0001 && got < want * 0.4) {
    nvx = 0;
    nvz = 0;
  }
  if (Math.hypot(nvx, nvz) < 0.04) {
    nvx = 0;
    nvz = 0;
  }
  return [kept[0], kept[1], nvx, nvz];
}

export function applyKnock(x, z, nx, nz, collide, radius = 0.28) {
  const imp = hitImpulse(nx, nz);
  const fn = collide || collideFn;
  const steps = 6;
  let cx = x;
  let cz = z;
  for (let i = 1; i <= steps; i++) {
    const wx = x + imp.px * (i / steps);
    const wz = z + imp.pz * (i / steps);
    const kept = fn(wx, wz, radius);
    const progressed = Math.hypot(kept[0] - cx, kept[1] - cz);
    cx = kept[0];
    cz = kept[1];
    if (progressed < (KNOCK_POP / steps) * 0.3) break;
  }
  let vx = imp.vx;
  let vz = imp.vz;
  [vx, vz] = killIntoWall(vx, vz, x + imp.px - cx, z + imp.pz - cz);
  if (Math.hypot(cx - x, cz - z) < KNOCK_POP * 0.28) {
    vx = 0;
    vz = 0;
  }
  if (Math.hypot(vx, vz) < 0.04) {
    vx = 0;
    vz = 0;
  }
  return { x: cx, z: cz, vx, vz, dx: imp.dx, dz: imp.dz };
}

export function shirtKey() {
  return String(localId() || makeClientId() || local.name || "you").toLowerCase();
}

export function shirtColor(id) {
  return colorOf(id || shirtKey());
}

function paintShirt(rig, hex) {
  const mat = rig?.userData?.shirt;
  if (!mat || hex == null) return;
  const n = Number(hex);
  if (!Number.isFinite(n)) return;
  mat.color.setHex(n >>> 0);
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

function wrapRad(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function faceBody(peer, moving, vx, vz, dt) {
  if (peer.hyaw == null) peer.hyaw = peer.tyaw || 0;
  if (peer.byaw == null) peer.byaw = peer.hyaw;
  if (peer.bodyLock != null && Number.isFinite(peer.bodyLock)) {
    peer.byaw = wrapRad(peer.bodyLock);
    peer.sitByaw = null;
    return;
  }
  if (peer.sit) {
    if (peer.sitByaw == null) peer.sitByaw = peer.tyaw != null ? peer.tyaw : peer.byaw;
    peer.byaw = peer.sitByaw;
    return;
  }
  peer.sitByaw = null;
  if (moving) {
    const moveYaw = Math.atan2(vx, vz);
    let target = moveYaw;
    const away = Math.abs(wrapRad(peer.hyaw - moveYaw));
    if (away > (95 * Math.PI) / 180 && away < (265 * Math.PI) / 180) target = moveYaw + Math.PI;
    peer.byaw += wrapRad(target - peer.byaw) * Math.min(1, dt * 8);
  }
  const off = wrapRad(peer.hyaw - peer.byaw);
  if (off < -HEAD_YAW_MAX) peer.byaw = peer.hyaw + HEAD_YAW_MAX;
  else if (off > HEAD_YAW_MAX) peer.byaw = peer.hyaw - HEAD_YAW_MAX;
  peer.byaw = wrapRad(peer.byaw);
}

function headYawOffset(peer) {
  return THREE.MathUtils.clamp(wrapRad((peer.hyaw || 0) - (peer.byaw || 0)), -HEAD_YAW_MAX, HEAD_YAW_MAX);
}

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

function addBox(parent, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(unitBox, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = false;
  m.receiveShadow = false;
  parent.add(m);
  return m;
}

function nameLabel(name) {
  return String(name || "?").slice(0, 16);
}

function measureLabel(text, scale) {
  let w = 0;
  for (const ch of text) w += ch === " " ? 5 * scale : 4 * scale;
  return w;
}

function paintNametag(tag, name) {
  const label = nameLabel(name);
  if (tag.userData.label === label && tag.material && tag.material.map) return;
  tag.userData.label = label;
  const scale = 2;
  const padX = 4;
  const padY = 3;
  const tw = Math.max(4, measureLabel(label, scale));
  const w = tw + padX * 2;
  const h = 5 * scale + padY * 2;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(0, 0, w, h);
  if (blitText) blitText(ctx, label, padX, padY, "#ffffff", scale);
  else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textBaseline = "middle";
    ctx.fillText(label, padX, h / 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  if (tag.material && tag.material.map) tag.material.map.dispose();
  if (tag.material) tag.material.dispose();
  tag.material = new THREE.SpriteMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: true,
    toneMapped: false,
  });
  const worldH = 0.2;
  tag.userData.baseScale = { x: worldH * (w / h), y: worldH };
  tag.scale.set(tag.userData.baseScale.x, tag.userData.baseScale.y, 1);
}

function makeNametag(name) {
  const tag = new THREE.Sprite();
  tag.center.set(0.5, 0);
  tag.renderOrder = 30;
  tag.frustumCulled = false;
  tag.userData.locked = false;
  tag.position.set(0, 1.86, 0);
  paintNametag(tag, name);
  tag.visible = true;
  return tag;
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
  const tall = gender === "f" ? EYE_F / EYE : 1;
  body.scale.setScalar(tall);
  g.add(body);

  const shirt = lambert(colorOf(id));
  const skin = lambert(0xe8b48a, { emissive: 0x5a3018, emissiveIntensity: 0.18 });
  const pantsMat = lambert(0x1d1d28);
  const hair = lambert(gender === "f" ? 0x3a1a12 : 0x2a1810);
  const eye = lambert(0x1a0c08);
  const starMat = lambert(0xffe066);

  addBox(body, skin, 0, 0.98, 0, gender === "f" ? 0.30 : 0.32, 0.38, 0.18);
  addBox(body, skin, 0, 1.24, 0, 0.14, 0.10, 0.14);
  addBox(body, skin, 0, 0.74, 0, gender === "f" ? 0.26 : 0.28, 0.12, 0.12);
  const girl = gender === "f";
  const hipW = girl ? 0.37 : 0.36;
  const hipD = girl ? 0.22 : 0.21;
  const cakeX = girl ? 0.08 : 0.076;
  const cakeW = girl ? 0.168 : 0.152;
  const cakeH = girl ? 0.148 : 0.132;
  const cakeD = girl ? 0.132 : 0.116;
  const hipPants = addBox(body, pantsMat, 0, 0.74, -0.01, hipW, 0.18, hipD);
  hipPants.userData.homeY = 0.74;
  hipPants.userData.homeSX = hipW;
  hipPants.userData.homeSY = 0.18;
  hipPants.userData.homeSZ = hipD;
  const hipCakeL = addBox(body, pantsMat, -cakeX, 0.685, -0.118, cakeW, cakeH, cakeD);
  const hipCakeR = addBox(body, pantsMat, cakeX, 0.685, -0.118, cakeW, cakeH, cakeD);
  const hipCakeC = addBox(body, pantsMat, 0, 0.672, -0.126, girl ? 0.1 : 0.09, 0.1, girl ? 0.098 : 0.088);
  const butt = new THREE.Group();
  addBox(butt, skin, -cakeX, 0.012, 0.01, cakeW, cakeH, cakeD);
  addBox(butt, skin, cakeX, 0.012, 0.01, cakeW, cakeH, cakeD);
  addBox(butt, skin, 0, 0, -0.008, girl ? 0.1 : 0.09, 0.1, girl ? 0.098 : 0.088);
  addBox(butt, skin, -cakeX, -0.042, 0.018, cakeW * 0.92, 0.074, cakeD * 0.82);
  addBox(butt, skin, cakeX, -0.042, 0.018, cakeW * 0.92, 0.074, cakeD * 0.82);
  butt.position.set(0, 0.675, -0.118);
  butt.visible = false;
  body.add(butt);
  addBox(body, shirt, 0, 0.98, 0, gender === "f" ? 0.36 : 0.38, 0.46, 0.22);
  if (gender === "f") {
    addBox(body, shirt, -0.09, 1.02, 0.14, 0.15, 0.13, 0.13);
    addBox(body, shirt, 0.09, 1.02, 0.14, 0.15, 0.13, 0.13);
  }

  const head = new THREE.Group();
  head.rotation.order = "YXZ";
  head.position.set(0, 1.38, 0);
  addBox(head, skin, 0, 0, 0, 0.28, 0.28, 0.28);
  styleHair(head, hair, gender);
  addBox(head, eye, -0.06, 0.02, 0.14, 0.05, 0.04, 0.03);
  addBox(head, eye, 0.06, 0.02, 0.14, 0.05, 0.04, 0.03);
  body.add(head);

  const armL = new THREE.Group();
  addBox(armL, shirt, 0, -0.08, 0, 0.13, 0.36, 0.13);
  addBox(armL, skin, 0, -0.3, 0, 0.11, 0.16, 0.11);
  armL.position.set(0.24, 1.1, 0);
  armL.userData.homeX = 0.24;
  armL.userData.homeY = 1.1;
  armL.userData.homeZ = 0;
  body.add(armL);

  const armR = new THREE.Group();
  addBox(armR, shirt, 0, -0.08, 0, 0.13, 0.36, 0.13);
  addBox(armR, skin, 0, -0.3, 0, 0.11, 0.16, 0.11);
  const held = addBox(armR, lambert(0xc47b20), 0, -0.42, 0.02, 0.08, 0.16, 0.08);
  held.visible = false;
  const cup = makePeerCup();
  armR.add(cup);
  armR.position.set(-0.24, 1.1, 0);
  armR.userData.homeX = -0.24;
  armR.userData.homeY = 1.1;
  armR.userData.homeZ = 0;
  body.add(armR);

  const legL = new THREE.Group();
  addBox(legL, skin, 0, -0.20, 0, 0.13, 0.40, 0.13);
  addBox(legL, skin, 0, -0.52, 0, 0.12, 0.28, 0.12);
  addBox(legL, skin, 0, -0.74, 0.03, 0.13, 0.08, 0.20);
  const pantL = addBox(legL, pantsMat, 0, -0.32, 0, 0.16, 0.64, 0.16);
  pantL.userData.homeY = -0.32;
  pantL.userData.homeSY = 0.64;
  legL.position.set(-0.11, 0.78, 0);
  body.add(legL);

  const legR = new THREE.Group();
  addBox(legR, skin, 0, -0.20, 0, 0.13, 0.40, 0.13);
  addBox(legR, skin, 0, -0.52, 0, 0.12, 0.28, 0.12);
  addBox(legR, skin, 0, -0.74, 0.03, 0.13, 0.08, 0.20);
  const pantR = addBox(legR, pantsMat, 0, -0.32, 0, 0.16, 0.64, 0.16);
  pantR.userData.homeY = -0.32;
  pantR.userData.homeSY = 0.64;
  legR.position.set(0.11, 0.78, 0);
  body.add(legR);

  let pecker = null;
  if (gender !== "f") {
    pecker = new THREE.Group();
    pecker.position.set(0, 0.70, 0.08);
    pecker.rotation.order = "XYZ";
    pecker.rotation.set(-Math.PI / 6, 0, 0);
    addBox(pecker, skin, 0, 0, 0.08, 0.042, 0.042, 0.16);
    addBox(pecker, skin, -0.034, -0.014, 0.02, 0.05, 0.05, 0.05);
    addBox(pecker, skin, 0.034, -0.014, 0.02, 0.05, 0.05, 0.05);
    pecker.visible = false;
    pecker.userData.len = 0.18;
    body.add(pecker);
  }

  const stars = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const m = addBox(stars, starMat, Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22, 0.06, 0.06, 0.06);
    m.castShadow = false;
  }
  stars.position.set(0, 0.28, 0);
  stars.visible = false;
  head.add(stars);

  const peeKit = makePeeKit();

  const tag = makeNametag(name);
  g.add(tag);
  g.userData = {
    body,
    head,
    armL,
    armR,
    legL,
    legR,
    held,
    cup,
    tag,
    stars,
    skin,
    shirt,
    hipPants,
    hipCakeL,
    hipCakeR,
    hipCakeC,
    butt,
    pantL,
    pantR,
    pecker,
    peeDrops: peeKit.drops,
    peePuddles: peeKit.puddles,
    gender,
    tall,
    walk: 0,
    peeEmit: 0,
    peePull: 0,
    pantDrop: 0,
    disposeFx: () => disposePeeFx(g.userData),
    flashMats: [shirt, skin, pantsMat, hair, eye],
    flashBase: [shirt, skin, pantsMat, hair, eye].map((m) => ({
      m,
      r: m.color.r,
      g: m.color.g,
      b: m.color.b,
    })),
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
  const tag = peer?.rig?.userData?.tag;
  if (!tag || tag.userData.locked) return;
  paintNametag(tag, name);
  tag.visible = true;
}

function liveName(n, fallback) {
  if (typeof n !== "string") return sanitizeName(fallback || "regular");
  const s = n.replace(/\s+/g, " ").trim();
  if (!s || s === "0" || s === "1") return sanitizeName(fallback || "regular");
  return sanitizeName(s);
}

function spawnPeer(id, state) {
  const name = liveName(typeof state.nm === "string" ? state.nm : state.n, "regular");
  const gender = state.g === "f" ? "f" : "m";
  const rig = makeBartender(id, name, gender);
  const yaw = state.yaw || 0;
  const eye = eyeHeight(gender);
  const groundY = Math.max(0, (state.y ?? eye) - eye);
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
    ty: state.y ?? eye,
    tyaw: yaw,
    hyaw: yaw,
    byaw: yaw,
    tpit: state.pit || 0,
    pit: state.pit || 0,
    bac: clamp(state.b, 0, DRUNK_NET),
    held: state.h || "",
    gf: clamp(state.gf, 0, 1),
    gc: Number(state.gc) || 0,
    pouring: !!state.p,
    last: performance.now(),
    phase: phaseOf(id),
    lx: state.x || 0,
    lz: state.z || 0,
    sit: !!state.s || !!state.v,
    pants: !!state.pn || !!state.u,
    drive: !!state.v,
    si: state.si == null ? (state.v ? 0 : -1) : (Number(state.si) | 0),
    ci: state.ci != null ? String(state.ci) : "",
    cx: state.cx,
    cz: state.cz,
    cy: state.cy,
    wanted: !!state.w,
    copCar: !!state.cp,
    pee: !!state.u,
    hurtT: 0,
    stunT: 0,
    punchT: 0,
    kvx: 0,
    kvz: 0,
  };
  paintShirt(rig, state.sc != null ? state.sc : colorOf(id));
  remotes.set(id, peer);
  if (remotes.size >= 1) killBot(false);
  peer.seq = Number.isFinite(Number(state.t)) ? Number(state.t) : 0;
  peer.pendingLeave = 0;
  peer.rig.visible = true;
  peer.rig.frustumCulled = false;
  toast?.(`${name} walked in`);
  return peer;
}

function markLeft(id, t) {
  leftAt.set(id, Number.isFinite(Number(t)) ? Number(t) : Date.now());
}

function dropPeer(id, silent) {
  const peer = remotes.get(id);
  if (!peer) return;
  if (peer.drive && peer.ci && (peer.si == null || peer.si === 0)) {
    try {
      carFn?.({ t: "car", a: "park", from: id, ci: peer.ci, x: peer.cx, z: peer.cz, yaw: peer.cy });
    } catch (err) {
      console.warn("car park", err);
    }
  }
  try {
    copFn?.({ t: "cops", a: "clear", from: id });
  } catch (err) {
    console.warn("cops clear", err);
  }
  disposePeeFx(peer.rig?.userData);
  scene.remove(peer.rig);
  remotes.delete(id);
  if (!silent) toast?.(`${peer.name} left the bar`);
}

function applyState(id, state) {
  if (!state || typeof state !== "object") return;
  const hasSeq = Number.isFinite(Number(state.seq));
  const seq = hasSeq ? Number(state.seq) : Number(state.t);
  const incomingT = Number(state.t);
  if (Number.isFinite(incomingT) && Date.now() - incomingT > 45000) return;
  const left = leftAt.get(id);
  if (left != null) {
    if (!Number.isFinite(incomingT) || incomingT <= left + 250) return;
    leftAt.delete(id);
  }
  let peer = remotes.get(id);
  if (peer && Number.isFinite(incomingT) && Number.isFinite(peer.seenT) && incomingT + 1500 < peer.seenT) {
    return;
  }
  if (!peer) {
    if (remotes.size >= 20) return;
    peer = spawnPeer(id, state);
  }
  if (Number.isFinite(seq)) peer.seq = seq;
  if (Number.isFinite(incomingT)) peer.seenT = incomingT;
  peer.pendingLeave = 0;
  peer.goneLeave = false;
  if (peer.rig) {
    peer.rig.visible = true;
    peer.rig.frustumCulled = false;
  }
  const incomingName = typeof state.nm === "string" ? state.nm : typeof state.n === "string" ? state.n : "";
  if (incomingName) peer.name = liveName(incomingName, peer.name);
  setNametag(peer, peer.name);
  peer.ty = state.y ?? peer.ty;
  if ((peer.stunT || 0) <= 0 && (peer.hurtT || 0) <= 0.12) {
    peer.tx = state.x ?? peer.tx;
    peer.tz = state.z ?? peer.tz;
  }
  peer.tyaw = state.yaw ?? peer.tyaw;
  peer.tpit = state.pit ?? peer.tpit;
  if (state.b != null) peer.bac = clamp(state.b, 0, DRUNK_NET);
  peer.held = state.h || "";
  if (state.gf != null) peer.gf = clamp(state.gf, 0, 1);
  if (state.gc != null) peer.gc = Number(state.gc) || 0;
  peer.pouring = !!state.p;
  const wasDrive = !!peer.drive;
  const wasSi = peer.si == null ? 0 : peer.si | 0;
  peer.drive = !!state.v;
  peer.si = state.si == null ? (peer.drive ? 0 : -1) : (Number(state.si) | 0);
  peer.sit = !!state.s || peer.drive;
  peer.pants = !!state.pn || !!state.u;
  if (state.ci != null) peer.ci = String(state.ci);
  if (state.cx != null) peer.cx = state.cx;
  if (state.cz != null) peer.cz = state.cz;
  if (state.cy != null) peer.cy = state.cy;
  peer.wanted = !!state.w;
  peer.copCar = !!state.cp;
  if (state.sc != null) paintShirt(peer.rig, state.sc);
  const isDriver = peer.drive && peer.si === 0;
  if (isDriver) {
    peer.bodyLock = state.cy != null ? state.cy + Math.PI : peer.tyaw;
    try {
      carFn?.({
        t: "car",
        a: "drive",
        from: id,
        ci: peer.ci,
        cx: state.cx,
        cz: state.cz,
        cy: state.cy,
        cs: state.cs,
        cf: state.cf,
        cp: state.cp,
        si: 0,
      });
    } catch (err) {
      console.warn("car drive", err);
    }
  } else if (wasDrive && wasSi === 0 && !peer.drive) {
    peer.bodyLock = null;
    try {
      carFn?.({ t: "car", a: "park", from: id, ci: peer.ci, x: peer.cx, z: peer.cz, yaw: peer.cy, si: 0 });
    } catch (err) {
      console.warn("car park", err);
    }
  } else if (peer.drive) {
    peer.bodyLock = peer.cy != null ? peer.cy + Math.PI : peer.tyaw;
  } else {
    peer.bodyLock = null;
  }
  peer.pee = !!state.u;
  if (state.ax != null && state.ay != null && state.az != null) peer.peeAim = { x: state.ax, y: state.ay, z: state.az };
  else peer.peeAim = null;
  if (state.g) {
    const nextG = state.g === "f" ? "f" : "m";
    if (peer.gender !== nextG) {
      const old = peer.rig;
      old.userData.disposeFx?.();
      const rig = makeBartender(id, peer.name, nextG);
      paintShirt(rig, state.sc != null ? state.sc : colorOf(id));
      rig.position.copy(old.position);
      rig.rotation.copy(old.rotation);
      scene.add(rig);
      scene.remove(old);
      peer.rig = rig;
      rig.visible = true;
      rig.frustumCulled = false;
    }
    peer.gender = nextG;
  }
  if (state.k) peer.punchT = Math.max(peer.punchT || 0, PUNCH_T);
  if (state.hid && state.hto && net?.id && state.hto === net.id) {
    handleHitEvent({
      id: state.hid,
      to: state.hto,
      from: id,
      nx: state.hnx,
      nz: state.hnz,
      n: state.n || peer.name,
    });
  }
  peer.last = performance.now();
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
  poseSeq = 0;
  net = connectNet({
    name: local.name,
    room: local.room,
    onStatus(s) {
      status = s;
    },
    onReady() {
      lastPose = "";
      forcePose = true;
      sendPose();
    },
    onPeer(id, state, meta) {
      if (meta?.retain) return;
      try {
        applyState(id, state);
      } catch (err) {
        console.warn("peer", err);
      }
    },
    onPeerLeave(id, reason, state) {
      if (reason === "empty" || reason === "gone") {
        markLeft(id, Number(state?.t) || Date.now());
        dropPeer(id, reason === "empty");
        return;
      }
      const peer = remotes.get(id);
      if (!peer) return;
      peer.pendingLeave = peer.pendingLeave || performance.now();
    },
    onEvent(msg) {
      if (msg.t === "leave" && msg.from) {
        markLeft(msg.from, Date.now());
        dropPeer(msg.from);
        return;
      }
      if (msg.t === "restock") {
        if (seenRestock.has(msg.id)) return;
        seenRestock.add(msg.id);
        onRestock?.(msg.by || "someone");
        return;
      }
      if (msg.t === "hit") {
        handleHitEvent(msg);
        return;
      }
      if (msg.t === "car") {
        try {
          carFn?.(msg);
        } catch (err) {
          console.warn("car", err);
        }
        return;
      }
      if (msg.t === "cops") {
        try {
          copFn?.(msg);
        } catch (err) {
          console.warn("cops", err);
        }
        return;
      }
      try {
        gameHandler?.(msg);
      } catch (err) {
        console.warn("game event", err);
      }
    },
  });
  bindTabNet();
}

function tabHidden() {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function bindTabNet() {
  if (window.__ipourTabNet) return;
  window.__ipourTabNet = true;
  const die = () => {
    if (!net) return;
    try {
      net.leave("unload");
    } catch {
      /* ignore */
    }
    status = "offline";
  };
  const wake = () => {
    if (!net) return;
    lastPose = "";
    forcePose = true;
    try {
      net.reconnect();
    } catch {
      /* ignore */
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") wake();
  });
  window.addEventListener("pageshow", wake);
  window.addEventListener("pagehide", (e) => {
    if (e.persisted) return;
    die();
  });
  window.addEventListener("beforeunload", die);
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
  if (!net || !camera || !net.ready()) return;
  const extra = poseFn?.() || {};
  const pose = {
    n: local.name,
    nm: local.name,
    x: round(extra.x ?? camera.position.x),
    y: round(extra.y ?? camera.position.y),
    z: round(extra.z ?? camera.position.z),
    yaw: round(extra.yaw ?? lookYaw(), 3),
    pit: round(extra.pit ?? lookPitch(), 3),
    b: round(clamp(drunkFn(), 0, DRUNK_NET), 2),
    h: String(heldFn() || "").slice(0, 24),
    p: pouringFn() ? 1 : 0,
    s: extra.s ? 1 : 0,
    u: extra.u ? 1 : 0,
    pn: extra.pn || extra.n ? 1 : 0,
    g: extra.g === "f" || local.gender === "f" ? "f" : "m",
    gf: extra.gf != null ? round(clamp(extra.gf, 0, 1), 2) : 0,
    gc: extra.gc ? (Number(extra.gc) || 0) : 0,
    sc: shirtColor(),
    t: Date.now(),
    seq: ++poseSeq,
  };
  if (extra.hurt) {
    pose.hurt = 1;
    if (extra.rdx != null) pose.rdx = round(extra.rdx, 3);
    if (extra.rdz != null) pose.rdz = round(extra.rdz, 3);
  }
  if (extra.ax != null && extra.ay != null && extra.az != null) {
    pose.ax = round(extra.ax, 2);
    pose.ay = round(extra.ay, 2);
    pose.az = round(extra.az, 2);
  }
  if (extra.k) pose.k = 1;
  if (extra.w) pose.w = 1;
  if (extra.v) {
    pose.v = 1;
    pose.ci = String(extra.ci ?? "");
    pose.si = extra.si == null ? 0 : extra.si | 0;
    if (pose.si === 0) {
      pose.cx = round(extra.cx ?? extra.x ?? 0, 2);
      pose.cz = round(extra.cz ?? extra.z ?? 0, 2);
      pose.cy = round(extra.cy ?? 0, 3);
      pose.cs = round(extra.cs || 0, 2);
      pose.cf = round(extra.cf || 0, 2);
    }
    if (extra.cp) pose.cp = 1;
  }
  if (lastHit && performance.now() < lastHit.until) {
    pose.hid = lastHit.hid;
    pose.hto = lastHit.to;
    pose.hnx = lastHit.nx;
    pose.hnz = lastHit.nz;
  }
  const key = `${pose.n}|${pose.x}|${pose.y}|${pose.z}|${pose.yaw}|${pose.pit}|${pose.b}|${pose.h}|${pose.p}|${pose.s}|${pose.u}|${pose.pn || 0}|${pose.g}|${pose.gf}|${pose.gc}|${pose.sc}|${pose.ax}|${pose.ay}|${pose.az}|${pose.v || 0}|${pose.ci || ""}|${pose.si ?? ""}|${pose.cx}|${pose.cz}|${pose.cy}|${pose.k || 0}|${pose.w || 0}|${pose.cp || 0}|${pose.hurt || 0}`;
  if (!forcePose && key === lastPose) return;
  lastPose = key;
  forcePose = false;
  net.sendState(pose);
}

function round(n, p = 2) {
  const m = 10 ** p;
  return Math.round(n * m) / m;
}

function pantsDown(peer) {
  return !!(peer.pants || peer.pee);
}

function stepPantDrop(peer, dt) {
  const u = peer.rig?.userData;
  if (!u) return 0;
  if (pantsDown(peer)) u.pantDrop = Math.min(1, (u.pantDrop || 0) + dt * 2.1);
  else u.pantDrop = Math.max(0, (u.pantDrop || 0) - dt * 2.8);
  return u.pantDrop || 0;
}

function poseSit(peer) {
  const u = peer.rig.userData;
  const drop = u.pantDrop || 0;
  const toilet = pantsDown(peer) && !peer.drive;
  u.body.position.y = -0.38;
  u.body.rotation.set(0.16, 0, 0);
  const spread = 0.18 + drop * 0.14;
  u.legL.rotation.set(-1.52, 0.1, spread);
  u.legR.rotation.set(-1.52, -0.1, -spread);
  if (toilet && drop < 0.98) {
    const reach = Math.min(1, drop / 0.55);
    const rest = Math.max(0, (drop - 0.55) / 0.45);
    const rx = -0.72 - reach * 0.62 + rest * 0.42;
    const rz = 0.22 + reach * 0.18 - rest * 0.08;
    u.armL.rotation.set(rx, 0, -rz);
    u.armR.rotation.set(peer.pouring ? -1.1 : rx, 0, rz);
  } else {
    u.armL.rotation.set(-0.72, 0, -0.22);
    u.armR.rotation.set(peer.pouring ? -1.1 : -0.72, 0, 0.22);
  }
}

function poseDrive(peer) {
  const u = peer.rig.userData;
  u.body.position.y = -0.16;
  u.body.rotation.set(0.1, 0, 0);
  u.legL.rotation.set(-1.28, 0.12, 0.08);
  u.legR.rotation.set(-1.28, -0.08, -0.06);
  u.armL.rotation.set(-0.98, 0.18, -0.42);
  u.armR.rotation.set(peer.pouring ? -1.1 : -0.98, -0.16, 0.4);
}

function poseHurt(_u, _hurtT) {
  return false;
}

function poseRightPunch(u, punchT) {
  if (!u?.armR || punchT <= 0) return false;
  const dur = PUNCH_T;
  const uPunch = 1 - Math.min(dur, punchT) / dur;
  const swing = uPunch < 0.38 ? uPunch / 0.38 : 1 - (uPunch - 0.38) / 0.62;
  u.armR.rotation.set(-1.75 * swing, -0.28 * swing, 0.48 * swing);
  if (u.armL) u.armL.rotation.set(0.32 * swing, 0.1 * swing, -0.22);
  return true;
}

function makePeerCup() {
  const g = new THREE.Group();
  const glass = lambert(0xc8e6f4, { transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.112, 10, 1, true), glass);
  wall.position.y = 0.056;
  g.add(wall);
  const base = new THREE.Mesh(new THREE.CircleGeometry(0.031, 10), glass);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.002;
  g.add(base);
  const liqMat = lambert(0xd6c044, { transparent: true, opacity: 0.94, emissive: 0xd6c044, emissiveIntensity: 0.3, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.028, 1, 10), liqMat);
  liq.position.y = 0.02;
  liq.scale.y = 0.01;
  liq.visible = false;
  liq.renderOrder = 2;
  g.add(liq);
  const surf = new THREE.Mesh(new THREE.CircleGeometry(0.034, 12), liqMat.clone());
  surf.rotation.x = -Math.PI / 2;
  surf.visible = false;
  surf.renderOrder = 3;
  g.add(surf);
  g.userData.liq = liq;
  g.userData.surf = surf;
  g.position.set(0.012, -0.5, 0.05);
  g.rotation.set(0.18, 0, 0.08);
  g.visible = false;
  return g;
}

function poseHeld(peer) {
  const u = peer.rig && peer.rig.userData;
  if (!u) return;
  const cupOn = isCupHeld(peer.held);
  if (u.held) u.held.visible = !!peer.held && !cupOn;
  if (!u.cup) return;
  u.cup.visible = cupOn;
  if (!cupOn) return;
  const fill = clamp(peer.gf || 0, 0, 1);
  const liq = u.cup.userData.liq;
  const surf = u.cup.userData.surf;
  if (!liq) return;
  liq.visible = fill > 0.015;
  if (surf) surf.visible = liq.visible;
  if (!liq.visible) return;
  const h = Math.max(0.01, 0.1 * fill);
  liq.scale.y = h;
  liq.position.y = 0.008 + h / 2;
  const col = Number(peer.gc) || 0xd6c044;
  liq.material.color.setHex(col);
  if (liq.material.emissive) liq.material.emissive.setHex(col);
  if (surf) {
    surf.position.y = 0.008 + h * 0.99;
    const r = 0.028 + 0.006 * fill;
    surf.scale.set(r / 0.034, r / 0.034, 1);
    surf.material.color.setHex(col);
    if (surf.material.emissive) surf.material.emissive.setHex(col);
  }
}

function makePeeKit() {
  const dropMat = new THREE.MeshLambertMaterial({
    color: 0xd6c044,
    emissive: 0x2c2408,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const puddleBase = new THREE.MeshLambertMaterial({
    color: 0xc4b03a,
    emissive: 0x1c1604,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const drops = [];
  for (let i = 0; i < 64; i++) {
    const m = new THREE.Mesh(peeDropGeo, dropMat);
    m.visible = false;
    m.castShadow = false;
    m.receiveShadow = false;
    m.userData.life = 0;
    m.userData.v = new THREE.Vector3();
    drops.push(m);
  }
  const puddles = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(peePuddleGeo, puddleBase.clone());
    m.visible = false;
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    m.receiveShadow = true;
    m.userData.life = 0;
    m.userData.maxLife = 2.6;
    puddles.push(m);
  }
  return { drops, puddles };
}

function disposePeeFx(u) {
  if (!u) return;
  for (const m of u.peeDrops || []) {
    m.visible = false;
    m.removeFromParent();
  }
  for (const m of u.peePuddles || []) {
    m.visible = false;
    m.removeFromParent();
  }
}

function hostFx(mesh) {
  const parent = scene || mesh.parent;
  if (parent && mesh.parent !== parent) parent.add(mesh);
}

function addPeePuddle(u, x, z) {
  const puddles = u.peePuddles || [];
  let near = null;
  let best = 0.22;
  for (const p of puddles) {
    if (!p.visible) continue;
    const d = Math.hypot(p.position.x - x, p.position.z - z);
    if (d < best) {
      best = d;
      near = p;
    }
  }
  if (near) {
    const grow = Math.min(2.1, near.scale.x + 0.1);
    near.scale.set(grow, grow, 1);
    near.userData.life = Math.min(3.4, near.userData.life + 0.28);
    return;
  }
  const p = puddles.find((m) => !m.visible);
  if (!p) return;
  hostFx(p);
  p.position.set(x, 0.012, z);
  p.scale.set(0.72, 0.72, 1);
  p.userData.maxLife = 2.6;
  p.userData.life = 2.6;
  p.material.opacity = 0.42;
  p.visible = true;
}

function tickPee(peer, dt, t) {
  const u = peer.rig.userData;
  const drops = u.peeDrops || [];
  const girl = (peer.gender || u.gender) === "f";
  const drunk = clamp(peer.bac);
  const fps = Boolean(peer.local && camera && !peer.sit && (!peer.rig.visible || !u.body?.visible));
  if (peer.pee) {
    u.peeEmit -= dt;
    let guard = 0;
    while (u.peeEmit <= 0 && guard++ < 8) {
      u.peeEmit += fps ? 0.007 : 0.011;
      const drop = drops.find((m) => !m.visible);
      if (!drop) break;
      hostFx(drop);
      const wob = Math.sin(t * 21 + (peer.phase || 0)) * (0.028 + drunk * 0.09);
      const spray = (Math.random() - 0.5) * 0.06 + wob * 1.6;
      if (fps) {
        camera.getWorldDirection(_peeFwd);
        _peeOrigin.copy(camera.position).addScaledVector(_peeFwd, 0.24);
        _peeOrigin.y -= 0.44;
        _peeOrigin.x += (Math.random() - 0.5) * 0.012 + wob * 0.12;
        if (peer.peeAim) {
          _peeFwd.set(peer.peeAim.x - _peeOrigin.x, peer.peeAim.y - _peeOrigin.y, peer.peeAim.z - _peeOrigin.z);
          if (_peeFwd.lengthSq() < 1e-8) _peeFwd.set(0, -1, 0);
          else _peeFwd.normalize();
        }
        _peeRight.set(_peeFwd.z, 0, -_peeFwd.x);
        if (_peeRight.lengthSq() < 1e-8) _peeRight.set(1, 0, 0);
        else _peeRight.normalize();
      } else if (peer.peeAim) {
        _peeOrigin.set((Math.random() - 0.5) * 0.01 + wob * 0.2, (u.body ? u.body.position.y : 0) + (girl ? 0.4 : 0.48), 0.08);
        peer.rig.localToWorld(_peeOrigin);
        _peeFwd.set(peer.peeAim.x - _peeOrigin.x, peer.peeAim.y - _peeOrigin.y, peer.peeAim.z - _peeOrigin.z);
        if (_peeFwd.lengthSq() < 1e-8) _peeFwd.set(0, -1, 0);
        else _peeFwd.normalize();
        _peeRight.set(_peeFwd.z, 0, -_peeFwd.x);
        if (_peeRight.lengthSq() < 1e-8) _peeRight.set(1, 0, 0);
        else _peeRight.normalize();
      } else if (u.pecker && u.pecker.visible) {
        u.pecker.updateWorldMatrix(true, false);
        u.pecker.getWorldPosition(_peeOrigin);
        _peeFwd.set(0, 0, 1).transformDirection(u.pecker.matrixWorld).normalize();
        _peeRight.set(1, 0, 0).transformDirection(u.pecker.matrixWorld).normalize();
        _peeOrigin.addScaledVector(_peeFwd, (u.pecker.userData.len || 0.18) + 0.012);
        _peeOrigin.addScaledVector(_peeRight, (Math.random() - 0.5) * 0.01 + wob * 0.25);
      } else {
        _peeOrigin.set((Math.random() - 0.5) * 0.01 + wob * 0.25, (u.body ? u.body.position.y : 0) + (girl ? 0.4 : 0.5), girl ? 0.07 : 0.09);
        peer.rig.localToWorld(_peeOrigin);
        _peeFwd.set(0, 0, 1).applyQuaternion(peer.rig.quaternion);
        _peeRight.set(1, 0, 0).applyQuaternion(peer.rig.quaternion);
      }
      drop.position.copy(_peeOrigin);
      const aim = Boolean(peer.peeAim);
      let speed = girl ? (aim ? 1.15 : 0.58) + Math.random() * 0.1 : (aim ? 2.35 : 3.15) + Math.random() * 0.22;
      if (aim) {
        const dist = Math.hypot(peer.peeAim.x - _peeOrigin.x, peer.peeAim.y - _peeOrigin.y, peer.peeAim.z - _peeOrigin.z);
        speed = Math.max(girl ? 0.7 : 0.95, Math.min(speed, 0.7 + dist * 2.6));
      }
      drop.userData.v.set(
        _peeFwd.x * speed + _peeRight.x * spray,
        aim ? _peeFwd.y * speed : u.pecker && u.pecker.visible ? _peeFwd.y * speed - 0.06 : girl ? -1.9 - Math.random() * 0.12 : -0.12 - Math.random() * 0.08,
        _peeFwd.z * speed + _peeRight.z * spray
      );
      drop.userData.life = 0.55 + Math.random() * 0.12;
      drop.userData.age = 0;
      drop.renderOrder = 4;
      drop.visible = true;
    }
  } else {
    u.peeEmit = 0;
  }
  const cups = heldCupWorlds();
  for (const drop of drops) {
    if (!drop.visible) continue;
    drop.userData.life -= dt;
    drop.userData.age = (drop.userData.age || 0) + dt;
    drop.userData.v.y -= 12 * dt;
    drop.position.addScaledVector(drop.userData.v, dt);
    const v = drop.userData.v;
    const spd = Math.hypot(v.x, v.y, v.z);
    const stretch = 1.15 + Math.min(3.4, spd * 0.42);
    drop.scale.set(fps ? 0.95 : 0.72, fps ? 0.95 : 0.72, stretch);
    if (spd > 0.08) {
      drop.lookAt(drop.position.x + v.x, drop.position.y + v.y, drop.position.z + v.z);
    }
    if ((drop.userData.age || 0) > 0.04 && catchPeeDrop(drop, cups)) {
      drop.visible = false;
      drop.removeFromParent();
      continue;
    }
    if ((drop.userData.age || 0) > 0.07 && peeDrainFn(drop.position.x, drop.position.y, drop.position.z)) {
      drop.visible = false;
      drop.removeFromParent();
      continue;
    }
    if (drop.userData.life <= 0 || drop.position.y < 0.014) {
      if (drop.position.y < 0.08 && !peeDrainFn(drop.position.x, drop.position.y, drop.position.z)) {
        addPeePuddle(u, drop.position.x, drop.position.z);
      }
      drop.visible = false;
      drop.removeFromParent();
    }
  }
  for (const p of u.peePuddles || []) {
    if (!p.visible) continue;
    p.userData.life -= dt;
    p.scale.x += dt * 0.08;
    p.scale.y = p.scale.x;
    p.material.opacity = Math.max(0, 0.42 * (p.userData.life / (p.userData.maxLife || 2.6)));
    if (p.userData.life <= 0) {
      p.visible = false;
      p.removeFromParent();
    }
  }
}

function targets() {
  const list = [...remotes.values()];
  if (bot) list.push(bot);
  return list;
}

function findPeer(id) {
  if (!id) return null;
  if (bot && bot.id === id) return bot;
  return remotes.get(id) || null;
}

function applyHurt(peer, nx, nz) {
  if (!peer || (peer.hurtT || 0) > 0.1) return false;
  const knock = applyKnock(peer.tx ?? peer.rig?.position.x ?? 0, peer.tz ?? peer.rig?.position.z ?? 0, nx, nz, collideFn, 0.32);
  peer.hurtT = HURT_T;
  peer.rdx = knock.dx;
  peer.rdz = knock.dz;
  if (peer.drive) return true;
  peer.kvx = (peer.kvx || 0) + knock.vx;
  peer.kvz = (peer.kvz || 0) + knock.vz;
  const eye = eyeHeight(peer.gender);
  peer.ty = Math.max(peer.ty ?? eye, eye) + KNOCK_UP;
  return true;
}

function swingPunch(peer) {
  if (peer) peer.punchT = PUNCH_T;
}

function handleHitEvent(msg) {
  if (!msg) return;
  const hid = String(msg.id || "");
  if (hid) {
    if (seenHits.has(hid)) return;
    seenHits.add(hid);
    if (seenHits.size > 80) seenHits.clear();
  }
  const me = net?.id || "";
  const nx = Number(msg.nx) || 0;
  const nz = Number(msg.nz) || 0;
  const from = findPeer(msg.from);
  swingPunch(from);
  const mine = !!(msg.to && me && msg.to === me);
  const target = mine ? null : findPeer(msg.to);
  const toX = mine ? camera?.position.x : target?.tx ?? target?.rig?.position.x;
  const toZ = mine ? camera?.position.z : target?.tz ?? target?.rig?.position.z;
  if (from && toX != null && toZ != null && pathBlocked(from.tx ?? from.rig?.position.x, from.tz ?? from.rig?.position.z, toX, toZ)) return;
  if (mine) {
    localHitFn?.(nx, nz, msg.n || from?.name || "");
    return;
  }
  applyHurt(target, nx, nz);
}

export function tryPunch() {
  if (!camera) return null;
  const extra = poseFn?.() || {};
  const x = extra.x ?? camera.position.x;
  const z = extra.z ?? camera.position.z;
  let fx = extra.aimx;
  let fz = extra.aimz;
  if (!Number.isFinite(fx) || !Number.isFinite(fz)) {
    const yaw = extra.yaw ?? lookYaw();
    fx = Math.sin(yaw);
    fz = Math.cos(yaw);
  }
  const aimLen = Math.hypot(fx, fz) || 1;
  fx /= aimLen;
  fz /= aimLen;
  let best = null;
  let bestDist = 2.15;
  for (const peer of targets()) {
    const dx = (peer.tx ?? peer.rig.position.x) - x;
    const dz = (peer.tz ?? peer.rig.position.z) - z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.2 || dist > bestDist) continue;
    const aim = dist > 0.001 ? (dx * fx + dz * fz) / dist : 0;
    if (aim < 0.22) continue;
    const tx = peer.tx ?? peer.rig.position.x;
    const tz = peer.tz ?? peer.rig.position.z;
    if (pathBlocked(x, z, tx, tz)) continue;
    best = peer;
    bestDist = dist;
  }
  if (!best) return null;
  const nx = fx;
  const nz = fz;
  applyHurt(best, nx, nz);
  const hid = Math.random().toString(36).slice(2, 10);
  seenHits.add(hid);
  lastHit = { hid, to: best.id, nx, nz, until: performance.now() + 1800 };
  publishEvent({ t: "hit", id: hid, to: best.id, nx: round(nx, 3), nz: round(nz, 3), n: local.name });
  return { id: best.id, name: best.name, nx, nz };
}

function drunkSway(drunk, t, phase, moving, walk) {
  const amp = Math.max(0, drunk);
  if (amp < 0.03) return { yaw: 0, pit: 0, roll: 0 };
  return {
    yaw: (Math.sin((t + phase) * 0.73) * 0.16 + Math.sin((t + phase) * 1.85) * 0.05) * amp,
    pit: (Math.cos((t + phase) * 0.61) * 0.1 + Math.sin(walk) * 0.035 * (moving ? 1 : 0.2)) * amp,
    roll: (Math.sin(t + phase) * 0.2 + Math.sin(walk) * 0.055 * (moving ? 1 : 0.1)) * amp,
  };
}

function animatePeer(peer, dt, t) {
  const rig = peer.rig;
  const u = rig.userData;
  const drunk = clamp(peer.bac, 0, DRUNK_NET);
  const phase = peer.phase || 0;
  const eye = eyeHeight(peer.gender || u.gender);
  const off = Math.max(0, (peer.ty ?? eye) - eye);
  const air = !peer.sit && (off > 0.18 || rig.position.y > 0.16);

  if (peer.stunT > 0) peer.stunT = Math.max(0, peer.stunT - dt);
  if (peer.hurtT > 0) peer.hurtT = Math.max(0, peer.hurtT - dt);
  if (peer.punchT > 0) peer.punchT = Math.max(0, peer.punchT - dt);
  if (!peer.local && (peer.kvx || peer.kvz)) {
    const [kx, kz, nvx, nvz] = stepKnock(peer.tx, peer.tz, peer.kvx, peer.kvz, dt, collideFn, 0.32);
    peer.tx = kx;
    peer.tz = kz;
    peer.kvx = nvx;
    peer.kvz = nvz;
  }

  if (!peer.local) {
    rig.visible = true;
    if (u.body) u.body.visible = true;
  }
  const dx = peer.tx - rig.position.x;
  const dz = peer.tz - rig.position.z;
  const dist = Math.hypot(dx, dz);
  if (!peer.local && dist > (peer.drive ? 3.5 : 8)) {
    rig.position.x = peer.tx;
    rig.position.z = peer.tz;
  } else {
    const k = peer.local ? 1 : Math.min(1, dt * (peer.drive ? 16 : air ? 14 : dist > 2.2 ? 10 : 7));
    rig.position.x += dx * k;
    rig.position.z += dz * k;
  }
  const targetY = peer.drive ? 0.12 : peer.sit ? 0.22 : air ? off : 0;
  rig.position.y += (targetY - rig.position.y) * (peer.local ? 1 : Math.min(1, dt * 16));

  if (peer.hyaw == null) peer.hyaw = peer.tyaw || 0;
  if (peer.byaw == null) peer.byaw = peer.hyaw;
  if (peer.freezeFacing || peer.local) {
    peer.hyaw = peer.tyaw;
    peer.pit = peer.tpit || 0;
  } else {
    peer.hyaw += wrapRad(peer.tyaw - peer.hyaw) * Math.min(1, dt * 12);
    peer.pit += ((peer.tpit || 0) - peer.pit) * Math.min(1, dt * 14);
  }

  const vx = (rig.position.x - peer.lx) / Math.max(dt, 1e-4);
  const vz = (rig.position.z - peer.lz) / Math.max(dt, 1e-4);
  peer.lx = rig.position.x;
  peer.lz = rig.position.z;
  const vel = Math.hypot(vx, vz);
  const moving = !air && !peer.sit && !peer.pee && !peer.drive && vel > 0.18;
  faceBody(peer, moving, vx, vz, dt);
  rig.rotation.y = peer.byaw;

  if (moving) u.walk += dt * (5.5 + drunk * 3.6) * (0.7 + Math.min(1.4, vel / 2.2));
  else if (drunk > 0.18 && !peer.sit && !peer.pee) u.walk += dt * drunk * 1.8;

  const limp = Math.min(1.2, drunk * 1.15);
  const gait = u.walk;
  const warped = gait + Math.sin(gait) * limp * 0.55;
  const amp = moving ? Math.min(0.9, 0.22 + vel * 0.22) : drunk * 0.18;
  const leftSwing = Math.sin(warped) * amp * (1 - limp * 0.58);
  const rightSwing = Math.sin(warped + Math.PI) * amp * (1 + limp * 0.28);
  const hitch = moving ? Math.max(0, -Math.sin(warped)) * limp * 0.07 : Math.sin(t * 1.3 + phase) * drunk * 0.03;

  stepPantDrop(peer, dt);
  if (peer.drive) {
    poseDrive(peer);
  } else if (peer.sit) {
    poseSit(peer);
  } else if (air) {
    const loft = Math.min(1, rig.position.y / 0.45);
    u.legL.rotation.set(-0.55 - loft * 0.2, 0, limp * 0.08);
    u.legR.rotation.set(-0.32 - loft * 0.15, 0, -limp * 0.04);
    u.armL.rotation.set(0.55 + loft * 0.35, 0, 0.15);
    u.armR.rotation.set(peer.pouring ? -1.1 : 0.42 + loft * 0.25, 0, -0.12);
    u.body.position.y = 0;
    u.body.rotation.set(0.12 * loft, 0, 0);
  } else {
    u.legL.rotation.set(leftSwing, 0, limp * 0.2);
    u.legR.rotation.set(rightSwing, 0, -limp * 0.06);
    u.armL.rotation.set(-rightSwing * (0.7 - limp * 0.2) + Math.sin(t * 2.4 + phase) * drunk * 0.12, 0, -drunk * 0.07);
    u.armR.rotation.set(
      peer.pouring ? -1.1 : -leftSwing * 0.65 + Math.sin(t * 1.7 + phase) * drunk * 0.1,
      0,
      drunk * 0.05
    );
    u.body.position.y = hitch;
    u.body.rotation.set(
      moving ? Math.sin(warped) * Math.min(0.07, 0.03 + drunk * 0.03) : Math.sin(t * 0.9 + phase) * Math.min(0.04, drunk * 0.02),
      0,
      moving ? Math.sin(warped + 0.6) * limp * 0.08 : Math.sin(t * 1.25 + phase) * Math.min(0.045, drunk * 0.025)
    );
  }

  if (peer.pee && !peer.sit) u.peePull = Math.min(1, (u.peePull || 0) + dt * 2.4);
  else u.peePull = Math.max(0, (u.peePull || 0) - dt * 3.2);
  const pull = u.peePull || 0;

  if (pull > 0.001 && !peer.sit && !air) {
    u.body.position.y = 0;
    u.body.rotation.x = 0;
    u.legL.rotation.set(0, 0, 0);
    u.legR.rotation.set(0, 0, 0);
    const reach = Math.min(1, pull / 0.55);
    const hold = Math.max(0, (pull - 0.55) / 0.45);
    const rx = -0.18 - reach * 0.72 + hold * 0.35;
    const rz = 0.12 + reach * 0.26 + hold * 0.04;
    for (const [arm, side] of [[u.armL, -1], [u.armR, 1]]) {
      if (!arm) continue;
      arm.position.set(arm.userData.homeX ?? -0.24 * side, arm.userData.homeY ?? 1.1, arm.userData.homeZ ?? 0);
      arm.rotation.set(rx, 0, rz * side);
      arm.scale.set(1, 1, 1);
    }
  } else if (!peer.sit) {
    for (const arm of [u.armL, u.armR]) {
      if (!arm || arm.userData.homeY == null) continue;
      arm.position.set(arm.userData.homeX, arm.userData.homeY, arm.userData.homeZ);
      arm.scale.set(1, 1, 1);
    }
  }

  const drop = u.pantDrop || 0;
  const pantsUp = !pantsDown(peer) && drop < 0.02;
  if (u.hipPants) {
    u.hipPants.visible = pantsUp;
    u.hipPants.position.y = u.hipPants.userData.homeY ?? 0.74;
    u.hipPants.position.z = -0.01;
    u.hipPants.scale.set(u.hipPants.userData.homeSX || 0.36, u.hipPants.userData.homeSY || 0.18, u.hipPants.userData.homeSZ || 0.21);
  }
  for (const cake of [u.hipCakeL, u.hipCakeR, u.hipCakeC]) {
    if (cake) cake.visible = pantsUp;
  }
  for (const pant of [u.pantL, u.pantR]) {
    if (!pant) continue;
    const homeY = pant.userData.homeY ?? -0.32;
    const homeSY = pant.userData.homeSY ?? 0.64;
    pant.position.y = homeY + (-0.68 - homeY) * drop;
    pant.scale.y = homeSY + (0.16 - homeSY) * drop;
    pant.scale.x = 0.16 + 0.04 * drop;
    pant.scale.z = 0.16 + 0.04 * drop;
    pant.visible = true;
  }
  if (u.butt) {
    u.butt.visible = drop > 0.06;
    u.butt.position.set(0, 0.675, -0.118);
    u.butt.scale.set(1, 1, 1);
  }
  if (u.pecker) {
    u.pecker.rotation.set(-Math.PI / 6, 0, 0);
    u.pecker.visible = drop > 0.32;
  }

  if ((peer.punchT || 0) > 0 && !peer.pee) poseRightPunch(u, peer.punchT);

  if (!peer.freezeHead) {
    const sway = drunkSway(drunk, t, phase, moving, u.walk);
    u.head.rotation.order = "YXZ";
    u.head.rotation.set(-peer.pit + sway.pit, headYawOffset(peer) + sway.yaw, sway.roll * 0.65);
  }

  const bases = u.flashBase || [];
  if (bases.length) {
    for (const b of bases) b.m.color.setRGB(b.r, b.g, b.b);
  }
  const flush = Math.min(1, drunk * 0.85);
  u.skin.color.setRGB(0.91 + flush * 0.09, 0.706 - flush * 0.5, 0.541 - flush * 0.44);
  if ((peer.hurtT || 0) > 0) {
    const a = Math.min(1, peer.hurtT / 0.12);
    for (const b of bases) b.m.color.setRGB(1, 0.28 * (1 - a), 0.28 * (1 - a));
    u.skin.color.setRGB(1, 0.32, 0.32);
  }

  if (u.tag && !u.tag.userData.locked) {
    if (u.tag.userData.label !== nameLabel(peer.name)) paintNametag(u.tag, peer.name);
    if (!peer.local) u.tag.visible = true;
    const tall = u.tall || 1;
    u.tag.position.set(0, 1.78 * tall + (u.stars.visible ? 0.12 : 0.04), 0);
    const base = u.tag.userData.baseScale;
    if (base && camera) {
      const d = camera.position.distanceTo(rig.position);
      const s = THREE.MathUtils.clamp(0.92 + d * 0.034, 0.92, 3.4);
      u.tag.scale.set(base.x * s, base.y * s, 1);
    }
  }

  const showStars = drunk > 0.3;
  u.stars.visible = showStars && u.head.visible;
  if (showStars) {
    u.stars.rotation.y += dt * (1.6 + drunk * 4.8);
    u.stars.position.set(0, 0.22 + Math.sin(t * 5 + phase) * 0.03, 0);
    u.stars.scale.setScalar(0.88);
  }

  poseHeld(peer);
  tickPee(peer, dt, t);
}

function killBot(silent) {
  if (!bot) return;
  disposePeeFx(bot.rig?.userData);
  scene?.remove(bot.rig);
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
    hyaw: Math.PI,
    byaw: Math.PI,
    tpit: 0,
    pit: 0,
    bac: 0.16,
    held: "House Whiskey",
    gf: 0,
    gc: 0,
    pouring: false,
    last: performance.now(),
    phase: phaseOf(BOT_ID),
    lx: 2.2,
    lz: 1.6,
    sit: false,
    pants: false,
    pee: false,
    hurtT: 0,
    stunT: 0,
    punchT: 0,
    kvx: 0,
    kvz: 0,
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

  if ((bot.hurtT || 0) > 0) {
    bot.tyaw += Math.sin(t * 8) * 0.4 * dt;
  } else if (ai.wait > 0) {
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
    const quiet = now - (peer.last || 0);
    const leaving = peer.pendingLeave && now - peer.pendingLeave > 4000 && quiet > 4000;
    if (leaving || quiet > 6000) {
      markLeft(id, Date.now());
      dropPeer(id);
      continue;
    }
    if (peer.rig) peer.rig.visible = true;
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
  const hidden = tabHidden();
  if (hbAcc >= (hidden ? 2.0 : 1.6)) {
    hbAcc = 0;
    forcePose = true;
  }
  const extra = poseFn?.() || {};
  const y = extra.y ?? camera.position.y;
  const air = y > eyeHeight(local.gender) + 0.06;
  const drive = !!extra.v;
  const interval = hidden ? 2.0 : drive ? 0.08 : air ? 0.1 : 0.16;
  if (net?.ready() && (forcePose || poseAcc >= interval)) {
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

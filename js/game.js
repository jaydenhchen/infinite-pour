import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import {
  CATALOG,
  CATEGORIES,
  findDrinks,
  spawnCustom,
  randomDrink,
  nameMix,
  mixColor,
  mixAbv,
  DARES,
} from "./drinks.js";
import {
  bootMultiplayer,
  tickMultiplayer,
  setPoseSources,
  publishRestock,
  loadIdentity,
  roster,
  netStatus,
  playerName,
} from "./multiplayer.js?v=19";

const $ = (id) => document.getElementById(id);
const canvas = $("gl");
const W = 16;
const D = 12;
const EYE = 1.58;
const WELL_Z = -2.22;
const SHELF_Z = -3.62;

const GLYPH = {
  0: ["111", "101", "101", "101", "111"],
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
  5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"],
  7: ["111", "001", "001", "001", "001"],
  8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "111", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "&": ["010", "101", "010", "101", "011"],
  "+": ["000", "010", "111", "010", "000"],
  "-": ["000", "000", "111", "000", "000"],
  ".": ["000", "000", "000", "000", "010"],
  "'": ["010", "010", "000", "000", "000"],
  "%": ["101", "001", "010", "100", "101"],
  "!": ["010", "010", "010", "000", "010"],
  "?": ["110", "001", "010", "000", "010"],
  "#": ["101", "111", "101", "111", "101"],
  "/": ["001", "001", "010", "100", "100"],
  ":": ["000", "010", "000", "010", "000"],
};

function blitText(ctx, text, x, y, color, scale = 1) {
  ctx.fillStyle = color;
  let cx = x;
  const s = String(text).toUpperCase();
  for (const ch of s) {
    if (ch === " ") {
      cx += 3 * scale;
      continue;
    }
    const g = GLYPH[ch];
    if (!g) {
      cx += 4 * scale;
      continue;
    }
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (g[row][col] === "1") ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
      }
    }
    cx += 4 * scale;
  }
  return cx - x;
}

function px(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function woodTex() {
  return px(32, 32, (ctx, n) => {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const grain = ((x * 3 + y * 11) ^ (y * 5)) & 7;
        const plank = (y / 8) | 0;
        const base = plank % 2 ? 92 : 78;
        ctx.fillStyle = `rgb(${base + grain * 4},${48 + grain * 2},${22 + grain})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = "#2a160c";
    for (let y = 8; y < n; y += 8) ctx.fillRect(0, y, n, 1);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(7, 16, 1, 16);
    ctx.fillRect(23, 16, 1, 16);
  });
}

function brickTex() {
  return px(32, 32, (ctx, n) => {
    ctx.fillStyle = "#3a2218";
    ctx.fillRect(0, 0, n, n);
    const colors = ["#8b4030", "#7a3428", "#9a4a36", "#6b2e22"];
    for (let row = 0; row < 8; row++) {
      const off = row % 2 ? 4 : 0;
      for (let col = -1; col < 8; col++) {
        ctx.fillStyle = colors[(row * 3 + col + 8) % colors.length];
        ctx.fillRect(col * 8 + off + 1, row * 4 + 1, 6, 2);
      }
    }
    ctx.fillStyle = "#c9b49a";
    for (let y = 0; y < n; y += 4) ctx.fillRect(0, y, n, 1);
  });
}

function tileTex() {
  return px(16, 16, (ctx) => {
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = "#3a332c";
    ctx.fillRect(1, 1, 6, 6);
    ctx.fillRect(9, 1, 6, 6);
    ctx.fillRect(1, 9, 6, 6);
    ctx.fillRect(9, 9, 6, 6);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(7, 0, 2, 16);
    ctx.fillRect(0, 7, 16, 2);
  });
}

function rubberTex() {
  return px(16, 16, (ctx) => {
    ctx.fillStyle = "#1a1210";
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = "#2a1c18";
    for (let y = 0; y < 16; y += 4)
      for (let x = 0; x < 16; x += 4) ctx.fillRect(x + 1, y + 1, 2, 2);
  });
}

function brassTex() {
  return px(16, 16, (ctx) => {
    for (let y = 0; y < 16; y++) {
      const v = 160 + ((y * 13) % 40);
      ctx.fillStyle = `rgb(${v},${v - 50},${40})`;
      ctx.fillRect(0, y, 16, 1);
    }
    ctx.fillStyle = "#ffe08a";
    ctx.fillRect(0, 2, 16, 1);
    ctx.fillStyle = "#6b4a10";
    ctx.fillRect(0, 14, 16, 1);
  });
}

function labelTex(drink) {
  return px(64, 32, (ctx, w, h) => {
    const c = drink.label ?? 0xc9a227;
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f4ead0";
    ctx.fillRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(4, 4, w - 8, h - 8);
    blitText(ctx, drink.name.slice(0, 14), 6, 8, "#f4ead0", 1);
    blitText(ctx, `${Math.round(drink.abv)}%`, 6, 18, "#e8c547", 1);
  });
}

function neonTex(text, hex) {
  return px(192, 48, (ctx, w, h) => {
    ctx.fillStyle = "#080405";
    ctx.fillRect(0, 0, w, h);
    const col = `#${hex.toString(16).padStart(6, "0")}`;
    blitText(ctx, text, 10, 16, col, 3);
  });
}

function chalkTex() {
  return px(256, 160, (ctx, w, h) => {
    ctx.fillStyle = "#1a2420";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2a3830";
    ctx.fillRect(6, 6, w - 12, h - 12);
    blitText(ctx, "TONIGHT", 16, 16, "#f4ead0", 2);
    const picks = [];
    const src = CATALOG.slice();
    for (let i = 0; i < 8; i++) {
      const j = (Math.random() * src.length) | 0;
      picks.push(src.splice(j, 1)[0]);
    }
    picks.forEach((d, i) => {
      blitText(ctx, d.name.slice(0, 22), 16, 40 + i * 14, i % 2 ? "#3dfff2" : "#e8c547", 1);
    });
  });
}

const mats = {};
function bootTextures() {
  const wood = woodTex();
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(8, 6);
  const brick = brickTex();
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping;
  brick.repeat.set(6, 3);
  const tile = tileTex();
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping;
  tile.repeat.set(10, 8);
  const rubber = rubberTex();
  rubber.wrapS = rubber.wrapT = THREE.RepeatWrapping;
  rubber.repeat.set(6, 3);
  mats.wood = new THREE.MeshLambertMaterial({ map: wood });
  mats.woodDark = new THREE.MeshLambertMaterial({ map: wood, color: 0x6b4a32 });
  mats.brick = new THREE.MeshLambertMaterial({ map: brick });
  mats.tile = new THREE.MeshLambertMaterial({ map: tile });
  mats.rubber = new THREE.MeshLambertMaterial({ map: rubber });
  mats.brass = new THREE.MeshLambertMaterial({ map: brassTex(), color: 0xffeeaa });
  mats.barTop = new THREE.MeshLambertMaterial({ color: 0x3a2214 });
  mats.black = new THREE.MeshLambertMaterial({ color: 0x120c0a });
  mats.glass = new THREE.MeshLambertMaterial({ color: 0xc8e6f4, transparent: true, opacity: 0.52 });
  mats.chrome = new THREE.MeshLambertMaterial({ color: 0xc8d0d8 });
  mats.seat = new THREE.MeshLambertMaterial({ color: 0x6b1c23 });
  mats.glow = new THREE.MeshBasicMaterial({ color: 0xffe08a });
}

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

function addBox(parent, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const dropGeo = new THREE.BoxGeometry(0.03, 0.05, 0.03);
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 8);
const unitCyl6 = new THREE.CylinderGeometry(1, 1, 1, 6);

function makeBottle(drink) {
  const g = new THREE.Group();
  g.userData.drink = drink;
  g.userData.kind = "bottle";
  g.userData.volume = 1;
  const liquid = drink.color;
  const glassCol = drink.bottle === "wine" ? 0x2a0810 : drink.bottle === "beer" ? 0x3a2410 : 0xddeef8;
  const glassMat = lambert(glassCol, { transparent: true, opacity: drink.bottle === "spirit" ? 0.42 : 0.62 });
  const liqMat = lambert(liquid, { transparent: true, opacity: 0.92, emissive: liquid, emissiveIntensity: 0.22 });
  const capMat = lambert(drink.label ?? 0x222222);
  const label = new THREE.MeshBasicMaterial({ map: labelTex(drink) });

  if (drink.bottle === "can") {
    const body = new THREE.Mesh(unitCyl, lambert(drink.label ?? 0xc0c8d0));
    body.scale.set(0.048, 0.15, 0.048);
    body.position.y = 0.075;
    g.add(body);
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.049, 0.049, 0.1, 10, 1, true), label);
    wrap.position.y = 0.08;
    g.add(wrap);
    const top = new THREE.Mesh(unitCyl, mats.chrome);
    top.scale.set(0.046, 0.012, 0.046);
    top.position.y = 0.156;
    g.add(top);
    addBox(g, unitBox, mats.chrome, 0, 0.168, 0.01, 0.02, 0.004, 0.03);
  } else if (drink.bottle === "wine") {
    const body = new THREE.Mesh(unitCyl, glassMat);
    body.scale.set(0.055, 0.2, 0.055);
    body.position.y = 0.12;
    g.add(body);
    const inner = new THREE.Mesh(unitCyl, liqMat);
    inner.scale.set(0.04, 0.16, 0.04);
    inner.position.y = 0.11;
    g.add(inner);
    const neck = new THREE.Mesh(unitCyl, glassMat);
    neck.scale.set(0.018, 0.16, 0.018);
    neck.position.y = 0.28;
    g.add(neck);
    const foil = new THREE.Mesh(unitCyl, capMat);
    foil.scale.set(0.02, 0.05, 0.02);
    foil.position.y = 0.37;
    g.add(foil);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.08), label);
    lab.position.set(0, 0.12, 0.056);
    g.add(lab);
  } else if (drink.bottle === "beer") {
    const body = new THREE.Mesh(unitCyl, glassMat);
    body.scale.set(0.05, 0.18, 0.05);
    body.position.y = 0.1;
    g.add(body);
    const inner = new THREE.Mesh(unitCyl, liqMat);
    inner.scale.set(0.038, 0.15, 0.038);
    inner.position.y = 0.09;
    g.add(inner);
    const neck = new THREE.Mesh(unitCyl, glassMat);
    neck.scale.set(0.02, 0.1, 0.02);
    neck.position.y = 0.23;
    g.add(neck);
    const cap = new THREE.Mesh(unitCyl6, capMat);
    cap.scale.set(0.022, 0.025, 0.022);
    cap.position.y = 0.29;
    g.add(cap);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.07), label);
    lab.position.set(0, 0.1, 0.051);
    g.add(lab);
  } else {
    addBox(g, unitBox, glassMat, 0, 0.13, 0, 0.1, 0.26, 0.1);
    addBox(g, unitBox, liqMat, 0, 0.12, 0, 0.078, 0.22, 0.078);
    const neck = new THREE.Mesh(unitCyl, glassMat);
    neck.scale.set(0.022, 0.08, 0.022);
    neck.position.y = 0.3;
    g.add(neck);
    const cap = new THREE.Mesh(unitCyl, capMat);
    cap.scale.set(0.024, 0.03, 0.024);
    cap.position.y = 0.35;
    g.add(cap);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.1), label);
    lab.position.set(0, 0.13, 0.052);
    g.add(lab);
  }
  g.scale.setScalar(1.75);
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.userData.root = g;
    }
  });
  return g;
}

function makeGlassMesh(type) {
  const g = new THREE.Group();
  const glassMat = mats.glass;
  if (type === "wine" || type === "coupe") {
    const bowl = new THREE.Mesh(
      type === "coupe"
        ? new THREE.CylinderGeometry(0.09, 0.02, 0.07, 10)
        : new THREE.CylinderGeometry(0.055, 0.03, 0.1, 10),
      glassMat
    );
    bowl.position.y = type === "coupe" ? 0.16 : 0.18;
    g.add(bowl);
    const stem = new THREE.Mesh(unitCyl, glassMat);
    stem.scale.set(0.012, 0.12, 0.012);
    stem.position.y = 0.08;
    g.add(stem);
    const base = new THREE.Mesh(unitCyl, glassMat);
    base.scale.set(0.055, 0.012, 0.055);
    base.position.y = 0.01;
    g.add(base);
  } else if (type === "shot") {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.07, 8), glassMat);
    c.position.y = 0.035;
    g.add(c);
  } else if (type === "rocks") {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 8), glassMat);
    c.position.y = 0.045;
    g.add(c);
  } else if (type === "highball") {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.16, 8), glassMat);
    c.position.y = 0.08;
    g.add(c);
  } else {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.16, 8), glassMat);
    c.position.y = 0.08;
    g.add(c);
  }
  const liq = new THREE.Mesh(
    unitCyl,
    lambert(0xe8c547, { transparent: true, opacity: 0.86, emissive: 0xe8c547, emissiveIntensity: 0.2 })
  );
  liq.name = "liquid";
  g.add(liq);
  g.userData.kind = "glass";
  g.userData.liq = liq;
  const rimR = { shot: 0.029, rocks: 0.061, wine: 0.056, coupe: 0.091, highball: 0.046, pint: 0.056 }[type] || 0.056;
  const rimY = { shot: 0.07, rocks: 0.09, wine: 0.23, coupe: 0.195, highball: 0.16, pint: 0.16 }[type] || 0.16;
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(rimR, rimR * 0.96, 0.01, 10),
    lambert(0xe8f4fa, { transparent: true, opacity: 0.8 })
  );
  rim.position.y = rimY;
  g.add(rim);
  const hit = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ visible: false }));
  hit.scale.set(0.18, 0.28, 0.18);
  hit.position.y = 0.1;
  g.add(hit);
  g.scale.setScalar(1.35);
  g.traverse((o) => {
    if (o.isMesh) o.userData.root = g;
  });
  return g;
}

function glassDims(type) {
  switch (type) {
    case "shot":
      return { r: 0.022, h: 0.055, y: 0.01 };
    case "rocks":
      return { r: 0.045, h: 0.07, y: 0.01 };
    case "wine":
      return { r: 0.04, h: 0.07, y: 0.13 };
    case "coupe":
      return { r: 0.07, h: 0.04, y: 0.13 };
    case "highball":
      return { r: 0.035, h: 0.13, y: 0.01 };
    default:
      return { r: 0.038, h: 0.13, y: 0.01 };
  }
}

function makeHand(side) {
  const g = new THREE.Group();
  const skin = lambert(0xe8b48a);
  const knuckle = lambert(0xc98a62);
  const sleeve = lambert(0x16161e);
  const cuff = lambert(0x2c2c3a);
  addBox(g, unitBox, sleeve, 0.02 * side, 0.05, 0.2, 0.1, 0.1, 0.3);
  addBox(g, unitBox, cuff, 0.01 * side, 0.02, 0.06, 0.088, 0.08, 0.055);
  addBox(g, unitBox, skin, 0.004 * side, 0.0, 0.02, 0.075, 0.058, 0.055);
  addBox(g, unitBox, skin, 0, -0.012, -0.04, 0.09, 0.042, 0.11);

  const thumb = new THREE.Group();
  addBox(thumb, unitBox, skin, 0, 0, 0, 0.034, 0.034, 0.075);
  addBox(thumb, unitBox, knuckle, 0.002 * side, 0.014, -0.042, 0.028, 0.024, 0.04);
  thumb.position.set(-0.058 * side, 0.02, -0.015);
  thumb.rotation.set(0.45, 0.55 * side, 0.85 * side);
  g.add(thumb);

  const open = new THREE.Group();
  const wrap = new THREE.Group();
  const xs = [-0.032, -0.01, 0.012, 0.034];
  xs.forEach((x, i) => {
    const len = 0.078 - i * 0.008;
    addBox(open, unitBox, skin, x, -0.008, -0.1, 0.02, 0.022, len);
    addBox(open, unitBox, knuckle, x, -0.002, -0.1 - len * 0.42, 0.018, 0.018, 0.032);
    addBox(wrap, unitBox, skin, x + 0.012 * side, -0.008, -0.092, 0.02, 0.024, 0.055);
    addBox(wrap, unitBox, knuckle, x - 0.028 * side, 0.022, -0.118, 0.02, 0.055, 0.022);
    addBox(wrap, unitBox, skin, x - 0.052 * side, 0.046, -0.092, 0.018, 0.032, 0.022);
  });
  wrap.visible = false;
  g.add(open);
  g.add(wrap);
  g.userData.open = open;
  g.userData.wrap = wrap;

  const grip = new THREE.Group();
  grip.position.set(-0.012 * side, -0.018, -0.048);
  g.add(grip);
  g.userData.grip = grip;
  return g;
}

const audio = {
  ctx: null,
  pourOsc: null,
  juke: false,
  jukeNodes: [],
  boot() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.02) * 0.98;
      data[i] = last;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 280;
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start();
  },
  beep(freq, dur, type = "square", vol = 0.06) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },
  clink() {
    this.beep(980, 0.12, "sine", 0.07);
    this.beep(1460, 0.08, "sine", 0.04);
  },
  gulp() {
    this.beep(140, 0.18, "sine", 0.08);
    this.beep(90, 0.22, "triangle", 0.05);
  },
  pourStart() {
    if (!this.ctx || this.pourOsc) return;
    const o = this.ctx.createOscillator();
    const n = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.value = 70;
    n.gain.value = 0.03;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 900;
    o.connect(f);
    f.connect(n);
    n.connect(this.ctx.destination);
    o.start();
    this.pourOsc = { o, n };
  },
  pourStop() {
    if (!this.pourOsc) return;
    this.pourOsc.o.stop();
    this.pourOsc = null;
  },
  toggleJuke() {
    this.juke = !this.juke;
    this.jukeNodes.forEach((n) => n.stop?.());
    this.jukeNodes = [];
    if (!this.juke || !this.ctx) return;
    const notes = [196, 246, 220, 164, 196, 246, 293, 246];
    let i = 0;
    const tick = () => {
      if (!this.juke) return;
      this.beep(notes[i % notes.length], 0.16, "square", 0.03);
      i++;
      this._j = setTimeout(tick, 180);
    };
    tick();
  },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0c10);
scene.fog = new THREE.Fog(0x1a0c10, 12, 22);

const camera = new THREE.PerspectiveCamera(78, 1, 0.08, 40);
camera.rotation.order = "YXZ";
camera.position.set(0, EYE, -1.05);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2(0, 0);
const solids = [];
const pickables = [];
const bottles = [];
const drops = [];
const deliveries = [];

const keys = Object.create(null);
let vy = 0;
let onGround = true;
let walkT = 0;
let pouring = false;
let held = null;
let look = null;
let bac = 0;
let score = 0;
let pours = 0;
let unique = new Set();
let dare = DARES[(Math.random() * DARES.length) | 0];
let toastT = 0;
let summonOpen = false;
let summonCat = "all";
let summonOpenedBy = null;
let resultIndex = 0;
let results = [];
let passedOut = false;
let tWorld = 0;
let mouseDown = false;
let fridgeOpen = false;
let glassState = { type: "pint", fill: 0, parts: [] };
let glassMesh = null;
let bacWait = 0;
let bacSoberT = 0;
let sipT = 0;
let neonA, neonB, jukeLight;
let hatchDoor;
let started = false;
let dragging = false;
let rightHand = null;
let leftHand = null;

function solid(x, z, w, d) {
  solids.push({ minx: x - w / 2, maxx: x + w / 2, minz: z - d / 2, maxz: z + d / 2 });
}

function collide(px, pz, r = 0.28) {
  px = THREE.MathUtils.clamp(px, -W / 2 + 0.35, W / 2 - 0.35);
  pz = THREE.MathUtils.clamp(pz, -D / 2 + 0.35, D / 2 - 0.35);
  for (const s of solids) {
    const cx = THREE.MathUtils.clamp(px, s.minx, s.maxx);
    const cz = THREE.MathUtils.clamp(pz, s.minz, s.maxz);
    let dx = px - cx;
    let dz = pz - cz;
    const dist2 = dx * dx + dz * dz;
    if (dist2 < r * r) {
      const dist = Math.sqrt(dist2) || 0.0001;
      const need = r - dist;
      px += (dx / dist) * need;
      pz += (dz / dist) * need;
    }
  }
  return [px, pz];
}

function registerPick(obj) {
  pickables.push(obj);
}

function unregisterPick(obj) {
  const i = pickables.indexOf(obj);
  if (i >= 0) pickables.splice(i, 1);
}

function placeBottle(drink, x, y, z, rot = 0, stock = true) {
  const b = makeBottle(drink);
  b.position.set(x, y, z);
  b.rotation.y = rot;
  b.userData.stock = stock;
  if (stock) b.userData.home = { x, y, z, rot };
  scene.add(b);
  bottles.push(b);
  registerPick(b);
  return b;
}

function detachHeld() {
  if (!held) return;
  if (held.parent) held.parent.remove(held);
}

function setRightGrip(on) {
  if (!rightHand) return;
  rightHand.userData.open.visible = !on;
  rightHand.userData.wrap.visible = !!on;
}

function poseHands() {
  if (!rightHand || !leftHand) return;
  const bob = Math.sin(tWorld * 2.1) * 0.01;
  const walk = onGround && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD) ? Math.sin(walkT) * 0.014 : 0;
  if (pouring && held && held.userData.kind === "bottle") {
    rightHand.position.set(0.1, -0.13 + bob, -0.36);
    rightHand.rotation.set(1.08, 0.42, 0.7);
  } else if (held && held.userData.kind === "glass") {
    const lift = sipT > 0 ? 0.14 : 0;
    rightHand.position.set(0.2, -0.16 + bob + walk + lift, -0.38 - lift * 0.35);
    rightHand.rotation.set(0.12 + (sipT > 0 ? 0.72 : 0), 0.04, 0.08);
  } else if (held) {
    rightHand.position.set(0.2, -0.24 + bob + walk, -0.4);
    rightHand.rotation.set(0.52, 0.2, 0.38);
  } else {
    rightHand.position.set(0.26, -0.33 + bob + walk, -0.46);
    rightHand.rotation.set(0.3, 0.1, 0.18);
  }
  leftHand.position.set(-0.27, -0.36 + bob - walk, -0.5);
  leftHand.rotation.set(0.24, -0.14, -0.2);
}

function removeBottle(b) {
  if (held === b) {
    detachHeld();
    held = null;
    setRightGrip(false);
  }
  unregisterPick(b);
  if (b.parent) b.parent.remove(b);
  scene.remove(b);
  const i = bottles.indexOf(b);
  if (i >= 0) bottles.splice(i, 1);
}

function restockDrinks() {
  audio.pourStop();
  pouring = false;
  mouseDown = false;
  if (held) {
    const obj = held;
    detachHeld();
    held = null;
    setRightGrip(false);
    if (obj.userData.kind !== "glass" && obj.userData.stock) scene.add(obj);
  }
  deliveries.length = 0;
  for (const drop of drops) scene.remove(drop);
  drops.length = 0;
  for (let i = bottles.length - 1; i >= 0; i--) {
    const b = bottles[i];
    if (!b.userData.stock) {
      removeBottle(b);
      continue;
    }
    const home = b.userData.home;
    if (b.parent && b.parent !== scene) b.parent.remove(b);
    if (b.parent !== scene) scene.add(b);
    unregisterPick(b);
    registerPick(b);
    b.scale.setScalar(1.75);
    b.position.set(home.x, home.y, home.z);
    b.rotation.set(0, home.rot, 0);
    b.userData.volume = 1;
  }
  if (glassState.type !== "pint") setGlassType("pint");
  glassState.fill = 0;
  glassState.parts = [];
  parkGlass();
  poseHands();
}

function resetShift() {
  restockDrinks();
  bac = 0;
  bacWait = 0;
  bacSoberT = 0;
  sipT = 0;
  score = 0;
  pours = 0;
  unique = new Set();
  dare = DARES[(Math.random() * DARES.length) | 0];
  fridgeOpen = false;
  if (hatchDoor) {
    hatchDoor.rotation.y = 0;
    hatchDoor.position.set(-4.84, 1.1, -2.7);
  }
  camera.position.set(0, EYE, -1.05);
  camera.rotation.set(0, 0, 0);
  vy = 0;
  onGround = true;
  walkT = 0;
  hud();
}

function byName(s) {
  const q = s.toLowerCase();
  return CATALOG.find((d) => d.name.toLowerCase() === q) || findDrinks(s, 1)[0];
}

function buildWorld() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mats.wood);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const alley = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.4), mats.tile);
  alley.rotation.x = -Math.PI / 2;
  alley.position.set(0, 0.01, -2.0);
  alley.receiveShadow = true;
  scene.add(alley);

  const mat = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.6), mats.rubber);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(0, 0.015, -1.2);
  scene.add(mat);

  const wallH = 3.4;
  addBox(scene, unitBox, mats.brick, 0, wallH / 2, -D / 2, W, wallH, 0.25);
  addBox(scene, unitBox, mats.brick, 0, wallH / 2, D / 2, W, wallH, 0.25);
  addBox(scene, unitBox, mats.brick, -W / 2, wallH / 2, 0, 0.25, wallH, D);
  addBox(scene, unitBox, mats.brick, W / 2, wallH / 2, 0, 0.25, wallH, D);
  addBox(scene, unitBox, mats.woodDark, 0, wallH, 0, W, 0.2, D);

  for (let i = -2; i <= 2; i++) {
    addBox(scene, unitBox, mats.woodDark, i * 3.2, 3.25, 0, 0.16, 0.18, D - 0.4);
  }

  addBox(scene, unitBox, mats.barTop, 0, 0.52, 0.35, 9.2, 1.04, 1.05);
  addBox(scene, unitBox, mats.woodDark, 0, 1.06, 0.35, 9.4, 0.06, 1.15);
  addBox(scene, unitBox, mats.brass, 0, 0.28, 0.88, 9.0, 0.05, 0.05);
  solid(0, 0.35, 9.2, 1.05);

  addBox(scene, unitBox, mats.barTop, 0, 0.5, WELL_Z, 7.4, 1.0, 0.7);
  addBox(scene, unitBox, mats.woodDark, 0, 1.02, WELL_Z, 7.5, 0.05, 0.78);
  addBox(scene, unitBox, mats.glow, 0, 1.015, WELL_Z - 0.28, 6.8, 0.008, 0.05);
  solid(0, WELL_Z, 7.4, 0.7);

  addBox(scene, unitBox, mats.woodDark, 0, 1.55, SHELF_Z - 0.22, 11.2, 2.6, 0.1);
  for (let row = 0; row < 4; row++) {
    const y = 0.88 + row * 0.56;
    addBox(scene, unitBox, mats.woodDark, 0, y, SHELF_Z - 0.08, 10.6, 0.05, 0.36);
  }
  solid(0, SHELF_Z - 0.1, 11, 0.55);

  const shelfDrinks = CATALOG.slice().sort(() => Math.random() - 0.5);
  let k = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 22; col++) {
      const drink = shelfDrinks[k++ % shelfDrinks.length];
      const x = -3.15 + col * 0.3;
      const y = 0.9 + row * 0.56;
      placeBottle(drink, x, y, SHELF_Z + 0.04, (Math.random() - 0.5) * 0.15);
    }
  }

  const wells = [
    "Tito's Handmade Vodka",
    "Tanqueray",
    "Bacardi Superior",
    "Jack Daniel's",
    "Espolòn Blanco",
    "Jameson",
    "Campari",
    "Lime Juice",
    "Twisted Tea Original",
    "Cutwater Lime Margarita",
    "White Claw Mango",
    "High Noon Pineapple",
  ];
  wells.forEach((name, i) => {
    placeBottle(byName(name), -2.4 + i * 0.38, 1.05, WELL_Z + 0.08, 0);
  });

  const fridge = addBox(scene, unitBox, lambert(0xd8d0c4), -5.35, 1.1, -2.7, 1.05, 2.2, 0.85);
  fridge.userData.kind = "fridge";
  fridge.userData.root = fridge;
  registerPick(fridge);
  hatchDoor = addBox(scene, unitBox, lambert(0xc8c0b4), -4.84, 1.1, -2.7, 0.06, 2.05, 0.8);
  hatchDoor.userData.kind = "fridge";
  hatchDoor.userData.root = fridge;
  addBox(scene, unitBox, lambert(0x3dfff2), -4.82, 1.7, -2.7, 0.08, 0.08, 0.08);
  solid(-5.35, -2.7, 1.15, 0.95);

  addBox(scene, unitBox, mats.woodDark, 5.35, 1.2, -2.85, 1.15, 2.4, 0.62);
  solid(5.35, -2.85, 1.25, 0.7);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      placeBottle(randomDrink((d) => d.type === "wine"), 4.95 + c * 0.2, 0.32 + r * 0.42, -2.62, 0);
    }
  }

  const taps = [
    { drink: byName("Lager") },
    { drink: byName("IPA") },
    { drink: byName("Guinness") },
  ];
  taps.forEach((tap, i) => {
    const x = -0.55 + i * 0.42;
    const col = new THREE.Mesh(unitCyl, mats.chrome);
    col.scale.set(0.03, 0.22, 0.03);
    col.position.set(x, 1.18, WELL_Z - 0.18);
    scene.add(col);
    const handle = addBox(
      scene,
      unitBox,
      lambert(i === 2 ? 0xc9a227 : 0xc41e3a),
      x,
      1.32,
      WELL_Z - 0.12,
      0.03,
      0.08,
      0.02
    );
    handle.userData.kind = "tap";
    handle.userData.drink = tap.drink;
    handle.userData.root = handle;
    registerPick(handle);
    col.userData.kind = "tap";
    col.userData.drink = tap.drink;
    col.userData.root = handle;
  });

  const sink = addBox(scene, unitBox, mats.chrome, -3.15, 1.05, WELL_Z + 0.05, 0.5, 0.08, 0.38);
  sink.userData.kind = "sink";
  sink.userData.root = sink;
  registerPick(sink);

  const reg = addBox(scene, unitBox, lambert(0x1a1a1a), 2.15, 1.16, WELL_Z + 0.05, 0.4, 0.22, 0.28);
  addBox(scene, unitBox, lambert(0x3dfff2), 2.15, 1.28, WELL_Z + 0.18, 0.32, 0.02, 0.02);
  reg.userData.kind = "register";
  reg.userData.root = reg;
  registerPick(reg);

  const hatch = addBox(scene, unitBox, mats.woodDark, -3.7, 1.18, WELL_Z + 0.18, 0.36, 0.28, 0.22);
  hatch.userData.kind = "hatch";
  hatch.userData.root = hatch;
  registerPick(hatch);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.35),
    new THREE.MeshBasicMaterial({ map: chalkTex() })
  );
  board.position.set(-3.35, 2.2, SHELF_Z - 0.16);
  scene.add(board);

  const sign1 = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.8),
    new THREE.MeshBasicMaterial({ map: neonTex("INFINITE POUR", 0xff3dac) })
  );
  sign1.position.set(1.9, 3.05, SHELF_Z - 0.16);
  scene.add(sign1);
  const sign2 = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.55),
    new THREE.MeshBasicMaterial({ map: neonTex("SERVE YOURSELF", 0x3dfff2) })
  );
  sign2.position.set(6.2, 2.55, 0.4);
  sign2.rotation.y = -Math.PI / 2;
  scene.add(sign2);

  neonA = new THREE.PointLight(0xff3dac, 3.2, 9);
  neonA.position.set(1.9, 2.55, SHELF_Z + 0.6);
  scene.add(neonA);
  neonB = new THREE.PointLight(0x3dfff2, 2.0, 7);
  neonB.position.set(6.2, 2.4, 0.4);
  scene.add(neonB);

  for (let i = -2; i <= 2; i++) {
    const stool = new THREE.Group();
    const seat = new THREE.Mesh(unitCyl, mats.seat);
    seat.scale.set(0.16, 0.05, 0.16);
    seat.position.y = 0.72;
    stool.add(seat);
    const pole = new THREE.Mesh(unitCyl, mats.brass);
    pole.scale.set(0.03, 0.72, 0.03);
    pole.position.y = 0.36;
    stool.add(pole);
    stool.position.set(i * 1.5, 0, 1.35);
    scene.add(stool);
  }

  const juke = addBox(scene, unitBox, lambert(0x1a0a12), 7.1, 0.9, 3.6, 0.7, 1.8, 0.5);
  addBox(scene, unitBox, lambert(0xff3dac), 7.1, 1.5, 3.36, 0.5, 0.35, 0.04);
  addBox(scene, unitBox, lambert(0x3dfff2), 7.1, 1.1, 3.36, 0.5, 0.12, 0.04);
  juke.userData.kind = "juke";
  juke.userData.root = juke;
  registerPick(juke);
  jukeLight = new THREE.PointLight(0xff3dac, 1.2, 5);
  jukeLight.position.set(7.1, 1.5, 3.2);
  scene.add(jukeLight);
  solid(7.1, 3.6, 0.8, 0.6);

  glassMesh = makeGlassMesh(glassState.type);
  glassMesh.position.set(0.22, 1.05, WELL_Z + 0.28);
  scene.add(glassMesh);
  registerPick(glassMesh);
  updateGlassVisual();

  const hemi = new THREE.HemisphereLight(0xffe6c8, 0x1a0c08, 0.85);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffd2a0, 0.55);
  dir.position.set(-1, 6, 2);
  dir.castShadow = true;
  dir.shadow.mapSize.set(512, 512);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 20;
  dir.shadow.camera.left = -8;
  dir.shadow.camera.right = 8;
  dir.shadow.camera.top = 8;
  dir.shadow.camera.bottom = -8;
  scene.add(dir);

  for (let i = -1; i <= 1; i++) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
    bulb.position.set(i * 2.6, 2.55, WELL_Z + 0.2);
    scene.add(bulb);
    const pl = new THREE.PointLight(0xffc070, 2.6, 6.5);
    pl.position.copy(bulb.position);
    if (i === 0) pl.castShadow = true;
    scene.add(pl);
  }
  const shelfLight = new THREE.PointLight(0xffe0b0, 2.8, 7);
  shelfLight.position.set(0, 2.1, SHELF_Z + 0.55);
  scene.add(shelfLight);

  const door = addBox(scene, unitBox, mats.woodDark, 0, 1.4, D / 2 - 0.2, 1.4, 2.6, 0.1);
  door.userData.kind = "door";
  door.userData.root = door;
  registerPick(door);
}

function updateGlassVisual() {
  if (!glassMesh) return;
  const liq = glassMesh.userData.liq;
  const dim = glassDims(glassState.type);
  const fill = glassState.fill;
  liq.visible = fill > 0.02;
  if (!liq.visible) return;
  const col = mixColor(glassState.parts);
  liq.material.color.setHex(col);
  if (liq.material.emissive) liq.material.emissive.setHex(col);
  liq.scale.set(dim.r, Math.max(0.01, dim.h * fill), dim.r);
  liq.position.set(0, dim.y + (dim.h * fill) / 2, 0);
}

function setGlassType(type) {
  const holding = held === glassMesh;
  const pos = glassMesh.position.clone();
  unregisterPick(glassMesh);
  if (glassMesh.parent) glassMesh.parent.remove(glassMesh);
  else scene.remove(glassMesh);
  if (holding) held = null;
  glassState.type = type;
  glassMesh = makeGlassMesh(type);
  if (holding) attachHeld(glassMesh);
  else {
    glassMesh.position.copy(pos);
    scene.add(glassMesh);
    registerPick(glassMesh);
  }
  updateGlassVisual();
}

function glassCapacityOz(type) {
  return { shot: 1.5, rocks: 8, pint: 16, highball: 12, wine: 6, coupe: 5, can: 12 }[type] || 10;
}

function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  toastT = 2.6;
}

function playing() {
  return started && !summonOpen && !passedOut;
}

function hud() {
  $("score").textContent = String(score);
  $("pours").textContent = String(pours);
  $("bacFill").style.width = `${THREE.MathUtils.clamp(bac / 0.28, 0, 1) * 100}%`;
  $("glassFill").style.width = `${THREE.MathUtils.clamp(glassState.fill, 0, 1) * 100}%`;
  if (glassState.fill < 0.02) $("glassName").textContent = `empty ${glassState.type}`;
  else {
    const n = nameMix(glassState.parts);
    const a = mixAbv(glassState.parts).toFixed(1);
    $("glassName").textContent = `${n} · ${a}%`;
  }
  if (held && held.userData.kind === "glass") {
    const n = glassState.fill > 0.02 ? nameMix(glassState.parts) : `empty ${glassState.type}`;
    $("heldName").textContent = n;
    $("heldMeta").textContent = `cup in hand · ${glassState.type} · Q set down`;
  } else if (held && held.userData.drink) {
    $("heldName").textContent = held.userData.drink.name;
    $("heldMeta").textContent = `${held.userData.drink.type} · ${held.userData.drink.abv}% ABV · ${Math.round(held.userData.volume * 100)}% left`;
  } else {
    $("heldName").textContent = "empty hands";
    $("heldMeta").textContent = "E grab bottle or cup · T summon";
  }
  $("dareText").textContent = dare.text;
  const d = THREE.MathUtils.clamp(bac / 0.28, 0, 1);
  $("vignette").style.filter = `hue-rotate(${d * 40}deg) saturate(${1 + d})`;
  $("vignette").style.background = `radial-gradient(ellipse at center, transparent ${50 - d * 20}%, rgba(${40 + d * 80}, 8, 20, ${0.45 + d * 0.4}) 100%)`;
  $("lookHint").classList.toggle("show", started && !controls.isLocked && !summonOpen && !passedOut);
  const list = $("onlineList");
  if (list) {
    const people = roster();
    const st = netStatus();
    const lines = people.map((p) => (p.you ? `> ${p.name} (you)` : p.name));
    const link = st === "online" ? "live" : st === "connecting" ? "linking..." : "solo";
    const text = `${lines.join("\n")}\n${people.length} on shift · ${link}`;
    if (list.dataset.snap !== text) {
      list.dataset.snap = text;
      list.replaceChildren();
      lines.forEach((line, i) => {
        const d = document.createElement("div");
        d.textContent = line;
        if (people[i]?.you) d.className = "you";
        list.appendChild(d);
      });
      const n = document.createElement("div");
      n.className = "net";
      n.textContent = `${people.length} on shift · ${link}`;
      list.appendChild(n);
    }
  }
}

function promptFrom(obj) {
  if (!obj) {
    if (held && held.userData.kind === "glass") {
      return glassState.fill > 0.02 ? "F sip  ·  G chug  ·  Q set down" : "cup in hand  ·  Q set down";
    }
    return started && !controls.isLocked ? "click the bar to capture mouse" : "";
  }
  const k = obj.userData.kind;
  const drink = obj.userData.drink;
  if (k === "bottle" && drink) {
    if (held && held.userData.kind === "glass") return `E pour  ${drink.name}  into cup`;
    return `E grab  ${drink.name}`;
  }
  if (k === "glass") {
    if (held && held.userData.kind === "bottle") return `click pour  ${held.userData.drink.name}  ·  E grab cup`;
    if (held && held.userData.kind === "glass") {
      if (glassState.fill > 0.02) return "F sip  ·  G chug  ·  Q set down";
      return "cup in hand  ·  1–6 swap  ·  Q set down";
    }
    if (glassState.fill > 0.02) return "E grab cup  ·  F sip  ·  G chug";
    return "E grab cup  ·  1–6 glassware";
  }
  if (k === "tap") return `E tap  ${drink.name}`;
  if (k === "fridge") return fridgeOpen ? "E grab a cold one" : "E open fridge";
  if (k === "register" || k === "hatch") return "E / T  summon any drink";
  if (k === "sink") return "E dump glass";
  if (k === "juke") return audio.juke ? "E silence the juke" : "E fire up the juke";
  if (k === "door") return "locked. you're already on shift.";
  return "";
}

function findRoot(hit) {
  let o = hit.object;
  while (o) {
    if (o.userData && o.userData.kind) return o.userData.root || o;
    o = o.parent;
  }
  return null;
}

function pick() {
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(pickables, true);
  for (const h of hits) {
    if (h.distance > 3.4) continue;
    const root = findRoot(h);
    if (!root) continue;
    if (held && root === held) continue;
    return { root, distance: h.distance, point: h.point };
  }
  return null;
}

function seatHeldGlass(g) {
  const type = glassState.type;
  const y = type === "shot" ? 0.012 : type === "wine" || type === "coupe" ? -0.03 : 0.018;
  g.scale.setScalar(1.22);
  g.position.set(0.012, y, 0.055);
  g.rotation.set(-0.42, 0.18, 0.1);
}

function parkGlass() {
  if (!glassMesh) return;
  if (held === glassMesh) {
    detachHeld();
    held = null;
    setRightGrip(false);
  }
  if (glassMesh.parent) glassMesh.parent.remove(glassMesh);
  glassMesh.scale.setScalar(1.35);
  glassMesh.position.set(0.22, 1.05, WELL_Z + 0.28);
  glassMesh.rotation.set(0, 0, 0);
  scene.add(glassMesh);
  unregisterPick(glassMesh);
  registerPick(glassMesh);
  updateGlassVisual();
}

function attachHeld(obj) {
  if (!obj || obj === held) return;
  if (held) dropHeld();
  unregisterPick(obj);
  if (obj.parent) obj.parent.remove(obj);
  if (obj.userData.kind === "glass") {
    seatHeldGlass(obj);
    rightHand.userData.grip.add(obj);
    held = obj;
    glassMesh = obj;
    setRightGrip(true);
    poseHands();
    audio.clink();
    toast("cup in hand");
    return;
  }
  const kind = obj.userData.drink?.bottle || "spirit";
  const y = kind === "can" ? -0.04 : kind === "wine" ? -0.09 : kind === "beer" ? -0.06 : -0.07;
  obj.scale.setScalar(0.72);
  obj.position.set(0.0, y, 0.01);
  obj.rotation.set(0.12, 0.4, 0.08);
  rightHand.userData.grip.add(obj);
  held = obj;
  setRightGrip(true);
  poseHands();
  audio.clink();
}

function dropHeld() {
  if (!held) return;
  const obj = held;
  detachHeld();
  held = null;
  setRightGrip(false);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const p = camera.position.clone().add(dir.multiplyScalar(0.75));
  const nearWell = Math.abs(p.z - WELL_Z) < 0.9 && Math.abs(p.x) < 3.6;
  if (obj.userData.kind === "glass") {
    obj.scale.setScalar(1.35);
    if (nearWell) {
      obj.position.set(0.22, 1.05, WELL_Z + 0.28);
    } else {
      p.y = Math.abs(p.z - 0.35) < 1.1 && Math.abs(p.x) < 4.6 ? 1.09 : 0.02;
      obj.position.copy(p);
    }
    obj.rotation.set(0, 0, 0);
    scene.add(obj);
    registerPick(obj);
    glassMesh = obj;
    poseHands();
    return;
  }
  if (nearWell) {
    p.y = 1.05;
    p.z = WELL_Z + 0.12;
  } else {
    p.y = 0.02;
  }
  obj.scale.setScalar(1.75);
  obj.position.copy(p);
  obj.rotation.set(0, camera.rotation.y, 0);
  scene.add(obj);
  registerPick(obj);
  poseHands();
}

function dumpHeldEmpty() {
  if (!held) return;
  const empty = held;
  detachHeld();
  held = null;
  setRightGrip(false);
  poseHands();
  if (empty.userData.stock) {
    const home = empty.userData.home;
    empty.scale.setScalar(1.75);
    empty.position.set(home.x, home.y, home.z);
    empty.rotation.set(0, home.rot, 0);
    empty.userData.volume = 0;
    scene.add(empty);
    registerPick(empty);
  } else {
    const i = bottles.indexOf(empty);
    if (i >= 0) bottles.splice(i, 1);
    unregisterPick(empty);
  }
  toast("bottle's dry");
}

function addPart(drink, amount) {
  const exist = glassState.parts.find((p) => p.name === drink.name);
  if (exist) exist.amount += amount;
  else glassState.parts.push({ ...drink, amount });
}

function pourIntoGlass(drink, amount) {
  const room = 1 - glassState.fill;
  const add = Math.min(room, amount);
  if (add <= 0) return 0;
  glassState.fill += add;
  addPart(drink, add);
  updateGlassVisual();
  return add;
}

function deliver(drink) {
  const b = makeBottle(drink);
  b.userData.stock = false;
  b.position.set(-3.7, 1.2, WELL_Z);
  scene.add(b);
  bottles.push(b);
  registerPick(b);
  deliveries.push({
    mesh: b,
    t: 0,
    from: b.position.clone(),
    to: new THREE.Vector3(0.2 + Math.random() * 0.35, 1.05, WELL_Z + 0.16),
  });
  audio.clink();
  toast(`summoned  ${drink.name}`);
}

function paintCats() {
  const wrap = $("cats");
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map(
    (c) => `<button type="button" data-cat="${c.id}" class="${c.id === summonCat ? "on" : ""}">${c.label}</button>`
  ).join("");
}

function focusSummonBox() {
  if (!summonOpen) return;
  const box = $("q");
  if (summonOpenedBy && box.value.toLowerCase() === summonOpenedBy) box.value = "";
  box.focus();
}

function openSummon(openedBy = null) {
  summonOpen = true;
  summonOpenedBy = openedBy;
  $("summon").classList.add("open");
  if (controls.isLocked) controls.unlock();
  $("q").value = "";
  $("q").blur();
  paintCats();
  renderResults("");
  const onUp = (ev) => {
    if (!summonOpenedBy || ev.key.toLowerCase() === summonOpenedBy || ev.code === "KeyE" || ev.code === "KeyT") {
      window.removeEventListener("keyup", onUp, true);
      focusSummonBox();
      setTimeout(() => {
        summonOpenedBy = null;
      }, 30);
    }
  };
  window.addEventListener("keyup", onUp, true);
  setTimeout(() => {
    focusSummonBox();
    summonOpenedBy = null;
  }, 120);
}

function closeSummon(relock = true) {
  summonOpen = false;
  summonCat = "all";
  summonOpenedBy = null;
  $("q").value = "";
  $("summon").classList.remove("open");
  if (relock && started && !passedOut) controls.lock();
}

function renderResults(q) {
  results = findDrinks(q, 18, summonCat);
  resultIndex = 0;
  if (!results.length) {
    $("results").innerHTML = `<li class="active"><span>nothing in this aisle</span><span class="abv">${summonCat}</span></li>`;
    return;
  }
  $("results").innerHTML = results
    .map(
      (d, i) =>
        `<li data-i="${i}" class="${i === 0 ? "active" : ""}"><span>${d.name}</span><span class="abv">${d.type} ${d.abv}%</span></li>`
    )
    .join("");
}

function spawnActive() {
  const typed = $("q").value.trim();
  const d = results[resultIndex] || (typed ? spawnCustom(typed) : null);
  if (!d) return;
  deliver(d);
  closeSummon();
}

function sipAmount(kind) {
  if (kind === "shot" || kind === "chug") return 1;
  return 0.22;
}

function bumpDrink() {
  bacWait = 10;
  bacSoberT = 0;
  sipT = 0.38;
}

function drinkGlass(kind) {
  if (glassState.fill < 0.02) return;
  const frac = Math.min(glassState.fill, sipAmount(kind));
  const oz = frac * glassCapacityOz(glassState.type);
  const abv = mixAbv(glassState.parts);
  const name = nameMix(glassState.parts);
  bac += (abv / 40) * (oz / 1.2) * 0.028;
  bumpDrink();
  glassState.fill -= frac;
  if (glassState.fill < 0.03) {
    glassState.fill = 0;
    if (!unique.has(name)) {
      unique.add(name);
      score += 25;
    }
    pours += 1;
    score += kind === "chug" ? 15 : 8;
    glassState.parts = [];
  } else {
    score += 3;
  }
  updateGlassVisual();
  audio.gulp();
  const snap = {
    name,
    type: glassState.parts[0]?.type,
    abv,
    parts: glassState.parts.length ? glassState.parts : [{ name, type: "cocktail", abv }],
    fill: glassState.fill,
    glass: glassState.type,
    bottle: glassState.parts[0]?.bottle,
  };
  checkDare(snap, kind === "chug");
  hud();
  maybePassOut();
}

function drinkHeld(kind) {
  if (!held) return;
  const drink = held.userData.drink;
  const frac = kind === "chug" ? held.userData.volume : Math.min(held.userData.volume, 0.2);
  const cap = drink.bottle === "can" || drink.bottle === "beer" ? 12 : 25;
  const oz = frac * cap;
  bac += (drink.abv / 40) * (oz / 1.2) * 0.028;
  bumpDrink();
  held.userData.volume -= frac;
  if (kind === "chug") pours += 1;
  if (kind === "chug" || held.userData.volume <= 0.02) {
    if (!unique.has(drink.name)) {
      unique.add(drink.name);
      score += 25;
    }
    if (kind !== "chug") pours += 1;
    score += kind === "chug" ? 15 : 8;
    dumpHeldEmpty();
  } else score += 3;
  audio.gulp();
  checkDare({ ...drink, parts: [drink], fill: held ? held.userData.volume : 0, glass: drink.glass }, kind === "chug");
  hud();
  maybePassOut();
}

function checkDare(snap, isChug) {
  if (!dare) return;
  if (dare.chug && !isChug) return;
  try {
    if (dare.test(snap)) completeDare();
  } catch {
    /* ignore */
  }
}

function completeDare() {
  score += 100;
  toast("DARE CLEARED  +100");
  audio.beep(520, 0.1, "square", 0.06);
  audio.beep(780, 0.16, "square", 0.06);
  dare = DARES[(Math.random() * DARES.length) | 0];
  hud();
}

function maybePassOut() {
  if (bac < 0.28 || passedOut) return;
  passedOut = true;
  if (controls.isLocked) controls.unlock();
  audio.pourStop();
  $("passoutStats").textContent = `score ${score}  ·  ${pours} pours  ·  ${unique.size} unique  ·  peak bac ${bac.toFixed(3)}`;
  $("passout").classList.add("open");
  resetShift();
}

function startShift() {
  started = true;
  audio.boot();
  const ident = loadIdentity();
  const name = ($("playerName")?.value || ident.name).trim();
  const room = ($("barCode")?.value || ident.room).trim();
  bootMultiplayer({
    scene,
    camera,
    blitText,
    toast,
    name,
    room,
    onRestock(by) {
      restockDrinks();
      audio.clink();
      toast(`${by} restocked the bar`);
    },
  });
  setPoseSources(
    () => held?.userData?.drink?.name || (held?.userData?.kind === "glass" ? "cup" : ""),
    () => pouring
  );
  toast(`${playerName()} is on the stick`);
  $("title").classList.add("hidden");
  $("hud").classList.remove("hidden");
  setTimeout(() => {
    try {
      const p = controls.lock();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* pointer lock is optional */
    }
  }, 0);
}

function clockIn() {
  passedOut = false;
  $("passout").classList.remove("open");
  resetShift();
  controls.lock();
  toast("back on the stick — bar restocked");
}

function useLook() {
  if (!look) return;
  const k = look.userData.kind;
  if (k === "bottle") {
    if (held && held.userData.kind === "glass") {
      const add = pourIntoGlass(look.userData.drink, 0.28);
      if (add) {
        audio.clink();
        toast(`poured  ${look.userData.drink.name}`);
      } else toast("cup is full");
      return;
    }
    attachHeld(look);
  } else if (k === "glass") {
    if (held && held.userData.kind === "bottle") return;
    attachHeld(look);
  }
  else if (k === "tap" && look.userData.drink) {
    const add = pourIntoGlass(look.userData.drink, 0.28);
    if (add) {
      audio.clink();
      toast(`tapped  ${look.userData.drink.name}`);
    } else toast("glass is full");
  } else if (k === "fridge") {
    if (!fridgeOpen) {
      fridgeOpen = true;
      hatchDoor.rotation.y = -1.2;
      hatchDoor.position.x = -4.55;
      hatchDoor.position.z = -2.35;
      toast("fridge yawns. cold cans wait.");
    } else if (!held) {
      const can = randomDrink((d) => d.bottle === "can" || d.type === "rtd");
      const b = makeBottle(can);
      b.userData.stock = false;
      scene.add(b);
      bottles.push(b);
      attachHeld(b);
      toast(can.name);
    }
  } else if (k === "register" || k === "hatch") openSummon("e");
  else if (k === "sink") {
    glassState.fill = 0;
    glassState.parts = [];
    updateGlassVisual();
    toast("glass dumped");
  } else if (k === "juke") {
    audio.toggleJuke();
    toast(audio.juke ? "jukebox: after hours" : "jukebox off");
  } else if (k === "door") toast("you're already inside. lock the door behind you.");
}

function spawnDrop() {
  if (!held) return;
  const m = new THREE.Mesh(dropGeo, lambert(held.userData.drink.color));
  const kind = held.userData.drink?.bottle;
  const topY = kind === "can" ? 0.17 : kind === "wine" ? 0.4 : kind === "beer" ? 0.3 : 0.36;
  const start = new THREE.Vector3(0, topY, 0);
  held.localToWorld(start);
  m.position.copy(start);
  m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.15, -1.6, (Math.random() - 0.5) * 0.1);
  m.userData.life = 0.45;
  scene.add(m);
  drops.push(m);
}

function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const m = drops[i];
    m.userData.life -= dt;
    m.position.addScaledVector(m.userData.v, dt);
    m.userData.v.y -= 8 * dt;
    if (m.userData.life <= 0 || m.position.y < 1.0) {
      scene.remove(m);
      drops.splice(i, 1);
    }
  }
}

function updateDeliveries(dt) {
  for (let i = deliveries.length - 1; i >= 0; i--) {
    const d = deliveries[i];
    d.t += dt * 1.6;
    const t = Math.min(1, d.t);
    d.mesh.position.lerpVectors(d.from, d.to, t);
    d.mesh.position.y = THREE.MathUtils.lerp(d.from.y, d.to.y, t) + Math.sin(t * Math.PI) * 0.4;
    d.mesh.rotation.y += dt * 4;
    if (t >= 1) {
      d.mesh.position.copy(d.to);
      d.mesh.rotation.set(0, 0, 0);
      deliveries.splice(i, 1);
    }
  }
}

function updatePlayer(dt) {
  const drunk = THREE.MathUtils.clamp(bac / 0.28, 0, 1);
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 4.2 : 2.6) * (1 - drunk * 0.45);
  const fwd = Number(!!keys.KeyW) - Number(!!keys.KeyS);
  const side = Number(!!keys.KeyD) - Number(!!keys.KeyA);
  const len = Math.hypot(fwd, side);
  if (len > 0) {
    const f = (fwd / len) * speed * dt;
    const s = (side / len) * speed * dt;
    const slip = (Math.random() - 0.5) * drunk * 0.4 * dt;
    controls.moveForward(f + slip);
    controls.moveRight(s + slip * 0.5);
  }
  if (keys.Space && onGround) {
    vy = 5.2;
    onGround = false;
  }
  vy -= 18 * dt;
  camera.position.y += vy * dt;
  if (camera.position.y <= EYE) {
    camera.position.y = EYE;
    vy = 0;
    onGround = true;
  }
  const [nx, nz] = collide(camera.position.x, camera.position.z);
  camera.position.x = nx;
  camera.position.z = nz;
  if (onGround && len > 0) {
    walkT += dt * (8 + drunk * 4);
    camera.position.y = EYE + Math.abs(Math.sin(walkT)) * 0.055;
  }
  camera.rotation.z = Math.sin(tWorld * (1.1 + drunk)) * 0.12 * drunk;
  camera.fov = 78 + Math.sin(tWorld * 0.7) * 4 * drunk;
  camera.updateProjectionMatrix();
}

function updatePour(dt) {
  const overGlass = look && look.userData.kind === "glass";
  const should =
    mouseDown &&
    held &&
    held.userData.kind === "bottle" &&
    overGlass &&
    held.userData.volume > 0 &&
    glassState.fill < 1;
  if (should && !pouring) {
    pouring = true;
    audio.pourStart();
  }
  if (!should && pouring) {
    pouring = false;
    audio.pourStop();
  }
  if (!should) {
    poseHands();
    return;
  }
  poseHands();
  const add = pourIntoGlass(held.userData.drink, dt * 0.45);
  held.userData.volume -= add;
  if (Math.random() < 0.6) spawnDrop();
  if (held.userData.volume <= 0) {
    dumpHeldEmpty();
    pouring = false;
    audio.pourStop();
  }
}

function resize() {
  const scale = 0.55;
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(1);
  renderer.setSize(Math.floor(w * scale), Math.floor(h * scale), false);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, clock.getDelta());
  tWorld += dt;
  if (sipT > 0) sipT = Math.max(0, sipT - dt);
  if (bac > 0.0001) {
    if (bacWait > 0) bacWait = Math.max(0, bacWait - dt);
    else {
      bacSoberT += dt;
      const rate = 0.00022 * Math.exp(bacSoberT / 15);
      bac = Math.max(0, bac - rate * dt);
      if (bac <= 0) {
        bac = 0;
        bacSoberT = 0;
      }
    }
  } else {
    bac = 0;
    bacWait = 0;
    bacSoberT = 0;
  }
  if (neonA) neonA.intensity = 3.0 + Math.sin(tWorld * 7) * 0.3 + (Math.random() < 0.015 ? -0.8 : 0);
  if (neonB) neonB.intensity = 1.8 + Math.sin(tWorld * 5 + 1) * 0.2;
  if (jukeLight) jukeLight.color.setHSL((tWorld * 0.12) % 1, 0.85, 0.55);
  look = null;
  if (playing()) {
    const p = pick();
    look = p ? p.root : null;
    updatePlayer(dt);
    updatePour(dt);
  } else audio.pourStop();
  updateDrops(dt);
  updateDeliveries(dt);
  $("prompt").textContent = playing() ? promptFrom(look) : "";
  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) $("toast").classList.remove("show");
  }
  poseHands();
  try {
    tickMultiplayer(dt);
  } catch (err) {
    console.warn("mp", err);
  }
  hud();
  renderer.render(scene, camera);
}

function bind() {
  window.addEventListener("resize", resize);
  const ident = loadIdentity();
  if ($("playerName")) $("playerName").value = ident.name;
  if ($("barCode")) $("barCode").value = ident.room.toUpperCase();
  $("clockInBtn").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startShift();
  });
  ["playerName", "barCode"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("click", (e) => e.stopPropagation());
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        startShift();
      }
    });
  });
  $("passout").addEventListener("click", () => {
    audio.boot();
    clockIn();
  });
  controls.addEventListener("lock", () => {
    $("title").classList.add("hidden");
    $("hud").classList.remove("hidden");
    started = true;
  });
  controls.addEventListener("unlock", () => {
    if (!summonOpen && !passedOut && !started) $("title").classList.remove("hidden");
  });
  window.addEventListener("mousedown", (e) => {
    if (e.target.closest("#restock")) return;
    if (e.button !== 0) return;
    mouseDown = true;
    dragging = started && !controls.isLocked && !summonOpen;
    if (!started) return;
    if (!controls.isLocked && !summonOpen && !passedOut && !e.target.closest("#summon") && !e.target.closest("#restock")) {
      controls.lock();
    }
    if (playing() && look && look !== held) {
      if (look.userData.kind === "bottle") attachHeld(look);
      else if (look.userData.kind === "glass" && !(held && held.userData.kind === "bottle")) attachHeld(look);
    }
  });
  window.addEventListener("mouseup", () => {
    mouseDown = false;
    dragging = false;
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging || controls.isLocked || summonOpen) return;
    camera.rotation.y -= e.movementX * 0.0024;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - e.movementY * 0.0024, -1.2, 1.2);
  });
  window.addEventListener("keydown", (e) => {
    const typing =
      e.target === $("q") ||
      e.target === $("playerName") ||
      e.target === $("barCode") ||
      (e.target && e.target.closest && e.target.closest("#summon"));
    if (e.code === "Space" && !typing) e.preventDefault();
    if (!e.repeat) keys[e.code] = true;
    else if (e.code !== "KeyF" && e.code !== "KeyG") keys[e.code] = true;
    if (summonOpenedBy && e.key.toLowerCase() === summonOpenedBy) {
      e.preventDefault();
    }
    if (e.target === $("q")) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSummon();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        spawnActive();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        resultIndex = Math.min(results.length - 1, resultIndex + 1);
        [...$("results").children].forEach((li, i) => li.classList.toggle("active", i === resultIndex));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        resultIndex = Math.max(0, resultIndex - 1);
        [...$("results").children].forEach((li, i) => li.classList.toggle("active", i === resultIndex));
      }
      return;
    }
    if (summonOpen && e.key === "Escape") closeSummon();
    if (!playing()) return;
    if (e.repeat && (e.code === "KeyF" || e.code === "KeyG" || e.code === "KeyE")) return;
    if (e.code === "KeyE") {
      e.preventDefault();
      useLook();
    }
    if (e.code === "KeyQ") dropHeld();
    if (e.code === "KeyR") {
      glassState.fill = 0;
      glassState.parts = [];
      updateGlassVisual();
    }
    if (e.code === "KeyF") {
      if (held && held.userData.kind === "bottle") drinkHeld("sip");
      else drinkGlass("sip");
    }
    if (e.code === "KeyG") {
      if (held && held.userData.kind === "bottle") drinkHeld("chug");
      else drinkGlass("chug");
    }
    if (e.code === "KeyT") {
      e.preventDefault();
      openSummon("t");
    }
    if (e.code === "KeyC") {
      dare = DARES[(Math.random() * DARES.length) | 0];
      toast("new dare");
      hud();
    }
    if (e.code === "KeyB") {
      restockDrinks();
      publishRestock();
      toast("bar restocked for everyone");
      audio.clink();
    }
    const glassKeys = {
      Digit1: "pint",
      Digit2: "wine",
      Digit3: "rocks",
      Digit4: "shot",
      Digit5: "highball",
      Digit6: "coupe",
    };
    if (glassKeys[e.code]) setGlassType(glassKeys[e.code]);
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });
  $("q").addEventListener("input", () => {
    if (summonOpenedBy && $("q").value.toLowerCase() === summonOpenedBy) {
      $("q").value = "";
      return;
    }
    renderResults($("q").value);
  });
  $("q").addEventListener("keydown", (e) => {
    if (summonOpenedBy && e.key.toLowerCase() === summonOpenedBy) e.preventDefault();
  });
  $("cats").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    summonCat = btn.dataset.cat;
    paintCats();
    renderResults($("q").value);
    $("q").focus();
  });
  $("results").addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    resultIndex = Number(li.dataset.i);
    spawnActive();
  });
  $("restock").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    restockDrinks();
    publishRestock();
    toast("bar restocked for everyone");
    audio.clink();
  });
}

bootTextures();
buildWorld();
rightHand = makeHand(1);
camera.add(rightHand);
leftHand = makeHand(-1);
camera.add(leftHand);
poseHands();
window.__BOOT = "world";
try {
  resize();
  bind();
  hud();
  window.__BOOT = "hud";
} catch (err) {
  window.__ERR = String(err && err.stack ? err.stack : err);
  console.error(err);
}

window.__POUR = {
  camera,
  scene,
  start: startShift,
  deliver,
  spawnCustom,
  findDrinks,
  sip: () => drinkGlass("sip"),
  chug: () => (glassState.fill > 0.02 ? drinkGlass("chug") : drinkHeld("chug")),
  pour: (name) => {
    const d = spawnCustom(name);
    pourIntoGlass(d, 0.4);
  },
  restock: restockDrinks,
  reset: resetShift,
  grabGlass: () => attachHeld(glassMesh),
  bumpDrink,
  grabNearest() {
    let best = null;
    let bestD = 9;
    for (const b of bottles) {
      if (b === held || !b.parent) continue;
      const d = b.position.distanceTo(camera.position);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    if (best) attachHeld(best);
    return best?.userData.drink.name;
  },
  state: () => ({
    bac,
    score,
    pours,
    fill: glassState.fill,
    glass: nameMix(glassState.parts) || glassState.type,
    held: held?.userData.drink?.name || held?.userData.kind || null,
    bacWait,
    bacSoberT,
    bottles: bottles.length,
    stock: bottles.filter((b) => b.userData.stock).length,
    pos: camera.position.toArray(),
    net: netStatus(),
    name: playerName(),
    online: roster().map((p) => p.name),
  }),
};

try {
  tick();
  window.__BOOT = "tick";
} catch (err) {
  window.__ERR = String(err && err.stack ? err.stack : err);
  console.error(err);
}

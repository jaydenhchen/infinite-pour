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
  PISS,
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
  makeAvatar,
  tickAvatar,
  localId,
  humanPeers,
  publishEvent,
  setGameHandler,
  setWorldCollide,
  shirtColor,
  tryPunch,
  poseHurt,
  eyeHeight,
  setPeeDrainFn,
  setPeeCupHooks,
  heldCupWorlds,
  setLocalHitHandler,
  setCarHandler,
  pokePose,
  setCopHandler,
  remotePeers,
  shirtKey,
  stepKnock,
  applyKnock,
  setWorldBlock,
} from "./multiplayer.js?v=128";
import { createGames } from "./games.js?v=106";

const $ = (id) => document.getElementById(id);
const canvas = $("gl");
const W = 16;
const D = 12;
const EYE = 1.58;
function eyeY() {
  return eyeHeight(localGender);
}
const WELL_Z = -2.22;
const SHELF_Z = -3.62;
const PASS_OUT = 2.6;
const DRUNK_VIS = 0.3;
const DRUNK_MAX = 6.25;
const HEART_START = 0.7;
const BAC_HOLD = 30;
const BAC_FADE = 60;
const PEE_SECS = 8;
const PEE_CUPS = 2;
const PEE_FILL_RATE = PEE_CUPS / PEE_SECS;
const ONE_DRINK_BAC = (40 / 40) * (1.5 / 1.2) * 0.028;
const CUP_STACK_MAX = 5;
const CUP_NEST = 0.028;
const WORLD_X = 108;
const WORLD_Z_MIN = -18;
const WORLD_Z_MAX = 118;
const CLIMB_MAX = 1.1;
const ROAD_W = 16;
const ROAD_HALF = 8;
const LANE_W = 3.5;
const WALK_W = 3.1;
const CURB_T = 0.28;
const CURB_H = 0.14;
const EW_ZS = [22, 58, 94];
const NS_XS = [-96, -52, 0, 52, 96];
const ROAD_XMIN = -108;
const ROAD_XMAX = 108;
const ROAD_ZMIN = 14;
const ROAD_ZMAX = 102;
const LAMP_SPACING = 20;
const LAMP_CLEAR = 6.4;
const LAMP_SETBACK = ROAD_HALF + 0.96;
const LAMP_H = 4.92;
const LAMP_ARM = 2.18;

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
  a: ["000", "011", "101", "101", "011"],
  b: ["100", "110", "101", "101", "110"],
  c: ["000", "011", "100", "100", "011"],
  d: ["001", "011", "101", "101", "011"],
  e: ["000", "010", "111", "100", "011"],
  f: ["001", "010", "111", "010", "010"],
  g: ["011", "101", "011", "001", "110"],
  h: ["100", "100", "110", "101", "101"],
  i: ["010", "000", "010", "010", "010"],
  j: ["001", "000", "001", "001", "110"],
  k: ["100", "101", "110", "101", "101"],
  l: ["110", "010", "010", "010", "111"],
  m: ["000", "101", "111", "101", "101"],
  n: ["000", "110", "101", "101", "101"],
  o: ["000", "010", "101", "101", "010"],
  p: ["000", "110", "101", "110", "100"],
  q: ["000", "011", "101", "011", "001"],
  r: ["000", "110", "100", "100", "100"],
  s: ["000", "011", "010", "100", "110"],
  t: ["010", "111", "010", "010", "001"],
  u: ["000", "101", "101", "101", "011"],
  v: ["000", "101", "101", "101", "010"],
  w: ["000", "101", "101", "111", "101"],
  x: ["000", "101", "010", "101", "000"],
  y: ["000", "101", "101", "011", "001"],
  z: ["000", "111", "010", "100", "111"],
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
  "_": ["000", "000", "000", "000", "111"],
};

function blitText(ctx, text, x, y, color, scale = 1) {
  ctx.fillStyle = color;
  let cx = x;
  const s = String(text);
  for (const ch of s) {
    if (ch === " ") {
      cx += 5 * scale;
      continue;
    }
    const g = GLYPH[ch] || GLYPH[ch.toUpperCase()] || GLYPH[ch.toLowerCase()];
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

function asphaltTex() {
  return px(32, 32, (ctx, n) => {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const grit = ((x * 13 + y * 7) ^ (x * 3 + y * 17) ^ (x * y)) & 15;
        const v = 26 + grit;
        ctx.fillStyle = `rgb(${v},${v},${v + 3})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    for (let i = 4; i < n; i += 11) ctx.fillRect(0, i, n, 1);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(9, 0, 1, n);
    ctx.fillRect(21, 6, 1, 18);
  });
}

function sidewalkTex() {
  return px(32, 32, (ctx, n) => {
    ctx.fillStyle = "#3e3c42";
    ctx.fillRect(0, 0, n, n);
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const s = ((x * 7 + y * 11) & 7) * 3;
        ctx.fillStyle = `rgb(${86 + s},${84 + s},${88 + s})`;
        ctx.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(x * 16 + 1, y * 16 + 13, 14, 2);
      }
    }
    ctx.fillStyle = "#2c2a30";
    ctx.fillRect(0, 15, n, 2);
    ctx.fillRect(15, 0, 2, n);
  });
}

function grassTex() {
  return px(16, 16, (ctx, n) => {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const g = 20 + ((x * 5 + y * 11 + x * y) & 15);
        ctx.fillStyle = `rgb(${6 + (g & 3)},${g},${12})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
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
  const asp = asphaltTex();
  asp.wrapS = asp.wrapT = THREE.RepeatWrapping;
  const walk = sidewalkTex();
  walk.wrapS = walk.wrapT = THREE.RepeatWrapping;
  const grass = grassTex();
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  mats.asphalt = new THREE.MeshLambertMaterial({ map: asp, color: 0x8a8a94 });
  mats.lane = new THREE.MeshLambertMaterial({ color: 0xc9a227 });
  mats.laneYellow = new THREE.MeshLambertMaterial({ color: 0xd7b31c, emissive: 0x3d2c00, emissiveIntensity: 0.24 });
  mats.laneWhite = new THREE.MeshLambertMaterial({ color: 0xeeeae0, emissive: 0x2a2820, emissiveIntensity: 0.2 });
  mats.sidewalk = new THREE.MeshLambertMaterial({ map: walk, color: 0x8a8882 });
  mats.grass = new THREE.MeshLambertMaterial({ map: grass, color: 0x2a3c22 });
  mats.curb = new THREE.MeshLambertMaterial({ color: 0x8a8680 });
  mats.steel = new THREE.MeshLambertMaterial({ color: 0x2a2c32 });
  mats.night = new THREE.MeshLambertMaterial({ color: 0x0c0a12 });
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
const smokeGeo = new THREE.SphereGeometry(0.2, 6, 5);

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

function glassProfile(type) {
  switch (type) {
    case "shot":
      return { rb: 0.023, rt: 0.027, h: 0.056, y: 0.008 };
    case "rocks":
      return { rb: 0.047, rt: 0.057, h: 0.076, y: 0.008 };
    case "wine":
      return { rb: 0.026, rt: 0.05, h: 0.086, y: 0.134 };
    case "coupe":
      return { rb: 0.018, rt: 0.084, h: 0.058, y: 0.128 };
    case "highball":
      return { rb: 0.04, rt: 0.043, h: 0.142, y: 0.01 };
    default:
      return { rb: 0.038, rt: 0.052, h: 0.142, y: 0.01 };
  }
}

function glassWallMat() {
  const mat = mats.glass.clone();
  mat.transparent = true;
  mat.opacity = 0.28;
  mat.depthWrite = false;
  mat.side = THREE.DoubleSide;
  return mat;
}

function addGlassWall(parent, mat, rt, rb, h, y) {
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12, 1, true), mat);
  wall.position.y = y;
  parent.add(wall);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(rb * 0.98, 12), mat);
  bot.rotation.x = -Math.PI / 2;
  bot.position.y = y - h / 2 + 0.001;
  parent.add(bot);
}

function makeGlassMesh(type) {
  const g = new THREE.Group();
  const glassMat = glassWallMat();
  if (type === "wine" || type === "coupe") {
    if (type === "coupe") addGlassWall(g, glassMat, 0.09, 0.02, 0.07, 0.16);
    else addGlassWall(g, glassMat, 0.055, 0.03, 0.1, 0.18);
    const stem = new THREE.Mesh(unitCyl, glassMat);
    stem.scale.set(0.012, 0.12, 0.012);
    stem.position.y = 0.08;
    g.add(stem);
    const base = new THREE.Mesh(unitCyl, glassMat);
    base.scale.set(0.055, 0.012, 0.055);
    base.position.y = 0.01;
    g.add(base);
  } else if (type === "shot") {
    addGlassWall(g, glassMat, 0.028, 0.024, 0.07, 0.035);
  } else if (type === "rocks") {
    addGlassWall(g, glassMat, 0.06, 0.05, 0.09, 0.045);
  } else if (type === "highball") {
    addGlassWall(g, glassMat, 0.045, 0.042, 0.16, 0.08);
  } else {
    addGlassWall(g, glassMat, 0.055, 0.04, 0.16, 0.08);
  }
  const liqMat = lambert(0xe8c547, {
    transparent: true,
    opacity: 0.94,
    emissive: 0xe8c547,
    emissiveIntensity: 0.32,
    depthWrite: false,
  });
  const liq = new THREE.Mesh(unitCyl, liqMat);
  liq.name = "liquid";
  liq.renderOrder = 2;
  g.add(liq);
  const meniscus = new THREE.Mesh(new THREE.CircleGeometry(1, 14), liqMat.clone());
  meniscus.name = "meniscus";
  meniscus.rotation.x = -Math.PI / 2;
  meniscus.renderOrder = 3;
  meniscus.visible = false;
  g.add(meniscus);
  g.userData.kind = "glass";
  g.userData.liq = liq;
  g.userData.meniscus = meniscus;
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
  const p = glassProfile(type);
  return { r: Math.max(p.rb, p.rt), h: p.h, y: p.y, rb: p.rb, rt: p.rt };
}

function isPissPart(p) {
  return !!(p && (p.id === "piss" || /piss/i.test(p.name || "")));
}

function peeShareOf(parts) {
  if (!parts || !parts.length) return 0;
  let pee = 0;
  let tot = 0;
  for (const p of parts) {
    const a = Math.max(0, Number(p.amount) || 0);
    tot += a;
    if (isPissPart(p)) pee += a;
  }
  return tot > 0 ? pee / tot : 0;
}

function purgeBac(drinks) {
  const cut = Math.min(bac, Math.max(0, (Number(drinks) || 0) * ONE_DRINK_BAC));
  if (cut <= 0) return 0;
  bac = Math.max(0, bac - cut);
  if (bacDecayFrom > 0) bacDecayFrom = Math.max(bac, bacDecayFrom - cut);
  return cut;
}

function rememberGlass(mesh) {
  if (!mesh) return;
  mesh.userData.gtype = glassState.type;
  mesh.userData.gfill = glassState.fill;
  mesh.userData.gparts = glassState.parts.map((p) => ({ ...p }));
}

function loadGlass(mesh) {
  if (!mesh) return;
  glassState.type = mesh.userData.gtype || mesh.userData.type || "pint";
  glassState.fill = Number(mesh.userData.gfill) || 0;
  glassState.parts = Array.isArray(mesh.userData.gparts) ? mesh.userData.gparts.map((p) => ({ ...p })) : [];
}

function trackLooseGlass(mesh) {
  if (!mesh || looseGlasses.includes(mesh)) return;
  looseGlasses.push(mesh);
}

function forgetLooseGlass(mesh) {
  const i = looseGlasses.indexOf(mesh);
  if (i >= 0) looseGlasses.splice(i, 1);
}

function disposeGlassMesh(mesh) {
  if (!mesh) return;
  forgetLooseGlass(mesh);
  unregisterPick(mesh);
  if (held === mesh) {
    detachHeld();
    held = null;
    setRightGrip(false);
  }
  if (mesh.parent) mesh.parent.remove(mesh);
  else scene.remove(mesh);
  if (glassMesh === mesh) glassMesh = null;
}

function clearLooseGlasses() {
  for (const mesh of [...looseGlasses]) disposeGlassMesh(mesh);
  if (glassMesh) disposeGlassMesh(glassMesh);
  glassMesh = null;
  glassState.type = "pint";
  glassState.fill = 0;
  glassState.parts = [];
}

function makeStackCup() {
  const g = new THREE.Group();
  const mat = glassWallMat();
  addGlassWall(g, mat, 0.055, 0.04, 0.15, 0.075);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.054, 0.01, 10),
    lambert(0xe8f4fa, { transparent: true, opacity: 0.72 })
  );
  rim.position.y = 0.15;
  g.add(rim);
  g.traverse((o) => {
    if (o.isMesh) o.userData.root = g;
  });
  return g;
}

function buildCupStacks() {
  const spots = [
    { x: 3.12, z: WELL_Z + 0.24 },
    { x: 3.4, z: WELL_Z + 0.24 },
  ];
  cupStackMeshes.length = 0;
  cupStacks[0] = CUP_STACK_MAX;
  cupStacks[1] = CUP_STACK_MAX;
  spots.forEach((spot, i) => {
    const g = new THREE.Group();
    g.position.set(spot.x, 1.05, spot.z);
    const cups = [];
    for (let n = 0; n < CUP_STACK_MAX; n++) {
      const c = makeStackCup();
      c.position.y = n * CUP_NEST;
      c.scale.setScalar(1.28 - n * 0.018);
      g.add(c);
      cups.push(c);
    }
    const hit = new THREE.Mesh(unitBox, new THREE.MeshBasicMaterial({ visible: false }));
    hit.scale.set(0.22, 0.42, 0.22);
    hit.position.y = 0.16;
    g.add(hit);
    g.userData.kind = "cupstack";
    g.userData.stack = i;
    g.userData.cups = cups;
    g.userData.root = g;
    g.traverse((o) => {
      if (o.isMesh) {
        o.userData.kind = "cupstack";
        o.userData.root = g;
      }
    });
    scene.add(g);
    registerPick(g);
    cupStackMeshes.push(g);
  });
  paintCupStacks();
}

function paintCupStacks() {
  for (let i = 0; i < cupStackMeshes.length; i++) {
    const g = cupStackMeshes[i];
    const n = THREE.MathUtils.clamp(cupStacks[i] | 0, 0, CUP_STACK_MAX);
    cupStacks[i] = n;
    (g.userData.cups || []).forEach((c, k) => {
      c.visible = k < n;
    });
  }
}

function publishCupStacks() {
  publishEvent({ t: "cups", a: [cupStacks[0], cupStacks[1]] });
}

function applyCupStacks(arr) {
  if (!Array.isArray(arr) || arr.length < 2) return;
  const next = [
    THREE.MathUtils.clamp(Number(arr[0]) || 0, 0, CUP_STACK_MAX),
    THREE.MathUtils.clamp(Number(arr[1]) || 0, 0, CUP_STACK_MAX),
  ];
  if (next[0] === cupStacks[0] && next[1] === cupStacks[1]) return;
  cupStacks[0] = next[0];
  cupStacks[1] = next[1];
  paintCupStacks();
}

function restockCupStacks(fromNet) {
  clearLooseGlasses();
  cupStacks[0] = CUP_STACK_MAX;
  cupStacks[1] = CUP_STACK_MAX;
  paintCupStacks();
  if (!fromNet) publishCupStacks();
}

function grabCupFromStack(want) {
  let i = want;
  if (i == null || cupStacks[i] <= 0) {
    i = cupStacks[0] > 0 ? 0 : cupStacks[1] > 0 ? 1 : -1;
  }
  if (i < 0) {
    toast("no cups left · restock the bar");
    return;
  }
  if (held) dropHeld();
  cupStacks[i] -= 1;
  paintCupStacks();
  publishCupStacks();
  glassState.type = glassState.type || "pint";
  glassState.fill = 0;
  glassState.parts = [];
  const cup = makeGlassMesh(glassState.type);
  cup.userData.gtype = glassState.type;
  cup.userData.gfill = 0;
  cup.userData.gparts = [];
  glassMesh = cup;
  attachHeld(cup);
}

function makeHand(side) {
  const g = new THREE.Group();
  const skin = lambert(0xe8b48a, { emissive: 0xc48a5c, emissiveIntensity: 0.35 });
  const shirt = lambert(shirtColor());
  const sleeve = addBox(g, unitBox, shirt, 0, 0, 0.22, 0.12, 0.12, 0.36);
  const palm = addBox(g, unitBox, skin, 0, 0, -0.02, 0.1, 0.1, 0.14);

  const open = new THREE.Group();
  const wrap = new THREE.Group();
  wrap.visible = false;
  g.add(open);
  g.add(wrap);
  g.userData.open = open;
  g.userData.wrap = wrap;
  g.userData.shirt = shirt;
  g.userData.skin = skin;
  g.userData.sleeve = sleeve;
  g.userData.palm = palm;

  const grip = new THREE.Group();
  grip.position.set(-0.012 * side, -0.018, -0.048);
  g.add(grip);
  g.userData.grip = grip;
  return g;
}

function bindLocalHands() {
  const u = localPeer?.rig?.userData;
  const shirt = u?.shirt;
  const skin = u?.skin;
  const hex = shirtColor();
  for (const hand of [rightHand, leftHand]) {
    if (!hand) continue;
    if (shirt && hand.userData.sleeve) {
      hand.userData.sleeve.material = shirt;
      hand.userData.shirt = shirt;
    } else if (hand.userData.shirt) {
      hand.userData.shirt.color.setHex(hex);
    }
    if (hand.userData.skin) {
      hand.userData.skin.color.setHex(0xe8b48a);
      if (hand.userData.skin.emissive) hand.userData.skin.emissive.setHex(0xc48a5c);
    }
  }
}

const audio = {
  ctx: null,
  pourOsc: null,
  peeOsc: null,
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
  noiseBuf() {
    if (this._noise) return this._noise;
    if (!this.ctx) return null;
    const len = Math.floor(this.ctx.sampleRate * 0.45);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this._noise = buf;
    return buf;
  },
  burst(dur, vol = 0.05, freq = 900, type = "bandpass", q = 0.9) {
    if (!this.ctx) return;
    const buf = this.noiseBuf();
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(Math.max(0.0001, vol), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    src.start();
    src.stop(now + dur);
  },
  clink() {
    this.beep(980, 0.12, "sine", 0.07);
    this.beep(1460, 0.08, "sine", 0.04);
  },
  gulp(kind = "sip") {
    this.beep(140, 0.18, "sine", 0.09);
    this.beep(90, 0.22, "triangle", 0.06);
    if (kind === "chug") {
      this.beep(70, 0.34, "sine", 0.07);
      this.beep(110, 0.28, "triangle", 0.05);
      this.burst(0.16, 0.03, 400, "lowpass", 0.4);
    }
  },
  canOpen() {
    this.beep(1480, 0.05, "square", 0.035);
    this.beep(2100, 0.04, "sine", 0.03);
    this.burst(0.06, 0.04, 2400, "highpass", 0.7);
  },
  doorThump() {
    this.beep(180, 0.09, "triangle", 0.07);
    this.beep(90, 0.16, "sine", 0.05);
    this.burst(0.12, 0.04, 220, "lowpass", 0.5);
    this.beep(420, 0.05, "sine", 0.025);
  },
  screech() {
    if (this.ctx && this._screechT && this.ctx.currentTime < this._screechT) return;
    if (this.ctx) this._screechT = this.ctx.currentTime + 0.1;
    this.burst(0.1, 0.018, 1900, "highpass", 0.55);
    this.beep(240 + Math.random() * 90, 0.07, "sawtooth", 0.018);
  },
  sit() {
    this.beep(160, 0.1, "triangle", 0.05);
    this.burst(0.08, 0.03, 180, "lowpass");
  },
  stand() {
    this.beep(210, 0.07, "triangle", 0.04);
    this.burst(0.06, 0.025, 260, "lowpass");
  },
  jump() {
    this.beep(240, 0.08, "sine", 0.04);
    this.burst(0.08, 0.03, 500, "highpass");
  },
  land(hard) {
    this.beep(hard ? 70 : 100, 0.12, "sine", hard ? 0.07 : 0.04);
    this.burst(0.1, hard ? 0.05 : 0.03, 140, "lowpass");
  },
  step() {
    this.burst(0.04, 0.018, 160, "lowpass", 0.4);
    this.beep(90, 0.04, "sine", 0.02);
  },
  punch() {
    this.burst(0.1, 0.05, 700, "bandpass", 0.8);
    this.beep(180, 0.08, "triangle", 0.04);
  },
  hit() {
    this.beep(90, 0.12, "sine", 0.08);
    this.burst(0.12, 0.07, 280, "lowpass", 0.5);
    this.beep(220, 0.06, "square", 0.03);
  },
  drop(kind) {
    if (kind === "glass") this.clink();
    else {
      this.beep(130, 0.1, "triangle", 0.05);
      this.burst(0.08, 0.035, 200, "lowpass");
    }
  },
  empty() {
    this.beep(150, 0.08, "triangle", 0.04);
    this.beep(90, 0.1, "sine", 0.03);
  },
  splash() {
    this.burst(0.18, 0.06, 1200, "bandpass", 0.6);
    this.beep(240, 0.08, "sine", 0.03);
  },
  bump() {
    this.beep(70, 0.1, "sine", 0.06);
    this.burst(0.08, 0.04, 120, "lowpass");
  },
  dart() {
    this.beep(220, 0.05, "triangle", 0.04);
    this.burst(0.06, 0.035, 900, "bandpass", 0.8);
  },
  sinkStart() {
    if (!this.ctx || this.sinkOsc) return;
    const buf = this.noiseBuf();
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1800;
    f.Q.value = 0.55;
    const g = this.ctx.createGain();
    g.gain.value = 0.03;
    src.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    src.start();
    this.sinkOsc = { src, g };
  },
  sinkStop() {
    if (!this.sinkOsc) return;
    try { this.sinkOsc.src.stop(); } catch (err) { /* already stopped */ }
    this.sinkOsc = null;
  },
  flush() {
    this.burst(0.45, 0.06, 380, "lowpass", 0.4);
    this.beep(180, 0.22, "sawtooth", 0.025);
    this.beep(90, 0.3, "sine", 0.03);
  },
  peeStart() {
    if (!this.ctx || this.peeOsc) return;
    const buf = this.noiseBuf();
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1400;
    f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.value = 0.028;
    src.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    src.start();
    this.peeOsc = { src, g };
  },
  peeStop() {
    if (!this.peeOsc) return;
    try { this.peeOsc.src.stop(); } catch (err) { /* already stopped */ }
    this.peeOsc = null;
  },
  passout() {
    this.beep(80, 0.4, "sine", 0.08);
    this.beep(40, 0.55, "triangle", 0.06);
    this.burst(0.3, 0.05, 90, "lowpass");
  },
  summonOpen() {
    this.beep(520, 0.07, "square", 0.04);
    this.beep(780, 0.08, "sine", 0.03);
  },
  summonClose() {
    this.beep(400, 0.06, "square", 0.03);
  },
  chat() {
    this.beep(690, 0.045, "square", 0.03);
  },
  restock() {
    this.clink();
    setTimeout(() => this.clink(), 70);
    setTimeout(() => this.clink(), 140);
  },
  warp() {
    this.beep(300, 0.12, "sine", 0.04);
    this.beep(180, 0.16, "triangle", 0.04);
    this.burst(0.14, 0.03, 600, "bandpass");
  },
  table() {
    this.beep(330, 0.08, "triangle", 0.05);
    this.beep(220, 0.1, "sine", 0.04);
  },
  catch() {
    this.beep(720, 0.07, "square", 0.05);
    this.beep(980, 0.05, "sine", 0.04);
  },
  heartLub(str) {
    const v = 0.03 + str * 0.07;
    this.beep(46, 0.1, "sine", v);
    this.beep(28, 0.16, "triangle", v * 0.7);
  },
  heartDub(str) {
    const v = 0.02 + str * 0.045;
    this.beep(38, 0.08, "sine", v);
  },
  engineStart() {
    if (this.ctx == null || this.eng) return;
    const o = this.ctx.createOscillator();
    const n = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.value = 48;
    n.gain.value = 0.0;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 240;
    o.connect(f);
    f.connect(n);
    n.connect(this.ctx.destination);
    o.start();
    this.eng = { o, n, f };
  },
  engineTick(speed) {
    if (this.eng == null || this.ctx == null) return;
    const sp = Math.abs(speed);
    const now = this.ctx.currentTime;
    this.eng.o.frequency.setTargetAtTime(48 + sp * 9, now, 0.08);
    this.eng.n.gain.setTargetAtTime(0.018 + Math.min(0.07, sp * 0.004), now, 0.08);
    this.eng.f.frequency.setTargetAtTime(220 + sp * 18, now, 0.08);
  },
  engineStop() {
    if (this.eng == null) return;
    try { this.eng.o.stop(); } catch (err) { /* already stopped */ }
    this.eng = null;
  },
  crash() {
    this.burst(0.28, 0.14, 120, "lowpass", 0.6);
    this.beep(64, 0.2, "sawtooth", 0.07);
    this.beep(36, 0.3, "triangle", 0.05);
  },
  baton() {
    this.beep(210, 0.06, "square", 0.05);
    this.burst(0.08, 0.045, 720, "bandpass");
  },
  arrest() {
    this.passout();
    this.beep(150, 0.22, "square", 0.05);
    this.beep(96, 0.3, "triangle", 0.045);
  },
  sirenStart() {
    if (this.ctx == null || this.siren) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.value = 680;
    g.gain.value = 0.032;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 880;
    f.Q.value = 2.4;
    o.connect(f);
    f.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    this.siren = { o, g, f, t: 0 };
  },
  sirenTick(dt) {
    if (!this.siren || !this.ctx) return;
    this.siren.t += dt;
    const hi = this.siren.t % 0.7 < 0.35;
    const now = this.ctx.currentTime;
    this.siren.o.frequency.setTargetAtTime(hi ? 790 : 510, now, 0.035);
  },
  sirenStop() {
    if (!this.siren) return;
    try { this.siren.o.stop(); } catch (err) { /* already stopped */ }
    this.siren = null;
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
scene.background = new THREE.Color(0x12080c);
scene.fog = new THREE.Fog(0x12080c, 28, 170);

const camera = new THREE.PerspectiveCamera(78, 1, 0.08, 280);
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
const _pickOrigin = new THREE.Vector3();
const _pickDir = new THREE.Vector3();
const _pickWorld = new THREE.Vector3();
const NEAR_USE = new Set(["door", "register", "hatch", "sink", "bathSink", "juke", "stool", "car", "tap", "toilet", "urinal", "stallDoor", "restroomDoor", "darts", "cupstack", "baton"]);
const solids = [];
const pickables = [];
const bottles = [];
const drops = [];
const deliveries = [];

const keys = Object.create(null);
let vy = 0;
let onGround = true;
let standY = 0;
let walkT = 0;
let pouring = false;
let held = null;
let look = null;
let bac = 0;
let score = 0;
let pours = 0;
let pourBank = 0;
let unique = new Set();
let toastT = 0;
let winPopT = 0;
let summonOpen = false;
let summonCat = "all";
let summonOpenedBy = null;
let chatOpen = false;
let chatOpenedBy = null;
const chatLines = [];
const CHAT_COLORS = ["#55FF55", "#55FFFF", "#FFFF55", "#FF55FF", "#FFAA00", "#FFFFFF", "#FF5555", "#55FF55"];
let resultIndex = 0;
let results = [];
let passedOut = false;
let tWorld = 0;
let mouseDown = false;
let fridgeOpen = false;
const toilets = [];
const sinks = [];
const stallZones = [];
const ceilings = [];
const swingDoors = [];
let bathFlicker = null;
let glassState = { type: "pint", fill: 0, parts: [] };
let glassMesh = null;
const looseGlasses = [];
const cupStacks = [CUP_STACK_MAX, CUP_STACK_MAX];
const cupStackMeshes = [];
let drankPiss = false;
let bacWait = 0;
let bacSoberT = 0;
let bacDecayFrom = 0;
let bacHoldUntil = 0;
let bacDecayStart = 0;
let sipT = 0;
let neonA, neonB, jukeLight;
let hatchDoor;
let frontDoor = null;
let frontDoorOpen = false;
let frontDoorAng = 0;
let frontDoorWant = 0;
let zoomHold = false;
let started = false;
let dragging = false;
let rightHand = null;
let leftHand = null;
let viewMode = 1;
let localPeer = null;
let inCar = null;
let carSeatI = 0;
let lastPeerN = -1;
const driftPuffs = [];
const remotePacks = new Map();
let lastCopKey = "";
let copNetAcc = 0;
const cars = [];
const worldSolids = [];
const carBlocks = [];
const camSolids = [];
const pads = [];
const bodyPos = new THREE.Vector3(0, EYE, -1.05);
const _headAim = new THREE.Vector3();
const _headWorld = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _drunkEuler = new THREE.Euler();
const drunkCam = { yaw: 0, pit: 0, roll: 0 };
let savedYaw = 0;
let savedPitch = 0;
let sitting = null;
const SIT_Y = 1.22;
let houseGames = null;
let view2Yaw = 0;
let view2Pitch = 0;
let peeing = false;
let peeUntil = 0;
let peeStart = 0;
let pantsStart = 0;
let viewPantDrop = 0;
let viewPants = null;
let punchT = 0;
let knockVx = 0;
let knockVz = 0;
let lastKnock = { x: 0, z: 0 };
let shakePhase = 0;
let shakeWalk = 0;
let localGender = "m";
let heartT = 0;
let heartKick = 0;
const cops = [];
let wanted = false;
let wantedT = 0;
const WANTED_GIVE_UP = 60;
const COP_ARRIVE_MIN = 12;
const COP_ARRIVE_MAX = 18;
const COP_HP = 10;
const PUNCH_DMG = 1;
const BATON_DMG = 3;
let stunT = 0;
let hurtFlash = 0;
let crashCool = 0;
let rideCar = null;
let climbCarHit = null;
let copSerial = 0;
let copWave = 0;

function packSolid(x, z, w, d, h, extra = {}) {
  return {
    minx: x - w / 2,
    maxx: x + w / 2,
    minz: z - d / 2,
    maxz: z + d / 2,
    top: h,
    climb: h <= CLIMB_MAX + 0.001,
    ...extra,
  };
}

function solid(x, z, w, d, h = 1.2) {
  solids.push(packSolid(x, z, w, d, h));
  camBox(x, h / 2, z, w, h, d);
}

function worldSolid(x, z, w, d, h = 4) {
  worldSolids.push(packSolid(x, z, w, d, h));
}

function blockCars(x, z, w, d) {
  carBlocks.push(packSolid(x, z, w, d, 4));
}

function inCarBlock(px, pz, pad = 0) {
  for (const s of carBlocks) {
    if (px >= s.minx - pad && px <= s.maxx + pad && pz >= s.minz - pad && pz <= s.maxz + pad) return true;
  }
  return false;
}

function addCeiling(x, z, w, d, y) {
  ceilings.push({
    minx: x - w / 2,
    maxx: x + w / 2,
    minz: z - d / 2,
    maxz: z + d / 2,
    y,
  });
}

function ceilingAt(px, pz) {
  let best = Infinity;
  for (const c of ceilings) {
    if (px >= c.minx && px <= c.maxx && pz >= c.minz && pz <= c.maxz && c.y < best) best = c.y;
  }
  return best;
}


function overAabb(px, pz, s, pad = 0) {
  return px >= s.minx - pad && px <= s.maxx + pad && pz >= s.minz - pad && pz <= s.maxz + pad;
}

function climbTopUnder(px, pz, feet, airborne, pad = 0.06) {
  let best = 0;
  climbCarHit = null;
  const consider = (s) => {
    if (!s.climb || !overAabb(px, pz, s, pad)) return;
    if (feet >= s.top - 0.14 || (airborne && feet + 0.44 >= s.top)) {
      if (s.top > best) best = s.top;
    }
  };
  for (const s of solids) consider(s);
  for (const s of worldSolids) consider(s);
  const ride = carClimbAt(px, pz, feet, airborne);
  if (ride.top > best) {
    best = ride.top;
    climbCarHit = ride.car;
  } else if (ride.car && ride.top > 0 && Math.abs(ride.top - best) < 0.001) {
    climbCarHit = ride.car;
  }
  return best;
}

function skipClimbWall(s, feet, airborne) {
  return !!s.climb && (airborne || feet >= s.top - 0.12);
}

function camBox(x, y, z, sx, sy, sz, extra = {}) {
  camSolids.push({
    minx: x - sx / 2,
    maxx: x + sx / 2,
    miny: y - sy / 2,
    maxy: y + sy / 2,
    minz: z - sz / 2,
    maxz: z + sz / 2,
    ...extra,
  });
}

function rayAabb(ox, oy, oz, dx, dy, dz, maxT, b) {
  let tmin = 0;
  let tmax = maxT;
  const axes = [
    [ox, dx, b.minx, b.maxx],
    [oy, dy, b.miny, b.maxy],
    [oz, dz, b.minz, b.maxz],
  ];
  for (const [o, d, mn, mx] of axes) {
    if (Math.abs(d) < 1e-12) {
      if (o < mn || o > mx) return null;
      continue;
    }
    const inv = 1 / d;
    let t1 = (mn - o) * inv;
    let t2 = (mx - o) * inv;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  return tmin;
}

function camRayHit(ox, oy, oz, dx, dy, dz, maxT, skip = 0) {
  let hit = maxT;
  for (const b of camSolids) {
    if (doorIsOpen(b)) continue;
    const t = rayAabb(ox, oy, oz, dx, dy, dz, hit, b);
    if (t != null && t >= skip && t < hit) hit = t;
  }
  return hit;
}

function worldBlocked(x0, z0, x1, z1) {
  const dx = (x1 || 0) - (x0 || 0);
  const dz = (z1 || 0) - (z0 || 0);
  const dist = Math.hypot(dx, dz);
  if (dist < 0.32) return false;
  const inv = 1 / dist;
  return camRayHit(x0, 1.22, z0, dx * inv, 0, dz * inv, dist, 0.12) < dist - 0.28;
}

function sweepPush(x, z, fx, fz, dist, r = 0.28) {
  const len = Math.hypot(fx, fz) || 1;
  const ux = fx / len;
  const uz = fz / len;
  const steps = Math.max(2, Math.ceil(Math.max(0.01, dist) / 0.1));
  let cx = x;
  let cz = z;
  for (let i = 1; i <= steps; i++) {
    const wx = x + ux * dist * (i / steps);
    const wz = z + uz * dist * (i / steps);
    const [kx, kz] = collide(wx, wz, r);
    const progressed = Math.hypot(kx - cx, kz - cz);
    cx = kx;
    cz = kz;
    if (progressed < (dist / steps) * 0.28) break;
  }
  return [cx, cz];
}

function drunkLevel() {
  return THREE.MathUtils.clamp(bac / DRUNK_VIS, 0, DRUNK_MAX);
}

function heartStrength() {
  if (!started || passedOut) return 0;
  return THREE.MathUtils.clamp((drunkLevel() - HEART_START) / 2.4, 0, 1);
}

function heartPulse(p, at, width) {
  const x = (p - at) / width;
  if (x < 0 || x > 1) return 0;
  return Math.sin(x * Math.PI);
}

function tickHeartbeat(dt) {
  const el = $("heartVig");
  if (!el) return;
  const str = heartStrength();
  if (str <= 0.001) {
    el.style.opacity = "0";
    heartT = 0;
    heartKick = Math.max(0, heartKick - dt * 4);
    return;
  }
  const bpm = 66 + str * 56;
  const period = 60 / bpm;
  const prev = heartT;
  heartT += dt;
  const p0 = (prev % period) / period;
  const p1 = (heartT % period) / period;
  if (p1 < p0) {
    audio.heartLub(str);
    heartKick = Math.max(heartKick, 0.1 + str * 0.22);
  } else if (p0 < 0.22 && p1 >= 0.22) {
    audio.heartDub(str);
    heartKick = Math.max(heartKick, 0.05 + str * 0.12);
  }
  heartKick = Math.max(0, heartKick - dt * 3.2);
  const beat = Math.max(heartPulse(p1, 0, 0.14), heartPulse(p1, 0.2, 0.12) * 0.72);
  const dark = Math.min(0.96, 0.2 + str * 0.46 + beat * (0.32 + str * 0.38));
  const hole = Math.max(6, 64 - str * 30 - beat * (12 + str * 18));
  el.style.opacity = "1";
  el.style.background = `radial-gradient(ellipse at center, transparent ${hole.toFixed(1)}%, rgba(0,0,0,${dark.toFixed(3)}) 100%)`;
}

function insideBar(x, z) {
  return Math.abs(x) < W / 2 - 0.18 && z > -D / 2 + 0.18 && z < D / 2 - 0.18;
}

function pushSolid(px, pz, r, s) {
  const inside = px >= s.minx && px <= s.maxx && pz >= s.minz && pz <= s.maxz;
  if (inside) {
    const left = px - s.minx;
    const right = s.maxx - px;
    const near = pz - s.minz;
    const far = s.maxz - pz;
    const m = Math.min(left, right, near, far);
    if (m === left) px = s.minx - r;
    else if (m === right) px = s.maxx + r;
    else if (m === near) pz = s.minz - r;
    else pz = s.maxz + r;
    return [px, pz];
  }
  const cx = THREE.MathUtils.clamp(px, s.minx, s.maxx);
  const cz = THREE.MathUtils.clamp(pz, s.minz, s.maxz);
  const dx = px - cx;
  const dz = pz - cz;
  const dist2 = dx * dx + dz * dz;
  if (dist2 < r * r) {
    const dist = Math.sqrt(dist2) || 0.0001;
    const need = r - dist;
    px += (dx / dist) * need;
    pz += (dz / dist) * need;
  }
  return [px, pz];
}

function collideWorld(px, pz, r = 0.28, feet = 0, airborne = false) {
  const list = insideBar(px, pz) ? solids : [];
  for (const s of list) {
    if (skipClimbWall(s, feet, airborne)) continue;
    [px, pz] = pushSolid(px, pz, r, s);
  }
  for (const s of worldSolids) {
    if (doorIsOpen(s)) continue;
    if (skipClimbWall(s, feet, airborne)) continue;
    [px, pz] = pushSolid(px, pz, r, s);
  }
  px = THREE.MathUtils.clamp(px, -WORLD_X, WORLD_X);
  pz = THREE.MathUtils.clamp(pz, WORLD_Z_MIN, WORLD_Z_MAX);
  return [px, pz];
}

function collideWorldForCar(px, pz, r = 0.48) {
  for (const s of worldSolids) {
    [px, pz] = pushSolid(px, pz, r, s);
  }
  for (const s of carBlocks) {
    [px, pz] = pushSolid(px, pz, r, s);
  }
  px = THREE.MathUtils.clamp(px, -WORLD_X, WORLD_X);
  pz = THREE.MathUtils.clamp(pz, WORLD_Z_MIN, WORLD_Z_MAX);
  return [px, pz];
}

function collideCars(px, pz, r = 0.28, skip = null) {
  let hit = null;
  for (const car of cars) {
    if (car === inCar || car === skip) continue;
    const dx = px - car.x;
    const dz = pz - car.z;
    const cr = r + 2.15;
    const dist2 = dx * dx + dz * dz;
    if (dist2 < cr * cr) {
      const dist = Math.sqrt(dist2) || 0.0001;
      const need = cr - dist;
      px += (dx / dist) * need;
      pz += (dz / dist) * need;
      hit = car;
    }
  }
  return [px, pz, hit];
}

function collide(px, pz, r = 0.28, feet = 0, airborne = false, skipCar = null) {
  [px, pz] = collideWorld(px, pz, r, feet, airborne);
  [px, pz] = collideCarsWalk(px, pz, r, skipCar, feet, airborne);
  px = THREE.MathUtils.clamp(px, -WORLD_X, WORLD_X);
  pz = THREE.MathUtils.clamp(pz, WORLD_Z_MIN, WORLD_Z_MAX);
  return [px, pz];
}

const CAR_PADS = [
  { kind: "hood", lx: 0, lz: -1.64, hw: 1.08, hd: 0.82, top: 0.73 },
  { kind: "trunk", lx: 0, lz: 1.86, hw: 1.08, hd: 0.56, top: 0.73 },
  { kind: "roof", lx: 0, lz: 0.28, hw: 1.02, hd: 1.32, top: 1.47 },
];

function carWorldToLocal(car, px, pz) {
  const dx = px - car.x;
  const dz = pz - car.z;
  const c = Math.cos(car.yaw);
  const s = Math.sin(car.yaw);
  return { lx: dx * c - dz * s, lz: dx * s + dz * c };
}

function carLocalToWorld(car, lx, lz) {
  const c = Math.cos(car.yaw);
  const s = Math.sin(car.yaw);
  return { x: car.x + lx * c + lz * s, z: car.z - lx * s + lz * c };
}

function carPadAt(car, lx, lz, grow = 0.06) {
  for (const pad of CAR_PADS) {
    if (Math.abs(lx - pad.lx) <= pad.hw + grow && Math.abs(lz - pad.lz) <= pad.hd + grow) return pad;
  }
  return null;
}

function collideCarsWalk(px, pz, r, skip, feet, airborne) {
  for (const car of cars) {
    if (car === inCar || car === skip) continue;
    const loc = carWorldToLocal(car, px, pz);
    if (Math.abs(loc.lx) > 1.55 + r || Math.abs(loc.lz) > 2.7 + r) continue;
    const pad = carPadAt(car, loc.lx, loc.lz, airborne ? 0.32 : 0.12);
    const vaulting = airborne && standY > 0.45;
    const onPad = pad && (
      feet >= pad.top - 0.2
      || (airborne && pad.kind !== "roof")
      || (airborne && feet + 0.78 >= pad.top)
    );
    if (onPad) {
      const cabinBlocks = pad.kind !== "roof" && !airborne && feet < pad.top + 0.38;
      if (cabinBlocks) {
        const [lx, lz] = pushSolid(loc.lx, loc.lz, r, { minx: -0.95, maxx: 0.95, minz: -1.08, maxz: 1.52 });
        const w = carLocalToWorld(car, lx, lz);
        px = w.x;
        pz = w.z;
      }
      continue;
    }
    const frontOrRear = Math.abs(loc.lx) < 1.22 && (loc.lz < -1.02 || loc.lz > 1.26);
    if (airborne && (frontOrRear || vaulting)) continue;
    const [lx, lz] = pushSolid(loc.lx, loc.lz, r, { minx: -1.08, maxx: 1.08, minz: -2.18, maxz: 2.18 });
    const w = carLocalToWorld(car, lx, lz);
    px = w.x;
    pz = w.z;
  }
  return [px, pz];
}

function carClimbAt(px, pz, feet, airborne) {
  let best = 0;
  let bestCar = null;
  const grow = airborne ? 0.34 : 0.12;
  const reach = airborne ? 0.78 : 0.18;
  for (const car of cars) {
    if (car === inCar) continue;
    const loc = carWorldToLocal(car, px, pz);
    for (const pad of CAR_PADS) {
      if (Math.abs(loc.lx - pad.lx) > pad.hw + grow) continue;
      if (Math.abs(loc.lz - pad.lz) > pad.hd + grow) continue;
      if (pad.kind === "roof" && standY < 0.45 && feet < 0.96) continue;
      if (feet >= pad.top - 0.2 || (airborne && feet + reach >= pad.top)) {
        if (pad.top > best) {
          best = pad.top;
          bestCar = car;
        }
      }
    }
  }
  return { top: best, car: bestCar };
}

function standSurface() {
  if (standY > 1.2) return "roof";
  if (standY < 0.45) return "";
  const car = rideCar || nearestCar(2.8);
  if (!car) return "hood";
  const loc = carWorldToLocal(car, camera.position.x, camera.position.z);
  const pad = carPadAt(car, loc.lx, loc.lz, 0.24);
  return pad?.kind || "hood";
}

function standCarPrompt(car) {
  const surf = standSurface();
  if (!surf) return "";
  const cops = !!(car && copsInCar(car));
  if (surf === "roof") return cops ? "on the roof · SPACE off · cops are still in it" : "on the roof · SPACE off · E get in";
  if (surf === "trunk") return cops ? "on the trunk · SPACE onto the roof · cops are still in it" : "on the trunk · SPACE onto the roof · E get in";
  return cops ? "on the hood · SPACE onto the roof · cops are still in it" : "on the hood · SPACE onto the roof · E get in";
}

function bindRideCar(car) {
  rideCar = car || null;
  if (car) {
    car.stickX = car.x;
    car.stickZ = car.z;
    car.stickYaw = car.yaw;
  }
}

function stickToRideCar() {
  if (!rideCar || inCar) return;
  if (rideCar.stickX == null || rideCar.stickZ == null) {
    rideCar.stickX = rideCar.x;
    rideCar.stickZ = rideCar.z;
    rideCar.stickYaw = rideCar.yaw;
    return;
  }
  const prev = { x: rideCar.stickX, z: rideCar.stickZ, yaw: rideCar.stickYaw ?? rideCar.yaw };
  const loc = carWorldToLocal(prev, camera.position.x, camera.position.z);
  const w = carLocalToWorld(rideCar, loc.lx, loc.lz);
  const dx = w.x - camera.position.x;
  const dz = w.z - camera.position.z;
  if (dx || dz) {
    camera.position.x = w.x;
    camera.position.z = w.z;
    bodyPos.x += dx;
    bodyPos.z += dz;
  }
  rideCar.stickX = rideCar.x;
  rideCar.stickZ = rideCar.z;
  rideCar.stickYaw = rideCar.yaw;
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

function makeViewPants() {
  const g = new THREE.Group();
  const mat = lambert(0x1d1d28);
  const waist = addBox(g, unitBox, mat, 0, -0.5, -0.16, 0.4, 0.14, 0.2);
  const left = addBox(g, unitBox, mat, -0.12, -0.86, -0.18, 0.18, 0.62, 0.16);
  const right = addBox(g, unitBox, mat, 0.12, -0.86, -0.18, 0.18, 0.62, 0.16);
  g.userData.waist = waist;
  g.userData.left = left;
  g.userData.right = right;
  g.visible = false;
  return g;
}

function poseViewPants(dt) {
  if (!viewPants) return;
  const want = onToilet() || peeing;
  const rate = want ? 2.2 : 2.8;
  if (want) viewPantDrop = Math.min(1, viewPantDrop + dt * rate);
  else viewPantDrop = Math.max(0, viewPantDrop - dt * rate);
  const first = viewMode === 1 && !inCar;
  const drop = viewPantDrop;
  viewPants.visible = first && drop > 0.01;
  if (!viewPants.visible) return;
  viewPants.position.set(0, -0.04 - drop * 0.7, 0.02 + drop * 0.08);
  viewPants.userData.waist.visible = drop < 0.62;
  viewPants.userData.waist.position.y = -0.5 - drop * 0.08;
  const bunch = 1 - drop * 0.58;
  viewPants.userData.left.scale.y = 0.62 * bunch;
  viewPants.userData.right.scale.y = 0.62 * bunch;
  viewPants.userData.left.position.y = -0.86 - drop * 0.22;
  viewPants.userData.right.position.y = -0.86 - drop * 0.22;
}

function poseHands() {
  if (!rightHand || !leftHand) return;
  const bob = Math.sin(tWorld * 2.1) * 0.01;
  const walk = onGround && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD) ? Math.sin(walkT) * 0.014 : 0;
  if (onToilet()) {
    const pull = THREE.MathUtils.clamp(viewPantDrop, 0, 1);
    const reach = Math.min(1, pull / 0.55);
    const hold = Math.max(0, (pull - 0.55) / 0.45);
    const x = 0.15 - reach * 0.03;
    const y = -0.22 - reach * 0.24 + hold * 0.1 + (peeing ? -0.04 : 0);
    const z = -0.3 - reach * 0.1 + hold * 0.06;
    rightHand.position.set(x, y + bob * 0.1, z);
    rightHand.rotation.set(1.05 + reach * 0.35 - hold * 0.2, 0.12, 0.4 + reach * 0.16);
    leftHand.position.set(-x, y + bob * 0.1, z);
    leftHand.rotation.set(1.05 + reach * 0.35 - hold * 0.2, -0.12, -0.4 - reach * 0.16);
    return;
  }
  if (!sitting && viewPantDrop > 0.05 && !peeing) {
    const lift = viewPantDrop;
    const x = 0.16;
    const y = -0.44 + (1 - lift) * 0.2;
    const z = -0.34;
    rightHand.position.set(x, y + bob * 0.08, z);
    rightHand.rotation.set(1.08, 0.1, 0.38);
    leftHand.position.set(-x, y + bob * 0.08, z);
    leftHand.rotation.set(1.08, -0.1, -0.38);
    return;
  }
  if (peeing) {
    const pull = THREE.MathUtils.clamp((tWorld - peeStart) / 0.55, 0, 1);
    const hold = THREE.MathUtils.clamp((tWorld - peeStart - 0.45) / 0.4, 0, 1);
    const x = 0.15 - pull * 0.04;
    const y = -0.20 - pull * 0.18 + hold * 0.04;
    const z = -0.34 - pull * 0.04;
    rightHand.position.set(x, y + bob * 0.15, z);
    rightHand.rotation.set(1.02 + pull * 0.32, 0.1, 0.34 + pull * 0.2);
    leftHand.position.set(-x, y + bob * 0.15, z);
    leftHand.rotation.set(1.02 + pull * 0.32, -0.1, -0.34 - pull * 0.2);
    return;
  }
  if (punchT > 0) {
    const u = 1 - punchT / 0.32;
    const swing = u < 0.34 ? u / 0.34 : 1 - (u - 0.34) / 0.66;
    rightHand.position.set(0.12 + swing * 0.06, -0.18 + swing * 0.16, -0.28 - swing * 0.38);
    rightHand.rotation.set(0.15 + swing * 1.25, 0.2, 0.45 + swing * 0.55);
    leftHand.position.set(-0.24, -0.34 + bob, -0.46);
    leftHand.rotation.set(0.24, -0.14, -0.2);
    return;
  }
  if (pouring && held && held.userData.kind === "bottle") {
    rightHand.position.set(0.1, -0.13 + bob, -0.36);
    rightHand.rotation.set(1.08, 0.42, 0.7);
  } else if (held && held.userData.kind === "glass") {
    const lift = sipT > 0 ? 0.14 : 0;
    rightHand.position.set(0.2, -0.16 + bob + walk + lift, -0.38 - lift * 0.35);
    rightHand.rotation.set(0.12 + (sipT > 0 ? 0.72 : 0), 0.04, 0.08);
  } else if (held && held.userData.drink?.bottle === "can") {
    rightHand.position.set(0.16, -0.1 + bob + walk, -0.34);
    rightHand.rotation.set(0.22, 0.08, 0.16);
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

function restockDrinks(fromNet) {
  audio.pourStop();
  audio.sinkStop();
  for (const s of sinks) {
    s.userData.running = false;
    if (s.userData.stream) s.userData.stream.visible = false;
    if (s.userData.splash) s.userData.splash.visible = false;
  }
  pouring = false;
  mouseDown = false;
  if (held) {
    const obj = held;
    detachHeld();
    held = null;
    setRightGrip(false);
    if (obj.userData.kind === "glass") {
      if (obj.parent) obj.parent.remove(obj);
      else scene.remove(obj);
      unregisterPick(obj);
    } else if (obj.userData.stock) scene.add(obj);
    else if (obj.userData.kind === "baton") {
      obj.scale.setScalar(1);
      obj.position.set(bodyPos.x, 0.03, bodyPos.z);
      obj.rotation.set(Math.PI / 2, 0, 0.12);
      scene.add(obj);
      unregisterPick(obj);
      registerPick(obj);
    }
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
  restockCupStacks(fromNet);
  poseHands();
  houseGames?.reset();
}

function resetShift() {
  restockDrinks();
  bac = 0;
  bacWait = 0;
  bacSoberT = 0;
  bacDecayFrom = 0;
  bacHoldUntil = 0;
  bacDecayStart = 0;
  sipT = 0;
  score = 0;
  pours = 0;
  pourBank = 0;
  unique = new Set();
  drankPiss = false;
  fridgeOpen = false;
  zoomHold = false;
  if (frontDoor) setFrontDoor(false, true);
  for (const door of swingDoors) {
    door.userData.open = false;
    door.userData.ang = 0;
    door.userData.want = 0;
    if (door.userData.hinge) door.userData.hinge.rotation.y = door.userData.hinge.userData.baseYaw || 0;
  }
  for (const t of toilets) {
    t.userData.seatUp = false;
  }
  clearPolice();
  stunT = 0;
  knockVx = 0;
  knockVz = 0;
  lastKnock = { x: 0, z: 0 };
  hurtFlash = 0;
  crashCool = 0;
  wanted = false;
  wantedT = 0;
  if (inCar) exitCar(true);
  camera.position.set(0, eyeY(), -1.05);
  camera.rotation.set(0, 0, 0);
  bodyPos.set(0, eyeY(), -1.05);
  savedYaw = 0;
  savedPitch = 0;
  view2Yaw = 0;
  view2Pitch = 0;
  vy = 0;
  onGround = true;
  standY = 0;
  walkT = 0;
  peeing = false;
  peeUntil = 0;
  pantsStart = 0;
  viewPantDrop = 0;
  closeChat(false);
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
  addBox(scene, unitBox, mats.brick, -4.4, wallH / 2, D / 2, 7.2, wallH, 0.25);
  addBox(scene, unitBox, mats.brick, 4.4, wallH / 2, D / 2, 7.2, wallH, 0.25);
  addBox(scene, unitBox, mats.brick, -W / 2, wallH / 2, -4.76, 0.25, wallH, 2.48);
  addBox(scene, unitBox, mats.brick, -W / 2, wallH / 2, 2.06, 0.25, wallH, 7.88);
  addBox(scene, unitBox, mats.brick, -W / 2, 2.85, -2.7, 0.25, 0.9, 1.72);
  addBox(scene, unitBox, mats.brick, W / 2, wallH / 2, 0, 0.25, wallH, D);
  addBox(scene, unitBox, mats.woodDark, 0, wallH, 0, W, 0.2, D);
  addCeiling(0, 0, W, D, wallH - 0.1);
  addBox(scene, unitBox, mats.woodDark, 0, 3.15, D / 2, 1.7, 0.5, 0.28);
  worldSolid(0, -D / 2, W, 0.4);
  worldSolid(-4.4, D / 2, 7.2, 0.4);
  worldSolid(4.4, D / 2, 7.2, 0.4);
  worldSolid(-W / 2, -4.76, 0.4, 2.48);
  worldSolid(-W / 2, 2.06, 0.4, 7.88);
  worldSolid(W / 2, 0, 0.4, D);
  camBox(0, wallH / 2, -D / 2, W, wallH, 0.4);
  camBox(-4.4, wallH / 2, D / 2, 7.2, wallH, 0.4);
  camBox(4.4, wallH / 2, D / 2, 7.2, wallH, 0.4);
  camBox(-W / 2, wallH / 2, -4.76, 0.4, wallH, 2.48);
  camBox(-W / 2, wallH / 2, 2.06, 0.4, wallH, 7.88);
  camBox(-W / 2, 2.85, -2.7, 0.4, 0.9, 1.72);
  camBox(W / 2, wallH / 2, 0, 0.4, wallH, D);
  camBox(0, wallH, 0, W, 0.24, D);
  camBox(0, 3.15, D / 2, 1.7, 0.5, 0.32);
  camBox(0, -0.2, 50, WORLD_X * 2 + 40, 0.4, WORLD_Z_MAX - WORLD_Z_MIN + 40);

  for (let i = -2; i <= 2; i++) {
    addBox(scene, unitBox, mats.woodDark, i * 3.2, 3.25, 0, 0.16, 0.18, D - 0.4);
  }

  addBox(scene, unitBox, mats.barTop, 0, 0.52, 0.35, 9.2, 1.04, 1.05);
  addBox(scene, unitBox, mats.woodDark, 0, 1.06, 0.35, 9.4, 0.06, 1.15);
  addBox(scene, unitBox, mats.brass, 0, 0.28, 0.88, 9.0, 0.05, 0.05);
  solid(0, 0.35, 9.2, 1.05, 1.1);

  addBox(scene, unitBox, mats.barTop, 0, 0.5, WELL_Z, 7.4, 1.0, 0.7);
  addBox(scene, unitBox, mats.woodDark, 0, 1.02, WELL_Z, 7.5, 0.05, 0.78);
  addBox(scene, unitBox, mats.glow, 0, 1.015, WELL_Z - 0.28, 6.8, 0.008, 0.05);
  solid(0, WELL_Z, 7.4, 0.7, 1.1);

  addBox(scene, unitBox, mats.woodDark, 0, 1.55, SHELF_Z - 0.22, 11.2, 2.6, 0.1);
  for (let row = 0; row < 4; row++) {
    const y = 0.88 + row * 0.56;
    addBox(scene, unitBox, mats.woodDark, 0, y, SHELF_Z - 0.08, 10.6, 0.05, 0.36);
  }
  solid(0, SHELF_Z - 0.1, 11, 0.55, 2.8);

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

  addBox(scene, unitBox, mats.woodDark, 5.35, 1.2, -2.85, 1.15, 2.4, 0.62);
  solid(5.35, -2.85, 1.25, 0.7, 2.4);
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
    seat.scale.set(0.18, 0.06, 0.18);
    seat.position.y = 0.72;
    stool.add(seat);
    const pole = new THREE.Mesh(unitCyl, mats.brass);
    pole.scale.set(0.03, 0.72, 0.03);
    pole.position.y = 0.36;
    stool.add(pole);
    const ring = new THREE.Mesh(unitCyl, mats.brass);
    ring.scale.set(0.17, 0.03, 0.17);
    ring.position.y = 0.06;
    stool.add(ring);
    stool.position.set(i * 1.5, 0, 1.35);
    stool.userData.kind = "stool";
    stool.userData.root = stool;
    stool.userData.sit = { x: i * 1.5, z: 1.35 };
    seat.userData.kind = "stool";
    seat.userData.root = stool;
    registerPick(stool);
    scene.add(stool);
    solid(i * 1.5, 1.35, 0.42, 0.42, 0.72);
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
  solid(7.1, 3.6, 0.8, 0.6, 1.8);

  buildCupStacks();

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

  for (let i = -1; i <= 1; i++) hangingBarLight(i * 2.6, WELL_Z + 0.2, i === 0);
  const shelfLight = new THREE.PointLight(0xffe0b0, 2.8, 7);
  shelfLight.position.set(0, 2.1, SHELF_Z + 0.55);
  scene.add(shelfLight);

  const hinge = new THREE.Group();
  hinge.position.set(-0.78, 0, D / 2 + 0.02);
  scene.add(hinge);
  const door = addBox(hinge, unitBox, mats.woodDark, 0.78, 1.3, 0, 1.52, 2.55, 0.08);
  addBox(hinge, unitBox, mats.brass, 1.46, 1.25, 0.05, 0.04, 0.12, 0.04);
  door.userData.kind = "door";
  door.userData.root = door;
  registerPick(door);
  frontDoor = hinge;
  frontDoorAng = 0;
  frontDoorWant = 0;
  frontDoorOpen = false;
  worldSolids.push({ minx: -0.8, maxx: 0.8, minz: D / 2 - 0.18, maxz: D / 2 + 0.22, door: true, top: 2.6, climb: false });
  camBox(0, 1.3, D / 2 + 0.02, 1.6, 2.6, 0.16, { door: true });

  buildBathrooms();
  blockCars(0, 0, W + 0.9, D + 0.9);
  blockCars(-10.35, -2.67, 4.8, 8.5);
  buildTown();
  houseGames = createGames({
    scene,
    camera,
    lambert,
    registerPick,
    solid,
    worldSolid,
    toast,
    flash,
    audio,
    neonTex,
    localId,
    humans: humanPeers,
    playerPos: () => bodyPos,
    sendEvent: publishEvent,
    houseDrink: (msg) => {
      toast(msg);
      score += 8;
      audio.gulp("sip");
    },
    score: (n) => {
      score += n;
    },
  });
  houseGames.build();
  setWorldCollide(collide);
  setWorldBlock(worldBlocked);
}

function asphalt(x, z, w, d, mat = mats.asphalt, y = 0.004) {
  return ground(x, z, w, d, mat, y);
}

function ground(x, z, w, d, mat = mats.asphalt, y = 0.004, tileX = 6, tileZ = 6) {
  let use = mat;
  if (mat && mat.map) {
    use = mat.clone();
    use.map = mat.map.clone();
    use.map.wrapS = use.map.wrapT = THREE.RepeatWrapping;
    use.map.repeat.set(Math.max(0.5, Math.abs(w) / tileX), Math.max(0.5, Math.abs(d) / tileZ));
    use.map.needsUpdate = true;
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), use);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function inXsect(x, z, pad = 0) {
  for (const ix of NS_XS) {
    if (Math.abs(x - ix) > ROAD_HALF + pad) continue;
    for (const iz of EW_ZS) {
      if (Math.abs(z - iz) <= ROAD_HALF + pad) return true;
    }
  }
  return false;
}

function paintChunk(x, z, w, d, mat, y = 0.018) {
  if (w < 0.08 || d < 0.08) return;
  if (inXsect(x, z, 0.15)) return;
  ground(x, z, w, d, mat, y);
}

function paintLine(x0, z0, x1, z1, w, mat) {
  const horiz = Math.abs(z1 - z0) < 1e-6;
  if (horiz) {
    const z = z0;
    let x = Math.min(x0, x1);
    const end = Math.max(x0, x1);
    while (x < end) {
      const n = Math.min(end, x + 2.4);
      paintChunk((x + n) / 2, z, n - x, w, mat);
      x = n;
    }
    return;
  }
  const x = x0;
  let z = Math.min(z0, z1);
  const end = Math.max(z0, z1);
  while (z < end) {
    const n = Math.min(end, z + 2.4);
    paintChunk(x, (z + n) / 2, w, n - z, mat);
    z = n;
  }
}

function paintDash(x0, z0, x1, z1, w, dash = 2.15, gap = 2.05) {
  const horiz = Math.abs(z1 - z0) < 1e-6;
  let on = true;
  if (horiz) {
    const z = z0;
    let x = Math.min(x0, x1);
    const end = Math.max(x0, x1);
    while (x < end) {
      const len = Math.min(on ? dash : gap, end - x);
      if (on) paintChunk(x + len / 2, z, len, w, mats.laneWhite);
      x += len;
      on = !on;
    }
    return;
  }
  const x = x0;
  let z = Math.min(z0, z1);
  const end = Math.max(z0, z1);
  while (z < end) {
    const len = Math.min(on ? dash : gap, end - z);
    if (on) paintChunk(x, z + len / 2, w, len, mats.laneWhite);
    z += len;
    on = !on;
  }
}

function crosswalk(x, z, alongX) {
  if (alongX) {
    for (let i = -3; i <= 3; i++) ground(x, z + i * 1.02, 2.4, 0.4, mats.laneWhite, 0.02);
  } else {
    for (let i = -3; i <= 3; i++) ground(x + i * 1.02, z, 0.4, 2.4, mats.laneWhite, 0.02);
  }
}

function curbAt(x, z, w, d) {
  addBox(scene, unitBox, mats.curb, x, CURB_H / 2, z, w, CURB_H, d);
}

function blockSpans(axis) {
  const pts = axis === "x" ? [ROAD_XMIN, ...NS_XS, ROAD_XMAX] : [ROAD_ZMIN, ...EW_ZS, ROAD_ZMAX];
  const spans = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = b - a - ROAD_W;
    if (len < 2.4) continue;
    spans.push({ a, b, mid: (a + b) / 2, len });
  }
  return spans;
}

function lampStations(a, b) {
  const start = a + ROAD_HALF + LAMP_CLEAR;
  const end = b - ROAD_HALF - LAMP_CLEAR;
  const span = end - start;
  if (span < 8) return [];
  const n = Math.max(1, Math.round(span / LAMP_SPACING));
  const step = span / n;
  const out = [];
  for (let i = 0; i < n; i++) out.push(start + step * (i + 0.5));
  return out;
}

function streetLight(x, z, armYaw = 0, lit = true) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = armYaw;
  addBox(g, unitBox, mats.curb, 0, 0.08, 0, 0.34, 0.16, 0.34);
  addBox(g, unitCyl, mats.steel, 0, LAMP_H * 0.5, 0, 0.07, LAMP_H, 0.07);
  addBox(g, unitCyl, mats.steel, 0, LAMP_H + 0.05, 0, 0.1, 0.1, 0.1);
  addBox(g, unitBox, mats.steel, 0, LAMP_H + 0.1, -LAMP_ARM * 0.48, 0.055, 0.055, LAMP_ARM * 0.96);
  addBox(g, unitBox, mats.steel, 0, LAMP_H + 0.02, -LAMP_ARM, 0.05, 0.14, 0.05);
  addBox(g, unitBox, lambert(0x16181c), 0, LAMP_H - 0.05, -LAMP_ARM, 0.3, 0.1, 0.44);
  addBox(g, unitBox, mats.glow, 0, LAMP_H - 0.11, -LAMP_ARM, 0.22, 0.035, 0.34);
  scene.add(g);
  if (lit) {
    const pl = new THREE.PointLight(0xffd4a0, 1.15, 13.5);
    pl.position.set(x - Math.sin(armYaw) * LAMP_ARM, LAMP_H - 0.14, z - Math.cos(armYaw) * LAMP_ARM);
    scene.add(pl);
  }
  return g;
}

function lamp(x, z) {
  streetLight(x, z, 0, true);
}

function buildRoads() {
  const xLen = ROAD_XMAX - ROAD_XMIN;
  const zLen = ROAD_ZMAX - ROAD_ZMIN;
  const xMid = (ROAD_XMIN + ROAD_XMAX) / 2;
  const zMid = (ROAD_ZMIN + ROAD_ZMAX) / 2;
  for (const z of EW_ZS) ground(xMid, z, xLen, ROAD_W, mats.asphalt, 0.005, 5.5, 5.5);
  for (const x of NS_XS) ground(x, zMid, ROAD_W, zLen, mats.asphalt, 0.005, 5.5, 5.5);

  for (const z of EW_ZS) {
    for (const sp of blockSpans("x")) {
      ground(sp.mid, z + ROAD_HALF + WALK_W / 2, sp.len, WALK_W, mats.sidewalk, 0.055, 2.2, 2.2);
      ground(sp.mid, z - ROAD_HALF - WALK_W / 2, sp.len, WALK_W, mats.sidewalk, 0.055, 2.2, 2.2);
      curbAt(sp.mid, z + ROAD_HALF + CURB_T / 2, sp.len, CURB_T);
      curbAt(sp.mid, z - ROAD_HALF - CURB_T / 2, sp.len, CURB_T);
    }
  }
  for (const x of NS_XS) {
    for (const sp of blockSpans("z")) {
      ground(x + ROAD_HALF + WALK_W / 2, sp.mid, WALK_W, sp.len, mats.sidewalk, 0.055, 2.2, 2.2);
      ground(x - ROAD_HALF - WALK_W / 2, sp.mid, WALK_W, sp.len, mats.sidewalk, 0.055, 2.2, 2.2);
      curbAt(x + ROAD_HALF + CURB_T / 2, sp.mid, CURB_T, sp.len);
      curbAt(x - ROAD_HALF - CURB_T / 2, sp.mid, CURB_T, sp.len);
    }
  }
  for (const ix of NS_XS) {
    for (const iz of EW_ZS) {
      const o = ROAD_HALF + WALK_W / 2;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          ground(ix + sx * o, iz + sz * o, WALK_W, WALK_W, mats.sidewalk, 0.055, 2.2, 2.2);
        }
      }
    }
  }

  for (const z of EW_ZS) {
    paintLine(ROAD_XMIN, z - 0.18, ROAD_XMAX, z - 0.18, 0.12, mats.laneYellow);
    paintLine(ROAD_XMIN, z + 0.18, ROAD_XMAX, z + 0.18, 0.12, mats.laneYellow);
    paintLine(ROAD_XMIN, z - ROAD_HALF + 0.55, ROAD_XMAX, z - ROAD_HALF + 0.55, 0.11, mats.laneWhite);
    paintLine(ROAD_XMIN, z + ROAD_HALF - 0.55, ROAD_XMAX, z + ROAD_HALF - 0.55, 0.11, mats.laneWhite);
    paintDash(ROAD_XMIN, z - LANE_W, ROAD_XMAX, z - LANE_W, 0.11);
    paintDash(ROAD_XMIN, z + LANE_W, ROAD_XMAX, z + LANE_W, 0.11);
  }
  for (const x of NS_XS) {
    paintLine(x - 0.18, ROAD_ZMIN, x - 0.18, ROAD_ZMAX, 0.12, mats.laneYellow);
    paintLine(x + 0.18, ROAD_ZMIN, x + 0.18, ROAD_ZMAX, 0.12, mats.laneYellow);
    paintLine(x - ROAD_HALF + 0.55, ROAD_ZMIN, x - ROAD_HALF + 0.55, ROAD_ZMAX, 0.11, mats.laneWhite);
    paintLine(x + ROAD_HALF - 0.55, ROAD_ZMIN, x + ROAD_HALF - 0.55, ROAD_ZMAX, 0.11, mats.laneWhite);
    paintDash(x - LANE_W, ROAD_ZMIN, x - LANE_W, ROAD_ZMAX, 0.11);
    paintDash(x + LANE_W, ROAD_ZMIN, x + LANE_W, ROAD_ZMAX, 0.11);
  }
  for (const ix of NS_XS) {
    for (const iz of EW_ZS) {
      crosswalk(ix - ROAD_HALF - 1.55, iz, true);
      crosswalk(ix + ROAD_HALF + 1.55, iz, true);
      crosswalk(ix, iz - ROAD_HALF - 1.55, false);
      crosswalk(ix, iz + ROAD_HALF + 1.55, false);
    }
  }
}

function buildStreetLights() {
  const seen = new Set();
  const place = (x, z, yaw) => {
    const key = x.toFixed(1) + "|" + z.toFixed(1);
    if (seen.has(key)) return;
    if (inXsect(x, z, 1.35)) return;
    if (Math.abs(x) < 8.8 && z > 6 && z < 16.4) return;
    seen.add(key);
    streetLight(x, z, yaw, true);
  };
  for (const zc of EW_ZS) {
    for (const sp of blockSpans("x")) {
      lampStations(sp.a, sp.b).forEach((x, i) => {
        const south = i % 2 === 0;
        place(x, zc + (south ? LAMP_SETBACK : -LAMP_SETBACK), south ? 0 : Math.PI);
      });
    }
  }
  for (const xc of NS_XS) {
    for (const sp of blockSpans("z")) {
      lampStations(sp.a, sp.b).forEach((z, i) => {
        const east = i % 2 === 0;
        place(xc + (east ? LAMP_SETBACK : -LAMP_SETBACK), z, east ? Math.PI / 2 : -Math.PI / 2);
      });
    }
  }
}

function buildTown() {
  ground(0, 50, 240, 180, mats.grass, -0.04, 12, 12);
  buildRoads();
  ground(0, 11.2, 16, 10.4, mats.sidewalk, 0.012, 2.4, 2.4);
  ground(0, 11.4, 12, 8.2, mats.asphalt, 0.007, 4, 4);
  for (const x of [-4.2, -1.4, 1.4, 4.2]) ground(x, 9.55, 0.08, 3.5, mats.laneWhite, 0.016);
  ground(-8.4, 12.6, 7.2, 7.4, mats.sidewalk, 0.012, 2.2, 2.2);

  building(26, 40, 12, 6.2, 10, 0x2a1020);
  building(-26, 40, 11, 5.4, 10, 0x102028);
  building(26, 76, 12, 7.5, 11, 0x241830);
  building(-26, 76, 14, 4.8, 10, 0x1a1024);
  building(74, 40, 14, 8, 12, 0x301018);
  building(-74, 40, 14, 6.6, 12, 0x101820);
  building(74, 76, 13, 5.5, 10, 0x201028);
  building(-74, 76, 12, 7.2, 11, 0x182010);
  building(26, 108, 12, 6.4, 9, 0x201428);
  building(-26, 108, 13, 5.8, 9, 0x142018);
  building(22, 5.5, 8, 4.2, 6, 0x22141c);
  building(-22, 5.5, 8, 5, 6, 0x141822);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 0.9),
    new THREE.MeshBasicMaterial({ map: neonTex("INFINITE POUR", 0xff3dac) })
  );
  sign.position.set(0, 2.85, D / 2 + 0.16);
  scene.add(sign);

  buildStreetLights();
  streetLight(-6.6, 8.35, Math.PI, true);
  streetLight(6.6, 8.35, Math.PI, true);
  streetLight(-8.4, 10.55, Math.PI, true);

  makeCar(-5.6, 8.1, Math.PI, 0xc41e3a);
  makeCar(5.6, 8.1, Math.PI, 0x2e6bff);
  makeCar(-5.6, 14.8, 0, 0xe8c547);
  makeCar(5.6, 14.8, 0, 0xff3dac);
  makeCar(22.4, 15.2, Math.PI / 2, 0xd8d0c4);
  makeCar(-22.4, 15.2, -Math.PI / 2, 0x2c6e49);
  makeCar(42.8, 29.1, Math.PI / 2, 0x8a3a12);
  makeCar(-42.8, 50.8, -Math.PI / 2, 0x3a3a48);
  makeCar(16.2, 21.6, Math.PI / 2, 0x6a2030);
  makeCar(-16.8, 26.2, -Math.PI / 2, 0x203050);
  makeCar(8.4, 56.4, 0, 0xb8b0a4);
  makeCar(-12.6, 62.4, Math.PI, 0x3d5a3a);

  pads.push({ x: 0, z: 22, r: 1.35 });
  pads.push({ x: 52, z: 22, r: 1.35 });
  pads.push({ x: 0, z: 58, r: 1.35 });
}

function addCarDoors(g, bodyMat, glassMat) {
  const chrome = lambert(0xc8c4bc);
  const mk = (side, hingeZ, len) => {
    const hinge = new THREE.Group();
    hinge.position.set(side * 1.09, 0.68, hingeZ);
    hinge.userData.side = side;
    g.add(hinge);
    addBox(hinge, unitBox, bodyMat, side * 0.06, 0, len * 0.5, 0.09, 0.72, len);
    addBox(hinge, unitBox, glassMat, side * 0.075, 0.38, len * 0.48, 0.04, 0.28, len * 0.7);
    addBox(hinge, unitBox, chrome, side * 0.11, 0.02, 0.36, 0.04, 0.06, 0.12);
    return hinge;
  };
  return { L: mk(-1, -1.32, 1.28), R: mk(1, -1.32, 1.28), LB: mk(-1, 0.22, 1.22), RB: mk(1, 0.22, 1.22) };
}

function carTooClose(x, z, min = 5.1, skip = null) {
  for (const c of cars) {
    if (c === skip) continue;
    if (Math.hypot(x - c.x, z - c.z) < min) return true;
  }
  return false;
}

function placeCarFree(x, z, skip = null) {
  for (let n = 0; n < 8; n++) {
    let pushed = false;
    for (const c of cars) {
      if (c === skip) continue;
      const dx = x - c.x;
      const dz = z - c.z;
      const d = Math.hypot(dx, dz);
      const min = 5.1;
      if (d < min) {
        const nx = d < 1e-4 ? 1 : dx / d;
        const nz = d < 1e-4 ? 0 : dz / d;
        x += nx * (min - d + 0.05);
        z += nz * (min - d + 0.05);
        pushed = true;
      }
    }
    if (!pushed) break;
  }
  x = THREE.MathUtils.clamp(x, -WORLD_X + 4, WORLD_X - 4);
  z = THREE.MathUtils.clamp(z, WORLD_Z_MIN + 3, WORLD_Z_MAX - 3);
  return [x, z];
}

function makeCar(x, z, yaw, color, opts = {}) {
  if (!opts.exact) [x, z] = placeCarFree(x, z);
  const g = new THREE.Group();
  const body = lambert(color);
  const dark = lambert(0x121014);
  const cabin = lambert(0x1c1412);
  const seat = lambert(0x2a1c18);
  const chrome = lambert(0xc8c4bc);
  const glass = lambert(0x8ad4e8, { transparent: true, opacity: 0.28 });
  addBox(g, unitBox, body, 0, 0.5, 0, 2.15, 0.46, 4.35);
  addBox(g, unitBox, cabin, 0, 0.78, 0.15, 1.88, 0.1, 2.7);
  addBox(g, unitBox, seat, -0.46, 0.98, 0.18, 0.54, 0.32, 0.5);
  addBox(g, unitBox, seat, 0.46, 0.98, 0.18, 0.54, 0.32, 0.5);
  addBox(g, unitBox, seat, -0.46, 0.98, 1.12, 0.54, 0.32, 0.5);
  addBox(g, unitBox, seat, 0.46, 0.98, 1.12, 0.54, 0.32, 0.5);
  addBox(g, unitBox, dark, -0.46, 0.92, -0.22, 0.86, 0.08, 0.95);
  addBox(g, unitBox, chrome, -0.46, 1.0, -0.42, 0.38, 0.08, 0.22);
  addBox(g, unitBox, body, 0, 1.42, 0.28, 1.98, 0.1, 2.55);
  addBox(g, unitBox, glass, 0, 1.18, -1.05, 1.72, 0.52, 0.06);
  addBox(g, unitBox, glass, 0, 1.16, 1.58, 1.72, 0.48, 0.06);
  addBox(g, unitBox, glass, -1.0, 1.16, 0.28, 0.05, 0.46, 2.15);
  addBox(g, unitBox, glass, 1.0, 1.16, 0.28, 0.05, 0.46, 2.15);
  addBox(g, unitBox, dark, -1.08, 0.3, -1.38, 0.3, 0.58, 0.58);
  addBox(g, unitBox, dark, 1.08, 0.3, -1.38, 0.3, 0.58, 0.58);
  addBox(g, unitBox, dark, -1.08, 0.3, 1.38, 0.3, 0.58, 0.58);
  addBox(g, unitBox, dark, 1.08, 0.3, 1.38, 0.3, 0.58, 0.58);
  addBox(g, unitBox, lambert(0xffe08a), -0.72, 0.52, -2.18, 0.16, 0.1, 0.08);
  addBox(g, unitBox, lambert(0xffe08a), 0.72, 0.52, -2.18, 0.16, 0.1, 0.08);
  addBox(g, unitBox, lambert(0xc41e3a), -0.72, 0.52, 2.18, 0.16, 0.1, 0.08);
  addBox(g, unitBox, lambert(0xc41e3a), 0.72, 0.52, 2.18, 0.16, 0.1, 0.08);
  const doors = addCarDoors(g, body, glass);
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  g.userData.kind = "car";
  g.userData.root = g;
  const car = {
    nid: `s${cars.length}`,
    mesh: g,
    x, z, yaw, speed: 0, drift: 0, vx: 0, vz: 0,
    doorL: doors.L, doorR: doors.R, doorLB: doors.LB, doorRB: doors.RB,
    doorAnim: null, doorSide: -1, doorRow: 0,
  };
  g.userData.car = car;
  registerPick(g);
  scene.add(g);
  cars.push(car);
  return car;
}

function hangingBarLight(x, z, shadow) {
  const ceilY = 3.28;
  const shadeY = 2.52;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const shadeCol = lambert(0x2a1c12);
  const lining = lambert(0xc9a227);
  addBox(g, unitBox, mats.chrome, 0, ceilY, 0, 0.2, 0.04, 0.2);
  addBox(g, unitCyl, mats.brass, 0, ceilY - 0.035, 0, 0.055, 0.05, 0.055);
  const hangH = ceilY - 0.06 - (shadeY + 0.16);
  addBox(g, unitCyl, mats.chrome, 0, shadeY + 0.16 + hangH / 2, 0, 0.01, hangH, 0.01);
  for (let i = 0; i < 3; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 10), mats.brass);
    link.position.set(0, shadeY + 0.17 + i * 0.03, 0);
    link.rotation.x = i % 2 ? Math.PI / 2 : 0;
    link.rotation.z = i % 2 ? 0 : Math.PI / 2;
    link.castShadow = true;
    g.add(link);
  }
  addBox(g, unitCyl, mats.chrome, 0, shadeY + 0.145, 0, 0.028, 0.04, 0.028);
  addBox(g, unitCyl, mats.brass, 0, shadeY + 0.12, 0, 0.04, 0.03, 0.04);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.09, 0.18, 14, 1, true), shadeCol);
  shade.position.set(0, shadeY + 0.05, 0);
  shade.castShadow = true;
  shade.receiveShadow = true;
  g.add(shade);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.082, 0.16, 14, 1, true), lining);
  inner.position.set(0, shadeY + 0.05, 0);
  g.add(inner);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 8, 18), mats.brass);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, shadeY - 0.04, 0);
  rim.castShadow = true;
  g.add(rim);
  addBox(g, unitCyl, mats.chrome, 0, shadeY + 0.13, 0, 0.09, 0.03, 0.09);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), mats.glow);
  bulb.position.set(0, shadeY + 0.01, 0);
  g.add(bulb);
  addBox(g, unitCyl, mats.chrome, 0, shadeY + 0.05, 0, 0.016, 0.03, 0.016);
  scene.add(g);
  const pl = new THREE.PointLight(0xffc070, 2.6, 6.5);
  pl.position.set(x, shadeY - 0.02, z);
  if (shadow) pl.castShadow = true;
  scene.add(pl);
  return g;
}

function building(x, z, sx, sy, sz, color) {
  addBox(scene, unitBox, lambert(color), x, sy / 2, z, sx, sy, sz);
  worldSolid(x, z, sx, sz);
  camBox(x, sy / 2, z, sx, sy, sz);
}

function barPad(x, z, label) {
  asphalt(x, z, 2.4, 2.4, mats.glow, 0.03);
  pads.push({ x, z, r: 1.35 });
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.55),
    new THREE.MeshBasicMaterial({ map: neonTex(label, 0x3dfff2), transparent: true, side: THREE.DoubleSide })
  );
  board.position.set(x, 1.35, z);
  scene.add(board);
}

function bathTileTex() {
  return px(32, 32, (ctx, n) => {
    ctx.fillStyle = "#6a6560";
    ctx.fillRect(0, 0, n, n);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const stain = ((x * 7 + y * 13) ^ (x * 3)) & 7;
        const r = 196 - stain * 6 - ((x + y) % 3) * 4;
        const g = 188 - stain * 5;
        const b = 176 - stain * 4;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * 8 + 1, y * 8 + 1, 6, 6);
        if (((x * 5 + y * 9) & 7) === 1) {
          ctx.fillStyle = "rgba(70,50,30,0.18)";
          ctx.fillRect(x * 8 + 2, y * 8 + 3, 3, 2);
        }
      }
    }
  });
}

function flyerTex(title, sub, bg, ink) {
  return px(64, 80, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1a120c";
    ctx.fillRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = bg;
    ctx.fillRect(4, 4, w - 8, h - 8);
    blitText(ctx, title, 6, 10, ink, 1);
    blitText(ctx, sub, 6, 28, "#201810", 1);
    ctx.fillStyle = "#1a120c";
    ctx.fillRect(w - 10, 0, 10, 9);
    ctx.fillRect(0, h - 6, 8, 6);
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(8, 48, 40, 18);
  });
}

function tagTex(text, col, scale = 2) {
  const s = String(text).toUpperCase();
  const w = Math.max(64, s.length * 4 * scale + 16);
  const h = 8 * scale + 16;
  return px(w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    blitText(ctx, s, 4, 6, col, scale);
  });
}

function scribbleTex(variant = 0) {
  return px(80, 48, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (variant === 1) {
      ctx.fillStyle = "#c41e3a";
      ctx.fillRect(20, 6, 8, 24);
      ctx.fillRect(17, 3, 14, 8);
      ctx.fillRect(14, 28, 9, 9);
      ctx.fillRect(25, 28, 9, 9);
      blitText(ctx, "NICE", 40, 18, "#3dfff2", 1);
      return;
    }
    if (variant === 2) {
      blitText(ctx, "555", 6, 6, "#2e6bff", 2);
      blitText(ctx, "6969", 6, 24, "#ff3dac", 2);
      return;
    }
    if (variant === 3) {
      ctx.fillStyle = "#e8c547";
      ctx.fillRect(10, 22, 56, 3);
      ctx.fillRect(36, 8, 3, 28);
      blitText(ctx, "XOXO", 12, 30, "#ff3dac", 1);
      return;
    }
    ctx.fillStyle = "#c41e3a";
    ctx.fillRect(8, 20, 28, 3);
    ctx.fillRect(18, 8, 3, 26);
    ctx.fillStyle = "#2e6bff";
    ctx.fillRect(44, 10, 18, 18);
    ctx.fillStyle = "#e8c547";
    ctx.fillRect(50, 16, 6, 6);
    blitText(ctx, "IP", 46, 32, "#3dfff2", 1);
  });
}

const wallMarks = [];

function wrapYaw(a) {
  let y = a % (Math.PI * 2);
  if (y < 0) y += Math.PI * 2;
  return y;
}

function yawClose(a, b) {
  const d = Math.abs(wrapYaw(a) - wrapYaw(b));
  return Math.min(d, Math.PI * 2 - d) < 0.2;
}

function wallAlong(x, z, yaw) {
  return x * Math.cos(yaw) - z * Math.sin(yaw);
}

function wallPlane(x, z, yaw) {
  return x * Math.sin(yaw) + z * Math.cos(yaw);
}

function markHits(a, b, pad) {
  if (!yawClose(a.yaw, b.yaw)) return false;
  if (Math.abs(a.plane - b.plane) > 0.2) return false;
  return Math.abs(a.along - b.along) < (a.w + b.w) * 0.5 + pad
    && Math.abs(a.y - b.y) < (a.h + b.h) * 0.5 + pad;
}

function reserveWall(x, y, z, w, h, yaw) {
  wallMarks.push({
    x,
    y,
    z,
    w,
    h,
    yaw,
    along: wallAlong(x, z, yaw),
    plane: wallPlane(x, z, yaw),
  });
}

function wallBusy(x, y, z, w, h, yaw, pad = 0.05) {
  const probe = { y, w, h, yaw, along: wallAlong(x, z, yaw), plane: wallPlane(x, z, yaw) };
  return wallMarks.some((m) => markHits(probe, m, pad));
}

function graffitiSize(text, scale = 2) {
  const s = String(text).toUpperCase();
  return {
    w: Math.max(0.26, s.length * 0.05 * (scale / 2) + 0.08),
    h: 0.1 * (scale / 2) + 0.04,
  };
}

function findWallSlot(x, y, z, w, h, yaw, pad = 0.06) {
  if (!wallBusy(x, y, z, w, h, yaw, pad)) return { x, y, z };
  const ux = Math.cos(yaw);
  const uz = -Math.sin(yaw);
  const tries = [];
  for (const dy of [0.2, -0.2, 0.36, -0.36, 0.5, -0.5, 0.64, -0.28, 0.78, -0.64]) {
    tries.push([x, y + dy, z]);
  }
  for (const s of [-0.24, 0.24, -0.42, 0.42, -0.6, 0.6, -0.78, 0.78]) {
    tries.push([x + ux * s, y, z + uz * s]);
    tries.push([x + ux * s, y + 0.22, z + uz * s]);
    tries.push([x + ux * s, y - 0.22, z + uz * s]);
  }
  for (const [px, py, pz] of tries) {
    if (py < 0.4 || py > 2.3) continue;
    if (!wallBusy(px, py, pz, w, h, yaw, pad)) return { x: px, y: py, z: pz };
  }
  return null;
}

function graffiti(text, col, x, y, z, yaw, scale = 2) {
  const s = String(text).toUpperCase();
  const { w, h } = graffitiSize(s, scale);
  const slot = findWallSlot(x, y, z, w, h, yaw);
  if (!slot) return null;
  return decal(tagTex(s, col, scale), slot.x, slot.y, slot.z, w, h, yaw);
}

function placeDecal(map, x, y, z, w, h, yaw) {
  const slot = findWallSlot(x, y, z, w, h, yaw);
  if (!slot) return null;
  return decal(map, slot.x, slot.y, slot.z, w, h, yaw);
}

function paperTex() {
  return px(32, 32, (ctx, n) => {
    ctx.fillStyle = "#f4eee2";
    ctx.fillRect(0, 0, n, n);
    ctx.fillStyle = "#e8dfd0";
    for (let y = 2; y < n; y += 4) ctx.fillRect(0, y, n, 1);
    ctx.fillStyle = "#d8cbb8";
    for (let x = 1; x < n; x += 8) {
      for (let y = 0; y < n; y += 2) ctx.fillRect(x, y, 1, 1);
    }
  });
}

function makeToiletPaper(x, y, z, yaw) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = yaw;
  const paper = new THREE.MeshLambertMaterial({ map: paperTex(), color: 0xf6efe2 });
  const tube = lambert(0xc9a06a);
  addBox(g, unitBox, mats.chrome, 0, 0, -0.01, 0.16, 0.12, 0.02);
  addBox(g, unitBox, mats.chrome, -0.07, 0, 0.05, 0.018, 0.08, 0.1);
  addBox(g, unitBox, mats.chrome, 0.07, 0, 0.05, 0.018, 0.08, 0.1);
  const spindle = new THREE.Mesh(unitCyl, mats.chrome);
  spindle.rotation.z = Math.PI / 2;
  spindle.scale.set(0.012, 0.145, 0.012);
  spindle.position.set(0, 0, 0.055);
  g.add(spindle);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 18, 1, true), paper);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, 0, 0.055);
  roll.castShadow = true;
  g.add(roll);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.112, 10), tube);
  core.rotation.z = Math.PI / 2;
  core.position.set(0, 0, 0.055);
  g.add(core);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.11), paper);
  sheet.position.set(0, -0.075, 0.108);
  sheet.rotation.x = 0.18;
  g.add(sheet);
  const fold = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), paper);
  fold.position.set(0, -0.138, 0.118);
  fold.rotation.x = 0.85;
  g.add(fold);
  const tags = ["IP", "LOL", "XOXO", "JAY"];
  const ink = tags[Math.abs((x * 13.7 + z * 9.1 + y * 3) | 0) % tags.length];
  const note = new THREE.Mesh(
    new THREE.PlaneGeometry(0.068, 0.026),
    new THREE.MeshBasicMaterial({
      map: tagTex(ink, "#c45a38", 1),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );
  note.position.set(0, 0.006, 0.0012);
  sheet.add(note);
  reserveWall(x, y - 0.05, z, 0.3, 0.42, yaw);
  scene.add(g);
  return g;
}

function crackTex() {
  return px(64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(20,16,12,0.55)";
    ctx.fillRect(8, 30, 48, 2);
    ctx.fillRect(28, 12, 2, 40);
    ctx.fillRect(28, 28, 18, 2);
    ctx.fillRect(14, 18, 16, 2);
    ctx.fillStyle = "rgba(180,200,210,0.35)";
    ctx.fillRect(12, 8, 10, 8);
  });
}

function decal(map, x, y, z, w, h, yaw, occupy = true) {
  const lift = 0.011;
  const nx = Math.sin(yaw) * lift;
  const nz = Math.cos(yaw) * lift;
  const mat = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    opacity: 0.94,
    side: THREE.FrontSide,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x + nx, y, z + nz);
  m.rotation.y = yaw;
  m.renderOrder = 2;
  scene.add(m);
  if (occupy) reserveWall(x, y, z, w, h, yaw);
  return m;
}

function doorIsOpen(s) {
  if (s.swing) return Math.abs(s.swing.userData.ang || 0) > 0.45;
  if (s.door) return frontDoorAng < -0.35;
  return false;
}

function makeHingeDoor(x, z, yaw, w, h, kind, swingDir = 1) {
  const hinge = new THREE.Group();
  hinge.position.set(x, 0, z);
  hinge.userData.baseYaw = yaw;
  hinge.rotation.y = yaw;
  scene.add(hinge);
  const door = addBox(hinge, unitBox, mats.woodDark, (w / 2) * swingDir, h / 2, 0, w, h, 0.05);
  addBox(hinge, unitBox, mats.brass, (w - 0.12) * swingDir, 1.05, 0.03, 0.04, 0.1, 0.04);
  door.userData.kind = kind;
  door.userData.root = door;
  door.userData.hinge = hinge;
  door.userData.ang = 0;
  door.userData.want = 0;
  door.userData.open = false;
  door.userData.swingDir = swingDir;
  door.userData.sid = `s${swingDoors.length}`;
  registerPick(door);
  swingDoors.push(door);
  const cx = x + Math.cos(yaw) * (w / 2) * swingDir;
  const cz = z - Math.sin(yaw) * (w / 2) * swingDir;
  const hx = Math.abs(Math.cos(yaw)) * (w / 2) + 0.1;
  const hz = Math.abs(Math.sin(yaw)) * (w / 2) + 0.1;
  worldSolids.push({ minx: cx - hx, maxx: cx + hx, minz: cz - hz, maxz: cz + hz, swing: door, top: h, climb: false });
  camBox(cx, h / 2, cz, hx * 2, h, hz * 2, { swing: door });
  return door;
}

function makeToilet(x, z, yaw) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  const porcelain = lambert(0xece4d8);
  const glaze = lambert(0xf6f0e6);
  const inner = lambert(0xd4ccc0);
  const water = lambert(0x3a8aaa, { transparent: true, opacity: 0.58 });
  const seat = lambert(0xf2e6d0);
  const add = (mesh, px, py, pz) => {
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.16, 14), porcelain), 0, 0.08, 0.17);
  const bowl = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.125, 0.18, 18), porcelain), 0, 0.24, 0.17);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.07, 0.12, 16), inner), 0, 0.26, 0.17);
  const wet = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), water);
  wet.rotation.x = -Math.PI / 2;
  add(wet, 0, 0.305, 0.17);
  const drain = new THREE.Mesh(new THREE.CircleGeometry(0.028, 10), lambert(0x1a1a1c));
  drain.rotation.x = -Math.PI / 2;
  add(drain, 0, 0.307, 0.17);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.024, 8, 20), glaze);
  rim.rotation.x = Math.PI / 2;
  add(rim, 0, 0.335, 0.17);
  const seatRing = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.03, 8, 20), seat);
  seatRing.rotation.x = Math.PI / 2;
  add(seatRing, 0, 0.358, 0.17);
  addBox(g, unitBox, porcelain, 0, 0.36, -0.02, 0.18, 0.14, 0.2);
  addBox(g, unitBox, porcelain, 0, 0.62, -0.2, 0.38, 0.4, 0.16);
  addBox(g, unitBox, glaze, 0, 0.83, -0.2, 0.4, 0.03, 0.18);
  addBox(g, unitBox, seat, 0, 0.64, -0.1, 0.34, 0.28, 0.04);
  addBox(g, unitBox, mats.chrome, 0.15, 0.72, -0.1, 0.05, 0.02, 0.07);
  scene.add(g);
  bowl.userData.kind = "toilet";
  bowl.userData.root = bowl;
  const sit = {
    x: x + Math.sin(yaw) * 0.12,
    z: z + Math.cos(yaw) * 0.12,
    y: 1.16,
    yaw,
    kind: "toilet",
    fixture: g,
    standX: x + Math.sin(yaw) * 0.78,
    standZ: z + Math.cos(yaw) * 0.78,
  };
  bowl.userData.sit = sit;
  bowl.userData.toilet = g;
  g.userData.water = wet;
  g.userData.bowlWorld = new THREE.Vector3(x + Math.sin(yaw) * 0.17, 0.31, z + Math.cos(yaw) * 0.17);
  g.userData.sit = sit;
  g.userData.drainR = 0.28;
  registerPick(bowl);
  toilets.push(g);
  worldSolid(x + Math.sin(yaw) * 0.06, z + Math.cos(yaw) * 0.06, 0.32, 0.36, 0.44);
  return g;
}

function makeUrinal(x, z, yaw) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  const porcelain = lambert(0xe6dfd4);
  const inner = lambert(0xcfc6b8);
  const water = lambert(0x2a6a8a, { transparent: true, opacity: 0.48 });
  addBox(g, unitBox, porcelain, 0, 0.98, -0.02, 0.36, 0.9, 0.06);
  addBox(g, unitBox, porcelain, 0, 1.3, 0.08, 0.36, 0.1, 0.18);
  addBox(g, unitBox, porcelain, -0.16, 0.86, 0.12, 0.05, 0.66, 0.28);
  addBox(g, unitBox, porcelain, 0.16, 0.86, 0.12, 0.05, 0.66, 0.28);
  addBox(g, unitBox, inner, 0, 0.9, 0.03, 0.24, 0.6, 0.04);
  const bowl = addBox(g, unitBox, porcelain, 0, 0.5, 0.14, 0.3, 0.18, 0.26);
  addBox(g, unitBox, porcelain, 0, 0.42, 0.22, 0.28, 0.06, 0.12);
  const cup = new THREE.Mesh(unitCyl, porcelain);
  cup.scale.set(0.12, 0.2, 0.1);
  cup.position.set(0, 0.68, 0.12);
  cup.rotation.x = 0.62;
  g.add(cup);
  const wet = addBox(g, unitBox, water, 0, 0.52, 0.14, 0.16, 0.03, 0.14);
  addBox(g, unitBox, lambert(0x1a1a1c), 0, 0.46, 0.12, 0.05, 0.02, 0.05);
  addBox(g, unitBox, mats.chrome, 0, 1.4, 0.0, 0.05, 0.12, 0.05);
  addBox(g, unitBox, mats.chrome, 0, 1.48, 0.1, 0.04, 0.04, 0.18);
  addBox(g, unitBox, mats.chrome, 0.12, 1.4, 0.03, 0.12, 0.03, 0.03);
  scene.add(g);
  bowl.userData.kind = "urinal";
  bowl.userData.root = bowl;
  bowl.userData.toilet = g;
  g.userData.kind = "urinal";
  g.userData.water = wet;
  g.userData.bowlWorld = new THREE.Vector3(x + Math.sin(yaw) * 0.14, 0.52, z + Math.cos(yaw) * 0.14);
  g.userData.drainR = 0.14;
  registerPick(bowl);
  toilets.push(g);
  worldSolid(x + Math.sin(yaw) * 0.04, z + Math.cos(yaw) * 0.04, 0.26, 0.26);
  return g;
}

function makeUrinalDivider(x, z, yaw) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  addBox(g, unitBox, lambert(0x5a3a28), 0, 0.86, 0.14, 0.04, 1.36, 0.46);
  scene.add(g);
  worldSolid(x + Math.sin(yaw) * 0.14, z + Math.cos(yaw) * 0.14, 0.1, 0.4);
}

function hash01(x, z, i) {
  const n = Math.sin(x * 12.9898 + z * 78.233 + i * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function stallGraffiti(x, z, yaw, room, hw, hd) {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const leftFace = yaw - Math.PI / 2;
  const rightFace = yaw + Math.PI / 2;
  const walls = [
    { x: x + rx * (hw - 0.04), z: z + rz * (hw - 0.04), face: leftFace, alongX: fx, alongZ: fz, span: hd * 0.88 },
    { x: x - rx * (hw - 0.04), z: z - rz * (hw - 0.04), face: rightFace, alongX: fx, alongZ: fz, span: hd * 0.88 },
    { x: x - fx * (hd - 0.04), z: z - fz * (hd - 0.04), face: yaw, alongX: rx, alongZ: rz, span: hw * 0.78 },
  ];
  const men = [
    ["555-6969", "#3dfff2", 2],
    ["CALL ME", "#ff3dac", 2],
    ["I EAT ASS", "#e8c547", 2],
    ["SUCK IT", "#c41e3a", 2],
    ["DTF TONIGHT", "#ff3dac", 2],
    ["BLOW ME", "#3dfff2", 2],
    ["867-5309", "#e8c547", 2],
    ["FREE HJ", "#c41e3a", 2],
    ["JAY HAS HERPES", "#ff3dac", 1],
    ["BIG DICK", "#3dfff2", 2],
    ["PISS HERE", "#3dfff2", 1],
    ["NICE COCK", "#e8c547", 2],
    ["IP 4EVER", "#3dfff2", 2],
    ["WASH ME", "#c41e3a", 2],
    ["KISS IT", "#ff3dac", 2],
    ["HOUSE BOT", "#e8c547", 2],
  ];
  const women = [
    ["555-0142", "#ff3dac", 2],
    ["ASK FOR KIM", "#3dfff2", 2],
    ["FOR A GOOD TIME", "#e8c547", 1],
    ["KISS ME", "#ff3dac", 2],
    ["EAT ME", "#c41e3a", 2],
    ["HOOK UP", "#3dfff2", 2],
    ["555-4200", "#e8c547", 2],
    ["BETTY 4EVER", "#ff3dac", 2],
    ["CALL MOM", "#3dfff2", 2],
    ["I WAS HERE", "#e8c547", 2],
    ["XOXO", "#ff3dac", 2],
    ["DTF", "#3dfff2", 2],
    ["TEXT JAY", "#e8c547", 2],
    ["LOVE BITES", "#c41e3a", 1],
    ["CUTE ASS", "#ff3dac", 2],
    ["STALL 2", "#3dfff2", 2],
  ];
  const pool = room === "men" ? men : women;
  const count = 6 + ((hash01(x, z, 0) * 4) | 0);
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let pick = (hash01(x, z, i + 3) * pool.length) | 0;
    let guard = 0;
    while (used.has(pick) && guard++ < pool.length) pick = (pick + 1) % pool.length;
    used.add(pick);
    const [label, col, scale] = pool[pick];
    const wall = walls[(hash01(x, z, i + 11) * walls.length) | 0];
    const along = (hash01(x, z, i + 19) - 0.5) * wall.span;
    const y = 0.62 + hash01(x, z, i + 29) * 1.15;
    graffiti(label, col, wall.x + wall.alongX * along, y, wall.z + wall.alongZ * along, wall.face, scale);
  }
  for (let i = 0; i < 2; i++) {
    const wall = walls[(hash01(x, z, 80 + i) * walls.length) | 0];
    const along = (hash01(x, z, 90 + i) - 0.5) * wall.span * 0.7;
    placeDecal(scribbleTex((hash01(x, z, 100 + i) * 4) | 0), wall.x + wall.alongX * along, 0.5 + hash01(x, z, 110 + i) * 0.4, wall.z + wall.alongZ * along, 0.3, 0.18, wall.face);
  }
}

function makeStall(x, z, yaw, room) {
  const stallMat = lambert(0x5a3a28);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const h = 1.85;
  const w = 1.4;
  const d = 1.5;
  const hw = w / 2;
  const hd = d / 2;
  const bx = x - fx * hd;
  const bz = z - fz * hd;
  addBox(scene, unitBox, stallMat, bx, h / 2, bz, Math.abs(rx) * w + 0.08, h, Math.abs(rz) * w + 0.08);
  worldSolid(bx, bz, Math.abs(rx) * w + 0.14, Math.abs(rz) * w + 0.14);
  camBox(bx, h / 2, bz, Math.abs(rx) * w + 0.14, h, Math.abs(rz) * w + 0.14);
  for (const s of [-1, 1]) {
    const sx = x + rx * hw * s - fx * 0.02;
    const sz = z + rz * hw * s - fz * 0.02;
    addBox(scene, unitBox, stallMat, sx, h / 2, sz, Math.abs(fx) * d + 0.07, h, Math.abs(rx) * d + 0.07);
    worldSolid(sx, sz, Math.abs(fx) * d + 0.12, Math.abs(rx) * d + 0.12);
    camBox(sx, h / 2, sz, Math.abs(fx) * d + 0.12, h, Math.abs(rx) * d + 0.12);
  }
  const doorW = 0.86;
  const hx = x + fx * hd - rx * (hw - 0.04);
  const hz = z + fz * hd - rz * (hw - 0.04);
  makeHingeDoor(hx, hz, yaw, doorW, 1.78, "stallDoor", 1);
  const fillW = Math.max(0.24, w - doorW - 0.1);
  const fillX = x + fx * hd + rx * (hw - fillW / 2);
  const fillZ = z + fz * hd + rz * (hw - fillW / 2);
  addBox(scene, unitBox, stallMat, fillX, h / 2, fillZ, Math.abs(rx) * fillW + 0.08, h, Math.abs(rz) * fillW + 0.08);
  worldSolid(fillX, fillZ, Math.abs(rx) * fillW + 0.12, Math.abs(rz) * fillW + 0.12);
  camBox(fillX, h / 2, fillZ, Math.abs(rx) * fillW + 0.12, h, Math.abs(rz) * fillW + 0.12);
  const tpX = x + rx * (hw - 0.05) - fx * 0.08;
  const tpZ = z + rz * (hw - 0.05) - fz * 0.08;
  makeToiletPaper(tpX, 0.92, tpZ, Math.atan2(-rx, -rz));
  const spanX = Math.abs(fx) * d + Math.abs(rx) * w;
  const spanZ = Math.abs(fz) * d + Math.abs(rz) * w;
  stallZones.push({
    minx: x - spanX / 2 + 0.08,
    maxx: x + spanX / 2 - 0.08,
    minz: z - spanZ / 2 + 0.08,
    maxz: z + spanZ / 2 - 0.08,
  });
  stallGraffiti(x, z, yaw, room, hw, hd);
  makeToilet(x - fx * 0.28, z - fz * 0.28, yaw);
}

function makeBathSink(x, z, yaw, room) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  const porcelain = lambert(0xe8e0d4);
  addBox(g, unitBox, lambert(0x4a4038), 0, 0.42, -0.02, 0.52, 0.84, 0.28);
  const basin = addBox(g, unitBox, porcelain, 0, 0.86, 0.04, 0.46, 0.08, 0.32);
  addBox(g, unitBox, lambert(0x2a6a8a, { transparent: true, opacity: 0.35 }), 0, 0.84, 0.05, 0.32, 0.02, 0.2);
  addBox(g, unitBox, mats.chrome, 0, 1.02, -0.08, 0.05, 0.18, 0.05);
  addBox(g, unitBox, mats.chrome, 0, 1.1, 0.04, 0.04, 0.04, 0.18);
  addBox(g, unitBox, lambert(0x3a322c), 0, 1.55, -0.16, 0.62, 0.72, 0.03);
  addBox(g, unitBox, lambert(0xb8d0dc, { transparent: true, opacity: 0.62 }), 0, 1.55, -0.14, 0.54, 0.64, 0.03);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.18, 8), lambert(0x8ad4ea, { transparent: true, opacity: 0.5 }));
  stream.position.set(0, 0.96, 0.08);
  stream.visible = false;
  g.add(stream);
  const splash = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), lambert(0x9adcea, { transparent: true, opacity: 0.4 }));
  splash.rotation.x = -Math.PI / 2;
  splash.position.set(0, 0.845, 0.08);
  splash.visible = false;
  g.add(splash);
  scene.add(g);
  g.userData.kind = "bathSink";
  g.userData.root = g;
  g.userData.sink = g;
  g.userData.running = false;
  g.userData.kid = `k${sinks.length}`;
  g.userData.stream = stream;
  g.userData.splash = splash;
  basin.userData.kind = "bathSink";
  basin.userData.root = g;
  basin.userData.sink = g;
  registerPick(g);
  registerPick(basin);
  sinks.push(g);
  const back = 0.16;
  worldSolid(x - Math.sin(yaw) * back, z - Math.cos(yaw) * back, 0.28, 0.16, 0.82);
  const mx = x - Math.sin(yaw) * 0.16;
  const mz = z - Math.cos(yaw) * 0.16;
  placeDecal(
    flyerTex(room === "men" ? "AIM" : "SMILE", room === "men" ? "THEN FLUSH" : "YOU LOOK", "#f4ead0", "#8b2020"),
    mx + Math.cos(yaw) * 0.14,
    1.72,
    mz - Math.sin(yaw) * 0.14,
    0.2,
    0.26,
    yaw
  );
  graffiti(room === "men" ? "PISS SHY" : "XOXO", room === "men" ? "#c41e3a" : "#ff3dac", mx - Math.cos(yaw) * 0.12, 1.32, mz + Math.sin(yaw) * 0.12, yaw, 2);
  decal(crackTex(), mx, 1.52, mz, 0.34, 0.34, yaw);
  return g;
}

function toggleBathSink(sink) {
  if (!sink) return;
  setBathSink(sink, !sink.userData.running);
}

function setBathSink(sink, on, fromNet) {
  if (!sink) return;
  const want = !!on;
  const changed = !!sink.userData.running !== want;
  sink.userData.running = want;
  if (sink.userData.stream) sink.userData.stream.visible = want;
  if (sink.userData.splash) sink.userData.splash.visible = want;
  if (changed) {
    if (want) {
      audio.sinkStart();
      audio.splash();
    } else if (!sinks.some((s) => s.userData.running)) {
      audio.sinkStop();
    }
  }
  if (!fromNet && changed && sink.userData.kid) publishWorldBit(sink.userData.kid, want);
}

function buildBathrooms() {
  const plaster = lambert(0x7a7468);
  const rust = lambert(0x6a4030);
  const tileMap = bathTileTex();
  tileMap.wrapS = tileMap.wrapT = THREE.RepeatWrapping;
  tileMap.repeat.set(8, 6);
  const tileMat = new THREE.MeshLambertMaterial({ map: tileMap, color: 0xd8d0c4 });
  const wallTile = bathTileTex();
  wallTile.wrapS = wallTile.wrapT = THREE.RepeatWrapping;
  wallTile.repeat.set(5, 4);
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTile, color: 0xc4b8aa });
  const bathH = 3.05;
  const WX0 = -12.52;
  const WX1 = -8.18;
  const MZ0 = -6.7;
  const MZ1 = -3.7;
  const WZ0 = -1.7;
  const WZ1 = 1.36;
  const HX0 = -10.12;
  const CX = (WX0 + WX1) / 2;

  const wall = (x, z, sx, sz) => {
    addBox(scene, unitBox, wallMat, x, bathH / 2, z, sx, bathH, sz);
    worldSolid(x, z, Math.max(0.28, sx + 0.06), Math.max(0.28, sz + 0.06));
    camBox(x, bathH / 2, z, sx + 0.1, bathH, sz + 0.1);
  };
  const floor = (x, z, w, d) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), tileMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.012, z);
    m.receiveShadow = true;
    scene.add(m);
    addBox(scene, unitBox, plaster, x, bathH + 0.04, z, w, 0.1, d);
    camBox(x, bathH, z, w, 0.16, d);
    addCeiling(x, z, w, d, bathH - 0.02);
  };

  floor(CX, (MZ0 + MZ1) / 2, WX1 - WX0, MZ1 - MZ0);
  floor((HX0 + WX1) / 2, (MZ1 + WZ0) / 2, WX1 - HX0, WZ0 - MZ1);
  floor(CX, (WZ0 + WZ1) / 2, WX1 - WX0, WZ1 - WZ0);

  wall(WX0, (MZ0 + MZ1) / 2, 0.16, MZ1 - MZ0);
  wall(CX, MZ0, WX1 - WX0, 0.16);
  wall(WX1, (MZ0 + MZ1) / 2, 0.16, MZ1 - MZ0);
  wall((WX0 - 9.55) / 2, MZ1, -9.55 - WX0, 0.16);
  wall((-8.42 + WX1) / 2, MZ1, WX1 + 8.42, 0.16);

  wall(HX0, (MZ1 + WZ0) / 2, 0.16, WZ0 - MZ1);
  wall(WX0, (MZ1 + WZ0) / 2, 0.16, WZ0 - MZ1);

  wall(WX0, (WZ0 + WZ1) / 2, 0.16, WZ1 - WZ0);
  wall(CX, WZ1, WX1 - WX0, 0.16);
  wall(WX1, (WZ0 + WZ1) / 2, 0.16, WZ1 - WZ0);
  wall((WX0 - 9.55) / 2, WZ0, -9.55 - WX0, 0.16);
  wall((-8.42 + WX1) / 2, WZ0, WX1 + 8.42, 0.16);

  addBox(scene, unitBox, mats.woodDark, -8, 1.08, -3.52, 0.18, 2.16, 0.1);
  addBox(scene, unitBox, mats.woodDark, -8, 1.08, -1.88, 0.18, 2.16, 0.1);
  addBox(scene, unitBox, mats.woodDark, -8, 2.28, -2.7, 0.18, 0.24, 1.74);

  const restSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.32),
    new THREE.MeshBasicMaterial({ map: neonTex("RESTROOMS", 0x3dfff2), side: THREE.DoubleSide })
  );
  restSign.position.set(-7.82, 2.55, -2.7);
  restSign.rotation.y = Math.PI / 2;
  scene.add(restSign);
  const menSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.24),
    new THREE.MeshBasicMaterial({ map: neonTex("MEN", 0x3dfff2), side: THREE.DoubleSide })
  );
  menSign.position.set(-9.4, 2.42, -3.58);
  scene.add(menSign);
  const womenSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.24),
    new THREE.MeshBasicMaterial({ map: neonTex("WOMEN", 0xff3dac), side: THREE.DoubleSide })
  );
  womenSign.position.set(-9.4, 2.42, -1.82);
  womenSign.rotation.y = Math.PI;
  scene.add(womenSign);

  const plMen = new THREE.PointLight(0xffd2a0, 1.15, 6);
  plMen.position.set(-10.35, 2.5, -5.2);
  scene.add(plMen);
  const plWomen = new THREE.PointLight(0xffd2a0, 1.15, 6);
  plWomen.position.set(-10.35, 2.5, -0.15);
  scene.add(plWomen);
  const plHall = new THREE.PointLight(0xc8e6f4, 0.7, 4);
  plHall.position.set(-9.1, 2.4, -2.7);
  scene.add(plHall);
  bathFlicker = plMen;

  makeHingeDoor(-9.55, MZ1, 0, 1.1, 2.15, "restroomDoor", 1);
  makeHingeDoor(-9.55, WZ0, Math.PI, 1.1, 2.15, "restroomDoor", -1);

  makeUrinal(WX0 + 0.16, -4.05, Math.PI / 2);
  makeUrinal(WX0 + 0.16, -4.72, Math.PI / 2);
  makeUrinalDivider(WX0 + 0.16, -4.38, Math.PI / 2);
  makeStall(-11.68, MZ0 + 0.78, Math.PI / 2, "men");
  makeBathSink(-8.46, -4.95, -Math.PI / 2, "men");

  makeStall(-11.78, WZ1 - 0.70, Math.PI, "women");
  makeStall(-10.28, WZ1 - 0.70, Math.PI, "women");
  makeBathSink(-8.46, -0.95, -Math.PI / 2, "women");

  addBox(scene, unitBox, rust, -8.58, 0.22, -3.88, 0.28, 0.44, 0.28);
  addBox(scene, unitBox, lambert(0x2a2018), -8.48, 1.55, -6.15, 0.08, 0.22, 0.16);
  addBox(scene, unitBox, lambert(0xf4ead0), -8.5, 1.38, -6.15, 0.06, 0.14, 0.12);
  addBox(scene, unitBox, lambert(0x3a322c), -10.45, 0.28, -3.92, 0.28, 0.56, 0.28);
  addBox(scene, unitBox, lambert(0xf4ead0), -10.45, 0.62, -3.92, 0.22, 0.12, 0.22);
  addBox(scene, unitBox, lambert(0x3a322c), -12.1, 0.28, -1.45, 0.28, 0.56, 0.28);
  addBox(scene, unitBox, lambert(0xf4ead0), -12.1, 0.62, -1.45, 0.22, 0.12, 0.22);

  const flyers = [
    flyerTex("POOL NITE", "FRI 9PM", "#e8c547", "#1a1008"),
    flyerTex("LOST KEYS", "ASK BAR", "#f4ead0", "#8b2020"),
    flyerTex("WASH HANDS", "PLEASE", "#d8e8f0", "#1a3040"),
    flyerTex("BAND", "SAT LATE", "#ff3dac", "#1a0810"),
    flyerTex("TIP BAR", "OR ELSE", "#c44b3c", "#f4ead0"),
    flyerTex("OUT", "OF ORDER", "#f0d080", "#3a2008"),
    flyerTex("HOUSE BOT", "SUCKS", "#2a2a30", "#3dfff2"),
    flyerTex("GOOD TIME", "ASK JAY", "#f4c4d4", "#4a1020"),
    flyerTex("FREE HJ", "STALL 1", "#f4ead0", "#8b2020"),
    flyerTex("DTF", "TEXT JAY", "#ff3dac", "#1a0810"),
  ];
  placeDecal(flyers[0], WX0 + 0.09, 1.7, -5.7, 0.42, 0.52, Math.PI / 2);
  placeDecal(flyers[1], WX0 + 0.09, 1.55, -3.95, 0.4, 0.5, Math.PI / 2);
  placeDecal(flyers[2], -8.28, 1.72, -6.05, 0.4, 0.5, -Math.PI / 2);
  placeDecal(flyers[3], -11.15, 1.85, MZ0 + 0.09, 0.44, 0.54, 0);
  placeDecal(flyers[8], WX0 + 0.09, 1.25, -6.15, 0.36, 0.46, Math.PI / 2);
  placeDecal(flyers[4], WX0 + 0.09, 1.65, 0.85, 0.42, 0.52, Math.PI / 2);
  placeDecal(flyers[5], WX0 + 0.09, 1.5, -0.25, 0.4, 0.5, Math.PI / 2);
  placeDecal(flyers[6], -8.28, 1.8, 0.95, 0.42, 0.52, -Math.PI / 2);
  placeDecal(flyers[7], -11.0, 1.9, WZ1 - 0.09, 0.44, 0.54, Math.PI);
  placeDecal(flyers[9], -9.4, 1.55, WZ1 - 0.09, 0.36, 0.46, Math.PI);

  graffiti("JAY", "#3dfff2", -11.7, 2.15, MZ0 + 0.09, 0, 2);
  graffiti("IP 4EVER", "#e8c547", -10.2, 2.18, MZ0 + 0.09, 0, 2);
  graffiti("POUR", "#e8c547", WX0 + 0.09, 2.18, -5.55, Math.PI / 2, 2);
  graffiti("WASTED", "#c41e3a", -8.28, 2.22, -4.55, -Math.PI / 2, 2);
  graffiti("FLUSH", "#2e6bff", WX0 + 0.09, 1.15, 0.55, Math.PI / 2, 2);
  graffiti("TITS", "#ff3dac", WX0 + 0.09, 2.15, -4.55, Math.PI / 2, 2);
  graffiti("555-0134", "#3dfff2", -8.28, 1.18, -5.35, -Math.PI / 2, 2);
  graffiti("SUCK IT", "#c41e3a", WX0 + 0.09, 2.12, 0.2, Math.PI / 2, 2);
  graffiti("IP", "#ff3dac", -9.35, 2.18, WZ1 - 0.09, Math.PI, 2);
  graffiti("DTF", "#ff3dac", -8.28, 2.2, 0.35, -Math.PI / 2, 2);
  graffiti("555-6969", "#e8c547", HX0 + 0.09, 1.55, -2.7, Math.PI / 2, 2);
  graffiti("CALL ME", "#ff3dac", HX0 + 0.09, 1.28, -2.35, Math.PI / 2, 2);
  graffiti("PISS HERE", "#3dfff2", WX0 + 0.09, 0.72, -4.7, Math.PI / 2, 1);
  graffiti("EAT ASS", "#c41e3a", -8.28, 0.95, 0.55, -Math.PI / 2, 2);
  graffiti("BLOWJOBS 5", "#e8c547", -10.7, 0.72, MZ0 + 0.09, 0, 1);
  graffiti("I LOVE PISS", "#ff3dac", -11.3, 0.7, WZ1 - 0.09, Math.PI, 1);
  placeDecal(scribbleTex(), -9.55, 1.28, MZ0 + 0.09, 0.46, 0.28, 0);
  placeDecal(scribbleTex(1), WX0 + 0.09, 0.95, -6.2, 0.36, 0.22, Math.PI / 2);
  placeDecal(scribbleTex(2), -8.28, 1.05, -0.05, 0.4, 0.24, -Math.PI / 2);
  placeDecal(scribbleTex(3), HX0 + 0.09, 1.85, -2.95, 0.36, 0.22, Math.PI / 2);
  placeDecal(flyerTex("BAND", "TONIGHT", "#3dfff2", "#081018"), -8.28, 1.35, 0.15, 0.36, 0.46, -Math.PI / 2);
  decal(crackTex(), WX0 + 0.09, 1.02, -5.85, 0.4, 0.4, Math.PI / 2);
  placeDecal(scribbleTex(), -10.12, 1.45, -2.7, 0.42, 0.24, Math.PI / 2);

  const wet = lambert(0x3a4038, { transparent: true, opacity: 0.22 });
  const stain = new THREE.Mesh(new THREE.CircleGeometry(0.28, 10), wet);
  stain.rotation.x = -Math.PI / 2;
  stain.position.set(-10.6, 0.02, -4.55);
  scene.add(stain);
  const stain2 = stain.clone();
  stain2.position.set(-10.15, 0.02, 0.15);
  stain2.scale.setScalar(0.7);
  scene.add(stain2);
  const stain3 = stain.clone();
  stain3.position.set(-9.2, 0.02, -2.7);
  stain3.scale.setScalar(0.45);
  scene.add(stain3);

  setPeeDrainFn((x, y, z) => {
    for (const toilet of toilets) {
      const b = toilet.userData.bowlWorld;
      if (!b) continue;
      const urinal = toilet.userData.kind === "urinal";
      const r = urinal ? 0.14 : (toilet.userData.drainR || 0.42);
      const top = urinal ? (b.y || 0.52) + 0.08 : (b.y || 0.5) + 0.42;
      if (Math.hypot(x - b.x, z - b.z) <= r && y <= top) return true;
    }
    for (const s of stallZones) {
      if (x >= s.minx && x <= s.maxx && z >= s.minz && z <= s.maxz && y < 0.16) return true;
    }
    return false;
  });
}

function toggleSwing(door) {
  setSwingDoor(door, !door?.userData?.open);
}

function setSwingDoor(door, open, silent, fromNet) {
  if (!door) return;
  const next = !!open;
  const changed = !!door.userData.open !== next;
  door.userData.open = next;
  const dir = door.userData.swingDir || 1;
  door.userData.want = next ? -1.85 * dir : 0;
  if (!silent && changed) audio.doorThump();
  if (!fromNet && !silent && changed && door.userData.sid) publishWorldBit(door.userData.sid, next);
}

function tickBathrooms(dt) {
  for (const door of swingDoors) {
    const diff = door.userData.want - door.userData.ang;
    if (Math.abs(diff) < 0.002) door.userData.ang = door.userData.want;
    else door.userData.ang += diff * Math.min(1, dt * 6.4);
    const hinge = door.userData.hinge;
    if (hinge) hinge.rotation.y = (hinge.userData.baseYaw || 0) + door.userData.ang;
  }
  for (const t of toilets) {
    if (t.userData.water && t.userData.bowlWorld) {
      t.updateMatrixWorld(true);
      t.userData.water.getWorldPosition(t.userData.bowlWorld);
    }
  }
  for (const s of sinks) {
    if (!s.userData.running) continue;
    const stream = s.userData.stream;
    const splash = s.userData.splash;
    if (stream) {
      stream.scale.y = 0.9 + Math.sin(tWorld * 28) * 0.08;
      stream.material.opacity = 0.42 + Math.sin(tWorld * 22) * 0.08;
    }
    if (splash) {
      const pulse = 0.85 + Math.sin(tWorld * 18) * 0.15;
      splash.scale.setScalar(pulse);
      splash.material.opacity = 0.28 + Math.sin(tWorld * 16) * 0.1;
    }
  }
  if (bathFlicker) {
    bathFlicker.intensity = 1.05 + Math.sin(tWorld * 9.2) * 0.08 + (Math.random() < 0.02 ? -0.35 : 0);
  }
}

function inBathroom(x, z) {
  return x < -8.05 && x > -12.7 && z > -6.85 && z < 1.5;
}

function glassCatchVolumes() {
  if (!glassMesh) return [];
  glassMesh.updateMatrixWorld(true);
  const dim = glassDims(glassState.type);
  const rim = new THREE.Vector3(0, dim.y + dim.h * 0.92, 0);
  glassMesh.localToWorld(rim);
  const s = glassMesh.scale.x || 1;
  const grounded = held !== glassMesh;
  const vols = [
    {
      x: rim.x,
      y: rim.y,
      z: rim.z,
      r: Math.max(0.2, dim.r * s * (grounded ? 5.4 : 3.6)),
      h: Math.max(0.28, dim.h * s * (grounded ? 4.2 : 2.4)),
    },
  ];
  if (!grounded) vols.push({ x: bodyPos.x, y: 1.02, z: bodyPos.z, r: 0.28, h: 0.48 });
  return vols;
}

function catchPeeInCup(amount) {
  if (!amount || glassState.fill >= 1) return 0;
  const before = glassState.fill;
  const add = pourIntoGlass(PISS, amount);
  if (add > 0 && before < 0.04) toast("cup catching piss");
  if (add > 0) hud();
  return add;
}

function peeTargetOf() {
  if (sitting?.kind === "toilet" && sitting.fixture?.userData?.bowlWorld) return sitting.fixture.userData.bowlWorld;
  const k = look?.userData?.kind;
  if ((k === "toilet" || k === "urinal") && look.userData.toilet?.userData?.bowlWorld) {
    return look.userData.toilet.userData.bowlWorld;
  }
  const yaw = viewMode === 2 ? view2Yaw : savedYaw;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  let bestCup = null;
  let bestCupD = 1.45;
  for (const c of heldCupWorlds()) {
    const dx = c.x - bodyPos.x;
    const dz = c.z - bodyPos.z;
    const d = Math.hypot(dx, dz);
    if (d > bestCupD) continue;
    const along = dx * fx + dz * fz;
    if (d > 0.55 && along < -0.12) continue;
    bestCupD = d;
    bestCup = c;
  }
  let best = null;
  let bestD = 1.25;
  for (const t of toilets) {
    const b = t.userData.bowlWorld;
    if (!b) continue;
    const d = Math.hypot(b.x - bodyPos.x, b.z - bodyPos.z);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  if (bestCup && (!best || bestCupD <= bestD + 0.2)) return bestCup;
  return best;
}

function sitHeight() {
  return sitting?.y || SIT_Y;
}

function lookDoorOpen(obj) {
  return Math.abs(obj?.userData.ang || 0) > 0.45;
}
function paintLiquid(mesh, col) {
  if (!mesh?.material) return;
  mesh.material.color.setHex(col);
  if (mesh.material.emissive) mesh.material.emissive.setHex(col);
}

function updateGlassVisual() {
  if (!glassMesh) return;
  const liq = glassMesh.userData.liq;
  if (!liq) return;
  const fill = THREE.MathUtils.clamp(glassState.fill, 0, 1);
  const meniscus = glassMesh.userData.meniscus;
  liq.visible = fill > 0.012;
  if (meniscus) meniscus.visible = liq.visible;
  if (!liq.visible) return;
  const spec = glassProfile(glassState.type);
  const f = Math.max(0.03, fill);
  const h = Math.max(0.006, spec.h * f);
  const rTop = spec.rb + (spec.rt - spec.rb) * f;
  if (liq.userData.dynGeo) liq.userData.dynGeo.dispose();
  const geo = new THREE.CylinderGeometry(rTop, spec.rb, h, 14);
  liq.geometry = geo;
  liq.userData.dynGeo = geo;
  liq.scale.set(1, 1, 1);
  liq.position.set(0, spec.y + h / 2, 0);
  const col = mixColor(glassState.parts);
  paintLiquid(liq, col);
  if (meniscus) {
    meniscus.scale.set(rTop, rTop, 1);
    meniscus.position.set(0, spec.y + h * 0.99, 0);
    paintLiquid(meniscus, col);
  }
  rememberGlass(glassMesh);
}

function setGlassType(type) {
  glassState.type = type;
  if (!glassMesh) return;
  const holding = held === glassMesh;
  const pos = glassMesh.position.clone();
  forgetLooseGlass(glassMesh);
  unregisterPick(glassMesh);
  if (glassMesh.parent) glassMesh.parent.remove(glassMesh);
  else scene.remove(glassMesh);
  if (holding) held = null;
  glassMesh = makeGlassMesh(type);
  glassMesh.userData.gtype = type;
  glassMesh.userData.gfill = glassState.fill;
  glassMesh.userData.gparts = glassState.parts.map((p) => ({ ...p }));
  if (holding) attachHeld(glassMesh);
  else {
    glassMesh.position.copy(pos);
    scene.add(glassMesh);
    registerPick(glassMesh);
    trackLooseGlass(glassMesh);
    audio.clink();
  }
  updateGlassVisual();
}

function glassCapacityOz(type) {
  return { shot: 1.5, rocks: 8, pint: 16, highball: 12, wine: 6, coupe: 5, can: 12 }[type] || 10;
}

function setPassoutMode(kind) {
  const title = $("passoutTitle");
  const cta = $("passoutCta");
  const box = $("passout");
  if (kind === "arrest") {
    if (title) title.textContent = "ARRESTED";
    if (cta) cta.textContent = "CLICK TO POST BAIL";
    box?.classList.add("arrest");
  } else {
    if (title) title.textContent = "YOU BLACKED OUT";
    if (cta) cta.textContent = "CLICK TO GET BACK UP";
    box?.classList.remove("arrest");
  }
}

function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  toastT = 2.6;
}

function heldLabel() {
  if (!held) return "";
  if (held.userData.kind === "baton") return "baton";
  if (held.userData.kind === "glass") return "cup";
  return held.userData.drink?.name || "";
}

function holdingBaton() {
  return held?.userData?.kind === "baton";
}

function takeHit(nx, nz, by) {
  const knock = applyKnock(camera.position.x, camera.position.z, nx, nz, collide, 0.28);
  lastKnock = { x: knock.dx, z: knock.dz };
  hurtFlash = 0.7;
  audio.hit();
  toast(by ? `${by} punched you` : "you got punched");
  if (sitting) standUp();
  if (inCar) {
    inCar.speed *= 0.32;
    inCar.drift += (Math.random() - 0.5) * 0.35;
  } else {
    knockVx += knock.vx;
    knockVz += knock.vz;
    if (onGround) {
      vy = Math.max(vy, 2.1);
      onGround = false;
    }
  }
  if (localPeer) localPeer.hurtT = 0.28;
}

function flash(text, kind = "win") {
  const el = $("winPop");
  if (!el) return;
  el.textContent = text;
  el.className = kind === "lose" ? "show lose" : kind === "back" ? "show back" : "show";
  winPopT = kind === "back" ? 1.8 : 3.2;
}

function penaltyDrink(msg, oz = 1.1) {
  bac += (5 / 40) * (oz / 1.2) * 0.028;
  bumpDrink();
  pours += 1;
  score += drinkScore(5, oz);
  audio.gulp("sip");
  toast(msg);
  hud();
  maybePassOut();
}

function onToilet() {
  return sitting?.kind === "toilet";
}

function sitOn(spot) {
  if (!spot || inCar) return;
  sitting = {
    x: spot.x,
    z: spot.z,
    y: spot.y || SIT_Y,
    yaw: spot.yaw,
    kind: spot.kind || "stool",
    fixture: spot.fixture || null,
    standX: spot.standX ?? spot.x,
    standZ: spot.standZ ?? spot.z + 0.12,
  };
  vy = 0;
  onGround = true;
  standY = 0;
  camera.position.set(sitting.x, sitting.y, sitting.z);
  bodyPos.set(sitting.x, sitting.y, sitting.z);
  if (sitting.kind === "toilet" && sitting.yaw != null) {
    const camYaw = sitting.yaw + Math.PI;
    savedYaw = camYaw;
    view2Yaw = camYaw;
    camera.rotation.order = "YXZ";
    camera.rotation.y = camYaw;
    pantsStart = tWorld;
  }
  audio.sit();
  pokePose();
}

function standUp() {
  if (!sitting) return;
  const onToilet = sitting.kind === "toilet";
  const wasPee = peeing;
  const x = sitting.standX ?? sitting.x;
  const z = sitting.standZ ?? sitting.z + 0.12;
  const [nx, nz] = collide(x, z, 0.28);
  camera.position.set(nx, eyeY(), nz);
  bodyPos.set(nx, eyeY(), nz);
  sitting = null;
  onGround = true;
  vy = 0;
  standY = 0;
  if (wasPee && onToilet) {
    peeing = false;
    peeUntil = 0;
    audio.peeStop();
    audio.flush();
  } else if (localGender === "f" && wasPee) {
    peeing = false;
    peeUntil = 0;
    audio.peeStop();
  }
  audio.stand();
  pokePose();
}

function playing() {
  return started && !summonOpen && !chatOpen && !passedOut;
}

function drunkWord(d) {
  if (d < 0.1) return "";
  if (d < 0.28) return "buzzed";
  if (d < 0.48) return "tipsy";
  if (d < 0.7) return "drunk";
  if (d < 0.95) return "wasted";
  if (d < 2.2) return "blackout";
  if (d < 4.0) return "wrecked";
  return "gone";
}

function hud() {
  $("score").textContent = String(score);
  $("pours").textContent = String(pours);
  $("bacFill").style.width = `${THREE.MathUtils.clamp(bac / PASS_OUT, 0, 1) * 100}%`;
  const fillEl = $("glassFill");
  const fillAmt = THREE.MathUtils.clamp(glassState.fill, 0, 1);
  const fillPct = Math.round(fillAmt * 100);
  fillEl.style.width = `${fillPct}%`;
  if (fillAmt > 0.012) {
    const hex = mixColor(glassState.parts).toString(16).padStart(6, "0");
    const r = parseInt(hex.slice(0, 2), 16);
    const gcol = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const dhex = [r, gcol, b].map((v) => Math.max(0, (v * 0.72) | 0).toString(16).padStart(2, "0")).join("");
    fillEl.style.background = `repeating-linear-gradient(90deg, #${hex} 0 8px, #${dhex} 8px 10px)`;
  } else {
    fillEl.style.background = "";
  }
  if (glassState.fill < 0.02) $("glassName").textContent = `empty ${glassState.type}`;
  else {
    const n = nameMix(glassState.parts);
    const a = mixAbv(glassState.parts).toFixed(1);
    $("glassName").textContent = `${n} · ${a}% · ${fillPct}% full`;
  }
  if (held && held.userData.kind === "glass") {
    const n = glassState.fill > 0.02 ? nameMix(glassState.parts) : `empty ${glassState.type}`;
    $("heldName").textContent = n;
    $("heldMeta").textContent = `cup in hand · ${glassState.type} · ${fillPct}% · Q set down`;
  } else if (held && held.userData.kind === "baton") {
    $("heldName").textContent = "baton";
    $("heldMeta").textContent = "3 damage · click swing · Q set down";
  } else if (held && held.userData.drink) {
    $("heldName").textContent = held.userData.drink.name;
    $("heldMeta").textContent = `${held.userData.drink.type} · ${held.userData.drink.abv}% ABV · ${Math.round(held.userData.volume * 100)}% left`;
  } else {
    $("heldName").textContent = "empty hands";
    $("heldMeta").textContent = "E grab a cup from the right stacks · Y summon · T chat";
  }
  const d = drunkLevel();
  $("vignette").style.filter = `hue-rotate(${Math.min(180, d * 40)}deg) saturate(${1 + Math.min(4, d)})`;
  $("vignette").style.background = `radial-gradient(ellipse at center, transparent ${Math.max(6, 50 - d * 12)}%, rgba(${Math.min(220, 40 + d * 40)}, 8, 20, ${Math.min(0.92, 0.45 + d * 0.12)}) 100%)`;
  $("lookHint").classList.toggle("show", started && !controls.isLocked && !summonOpen && !chatOpen && !passedOut);
  const list = $("onlineList");
  if (list) {
    const people = roster();
    const st = netStatus();
    const rows = people.map((p) => {
      const who = p.you ? `> ${p.name} (you)` : p.bot ? `${p.name} (bot)` : p.name;
      const buzz = drunkWord(p.drunk || 0);
      return { who, buzz, you: !!p.you, drunk: p.drunk || 0 };
    });
    const link = st === "online" ? "live" : st === "connecting" ? "linking..." : "solo";
    const text = `${rows.map((r) => (r.buzz ? `${r.who} · ${r.buzz}` : r.who)).join("\n")}\n${people.length} on shift · ${link}`;
    if (list.dataset.snap !== text) {
      list.dataset.snap = text;
      list.replaceChildren();
      rows.forEach((row) => {
        const d = document.createElement("div");
        const cls = ["row"];
        if (row.you) cls.push("you");
        if (row.drunk > 0.45) cls.push("wasted");
        if (row.buzz === "blackout") cls.push("ko");
        d.className = cls.join(" ");
        const who = document.createElement("span");
        who.className = "who";
        who.textContent = row.who;
        d.appendChild(who);
        if (row.buzz) {
          const buzz = document.createElement("span");
          buzz.className = "buzz";
          buzz.textContent = row.buzz;
          d.appendChild(buzz);
        }
        list.appendChild(d);
      });
      const n = document.createElement("div");
      n.className = "net";
      n.textContent = `${people.length} on shift · ${link}`;
      list.appendChild(n);
    }
  }
  const gameBox = $("game");
  const gameText = $("gameText");
  if (gameBox && gameText) {
    const line = houseGames?.hudText() || "";
    gameBox.classList.toggle("hidden", !line);
    if (line && gameText.textContent !== line) gameText.textContent = line;
  }
}

function promptFrom(obj) {
  if (inCar) {
    if (!driving()) {
      if (wanted) return "riding along · E get out · lose the cops";
      return "riding along · mouse look · E get out · F/G drink · 1/2/3 camera";
    }
    if (wanted) return "WASD drive · mouse orbit · SHIFT drift · E get out · lose the cops";
    return "WASD drive · mouse orbit · SHIFT drift · E get out · 1 hood · 2 oncoming · 3 chase · F/G drink · H cab home";
  }
  if (wanted) {
    if (obj?.userData?.kind === "baton") return "E grab baton · click punch";
    const near = nearestCar(3.4);
    const stand = standCarPrompt(near);
    if (stand) return stand;
    if (stunT > 0) {
      if (near?.cop && copsInCar(near)) return "stunned · cops are still in the car · click punch";
      if (near?.cop) return "stunned · E steal the cop car · click punch to keep them back";
      if (near) return "stunned · E get in · click punch to keep them back";
      return "stunned · cops inbound · click punch to keep them back";
    }
    if (near?.cop && copsInCar(near)) return "cops are in it · punch them out first · SPACE onto the hood or trunk";
    if (near?.cop) return "E steal the cop car · SPACE onto the hood or trunk · click punch";
    if (near) return "E get in · SPACE onto the hood or trunk · click punch";
    return "cops on you · click punch · RUN · E still gets you in a car";
  }
  if (sitting) {
    if (sitting.kind === "toilet") {
      return "toilet · pants down · E stand · P pee";
    }
    return houseGames?.prompt(obj) || "stool. WASD or E stand · F sip · G chug";
  }
  if (inCar) return "WASD drive · mouse orbit · SHIFT drift · E get out · 1 hood · 2 oncoming · 3 chase · F/G drink · H cab home";
  if (!obj) {
    const gamePrompt = houseGames?.prompt(null) || "";
    if (gamePrompt) return gamePrompt;
    const car = nearestCar(3.4);
    if (car) {
      const stand = standCarPrompt(car);
      if (stand) return stand;
      return carRideHint(car);
    }
    if (held && held.userData.kind === "glass") {
      return glassState.fill > 0.02 ? "F sip  ·  G chug  ·  Q set down" : "cup in hand  ·  hold it in a stream  ·  Q set down";
    }
    if (held && held.userData.kind === "baton") return "baton · click swing · Q set down";
    if (inBathroom(camera.position.x, camera.position.z)) {
      return localGender === "f" ? "restrooms · E sit · P pee on the toilet" : "restrooms · E sit or open doors · P pee";
    }
    if (!insideBar(camera.position.x, camera.position.z)) return "H cab back to the bar · patio games to the left · restrooms behind the left wall";
    return started && !controls.isLocked ? "click the bar to capture mouse" : "";
  }
  const k = obj.userData.kind;
  const drink = obj.userData.drink;
  if (k === "bottle" && drink) {
    if (held && held.userData.kind === "glass") return `E pour  ${drink.name}  into cup`;
    return `E grab  ${drink.name}`;
  }
  if (k === "baton") {
    if (held && held.userData.kind === "baton") return "baton in hand · click swing · Q set down";
    return "E grab baton";
  }
  if (k === "cupstack") {
    const n = cupStacks[obj.userData.stack] || 0;
    if (!n) return cupStacks.some((c) => c > 0) ? "E grab a cup from the other stack" : "stacks empty · restock the bar";
    return `E grab a cup · ${n} left in this stack`;
  }
  if (k === "glass") {
    if (held && held.userData.kind === "bottle") return `click pour  ${held.userData.drink.name}  ·  E grab cup`;
    if (held && held.userData.kind === "glass") {
      if (glassState.fill > 0.02) return "F sip  ·  G chug  ·  Q set down";
      return "cup in hand  ·  hold it in a stream  ·  4–9 swap  ·  Q set down";
    }
    if (glassState.fill > 0.02) return "E grab cup  ·  F sip  ·  G chug";
    return "E grab cup  ·  4–9 glassware";
  }
  if (k === "tap") return `E tap  ${drink.name}`;
  if (k === "toilet") return localGender === "f" ? "E sit · pants come off · then P pee" : "E sit · pants come off";
  if (k === "urinal") return localGender === "f" ? "girls sit on the toilet" : "P to pee";
  if (k === "restroomDoor") return lookDoorOpen(obj) ? "E close the restroom door" : "E open the restroom door";
  if (k === "stallDoor") return lookDoorOpen(obj) ? "E close the stall" : "E open the stall";
  if (k === "register" || k === "hatch") return "E / Y  summon any drink";
  if (k === "sink") return "E dump glass";
  if (k === "bathSink") return obj.userData.sink?.userData.running ? "E turn the sink off" : "E turn the sink on";
  if (k === "juke") return audio.juke ? "E silence the juke" : "E fire up the juke";
  if (k === "door") return frontDoorOpen ? "E close the front door" : "E open the front door";
  if (k === "copcar") {
    const car = obj.userData.car;
    const stand = standCarPrompt(car);
    if (stand) return stand;
    if (copsInCar(car)) return "cops are in it · punch them out first · SPACE onto the hood or trunk";
    return carOccupants(car).has(0) ? "E hop in · SPACE onto the hood or trunk · click punch" : "E steal the cop car · SPACE onto the hood or trunk · click punch";
  }
  if (k === "car") {
    if (inCar) return driving() ? "E get out · SHIFT drift" : "E get out";
    return standCarPrompt(obj.userData.car) || carRideHint(obj.userData.car);
  }
  if (k === "stool") return sitting ? "E or WASD stand up" : "E sit at the bar";
  const gamePrompt = houseGames?.prompt(look) || "";
  if (gamePrompt) return gamePrompt;
  if (inCar) return "WASD drive · mouse orbit · SHIFT drift · E get out · 1 hood · 2 oncoming · 3 chase · F/G drink · H cab home";
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

function isLocalHit(obj) {
  const rig = localPeer?.rig;
  if (!rig) return false;
  let o = obj;
  while (o) {
    if (o === rig) return true;
    o = o.parent;
  }
  return false;
}

function facingYaw() {
  if (inCar) return savedYaw;
  return viewMode === 2 ? view2Yaw : camera.rotation.y;
}

function facingPitch() {
  if (inCar) return savedPitch;
  return viewMode === 2 ? view2Pitch : camera.rotation.x;
}

function pickReach(kind) {
  const extra = houseGames?.pickRange(kind) || 0;
  const base = kind === "car" ? 5.4 : extra || 3.4;
  return viewMode === 1 ? base : base + 1.2;
}

function pickFromRay(origin, dir) {
  raycaster.set(origin, dir);
  raycaster.near = 0.02;
  raycaster.far = 14;
  const hits = raycaster.intersectObjects(pickables, true);
  for (const h of hits) {
    if (isLocalHit(h.object)) continue;
    const root = findRoot(h);
    if (!root || (held && root === held)) continue;
    const kind = root.userData?.kind || "";
    const dist = Math.hypot(h.point.x - bodyPos.x, h.point.z - bodyPos.z);
    if (dist > pickReach(kind)) continue;
    return { root, distance: dist, point: h.point };
  }
  return null;
}

function nearbyUse() {
  const yaw = facingYaw();
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const reach = viewMode === 1 ? 1.9 : 2.8;
  let best = null;
  for (const obj of pickables) {
    const root = obj.userData?.root || obj;
    const kind = root.userData?.kind;
    if (!NEAR_USE.has(kind)) continue;
    if (held && root === held) continue;
    root.getWorldPosition(_pickWorld);
    const dx = _pickWorld.x - bodyPos.x;
    const dz = _pickWorld.z - bodyPos.z;
    const dist = Math.hypot(dx, dz);
    const max = kind === "car" ? 3.6 : kind === "door" || kind === "restroomDoor" || kind === "stallDoor" ? 2.8 : reach;
    if (dist > max) continue;
    const forward = dist < 0.15 ? 1 : (dx * fx + dz * fz) / dist;
    if (kind !== "door" && kind !== "car" && kind !== "stool" && kind !== "restroomDoor" && kind !== "stallDoor" && kind !== "toilet" && kind !== "urinal" && kind !== "bathSink" && kind !== "darts" && forward < -0.25) continue;
    const score = dist - Math.max(0, forward) * 0.9 - (kind === "door" ? 0.4 : 0);
    if (!best || score < best.score) best = { root, distance: dist, point: _pickWorld.clone(), score };
  }
  return best;
}

function pick() {
  const yaw = facingYaw();
  const pit = facingPitch();
  const cp = Math.cos(pit);
  _pickOrigin.copy(bodyPos);
  _pickDir.set(-Math.sin(yaw) * cp, Math.sin(pit), -Math.cos(yaw) * cp);
  if (_pickDir.lengthSq() < 1e-8) _pickDir.set(0, 0, -1);
  else _pickDir.normalize();
  const fromBody = pickFromRay(_pickOrigin, _pickDir);
  if (fromBody) return fromBody;

  if (viewMode === 2 || viewMode === 3) {
    const useYaw = yaw;
    const p = THREE.MathUtils.clamp(pit, -1.35, 1.35);
    const cp2 = Math.cos(p);
    const sp2 = Math.sin(p);
    _pickOrigin.copy(camera.position);
    _pickDir.set(-Math.sin(useYaw) * cp2, sp2, -Math.cos(useYaw) * cp2).normalize();
    const fromCam = pickFromRay(_pickOrigin, _pickDir);
    if (fromCam) return fromCam;
  }

  if (viewMode === 1) {
    raycaster.setFromCamera(ndc, camera);
    raycaster.near = 0;
    raycaster.far = 8;
    const hits = raycaster.intersectObjects(pickables, true);
    for (const h of hits) {
      if (isLocalHit(h.object)) continue;
      const root = findRoot(h);
      if (!root || (held && root === held)) continue;
      const kind = root.userData?.kind || "";
      if (h.distance > pickReach(kind)) continue;
      return { root, distance: h.distance, point: h.point };
    }
    return null;
  }

  return nearbyUse();
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
  glassMesh.position.set(3.26, 1.05, WELL_Z + 0.24);
  glassMesh.rotation.set(0, 0, 0);
  scene.add(glassMesh);
  unregisterPick(glassMesh);
  registerPick(glassMesh);
  trackLooseGlass(glassMesh);
  updateGlassVisual();
}

function attachHeld(obj) {
  if (!obj || obj === held) return;
  if (held) dropHeld();
  unregisterPick(obj);
  if (obj.parent) obj.parent.remove(obj);
  if (obj.userData.kind === "glass") {
    if (glassMesh && glassMesh !== obj) rememberGlass(glassMesh);
    forgetLooseGlass(obj);
    seatHeldGlass(obj);
    rightHand.userData.grip.add(obj);
    held = obj;
    glassMesh = obj;
    loadGlass(obj);
    setRightGrip(true);
    poseHands();
    updateGlassVisual();
    hud();
    pokePose();
    audio.clink();
    return;
  }
  if (obj.userData.kind === "baton") {
    obj.scale.setScalar(0.82);
    obj.position.set(0.02, -0.1, 0.04);
    obj.rotation.set(0.95, 0.12, 0.22);
    rightHand.userData.grip.add(obj);
    held = obj;
    setRightGrip(true);
    poseHands();
    pokePose();
    audio.clink();
    return;
  }
  const kind = obj.userData.drink?.bottle || "spirit";
  const y = kind === "can" ? 0.08 : kind === "wine" ? -0.09 : kind === "beer" ? -0.06 : -0.07;
  obj.scale.setScalar(kind === "can" ? 0.92 : 0.72);
  obj.position.set(kind === "can" ? 0.012 : 0, y, kind === "can" ? 0.03 : 0.01);
  obj.rotation.set(kind === "can" ? 0.04 : 0.12, kind === "can" ? 0.08 : 0.4, kind === "can" ? 0.04 : 0.08);
  rightHand.userData.grip.add(obj);
  held = obj;
  setRightGrip(true);
  poseHands();
  audio.clink();
  if (kind === "can") audio.canOpen();
}

function dropHeld() {
  if (!held) return;
  const obj = held;
  detachHeld();
  held = null;
  setRightGrip(false);
  audio.drop(obj.userData.kind);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const p = camera.position.clone().add(dir.multiplyScalar(0.75));
  const nearWell = Math.abs(p.z - WELL_Z) < 0.9 && Math.abs(p.x) < 3.6;
  if (obj.userData.kind === "glass") {
    rememberGlass(obj);
    obj.scale.setScalar(1.35);
    if (nearWell) {
      obj.position.set(3.26, 1.05, WELL_Z + 0.24);
    } else {
      p.y = Math.abs(p.z - 0.35) < 1.1 && Math.abs(p.x) < 4.6 ? 1.09 : 0.02;
      obj.position.copy(p);
    }
    obj.rotation.set(0, 0, 0);
    scene.add(obj);
    registerPick(obj);
    glassMesh = obj;
    trackLooseGlass(obj);
    poseHands();
    return;
  }
  if (obj.userData.kind === "baton") {
    obj.scale.setScalar(1);
    p.y = 0.03;
    obj.position.copy(p);
    obj.rotation.set(Math.PI / 2, camera.rotation.y, 0.12);
    scene.add(obj);
    registerPick(obj);
    poseHands();
    pokePose();
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
  audio.empty();
  if (empty.userData.stock) {
    const home = empty.userData.home;
    empty.scale.setScalar(1.75);
    empty.position.set(home.x, home.y, home.z);
    empty.rotation.set(0, home.rot, 0);
    empty.userData.volume = 1;
    scene.add(empty);
    registerPick(empty);
  } else {
    const i = bottles.indexOf(empty);
    if (i >= 0) bottles.splice(i, 1);
    unregisterPick(empty);
  }
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
  hud();
  pokePose();
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
}

function paintCats() {
  const wrap = $("cats");
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map(
    (c) => `<button type="button" data-cat="${c.id}" class="${c.id === summonCat ? "on" : ""}">${c.label}</button>`
  ).join("");
}

function chatColor(name) {
  let h = 0;
  for (const ch of String(name || "")) h = (h * 33 + ch.charCodeAt(0)) | 0;
  return CHAT_COLORS[Math.abs(h) % CHAT_COLORS.length];
}

function cleanChatName(s) {
  return String(s || "regular").replace(/[^\w \-'.]/g, "").replace(/\s+/g, " ").trim().slice(0, 16) || "regular";
}

function cleanChatText(s) {
  return String(s || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function escChat(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function neighborKey(ch) {
  const lower = ch.toLowerCase();
  if (!/[a-z]/.test(lower)) return ch;
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  for (let r = 0; r < rows.length; r++) {
    const i = rows[r].indexOf(lower);
    if (i < 0) continue;
    const opts = [];
    for (const [dr, dc] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const row = rows[r + dr];
      if (!row) continue;
      const n = row[i + dc];
      if (n && /[a-z]/.test(n)) opts.push(n);
    }
    if (!opts.length) return ch;
    const pick = opts[(Math.random() * opts.length) | 0];
    return ch !== lower ? pick.toUpperCase() : pick;
  }
  return ch;
}

function drunkTypeChar(ch) {
  if (!/[a-zA-Z]/.test(ch)) return ch;
  const d = drunkLevel();
  const chance = THREE.MathUtils.clamp((d - 0.42) / 8.5, 0, 0.24);
  if (Math.random() >= chance) return ch;
  return neighborKey(ch);
}

function insertChatChar(ch) {
  const box = $("chatQ");
  if (!box) return;
  const start = box.selectionStart ?? box.value.length;
  const end = box.selectionEnd ?? box.value.length;
  const next = (box.value.slice(0, start) + ch + box.value.slice(end)).slice(0, 120);
  box.value = next;
  const caret = Math.min(120, start + ch.length);
  box.setSelectionRange(caret, caret);
}

function paintChat() {
  const log = $("chatLog");
  if (!log) return;
  const now = performance.now();
  const lines = chatOpen
    ? chatLines.slice(-80)
    : chatLines.filter((line) => now - line.t < 12500).slice(-12);
  log.innerHTML = lines
    .map((line) => {
      const age = now - line.t;
      const fade = !chatOpen && age > 10000;
      const gone = !chatOpen && age > 12500;
      const cls = [fade ? "fade" : "", gone ? "gone" : ""].filter(Boolean).join(" ");
      return `<li class="${cls}"><span class="who" style="color:${chatColor(line.name)}">&lt;${escChat(line.name)}&gt;</span> ${escChat(line.text)}</li>`;
    })
    .join("");
  log.scrollTop = log.scrollHeight;
}

function addChat(name, text, you) {
  const who = cleanChatName(name);
  const msg = cleanChatText(text);
  if (!msg) return;
  chatLines.push({ name: who, text: msg, you: !!you, t: performance.now() });
  if (chatLines.length > 80) chatLines.shift();
  paintChat();
  audio.chat();
}

function openChat() {
  if (!started || passedOut || summonOpen || chatOpen) return;
  chatOpen = true;
  chatOpenedBy = "t";
  for (const k of Object.keys(keys)) keys[k] = false;
  $("chat").classList.add("open");
  $("chatQ").value = "";
  if (controls.isLocked) controls.unlock();
  paintChat();
  const onUp = (ev) => {
    if (!chatOpenedBy || ev.code === "KeyT" || ev.key.toLowerCase() === "t") {
      window.removeEventListener("keyup", onUp, true);
      $("chatQ").focus();
      setTimeout(() => {
        chatOpenedBy = null;
      }, 30);
    }
  };
  window.addEventListener("keyup", onUp, true);
  setTimeout(() => {
    $("chatQ")?.focus();
    chatOpenedBy = null;
  }, 120);
}

function closeChat(relock = true) {
  if (!chatOpen && !$("chat")?.classList.contains("open")) {
    chatOpenedBy = null;
    return;
  }
  chatOpen = false;
  chatOpenedBy = null;
  const box = $("chatQ");
  if (box) {
    box.value = "";
    box.blur();
  }
  $("chat")?.classList.remove("open");
  paintChat();
  if (relock && started && !passedOut && !summonOpen) {
    try {
      controls.lock();
    } catch {
      /* pointer lock is optional */
    }
  }
}

function sendChat() {
  const text = cleanChatText($("chatQ")?.value || "");
  closeChat(true);
  if (!text) return;
  addChat(playerName(), text, true);
  publishEvent({ t: "chat", n: playerName(), m: text });
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
  audio.summonOpen();
  $("summon").classList.add("open");
  if (controls.isLocked) controls.unlock();
  $("q").value = "";
  $("q").blur();
  paintCats();
  renderResults("");
  const onUp = (ev) => {
    if (!summonOpenedBy || ev.key.toLowerCase() === summonOpenedBy || ev.code === "KeyE" || ev.code === "KeyY") {
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
  audio.summonClose();
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

function drinkScore(abv, oz) {
  const strength = Math.max(0, Number(abv) || 0) / 5;
  const pour = Math.max(0, Number(oz) || 0) / 1.2;
  return Math.max(1, Math.round(strength * pour * 3));
}

function uniqueScore(abv) {
  return Math.max(6, Math.round((Number(abv) || 0) * 1.6));
}

function bottleCapOz(drink) {
  return drink?.bottle === "can" || drink?.bottle === "beer" ? 12 : 25;
}

function heldServingOz(drink, kind, volume) {
  const cap = bottleCapOz(drink);
  const left = Math.max(0, (Number(volume) || 0) * cap);
  if (kind === "chug") return left;
  const bottle = drink?.bottle;
  if (bottle === "can" || bottle === "beer") return left;
  if (bottle === "wine") return Math.min(left, 5);
  return Math.min(left, 1.5);
}

function drinksIrl(abv, oz) {
  return Math.max(0, (Number(abv) || 0) * (Number(oz) || 0) / 60);
}

function addPours(abv, oz) {
  pourBank += drinksIrl(abv, oz);
  const n = Math.floor(pourBank + 1e-9);
  if (n > 0) {
    pours += n;
    pourBank -= n;
  }
}

function bumpDrink() {
  bacWait = BAC_HOLD;
  bacSoberT = 0;
  bacDecayFrom = 0;
  bacHoldUntil = tWorld + BAC_HOLD;
  bacDecayStart = 0;
  sipT = 0.38;
}

function drinkGlass(kind) {
  if (glassState.fill < 0.02) return;
  const cap = glassCapacityOz(glassState.type);
  const left = glassState.fill * cap;
  const oz = kind === "chug" || glassState.type === "shot" ? left : Math.min(left, cap * sipAmount(kind));
  const frac = cap > 0 ? oz / cap : glassState.fill;
  const share = peeShareOf(glassState.parts);
  const abv = mixAbv(glassState.parts);
  const name = nameMix(glassState.parts);
  const alcOz = oz * (1 - share);
  const peeDrinks = frac * share;
  if (share > 0.02 && !drankPiss) {
    drankPiss = true;
    toast("you drank piss");
  }
  if (alcOz > 0.01) {
    bac += (abv / 40) * (alcOz / 1.2) * 0.028;
    bumpDrink();
    score += drinkScore(abv, alcOz);
    addPours(abv, alcOz);
  } else {
    sipT = 0.38;
  }
  if (peeDrinks > 0) purgeBac(peeDrinks);
  glassState.fill = Math.max(0, glassState.fill - frac);
  if (glassState.fill < 0.03) {
    glassState.fill = 0;
    if (share < 0.85 && name && !unique.has(name)) {
      unique.add(name);
      score += uniqueScore(abv);
    }
    glassState.parts = [];
  }
  updateGlassVisual();
  audio.gulp(kind);
  hud();
  maybePassOut();
}

function drinkHeld(kind) {
  if (!held) return;
  const drink = held.userData.drink;
  const cap = bottleCapOz(drink);
  const oz = heldServingOz(drink, kind, held.userData.volume);
  const frac = cap > 0 ? oz / cap : held.userData.volume;
  if (/piss/i.test(drink.name || "")) {
    if (!drankPiss) {
      drankPiss = true;
      toast("you drank piss");
    }
    purgeBac(frac);
    sipT = 0.38;
  } else {
    bac += (drink.abv / 40) * (oz / 1.2) * 0.028;
    bumpDrink();
    score += drinkScore(drink.abv, oz);
    addPours(drink.abv, oz);
  }
  held.userData.volume = Math.max(0, held.userData.volume - frac);
  if (kind === "chug" || held.userData.volume <= 0.02) {
    if (!/piss/i.test(drink.name || "") && !unique.has(drink.name)) {
      unique.add(drink.name);
      score += uniqueScore(drink.abv);
    }
    dumpHeldEmpty();
  }
  audio.gulp(kind);
  hud();
  maybePassOut();
}

function maybePassOut() {
  if (bac < PASS_OUT || passedOut) return;
  passedOut = true;
  if (controls.isLocked) controls.unlock();
  audio.pourStop();
  audio.peeStop();
  audio.sinkStop();
  audio.passout();
  setPassoutMode("blackout");
  $("passoutStats").textContent = `score ${score}  ·  ${pours} pours  ·  ${unique.size} unique  ·  peak bac ${bac.toFixed(3)}`;
  $("passout").classList.add("open");
  closeChat(false);
  if (inCar) exitCar(true);
  resetShift();
}

function startShift() {
  started = true;
  audio.boot();
  const ident = loadIdentity();
  const name = ($("playerName")?.value || ident.name).trim();
  const room = ($("barCode")?.value || ident.room).trim();
  const genderBtn = document.querySelector(".gender-picks button.on");
  localGender = genderBtn?.dataset.g === "f" || (!genderBtn && ident.gender === "f") ? "f" : "m";
  camera.position.y = eyeY();
  bodyPos.y = eyeY();
  bootMultiplayer({
    scene,
    camera,
    blitText,
    toast,
    name,
    room,
    gender: localGender,
    collide,
    onRestock(by) {
      restockDrinks(true);
      audio.restock();
      toast(`${by} restocked the bar`);
    },
  });
  setLocalHitHandler((nx, nz, by) => {
    takeHit(nx, nz, by);
  });
  setPeeCupHooks(glassCatchVolumes, (amt) => (peeing ? 0 : catchPeeInCup(amt)));
  setPoseSources(
    () => heldLabel(),
    () => pouring,
    () => drunkLevel(),
    () => ({
      x: bodyPos.x,
      y: sitting ? sitHeight() : bodyPos.y,
      z: bodyPos.z,
      yaw: (inCar ? inCar.yaw : viewMode === 2 ? view2Yaw : savedYaw) + Math.PI,
      pit: viewMode === 2 ? view2Pitch : savedPitch,
      s: sitting ? 1 : 0,
      u: peeing ? 1 : 0,
      pn: onToilet() ? 1 : 0,
      g: localGender,
      gf: glassState.fill,
      gc: glassState.fill > 0.02 ? mixColor(glassState.parts) : 0,
      k: punchT > 0.02 ? 1 : 0,
      aimx: punchAim().fx,
      aimz: punchAim().fz,
      ...(inCar
        ? {
            v: 1,
            ci: inCar.nid,
            si: carSeatI,
            ...(carSeatI === 0
              ? {
                  cx: inCar.x,
                  cz: inCar.z,
                  cy: inCar.yaw,
                  cs: inCar.speed,
                  cf: inCar.drift || 0,
                }
              : {}),
            cp: inCar.cop ? 1 : 0,
          }
        : {}),
      w: wanted ? 1 : 0,
      ...(peeing && peeTargetOf()
        ? { ax: peeTargetOf().x, ay: peeTargetOf().y, az: peeTargetOf().z }
        : {}),
    })
  );
  setGameHandler((msg) => {
    if (msg?.t === "cupfill") {
      const to = String(msg.to || "");
      if (to && to !== String(localId() || "")) return;
      catchPeeInCup(Number(msg.a) || 0.03);
      return;
    }
    if (msg?.t === "cops") {
      applyRemoteCops(msg);
      return;
    }
    if (msg?.t === "world") {
      applyWorld(msg);
      return;
    }
    if (msg?.t === "chat") {
      addChat(msg.n || "regular", msg.m || "");
      return;
    }
    if (msg?.t === "cups") {
      applyCupStacks(msg.a);
      return;
    }
    houseGames?.onNet(msg);
  });
  setCarHandler(applyRemoteCar);
  setCopHandler(applyRemoteCops);
  ensureLocalAvatar();
  bindLocalHands();
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
  $("passout").classList.remove("open", "arrest");
  setPassoutMode("blackout");
  resetShift();
  controls.lock();
}

function useLook() {
  if (!look) return;
  const k = look.userData.kind;
  if (k === "bottle") {
    if (held && held.userData.kind === "glass") {
      const add = pourIntoGlass(look.userData.drink, 0.12);
      if (add) audio.clink();
      else toast("cup is full");
      return;
    }
    attachHeld(look);
  } else if (k === "cupstack") {
    grabCupFromStack(look.userData.stack);
  } else if (k === "glass") {
    if (held && held.userData.kind === "bottle") return;
    attachHeld(look);
  } else if (k === "baton") {
    attachHeld(look);
  }
  else if (k === "tap" && look.userData.drink) {
    const add = pourIntoGlass(look.userData.drink, 0.12);
    if (add) audio.clink();
    else toast("glass is full");
  } else if (k === "register" || k === "hatch") openSummon("e");
  else if (k === "sink") {
    glassState.fill = 0;
    glassState.parts = [];
    updateGlassVisual();
    audio.splash();
  } else if (k === "bathSink") {
    toggleBathSink(look.userData.sink || look);
  } else if (k === "juke") {
    setJuke(!audio.juke);
  } else if (k === "door") {
    setFrontDoor(frontDoorOpen ? false : true);
  } else if (k === "car") enterCar(look.userData.car);
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


function nearestCar(max = 3.4) {
  let best = null;
  let bestD = max;
  for (const car of cars) {
    if (car === inCar) continue;
    const d = Math.hypot(car.x - camera.position.x, car.z - camera.position.z);
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}

function ensureLocalAvatar() {
  if (!playerName) return;
  const gender = localGender === "f" ? "f" : "m";
  const sid = shirtKey();
  if (localPeer) {
    if (localPeer.gender !== gender) {
      localPeer.rig.userData.disposeFx?.();
      scene.remove(localPeer.rig);
      localPeer = null;
    } else {
      if (localPeer.id !== sid) localPeer.id = sid;
      localPeer.name = playerName();
      const hex = shirtColor(sid);
      if (localPeer.rig?.userData?.shirt) localPeer.rig.userData.shirt.color.setHex(hex);
      return;
    }
  }
  try {
    const rig = makeAvatar(sid, playerName(), gender);
    rig.visible = false;
    scene.add(rig);
    localPeer = {
      id: sid,
      name: playerName(),
      gender,
      rig,
      tx: camera.position.x,
      tz: camera.position.z,
      ty: camera.position.y,
      tyaw: 0,
      tpit: 0,
      pit: 0,
      bac: 0,
      held: "",
      gf: 0,
      gc: 0,
      pouring: false,
      last: performance.now(),
      phase: 1.7,
      lx: camera.position.x,
      lz: camera.position.z,
      local: true,
      sit: false,
      pee: false,
      freezeFacing: false,
      freezeHead: false,
      hyaw: 0,
      byaw: 0,
      bodyLock: null,
    };
    bindLocalHands();
  } catch (err) {
    console.warn("avatar", err);
  }
}

function setView(mode) {
  if (mode === 2 && viewMode !== 2) {
    view2Yaw = savedYaw;
    view2Pitch = savedPitch;
  }
  if (mode !== 2 && viewMode === 2) {
    savedYaw = view2Yaw;
    savedPitch = view2Pitch;
    camera.rotation.order = "YXZ";
    camera.rotation.y = view2Yaw;
    camera.rotation.x = view2Pitch;
  }
  viewMode = mode;
}

function applyDrunkCam(dt, extra = 0) {
  const drunk = Math.max(0, drunkLevel());
  const amp = drunk;
  shakePhase += dt * 1.05;
  const moving = sitting == null && inCar == null && onGround && (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD);
  if (moving) shakeWalk += dt * 5.2;
  const zoom = zoomHold;
  const feel = zoom ? 1.2 : 1;
  if (amp < 0.03) {
    drunkCam.yaw = 0;
    drunkCam.pit = 0;
    drunkCam.roll = extra;
  } else {
    drunkCam.yaw = (Math.sin(shakePhase * 0.73) * 0.16 + Math.sin(shakePhase * 1.85) * 0.05) * amp * feel;
    drunkCam.pit = (Math.cos(shakePhase * 0.61) * 0.1 + Math.sin(shakeWalk) * 0.035 * (moving ? 1 : 0.2)) * amp * feel;
    drunkCam.roll = (Math.sin(shakePhase) * 0.2 + Math.sin(shakeWalk) * 0.055 * (moving ? 1 : 0.1)) * amp * feel + extra;
  }
  const base = zoom ? 22 : 78 + extra * 8;
  const pulse = amp < 0.03 ? 0 : Math.sin(shakePhase * 0.45) * (zoom ? 1.8 : 4.2) * amp;
  camera.fov = base + pulse + heartKick * (zoom ? 6 : 16);
  camera.updateProjectionMatrix();
}

function applyDrunkLook() {
  if (Math.abs(drunkCam.yaw) + Math.abs(drunkCam.pit) + Math.abs(drunkCam.roll) < 1e-5) return;
  camera.rotation.order = "YXZ";
  _drunkEuler.setFromQuaternion(camera.quaternion, "YXZ");
  _drunkEuler.y += drunkCam.yaw;
  _drunkEuler.x += drunkCam.pit;
  _drunkEuler.z += drunkCam.roll;
  camera.quaternion.setFromEuler(_drunkEuler);
  camera.rotation.copy(_drunkEuler);
  const head = localPeer?.rig?.userData?.head;
  if (head && viewMode !== 1 && localPeer.rig.visible) {
    head.rotation.order = "YXZ";
    head.rotation.y += drunkCam.yaw;
    head.rotation.x += drunkCam.pit;
    head.rotation.z += drunkCam.roll * 0.65;
  }
}

function setJuke(on, fromNet) {
  const want = !!on;
  if (!!audio.juke === want) return;
  audio.toggleJuke();
  if (!fromNet) publishWorldBit("juke", want);
}

function worldBits() {
  const o = { front: frontDoorOpen ? 1 : 0, juke: audio.juke ? 1 : 0, cups: [cupStacks[0], cupStacks[1]] };
  for (const door of swingDoors) {
    if (door.userData.sid) o[door.userData.sid] = door.userData.open ? 1 : 0;
  }
  for (const sink of sinks) {
    if (sink.userData.kid) o[sink.userData.kid] = sink.userData.running ? 1 : 0;
  }
  return o;
}

function publishWorldBit(id, on) {
  if (!id) return;
  publishEvent({ t: "world", i: String(id), o: on ? 1 : 0 });
}

function publishWorldSync() {
  publishEvent({ t: "world", a: "sync", o: worldBits() });
}

function applyWorldBit(id, on, fromNet) {
  if (id === "front") setFrontDoor(!!on, false, true);
  else if (id === "juke") setJuke(!!on, true);
  else if (String(id).startsWith("s")) {
    const door = swingDoors.find((d) => d.userData.sid === id);
    if (door) setSwingDoor(door, !!on, false, true);
  } else if (String(id).startsWith("k")) {
    const sink = sinks.find((s) => s.userData.kid === id);
    if (sink) setBathSink(sink, !!on, true);
  }
}

function applyWorld(msg) {
  if (!msg) return;
  if (msg.a === "sync" && msg.o && typeof msg.o === "object") {
    if (msg.o.cups) applyCupStacks(msg.o.cups);
    for (const [id, val] of Object.entries(msg.o)) {
      if (id === "cups") continue;
      applyWorldBit(id, val, true);
    }
    return;
  }
  if (msg.i === "cups") {
    applyCupStacks(msg.o);
    return;
  }
  if (msg.i != null) applyWorldBit(msg.i, msg.o, true);
}

function setFrontDoor(open, silent, fromNet) {
  const next = !!open;
  const changed = frontDoorOpen !== next;
  frontDoorOpen = next;
  frontDoorWant = frontDoorOpen ? -1.9 : 0;
  if (!silent && changed) audio.doorThump();
  if (!fromNet && !silent && changed) publishWorldBit("front", next);
}

function tickFrontDoor(dt) {
  if (frontDoor == null) return;
  const diff = frontDoorWant - frontDoorAng;
  if (Math.abs(diff) < 0.002) frontDoorAng = frontDoorWant;
  else frontDoorAng += diff * Math.min(1, dt * 6.2);
  frontDoor.rotation.y = frontDoorAng;
}

const CAR_SEATS = [
  { side: -0.46, along: 0.16 },
  { side: 0.46, along: 0.16 },
  { side: -0.46, along: -0.86 },
  { side: 0.46, along: -0.86 },
];

function driving() {
  return !!(inCar && carSeatI === 0);
}

function seatDoorSide(i) {
  return i === 1 || i === 3 ? 1 : -1;
}

function carSeat(car, i = 0) {
  const fx = -Math.sin(car.yaw);
  const fz = -Math.cos(car.yaw);
  const lx = Math.cos(car.yaw);
  const lz = -Math.sin(car.yaw);
  const spec = CAR_SEATS[i] || CAR_SEATS[0];
  return {
    x: car.x + lx * spec.side + fx * spec.along,
    y: 1.18,
    z: car.z + lz * spec.side + fz * spec.along,
  };
}

function carOccupants(car) {
  const taken = new Set();
  if (!car) return taken;
  if (inCar === car && carSeatI >= 0) taken.add(carSeatI);
  const nid = String(car.nid || "");
  if (!nid) return taken;
  for (const peer of remotePeers()) {
    if (!peer.drive) continue;
    if (String(peer.ci || "") !== nid) continue;
    taken.add(peer.si == null ? 0 : peer.si | 0);
  }
  return taken;
}

function copsInCar(car) {
  if (!car?.cop) return false;
  for (const pack of cops) {
    if (pack.car !== car) continue;
    for (const off of pack.officers) {
      if (!off.dead && off.state === "ride") return true;
    }
  }
  return false;
}

function pickCarSeat(car, px, pz) {
  const taken = carOccupants(car);
  if (!taken.has(0)) return 0;
  const side = carDoorSide(car, px, pz);
  const order = side < 0 ? [2, 1, 3] : [1, 3, 2];
  for (const i of order) if (!taken.has(i)) return i;
  return -1;
}

function carRideHint(car) {
  if (!car) return "E get in · SPACE onto the hood or trunk, then the roof";
  if (copsInCar(car)) return "cops are in it · punch them out first · SPACE onto the hood or trunk";
  const taken = carOccupants(car);
  if (taken.size >= 4) return "car's full · SPACE onto the hood or trunk";
  if (car.cop && !taken.has(0)) return "E steal the cop car · SPACE onto the hood or trunk";
  if (taken.has(0)) return "E hop in · SPACE onto the hood or trunk";
  return "E get in · SPACE onto the hood or trunk, then the roof";
}

function maybeTakeWheel() {
  if (!inCar || carSeatI === 0) return;
  if (copsInCar(inCar)) return;
  const taken = carOccupants(inCar);
  if (taken.has(0)) return;
  for (const peer of remotePeers()) {
    if (!peer.drive || String(peer.ci || "") !== String(inCar.nid)) continue;
    const si = peer.si == null ? 0 : peer.si | 0;
    if (si > 0 && si < carSeatI) return;
  }
  carSeatI = 0;
  inCar.driverId = localId() || "me";
  inCar.driverUntil = performance.now() + 8000;
  audio.engineStart();
  if (inCar.cop) hijackCopCar(inCar);
  toast("you're driving");
  pokePose();
}

function togglePee() {
  if (inCar) return;
  if (localGender === "f") {
    if (peeing) {
      const flush = sitting?.kind === "toilet";
      peeing = false;
      peeUntil = 0;
      audio.peeStop();
      if (flush) audio.flush();
      return;
    }
    if (sitting?.kind !== "toilet") {
      toast("sit on the toilet first");
      return;
    }
  }
  if (sitting && sitting.kind !== "toilet") standUp();
  if (peeing) {
    const flush = sitting?.kind === "toilet";
    peeing = false;
    peeUntil = 0;
    audio.peeStop();
    if (flush) audio.flush();
    return;
  }
  peeing = true;
  peeUntil = tWorld + PEE_SECS;
  peeStart = tWorld;
  audio.peeStart();
}

function enterCar(car) {
  if (car == null || inCar) return;
  if (copsInCar(car)) {
    toast("cops are still in it");
    return;
  }
  const seat = pickCarSeat(car, bodyPos.x, bodyPos.z);
  if (seat < 0) {
    toast("car's full");
    return;
  }
  bindRideCar(null);
  swingCarDoors(car, seatDoorSide(seat), seat > 1 ? 1 : 0);
  inCar = car;
  carSeatI = seat;
  if (seat === 0) {
    car.speed = 0;
    car.vx = 0;
    car.vz = 0;
    car.driverId = localId() || "me";
    car.driverUntil = performance.now() + 8000;
    audio.engineStart();
    if (car.cop) hijackCopCar(car);
  }
  vy = 0;
  onGround = true;
  standY = 0;
  const s = carSeat(car, seat);
  camera.position.set(s.x, s.y, s.z);
  bodyPos.set(s.x, s.y, s.z);
  savedYaw = car.yaw;
  savedPitch = 0.18;
  view2Yaw = car.yaw;
  view2Pitch = 0.18;
  camera.rotation.order = "YXZ";
  camera.rotation.y = savedYaw;
  camera.rotation.x = savedPitch;
  audio.doorThump();
  pokePose();
}

function exitCar(silent) {
  if (inCar == null) return;
  const car = inCar;
  const wasDriver = carSeatI === 0;
  const side = seatDoorSide(carSeatI);
  const lx = Math.cos(car.yaw);
  const lz = -Math.sin(car.yaw);
  const x = car.x + lx * side * 2.4;
  const z = car.z + lz * side * 2.4;
  const [nx, nz] = collide(x, z, 0.3);
  camera.position.set(nx, eyeY(), nz);
  bodyPos.set(nx, eyeY(), nz);
  swingCarDoors(car, side, carSeatI > 1 ? 1 : 0);
  inCar = null;
  carSeatI = 0;
  standY = 0;
  bindRideCar(null);
  if (wasDriver) {
    car.speed = 0;
    car.drift = 0;
    car.vx = 0;
    car.vz = 0;
    car.driverId = "";
    audio.engineStop();
    publishParkedCar(car);
  }
  pokePose();
  if (silent) return;
  audio.doorThump();
}

function warpBar() {
  if (wanted) {
    toast("cops cut the cab line");
    return;
  }
  if (inCar) exitCar(true);
  audio.warp();
  camera.position.set(0, eyeY(), -1.05);
  camera.rotation.set(0, 0, 0);
  savedYaw = 0;
  savedPitch = 0;
  view2Yaw = 0;
  view2Pitch = 0;
  bodyPos.set(0, eyeY(), -1.05);
  vy = 0;
  onGround = true;
  standY = 0;
}

function tryPads() {
  for (const pad of pads) {
    if (pad.z < 16) continue;
    if (Math.hypot(camera.position.x - pad.x, camera.position.z - pad.z) < pad.r) {
      warpBar();
      return true;
    }
  }
  return false;
}

function syncCarMesh(car) {
  if (!car?.mesh) return;
  car.mesh.position.set(car.x, car.wreckY || 0, car.z);
  car.mesh.rotation.order = "YXZ";
  car.mesh.rotation.y = car.yaw;
  car.mesh.rotation.x = (car.wreckPitch || 0) + Math.abs(car.drift || 0) * 0.04;
  car.mesh.rotation.z = (car.wreckRoll || 0) - (car.drift || 0) * 0.28;
}

function carDoorSide(car, px, pz) {
  const lx = Math.cos(car.yaw);
  const lz = -Math.sin(car.yaw);
  return (px - car.x) * lx + (pz - car.z) * lz >= 0 ? 1 : -1;
}

function swingCarDoors(car, side, row = 0) {
  if (!car) return;
  car.doorSide = side < 0 ? -1 : 1;
  car.doorRow = row ? 1 : 0;
  car.doorAnim = 0;
}

function tickCarDoors(dt) {
  for (const car of cars) {
    if (car.doorAnim == null) continue;
    car.doorAnim += dt;
    const u = car.doorAnim;
    let open = 0;
    if (u < 0.26) open = u / 0.26;
    else if (u < 0.52) open = 1;
    else if (u < 0.92) open = 1 - (u - 0.52) / 0.4;
    else {
      open = 0;
      car.doorAnim = null;
    }
    const ang = open * 1.22;
    const front = car.doorRow !== 1;
    const left = car.doorSide < 0;
    if (car.doorL) car.doorL.rotation.y = left && front ? -ang : 0;
    if (car.doorR) car.doorR.rotation.y = !left && front ? ang : 0;
    if (car.doorLB) car.doorLB.rotation.y = left && !front ? -ang : 0;
    if (car.doorRB) car.doorRB.rotation.y = !left && !front ? ang : 0;
  }
}

function spawnDriftPuff(car) {
  if (driftPuffs.length > 36) {
    const old = driftPuffs.shift();
    old.parent?.remove(old);
  }
  const fx = -Math.sin(car.yaw);
  const fz = -Math.cos(car.yaw);
  const rx = Math.cos(car.yaw);
  const rz = -Math.sin(car.yaw);
  for (const side of [-1, 1]) {
    const m = new THREE.Mesh(smokeGeo, lambert(0xd4ccc0, { transparent: true, opacity: 0.3 }));
    m.position.set(car.x - fx * 1.72 + rx * side * 0.92, 0.1, car.z - fz * 1.72 + rz * side * 0.92);
    m.userData.life = 0.42 + Math.random() * 0.22;
    m.userData.max = m.userData.life;
    m.userData.vx = -fx * 0.35 + (Math.random() - 0.5) * 0.7;
    m.userData.vy = 0.5 + Math.random() * 0.45;
    m.userData.vz = -fz * 0.35 + (Math.random() - 0.5) * 0.7;
    scene.add(m);
    driftPuffs.push(m);
  }
}

function tickDriftFx(dt) {
  for (const car of cars) {
    const slip = Math.abs(car.drift || 0);
    const spd = Math.hypot(car.vx || 0, car.vz || 0) || Math.abs(car.speed || 0);
    if (slip > 0.26 && spd > 4) {
      car.smokeAcc = (car.smokeAcc || 0) + dt * (0.7 + slip * 2.4);
      if (car.smokeAcc > 0.046) {
        car.smokeAcc = 0;
        spawnDriftPuff(car);
        if (car === inCar && slip > 0.38) audio.screech();
      }
    }
  }
  for (let i = driftPuffs.length - 1; i >= 0; i--) {
    const m = driftPuffs[i];
    m.userData.life -= dt;
    if (m.userData.life <= 0) {
      m.parent?.remove(m);
      driftPuffs.splice(i, 1);
      continue;
    }
    m.position.x += m.userData.vx * dt;
    m.position.y += m.userData.vy * dt;
    m.position.z += m.userData.vz * dt;
    const u = m.userData.life / m.userData.max;
    m.scale.setScalar(0.65 + (1 - u) * 1.9);
    if (m.material) m.material.opacity = 0.3 * u;
  }
}

function netRound(n, p = 2) {
  const m = 10 ** p;
  return Math.round(Number(n) * m) / m;
}

function carTaken(car) {
  if (!car || car === inCar) return false;
  if (!car.driverId) return false;
  return performance.now() < (car.driverUntil || 0);
}

function publishParkedCar(car) {
  if (!car?.nid) return;
  publishEvent({
    t: "car",
    a: "park",
    ci: car.nid,
    x: netRound(car.x),
    z: netRound(car.z),
    yaw: netRound(car.yaw, 3),
  });
}

function carByNid(nid) {
  const id = String(nid ?? "");
  if (!id) return null;
  return cars.find((c) => String(c.nid) === id) || null;
}

function applyRemoteCar(msg) {
  if (!msg || msg.from === localId()) return;
  const nid = msg.ci != null ? String(msg.ci) : "";
  if (!nid) return;
  let car = carByNid(nid);
  const isCop = !!msg.cp || nid.startsWith("p");
  if (!car) {
    car = makeCar(msg.cx ?? msg.x ?? 0, msg.cz ?? msg.z ?? 0, msg.cy ?? msg.yaw ?? 0, isCop ? 0x12141c : 0x2a2a32, { exact: true });
    car.nid = nid;
    car.remoteSpawn = true;
    if (isCop) dressCopCar(car);
  } else if (isCop && !car.cop) {
    dressCopCar(car);
  }
  if (msg.a === "board" || msg.a === "alight") {
    swingCarDoors(car, seatDoorSide(msg.si), (msg.si | 0) > 1 ? 1 : 0);
    return;
  }
  if (driving() && car === inCar) return;
  const park = msg.a === "park";
  const taken = carTaken(car);
  const arriving = !park && !taken;
  const leaving = park && taken;
  if (msg.si == null || msg.si === 0) car.driverId = park ? "" : msg.from || car.driverId;
  car.driverUntil = park ? 0 : performance.now() + 4500;
  const tx = msg.cx ?? msg.x;
  const tz = msg.cz ?? msg.z;
  const tyaw = msg.cy ?? msg.yaw;
  if (Number.isFinite(Number(tx))) car.tx = Number(tx);
  if (Number.isFinite(Number(tz))) car.tz = Number(tz);
  if (Number.isFinite(Number(tyaw))) car.tyaw = Number(tyaw);
  if (msg.cs != null) car.speed = Number(msg.cs) || 0;
  if (msg.cf != null) car.drift = Number(msg.cf) || 0;
  if (park) {
    if (car.tx != null) car.x = car.tx;
    if (car.tz != null) car.z = car.tz;
    if (car.tyaw != null) car.yaw = car.tyaw;
    car.speed = 0;
    car.drift = 0;
    car.vx = 0;
    car.vz = 0;
    car.tx = null;
    car.tz = null;
    car.tyaw = null;
    syncCarMesh(car);
  }
  if ((arriving || leaving) && (msg.si == null || msg.si === 0)) swingCarDoors(car, -1, 0);
}

function seatRemoteDrivers() {
  for (const peer of remotePeers()) {
    if (!peer.drive) {
      if (peer._carRide) {
        const left = carByNid(peer._carRide);
        if (left) swingCarDoors(left, seatDoorSide(peer.si), (peer.si | 0) > 1 ? 1 : 0);
        peer._carRide = "";
      }
      continue;
    }
    const si = peer.si == null ? 0 : peer.si | 0;
    let car = carByNid(peer.ci);
    if (!car && si === 0 && peer.cx != null && peer.cz != null) {
      const isCop = !!peer.copCar || String(peer.ci || "").startsWith("p");
      car = makeCar(peer.cx, peer.cz, peer.cy || 0, isCop ? 0x12141c : 0x2a2a32, { exact: true });
      car.nid = String(peer.ci || `r${peer.id}`);
      car.remoteSpawn = true;
      if (isCop) dressCopCar(car);
      peer.ci = car.nid;
    }
    if (!car) continue;
    if (si === 0) {
      car.driverId = peer.id;
      car.driverUntil = performance.now() + 4000;
      if (peer.cx != null) car.tx = peer.cx;
      if (peer.cz != null) car.tz = peer.cz;
      if (peer.cy != null) car.tyaw = peer.cy;
    }
    if (!peer._carRide) swingCarDoors(car, seatDoorSide(si), si > 1 ? 1 : 0);
    peer._carRide = car.nid;
    const s = carSeat(car, si);
    peer.tx = s.x;
    peer.tz = s.z;
    if (peer.rig) {
      peer.rig.position.set(s.x, 0.12, s.z);
      peer.byaw = car.yaw + Math.PI;
      peer.hyaw = peer.byaw;
      peer.rig.rotation.y = peer.byaw;
    }
  }
}

function tickRemoteCars(dt) {
  const now = performance.now();
  for (const car of cars) {
    if (driving() && car === inCar) continue;
    if (car.tx == null || car.tz == null) {
      if (car.driverUntil && now > car.driverUntil) car.driverId = "";
      continue;
    }
    if (car.driverUntil && now > car.driverUntil + 1600) {
      car.tx = null;
      car.tz = null;
      car.tyaw = null;
      if (!car.remoteCop) car.driverId = "";
      continue;
    }
    const dx = car.tx - car.x;
    const dz = car.tz - car.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 8) {
      car.x = car.tx;
      car.z = car.tz;
    } else {
      const k = Math.min(1, dt * 16);
      car.x += dx * k;
      car.z += dz * k;
    }
    if (car.tyaw != null) {
      let d = (car.tyaw - car.yaw) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      car.yaw += d * Math.min(1, dt * 14);
    }
    syncCarMesh(car);
  }
}

function applyRemoteCops(msg) {
  if (!msg || msg.from === localId()) return;
  if (msg.a === "clear" || !msg.p || !msg.p.length) {
    for (const [key, pack] of [...remotePacks]) {
      if (!msg.from || pack.from === msg.from) {
        for (const off of pack.officers || []) off.rig?.parent?.remove(off.rig);
        remotePacks.delete(key);
      }
    }
    return;
  }
  // lightweight: just toast once so remotes know heat exists
  if (!remotePacks.has(msg.from)) {
    remotePacks.set(msg.from, { from: msg.from, officers: [] });
    toast(`${msg.fromName || "someone"}'s cops`);
  }
}

function resolveDrive(car, nx, nz) {
  const fx = -Math.sin(car.yaw);
  const fz = -Math.cos(car.yaw);
  const lx = Math.cos(car.yaw);
  const lz = -Math.sin(car.yaw);
  let px = nx;
  let pz = nz;
  let hitKind = "";
  const probes = [
    [0, 0],
    [0, -2.15],
    [0, 2.15],
    [-1.12, -1.6],
    [1.12, -1.6],
    [-1.12, 0],
    [1.12, 0],
    [-1.12, 1.6],
    [1.12, 1.6],
    [0, -1.1],
    [0, 1.1],
  ];
  for (const [ox, oz] of probes) {
    const sx = px + lx * ox + fx * oz;
    const sz = pz + lz * ox + fz * oz;
    const [qx, qz] = collideWorldForCar(sx, sz, 0.42);
    const dx = qx - sx;
    const dz = qz - sz;
    if (dx * dx + dz * dz > 1e-7) {
      px += dx;
      pz += dz;
      hitKind = "building";
    }
  }
  if (inCarBlock(px, pz, 0.35) || inCarBlock(px + fx * 1.6, pz + fz * 1.6, 0.2) || inCarBlock(px - fx * 1.6, pz - fz * 1.6, 0.2)) {
    const [ex, ez] = collideWorldForCar(px, pz, 1.55);
    px = ex;
    pz = ez;
    hitKind = "building";
  }
  const [cx, cz, other] = collideCars(px, pz, 1.25, car);
  if (other) return { x: cx, z: cz, hitKind: "car", hitCar: other };
  return { x: px, z: pz, hitKind, hitCar: null };
}

function shoveCar(other, from, spd) {
  if (!other || other.cop) return;
  const dx = other.x - from.x;
  const dz = other.z - from.z;
  const d = Math.hypot(dx, dz) || 1;
  const push = Math.min(1.6, 0.22 + spd * 0.09);
  other.x += (dx / d) * push;
  other.z += (dz / d) * push;
  const [hx, hz] = collideWorldForCar(other.x, other.z, 1.35);
  other.x = hx;
  other.z = hz;
  other.yaw += (Math.random() - 0.5) * Math.min(0.7, spd * 0.04);
  other.wreckRoll = (other.wreckRoll || 0) + (Math.random() - 0.5) * 0.12;
  syncCarMesh(other);
}

function dressCopCar(car) {
  car.cop = true;
  car.mesh.userData.kind = "copcar";
  car.mesh.userData.car = car;
  const red = lambert(0xff2440, { emissive: 0xff2440, emissiveIntensity: 1.3 });
  const blu = lambert(0x2450ff, { emissive: 0x2450ff, emissiveIntensity: 1.3 });
  const blk = lambert(0x111318);
  addBox(car.mesh, unitBox, blk, 0, 1.58, 0.1, 0.72, 0.12, 1.18);
  addBox(car.mesh, unitBox, red, -0.22, 1.68, 0.1, 0.28, 0.1, 0.42);
  addBox(car.mesh, unitBox, blu, 0.22, 1.68, 0.1, 0.28, 0.1, 0.42);
  addBox(car.mesh, unitBox, lambert(0xe8e4dc), 0, 0.62, 0, 2.18, 0.06, 3.2);
  car.sirenMats = [red, blu];
}

function hijackCopCar(car) {
  if (!car?.cop) return;
  for (const pack of cops) {
    if (pack.car !== car) continue;
    pack.arrived = true;
    pack.hijacked = true;
    car.speed = 0;
    for (const off of pack.officers) {
      if (off.dead || !off.rig || off.state !== "ride") continue;
      const side = off.seat < 0 ? -1 : 1;
      const lx = Math.cos(car.yaw);
      const lz = -Math.sin(car.yaw);
      off.x = car.x + lx * side * 2.55;
      off.z = car.z + lz * side * 2.55;
      [off.x, off.z] = collideWorld(off.x, off.z, 0.28);
      off.state = "stagger";
      off.staggerT = 1.05;
      off.swingT = 0;
      off.outT = 1;
      off.yaw = Math.atan2(bodyPos.x - off.x, bodyPos.z - off.z);
      off.rig.position.set(off.x, 0, off.z);
      off.rig.rotation.y = off.yaw;
    }
  }
  toast("you stole the cop car");
}

function punchAim() {
  if (viewMode === 1 && camera) {
    camera.getWorldDirection(_camDir);
    const len = Math.hypot(_camDir.x, _camDir.z) || 1;
    return { fx: _camDir.x / len, fz: _camDir.z / len };
  }
  const yaw = viewMode === 2 ? view2Yaw : savedYaw;
  return { fx: -Math.sin(yaw), fz: -Math.cos(yaw) };
}

function makeBatonMesh() {
  const g = new THREE.Group();
  g.userData.kind = "baton";
  const wood = lambert(0x4a2c14);
  const grip = lambert(0x1a120c);
  const tip = lambert(0x2a1a10);
  addBox(g, unitBox, wood, 0, 0.24, 0, 0.045, 0.42, 0.045);
  addBox(g, unitBox, grip, 0, 0.02, 0, 0.055, 0.1, 0.055);
  addBox(g, unitBox, tip, 0, 0.47, 0, 0.05, 0.06, 0.05);
  return g;
}

function dropOfficerBaton(off) {
  if (!off || off.droppedBaton) return;
  off.droppedBaton = true;
  const heldMesh = off.rig?.userData?.held;
  if (heldMesh) heldMesh.visible = false;
  const baton = makeBatonMesh();
  const x = off.rd ? off.rd.x : off.x;
  const z = off.rd ? off.rd.z : off.z;
  const [nx, nz] = collideWorld(x + (Math.random() - 0.5) * 0.25, z + (Math.random() - 0.5) * 0.25, 0.18);
  baton.position.set(nx, 0.03, nz);
  baton.rotation.set(Math.PI / 2, off.yaw || 0, 0.16);
  scene.add(baton);
  registerPick(baton);
}

function hitOfficer(off, fx, fz, dmg) {
  if (!off || off.dead) return false;
  if (off.state === "ride") {
    const car = off.car;
    if (car) {
      const side = off.seat < 0 ? -1 : 1;
      const lx = Math.cos(car.yaw);
      const lz = -Math.sin(car.yaw);
      off.x = car.x + lx * side * 2.2;
      off.z = car.z + lz * side * 2.2;
      [off.x, off.z] = collideWorld(off.x, off.z, 0.28);
    }
    off.state = "chase";
    off.outT = 1;
  }
  off.swingT = 0;
  const knock = applyKnock(off.x, off.z, fx, fz, collideWorld, 0.28);
  off.kvx = (off.kvx || 0) + knock.vx;
  off.kvz = (off.kvz || 0) + knock.vz;
  off.hopY = Math.max(off.hopY || 0, 0.14);
  off.hurtT = 0.28;
  off.yaw = Math.atan2(bodyPos.x - off.x, bodyPos.z - off.z);
  off.hp = Math.max(0, (off.hp ?? COP_HP) - dmg);
  if (holdingBaton()) audio.baton();
  if (off.hp <= 0) {
    killOfficer(off, null, 3.4, { reinforce: false, mild: true, shove: { fx, fz } });
    return true;
  }
  return true;
}

function punchCops() {
  if (!cops.length || inCar) return false;
  const { fx, fz } = punchAim();
  const x = bodyPos.x;
  const z = bodyPos.z;
  let best = null;
  let bestDist = 2.35;
  for (const pack of cops) {
    for (const off of pack.officers) {
      if (off.dead) continue;
      const dx = off.x - x;
      const dz = off.z - z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.04 || dist > bestDist) continue;
      const aim = dist > 0.001 ? (dx * fx + dz * fz) / dist : 0;
      if (aim < 0.15) continue;
      if (worldBlocked(x, z, off.x, off.z)) continue;
      best = off;
      bestDist = dist;
    }
  }
  if (!best) return false;
  return hitOfficer(best, fx, fz, holdingBaton() ? BATON_DMG : PUNCH_DMG);
}

function makeOfficer() {
  const rig = makeAvatar(`cop-${++copSerial}`, "P.D.", "m");
  if (rig.userData.shirt) {
    rig.userData.shirt.color.setHex(0x1b2d55);
    const fb = rig.userData.flashBase?.find((b) => b.m === rig.userData.shirt);
    if (fb) {
      fb.r = rig.userData.shirt.color.r;
      fb.g = rig.userData.shirt.color.g;
      fb.b = rig.userData.shirt.color.b;
    }
  }
  if (rig.userData.tag) {
    rig.userData.tag.visible = false;
    rig.userData.tag.userData.locked = true;
  }
  const head = rig.userData.head;
  if (head) {
    addBox(head, unitBox, lambert(0x111318), 0, 0.16, 0, 0.32, 0.1, 0.32);
    addBox(head, unitBox, lambert(0x111318), 0, 0.12, 0.12, 0.32, 0.04, 0.12);
    addBox(head, unitBox, lambert(0xc9a227), 0, 0.16, 0.15, 0.08, 0.04, 0.02);
  }
  const held = rig.userData.held;
  if (held) {
    held.visible = true;
    held.material = lambert(0x4a2c14);
    held.scale.set(0.045, 0.62, 0.045);
    held.position.set(0.08, -0.55, 0.04);
  }
  scene.add(rig);
  return rig;
}

function clearPolice() {
  audio.sirenStop();
  for (const pack of cops) {
    for (const off of pack.officers) {
      off.rig?.parent?.remove(off.rig);
    }
    if (pack.car && pack.car !== inCar) {
      const i = cars.indexOf(pack.car);
      if (i >= 0) cars.splice(i, 1);
      pack.car.mesh?.parent?.remove(pack.car.mesh);
    }
  }
  cops.length = 0;
  wanted = false;
  wantedT = 0;
  copWave = 0;
  bindRideCar(null);
}

function heatUp() {
  wanted = true;
  wantedT = 0;
}

function addCopPack(x, z) {
  heatUp();
  audio.sirenStart();
  copWave += 1;
  const roads = [22, 58, 94];
  let rz = roads[0];
  for (const r of roads) if (Math.abs(r - z) < Math.abs(rz - z)) rz = r;
  rz += ((copWave % 3) - 1) * 3.4;
  const side = copWave % 2 === 0 ? (x >= 0 ? 1 : -1) : (x >= 0 ? -1 : 1);
  let sx = THREE.MathUtils.clamp(x + side * (52 + (copWave % 4) * 8), -WORLD_X + 8, WORLD_X - 8);
  const along = [0, 12, -12, 24, -24, 36, -36, 48];
  let placed = false;
  for (const a of along) {
    const tx = THREE.MathUtils.clamp(sx + a, -WORLD_X + 8, WORLD_X - 8);
    if (!carTooClose(tx, rz, 5.4)) {
      sx = tx;
      placed = true;
      break;
    }
  }
  if (!placed) [sx, rz] = placeCarFree(sx, rz);
  const car = makeCar(sx, rz, Math.atan2(sx - x, rz - z), 0x12141c, { exact: true });
  dressCopCar(car);
  car.speed = 16;
  const pack = {
    car,
    officers: [],
    tx: x,
    tz: z,
    arrived: false,
    driveT: 0,
    hijacked: false,
  };
  for (let i = 0; i < 2; i++) {
    pack.officers.push({
      id: copSerial + 1,
      rig: makeOfficer(),
      car,
      seat: i === 0 ? -0.46 : 0.46,
      state: "ride",
      x: sx,
      z: rz,
      yaw: car.yaw,
      phase: i * 1.4,
      swingT: 0,
      outT: 0,
      dead: false,
      hp: COP_HP,
      hurtT: 0,
      kvx: 0,
      kvz: 0,
      hopY: 0,
      droppedBaton: false,
    });
  }
  cops.push(pack);
}

function spawnPolice(x, z) {
  toast(cops.length ? "more cops incoming" : "cops incoming");
  addCopPack(x, z);
}

function angDiff(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function flopLimb(node, L, rest, dt) {
  if (!node || !L) return;
  L.wx += (rest.x - L.x) * 9 * dt;
  L.wy += (rest.y - L.y) * 9 * dt;
  L.wz += (rest.z - L.z) * 9 * dt;
  L.wx *= Math.max(0, 1 - dt * 3.4);
  L.wy *= Math.max(0, 1 - dt * 3.4);
  L.wz *= Math.max(0, 1 - dt * 3.4);
  L.x += L.wx * dt;
  L.y += L.wy * dt;
  L.z += L.wz * dt;
  node.rotation.set(L.x, L.y, L.z);
}

function ragLimb(wx = 0, wy = 0, wz = 0) {
  return { x: 0, y: 0, z: 0, wx, wy, wz };
}

const COP_DEAD_LIMBS = {
  head: { x: 0.42, y: 0.38, z: 0.16 },
  armL: { x: -0.28, y: 0.12, z: 1.32 },
  armR: { x: 0.46, y: -0.18, z: -1.18 },
  legL: { x: 0.38, y: 0.22, z: 0.16 },
  legR: { x: -0.22, y: -0.14, z: -0.2 },
};

function applyCopRagdoll(off) {
  const rd = off.rd;
  const rig = off.rig;
  if (!rd || !rig) return;
  rig.position.set(rd.x, rd.y, rd.z);
  rig.rotation.order = "YXZ";
  rig.rotation.set(rd.rx, rd.ry, rd.rz);
}

function startCopRagdoll(off, car, spd, shove = null, mild = false) {
  const rig = off.rig;
  if (!rig) return;
  const u = rig.userData;
  u.disposeFx?.();
  if (u.tag) {
    u.tag.visible = false;
    u.tag.userData.locked = true;
  }
  if (u.stars) u.stars.visible = false;
  if (u.body) {
    u.body.position.set(0, -0.92, 0);
    u.body.rotation.set(0, 0, 0);
  }
  let fx = 0;
  let fz = 1;
  if (car) {
    const sign = Math.sign(car.speed || 1);
    fx = -Math.sin(car.yaw) * sign;
    fz = -Math.cos(car.yaw) * sign;
    const loc = carWorldToLocal(car, off.x, off.z);
    const lx = Math.cos(car.yaw);
    const lz = -Math.sin(car.yaw);
    fx += lx * THREE.MathUtils.clamp(loc.lx, -1.2, 1.2) * 0.42;
    fz += lz * THREE.MathUtils.clamp(loc.lx, -1.2, 1.2) * 0.42;
    const len = Math.hypot(fx, fz) || 1;
    fx /= len;
    fz /= len;
  } else if (shove && (shove.fx || shove.fz)) {
    const len = Math.hypot(shove.fx, shove.fz) || 1;
    fx = shove.fx / len;
    fz = shove.fz / len;
  }
  const kick = mild ? 2.4 + Math.min(6, spd) * 0.25 : 7.2 + Math.min(18, spd) * 0.82;
  const up = mild ? 2.1 : 5.6 + Math.min(16, spd) * 0.22;
  const side = Math.random() - 0.5;
  const keep = off.rd && !off.rd.settled;
  off.rd = {
    x: keep ? off.rd.x : off.x,
    y: keep ? Math.max(0.55, off.rd.y) : Math.max(0.72, (rig.position.y || 0) + 0.92),
    z: keep ? off.rd.z : off.z,
    vx: fx * kick + side * 2.8,
    vy: up,
    vz: fz * kick + (Math.random() - 0.5) * 2.8,
    rx: keep ? off.rd.rx : 0.2,
    ry: keep ? off.rd.ry : off.yaw || 0,
    rz: keep ? off.rd.rz : side * 0.5,
    wx: 5 + Math.random() * 9,
    wy: (Math.random() - 0.5) * 12,
    wz: 7 + Math.random() * 9,
    face: Math.random() < 0.5 ? 1 : -1,
    bounce: 0,
    t: 0,
    settled: false,
    skipCar: car || null,
    skipT: 0.42,
    limbs: {
      head: ragLimb((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10),
      armL: ragLimb((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, 12 + Math.random() * 8),
      armR: ragLimb((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, -12 - Math.random() * 8),
      legL: ragLimb((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7),
      legR: ragLimb((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7),
    },
  };
  applyCopRagdoll(off);
}

function settleCopRagdoll(off) {
  const rd = off.rd;
  const rig = off.rig;
  if (!rd || !rig) return;
  rd.settled = true;
  rd.vx = rd.vy = rd.vz = 0;
  rd.wx = rd.wy = rd.wz = 0;
  rd.rx = rd.face * (Math.PI * 0.5 + (Math.random() - 0.5) * 0.18);
  rd.rz = (Math.random() - 0.5) * 0.28;
  rd.y = 0.2;
  const [x, z] = collideWorld(rd.x, rd.z, 0.34, 0, true);
  rd.x = x;
  rd.z = z;
  off.x = x;
  off.z = z;
  const u = rig.userData;
  if (u.head) u.head.rotation.set(COP_DEAD_LIMBS.head.x, COP_DEAD_LIMBS.head.y, COP_DEAD_LIMBS.head.z);
  if (u.armL) u.armL.rotation.set(COP_DEAD_LIMBS.armL.x, COP_DEAD_LIMBS.armL.y, COP_DEAD_LIMBS.armL.z);
  if (u.armR) u.armR.rotation.set(COP_DEAD_LIMBS.armR.x, COP_DEAD_LIMBS.armR.y, COP_DEAD_LIMBS.armR.z);
  if (u.legL) u.legL.rotation.set(COP_DEAD_LIMBS.legL.x, COP_DEAD_LIMBS.legL.y, COP_DEAD_LIMBS.legL.z);
  if (u.legR) u.legR.rotation.set(COP_DEAD_LIMBS.legR.x, COP_DEAD_LIMBS.legR.y, COP_DEAD_LIMBS.legR.z);
  applyCopRagdoll(off);
}

function tickRagdoll(off, dt) {
  const rd = off.rd;
  const rig = off.rig;
  if (!rd || !rig) return;
  if (rd.settled) return;
  dt = Math.min(0.033, dt);
  rd.t += dt;
  if (rd.skipT > 0) rd.skipT -= dt;
  rd.vy -= 26 * dt;
  rd.x += rd.vx * dt;
  rd.y += rd.vy * dt;
  rd.z += rd.vz * dt;
  rd.rx += rd.wx * dt;
  rd.ry += rd.wy * dt;
  rd.rz += rd.wz * dt;
  let nx = rd.x;
  let nz = rd.z;
  [nx, nz] = collideWorld(nx, nz, 0.34, 0, true);
  const skip = rd.skipT > 0 ? rd.skipCar : null;
  const hit = collideCars(nx, nz, 0.42, skip);
  nx = hit[0];
  nz = hit[1];
  if (Math.abs(nx - rd.x) > 1e-4) {
    rd.vx *= -0.4;
    rd.wy += (Math.random() - 0.5) * 4;
  }
  if (Math.abs(nz - rd.z) > 1e-4) {
    rd.vz *= -0.4;
    rd.wy += (Math.random() - 0.5) * 4;
  }
  rd.x = nx;
  rd.z = nz;
  off.x = rd.x;
  off.z = rd.z;
  const floor = 0.2;
  if (rd.y < floor) {
    rd.y = floor;
    if (rd.vy < -2.2) {
      rd.vy *= -0.36;
      rd.vx *= 0.66;
      rd.vz *= 0.66;
      rd.wx += (Math.random() - 0.5) * 5;
      rd.wz *= 0.52;
      rd.bounce += 1;
      audio.land(rd.bounce === 1);
      for (const L of Object.values(rd.limbs)) {
        L.wx += (Math.random() - 0.5) * 9;
        L.wz += (Math.random() - 0.5) * 9;
      }
    } else {
      rd.vy = 0;
      rd.vx *= Math.max(0, 1 - dt * 3.8);
      rd.vz *= Math.max(0, 1 - dt * 3.8);
      rd.wx *= Math.max(0, 1 - dt * 4.4);
      rd.wy *= Math.max(0, 1 - dt * 3.6);
      rd.wz *= Math.max(0, 1 - dt * 4.4);
    }
    rd.wx += angDiff(rd.rx, rd.face * Math.PI * 0.5) * 11 * dt;
    rd.wz += angDiff(rd.rz, 0) * 7 * dt;
  } else {
    rd.vx *= 1 - dt * 0.2;
    rd.vz *= 1 - dt * 0.2;
    rd.wx *= 1 - dt * 0.1;
    rd.wy *= 1 - dt * 0.08;
    rd.wz *= 1 - dt * 0.1;
  }
  const u = rig.userData;
  flopLimb(u.head, rd.limbs.head, COP_DEAD_LIMBS.head, dt);
  flopLimb(u.armL, rd.limbs.armL, COP_DEAD_LIMBS.armL, dt);
  flopLimb(u.armR, rd.limbs.armR, COP_DEAD_LIMBS.armR, dt);
  flopLimb(u.legL, rd.limbs.legL, COP_DEAD_LIMBS.legL, dt);
  flopLimb(u.legR, rd.limbs.legR, COP_DEAD_LIMBS.legR, dt);
  const speed = Math.hypot(rd.vx, rd.vy, rd.vz);
  const spin = Math.hypot(rd.wx, rd.wy, rd.wz);
  if (rd.y <= floor + 0.03 && speed < 0.55 && spin < 1.35 && rd.t > 0.65) {
    settleCopRagdoll(off);
    return;
  }
  applyCopRagdoll(off);
}

function killOfficer(off, car, spd = 10, opts = {}) {
  if (!off || off.dead) return;
  off.dead = true;
  off.state = "dead";
  dropOfficerBaton(off);
  if (off.rig) startCopRagdoll(off, car, spd, opts.shove || null, !!opts.mild);
  audio.hit();
  if (opts.reinforce === false) {
    toast("cop down");
    return;
  }
  toast("cop down · two more inbound");
  heatUp();
  if (!passedOut) addCopPack(bodyPos.x, bodyPos.z);
}

function runOverCops(car, spd) {
  if (!car || spd < 4.8 || passedOut) return 0;
  let n = 0;
  for (const pack of cops) {
    for (const off of pack.officers) {
      if (off.state === "ride") continue;
      const loc = carWorldToLocal(car, off.rd ? off.rd.x : off.x, off.rd ? off.rd.z : off.z);
      if (Math.abs(loc.lx) > 1.28 || Math.abs(loc.lz) > 2.4) continue;
      if (off.dead) {
        if (off.rd && (off.rd.settled || off.rd.t > 0.32)) {
          startCopRagdoll(off, car, spd * 0.88);
          audio.hit();
        }
        continue;
      }
      killOfficer(off, car, spd);
      n += 1;
    }
  }
  return n;
}

function yankFromCar(off) {
  if (!inCar) return;
  const sideX = off ? off.x : camera.position.x;
  const sideZ = off ? off.z : camera.position.z;
  exitCar(true);
  const [nx, nz] = collide(sideX, sideZ, 0.3);
  camera.position.set(nx, eyeY(), nz);
  bodyPos.set(nx, eyeY(), nz);
  audio.doorThump();
  toast("pulled out of the car");
}

function beginCrash(spd, hitCar) {
  if (crashCool > 0) return;
  crashCool = 1.15;
  audio.crash();
  hurtFlash = 1;
  flash("CRASH", "lose");
  stunT = Math.max(stunT, 5.5);
  if (inCar) {
    const wreck = inCar;
    wreck.speed = 0;
    wreck.wreckRoll = (Math.random() < 0.5 ? -1 : 1) * 0.11;
    wreck.wreckY = -0.05;
    syncCarMesh(wreck);
    exitCar(true);
  }
  heatUp();
  if (!cops.length && !passedOut) spawnPolice(bodyPos.x, bodyPos.z);
}

function flashOfficerHurt(off) {
  const u = off.rig?.userData;
  if (!u) return;
  const bases = u.flashBase || [];
  for (const b of bases) b.m.color.setRGB(b.r, b.g, b.b);
  if ((off.hurtT || 0) <= 0) return;
  const a = Math.min(1, off.hurtT / 0.12);
  for (const b of bases) b.m.color.setRGB(1, 0.28 * (1 - a), 0.28 * (1 - a));
  if (u.skin) u.skin.color.setRGB(1, 0.32, 0.32);
}

function poseCop(off, dt, moving) {
  const u = off.rig?.userData;
  if (!u) return;
  off.phase += dt * (moving ? 9.2 : 3);
  const swing = Math.sin(off.phase) * (moving ? 0.62 : 0.08);
  if (u.body) u.body.rotation.set(off.state === "stagger" ? -0.28 : 0, 0, 0);
  if (u.legL) u.legL.rotation.set(swing, 0, 0);
  if (u.legR) u.legR.rotation.set(-swing, 0, 0);
  if (u.armL) u.armL.rotation.set(off.state === "stagger" ? -1.15 + Math.sin(off.phase * 2) * 0.3 : -swing * 0.55, 0, 0);
  if (u.armR) {
    if (off.state === "stagger") {
      u.armR.rotation.set(-0.85, 0, 0.72);
    } else if (off.state === "swing") {
      const a = Math.sin(Math.min(1, off.swingT / 0.28) * Math.PI);
      u.armR.rotation.set(-0.2 - a * 1.7, 0, 0.15 + a * 0.5);
    } else {
      u.armR.rotation.set(0.35, 0, -0.45);
    }
  }
  if ((off.hurtT || 0) > 0) poseHurt(u, off.hurtT);
  flashOfficerHurt(off);
}

function arrestPlayer() {
  if (passedOut) return;
  passedOut = true;
  if (controls.isLocked) controls.unlock();
  audio.pourStop();
  audio.peeStop();
  audio.sinkStop();
  audio.sirenStop();
  audio.arrest();
  setPassoutMode("arrest");
  $("passoutStats").textContent = `the cops got you  ·  score ${score}  ·  ${pours} pours  ·  bac ${bac.toFixed(3)}`;
  $("passout").classList.add("open");
  if (inCar) exitCar(true);
  clearPolice();
  resetShift();
}

function packShouldRam(pack) {
  return !!(inCar && pack?.car && inCar !== pack.car && !pack.hijacked);
}

function packCanDrive(pack) {
  const living = pack.officers.filter((off) => !off.dead);
  return living.length > 0 && living.every((off) => off.state === "ride");
}

function officerDoorWorld(off) {
  const car = off.car;
  const side = off.seat < 0 ? -1 : 1;
  const lx = Math.cos(car.yaw);
  const lz = -Math.sin(car.yaw);
  return { x: car.x + lx * side * 2.35, z: car.z + lz * side * 2.35, side };
}

function driveCopCar(pack, dt, ram) {
  const car = pack.car;
  if (!car || inCar === car) return;
  if (!packCanDrive(pack)) {
    car.speed = 0;
    syncCarMesh(car);
    return;
  }
  pack.tx = bodyPos.x;
  pack.tz = bodyPos.z;
  const dx = pack.tx - car.x;
  const dz = pack.tz - car.z;
  const dist = Math.hypot(dx, dz);
  const stopAt = ram ? 2.1 : 7.6;
  if (ram) pack.driveT = 0;
  else pack.driveT += dt;
  if (!ram && (dist <= stopAt || (pack.driveT >= COP_ARRIVE_MIN && dist < 9.2) || pack.driveT > COP_ARRIVE_MAX)) {
    pack.arrived = true;
    car.speed = 0;
    syncCarMesh(car);
    return;
  }
  pack.arrived = false;
  const aim = Math.atan2(car.x - pack.tx, car.z - pack.tz);
  car.yaw += angDiff(car.yaw, aim) * Math.min(1, dt * 4.4);
  const maxSpd = ram ? 17.5 : 13.5;
  const step = Math.min(dist, maxSpd * dt);
  if (dist > 0.001) {
    const nx = car.x + (dx / dist) * step;
    const nz = car.z + (dz / dist) * step;
    const resolved = resolveDrive(car, nx, nz);
    car.x = resolved.x;
    car.z = resolved.z;
    car.speed = maxSpd;
    if (ram && resolved.hitCar === inCar && maxSpd >= 5.6 && crashCool <= 0) {
      shoveCar(inCar, car, maxSpd);
      beginCrash(maxSpd, car);
    }
  }
  syncCarMesh(car);
}

function tickPolice(dt) {
  if (!cops.length) return;
  if (wanted) {
    wantedT += dt;
    if (wantedT >= WANTED_GIVE_UP) {
      toast("cops lost interest");
      if (inCar?.sirenMats) {
        inCar.sirenMats[0].emissiveIntensity = 0.12;
        inCar.sirenMats[1].emissiveIntensity = 0.12;
      }
      clearPolice();
      return;
    }
  }
  audio.sirenTick(dt);
  const blink = tWorld * 6 % 2 < 1;
  const px = bodyPos.x;
  const pz = bodyPos.z;
  for (const pack of cops) {
    const car = pack.car;
    if (car?.sirenMats) {
      car.sirenMats[0].emissiveIntensity = blink ? 1.8 : 0.12;
      car.sirenMats[1].emissiveIntensity = blink ? 0.12 : 1.8;
    }
    if (inCar === car) {
      pack.arrived = true;
      pack.hijacked = true;
      if (car) car.speed = 0;
    } else {
      driveCopCar(pack, dt, packShouldRam(pack));
    }
    stickToRideCar();
    for (const off of pack.officers) {
      if (off.dead) {
        tickRagdoll(off, dt);
        continue;
      }
      if (off.hurtT > 0) off.hurtT = Math.max(0, off.hurtT - dt);
      if (off.kvx || off.kvz) {
        const [kx, kz, nvx, nvz] = stepKnock(off.x, off.z, off.kvx || 0, off.kvz || 0, dt, collideWorld, 0.28);
        off.x = kx;
        off.z = kz;
        off.kvx = nvx;
        off.kvz = nvz;
      }
      if (off.hopY > 0) off.hopY = Math.max(0, off.hopY - dt * 1.8);
      const ram = packShouldRam(pack);
      if (ram && (off.state === "chase" || off.state === "swing" || off.state === "stagger" || off.state === "out")) {
        off.state = "board";
      } else if (!ram && off.state === "board") {
        off.state = "chase";
      }
      if (off.state === "board") {
        const dest = officerDoorWorld(off);
        const bdx = dest.x - off.x;
        const bdz = dest.z - off.z;
        const bdist = Math.hypot(bdx, bdz);
        off.yaw = bdist > 0.02 ? Math.atan2(bdx, bdz) : Math.atan2(car.x - off.x, car.z - off.z);
        if (bdist > 0.32 && (off.hurtT || 0) <= 0.08) {
          let nx = off.x + (bdx / (bdist || 1)) * 3.7 * dt;
          let nz = off.z + (bdz / (bdist || 1)) * 3.7 * dt;
          [nx, nz] = collideWorld(nx, nz, 0.28);
          off.x = nx;
          off.z = nz;
        }
        if (bdist < 0.58) {
          off.state = "ride";
          off.outT = 0;
          swingCarDoors(car, dest.side, 0);
        }
        off.rig.position.set(off.x, off.hopY || 0, off.z);
        off.rig.rotation.y = off.yaw;
        poseCop(off, dt, bdist > 0.32);
        continue;
      }
      if (off.state === "ride") {
        const fx = -Math.sin(car.yaw);
        const fz = -Math.cos(car.yaw);
        const lx = Math.cos(car.yaw);
        const lz = -Math.sin(car.yaw);
        off.x = car.x + lx * off.seat + fx * 0.18;
        off.z = car.z + lz * off.seat + fz * 0.18;
        off.yaw = car.yaw + Math.PI;
        off.rig.position.set(off.x, 0.55, off.z);
        off.rig.rotation.y = off.yaw;
        if (pack.arrived && !ram) {
          off.state = "out";
          off.outT = 0;
          swingCarDoors(car, off.seat < 0 ? -1 : 1, 0);
        }
        poseCop(off, dt, false);
        continue;
      }
      if (off.state === "out") {
        off.outT += dt;
        const side = off.seat < 0 ? -1 : 1;
        const lx = Math.cos(car.yaw);
        const lz = -Math.sin(car.yaw);
        const destX = car.x + lx * side * 2.35;
        const destZ = car.z + lz * side * 2.35;
        off.x += (destX - off.x) * Math.min(1, dt * 5);
        off.z += (destZ - off.z) * Math.min(1, dt * 5);
        off.yaw = Math.atan2(px - off.x, pz - off.z);
        if (off.outT > 0.42) off.state = "chase";
        off.rig.position.set(off.x, off.hopY || 0, off.z);
        off.rig.rotation.y = off.yaw;
        poseCop(off, dt, true);
        continue;
      }
      if (off.state === "stagger") {
        off.staggerT = (off.staggerT || 0) - dt;
        const sdx = off.x - px;
        const sdz = off.z - pz;
        const sdist = Math.hypot(sdx, sdz) || 1;
        let nx = off.x + (sdx / sdist) * 1.55 * dt;
        let nz = off.z + (sdz / sdist) * 1.55 * dt;
        [nx, nz] = collideWorld(nx, nz, 0.28);
        off.x = nx;
        off.z = nz;
        off.yaw = Math.atan2(px - off.x, pz - off.z);
        off.rig.position.set(off.x, off.hopY || 0, off.z);
        off.rig.rotation.y = off.yaw;
        poseCop(off, dt, false);
        if (off.staggerT <= 0) off.state = "chase";
        continue;
      }
      const dx = px - off.x;
      const dz = pz - off.z;
      const dist = Math.hypot(dx, dz);
      off.yaw = Math.atan2(dx, dz);
      const carSpd = inCar ? Math.abs(inCar.speed || 0) : 0;
      const tooFast = inCar && carSpd > 3.5;
      const reach = inCar ? 1.72 : 1.08;
      if (off.state === "chase") {
        if (dist > 0.8 && (off.hurtT || 0) <= 0.08) {
          let nx = off.x + (dx / (dist || 1)) * 3.28 * dt;
          let nz = off.z + (dz / (dist || 1)) * 3.28 * dt;
          [nx, nz] = collideWorld(nx, nz, 0.28);
          off.x = nx;
          off.z = nz;
        }
        if (dist < reach && stunT <= 0 && !tooFast) {
          off.state = "swing";
          off.swingT = 0;
          audio.baton();
        }
      } else if (off.state === "swing") {
        off.swingT += dt;
        if (off.swingT > 0.18 && off.swingT < 0.32 && dist < reach + 0.12 && !tooFast) {
          if (inCar) yankFromCar(off);
          arrestPlayer();
          return;
        }
        if (off.swingT > 0.52 || tooFast) off.state = "chase";
      }
      off.rig.position.set(off.x, off.hopY || 0, off.z);
      off.rig.rotation.y = off.yaw;
      poseCop(off, dt, off.state === "chase");
    }
  }
}

function updateCar(dt) {
  const car = inCar;
  if (!car) return;
  if (car.vx == null) car.vx = 0;
  if (car.vz == null) car.vz = 0;
  if (car.drift == null) car.drift = 0;
  const drunk = drunkLevel();
  const throttle = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const steer = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const hb = !!(keys.ShiftLeft || keys.ShiftRight);
  const maxV = 18 * (1 - Math.min(0.55, drunk * 0.45));
  let vx = car.vx;
  let vz = car.vz;
  let fx = -Math.sin(car.yaw);
  let fz = -Math.cos(car.yaw);
  let rx = Math.cos(car.yaw);
  let rz = -Math.sin(car.yaw);
  const power = (hb ? 16 : 24) * (1 - Math.min(0.32, drunk * 0.28));
  if (throttle) {
    vx += fx * throttle * power * dt;
    vz += fz * throttle * power * dt;
  }
  const linDrag = hb ? 1.55 : throttle ? 0.2 : 1.08;
  vx *= Math.max(0, 1 - linDrag * dt);
  vz *= Math.max(0, 1 - linDrag * dt);
  let spd = Math.hypot(vx, vz);
  let fwd = vx * fx + vz * fz;
  let lat = vx * rx + vz * rz;
  const slipAng = Math.atan2(lat, Math.max(1.05, Math.abs(fwd)));
  const sliding = (hb && spd > 2.5) || (Math.abs(slipAng) > 0.2 && spd > 5.2);
  const steerFeel = Math.min(1.6, spd / 7.1) * (sliding ? 2.2 : 1.22);
  const wobble = (Math.random() - 0.5) * drunk * 0.85 + Math.sin(tWorld * (1.3 + drunk)) * drunk * 0.32;
  const moveSign = Math.sign(fwd || throttle || 1);
  car.yaw -= (steer * steerFeel + wobble + slipAng * (sliding ? 1.4 : 0.26)) * dt * moveSign;
  fx = -Math.sin(car.yaw);
  fz = -Math.cos(car.yaw);
  rx = Math.cos(car.yaw);
  rz = -Math.sin(car.yaw);
  fwd = vx * fx + vz * fz;
  lat = vx * rx + vz * rz;
  if (hb && steer && spd > 3) lat += steer * moveSign * Math.min(8.5, spd * 0.5) * dt * 9;
  const grip = (sliding ? 1.25 + drunk * 0.22 : 8.6) * (1 - Math.min(0.25, drunk * 0.2));
  lat *= Math.exp(-grip * dt);
  vx = fx * fwd + rx * lat;
  vz = fz * fwd + rz * lat;
  spd = Math.hypot(vx, vz);
  if (spd > maxV) {
    vx *= maxV / spd;
    vz *= maxV / spd;
    spd = maxV;
    fwd = vx * fx + vz * fz;
    lat = vx * rx + vz * rz;
  }
  car.vx = vx;
  car.vz = vz;
  car.speed = fwd;
  const slipAmt = spd > 0.45 ? lat / Math.max(2.3, spd) : 0;
  car.drift += (Math.max(-1.35, Math.min(1.35, slipAmt)) - car.drift) * Math.min(1, dt * 10);
  if (Math.abs(car.drift) < 0.01) car.drift = 0;
  const nx = car.x + vx * dt;
  const nz = car.z + vz * dt;
  const hit = resolveDrive(car, nx, nz);
  const bump = Math.hypot(hit.x - nx, hit.z - nz);
  if (hit.hitKind && bump > 0.012) {
    if (spd >= 5.6) {
      if (hit.hitCar) shoveCar(hit.hitCar, car, spd);
      car.x = hit.x;
      car.z = hit.z;
      car.speed = 0;
      car.drift = 0;
      car.vx = 0;
      car.vz = 0;
      syncCarMesh(car);
      runOverCops(car, spd);
      beginCrash(spd, hit.hitCar);
      return;
    }
    const inv = Math.max(dt, 0.0001);
    car.vx = ((hit.x - car.x) / inv) * 0.4;
    car.vz = ((hit.z - car.z) / inv) * 0.4;
    car.speed *= -0.18;
    car.drift *= 0.4;
    if (hit.hitCar && spd > 2.4) shoveCar(hit.hitCar, car, spd);
  }
  car.x = hit.x;
  car.z = hit.z;
  syncCarMesh(car);
  if (runOverCops(car, spd)) {
    car.speed *= 0.84;
    car.vx *= 0.84;
    car.vz *= 0.84;
  }
  const s = carSeat(car, 0);
  camera.position.set(s.x, s.y + spd * 0.008, s.z);
  bodyPos.set(s.x, s.y, s.z);
  audio.engineTick(car.speed);
  applyDrunkCam(dt, Math.min(0.22, spd * 0.004 + Math.abs(car.drift) * 0.09));
}

function stashLook() {
  if (inCar) {
    const s = carSeat(inCar, carSeatI);
    bodyPos.set(s.x, s.y, s.z);
    view2Yaw = savedYaw;
    view2Pitch = savedPitch;
    return;
  }
  if (viewMode === 2) {
    camera.rotation.order = "YXZ";
    camera.rotation.y = view2Yaw;
    camera.rotation.x = view2Pitch;
    savedYaw = view2Yaw;
    savedPitch = view2Pitch;
  } else {
    savedYaw = camera.rotation.y;
    savedPitch = camera.rotation.x;
  }
  bodyPos.copy(camera.position);
}

function restoreBodyPos() {
  camera.position.copy(bodyPos);
  if (inCar || viewMode === 2) {
    camera.rotation.order = "YXZ";
    camera.rotation.y = inCar ? savedYaw : view2Yaw;
    camera.rotation.x = inCar ? savedPitch : view2Pitch;
    camera.rotation.z = 0;
    camera.quaternion.setFromEuler(camera.rotation);
  }
  camera.updateMatrix();
}

function restoreBodyLook() {
  camera.position.copy(bodyPos);
  camera.rotation.order = "YXZ";
  if (inCar || viewMode === 2) {
    camera.rotation.y = inCar ? savedYaw : view2Yaw;
    camera.rotation.x = inCar ? savedPitch : view2Pitch;
  } else {
    camera.rotation.y = savedYaw;
    camera.rotation.x = savedPitch;
  }
  camera.rotation.z = 0;
  camera.quaternion.setFromEuler(camera.rotation);
}

function aimLocalHeadAtCamera() {
  const head = localPeer?.rig?.userData?.head;
  if (!head) return;
  localPeer.rig.updateMatrixWorld(true);
  const parent = head.parent;
  if (!parent) return;
  parent.worldToLocal(_headAim.copy(camera.position));
  const dx = _headAim.x - head.position.x;
  const dy = _headAim.y - head.position.y;
  const dz = _headAim.z - head.position.z;
  head.rotation.order = "YXZ";
  head.rotation.y = THREE.MathUtils.clamp(Math.atan2(dx, dz), -1.4, 1.4);
  head.rotation.x = THREE.MathUtils.clamp(-Math.atan2(dy, Math.hypot(dx, dz) || 1e-6), -1.15, 0.9);
  head.rotation.z = 0;
}

function orbitHeadCam(head, dist, yaw, pit, front) {
  const p = THREE.MathUtils.clamp(pit, -1.35, 1.35);
  const cp = Math.cos(p);
  const sp = Math.sin(p);
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const s = front ? 1 : -1;
  _camDir.set(s * fx * cp, s * sp, s * fz * cp);
  const mag = _camDir.length();
  if (mag < 1e-8) {
    camera.position.set(head.x, Math.max(0.16, head.y), head.z);
    camera.lookAt(head.x, head.y, head.z);
    return;
  }
  _camDir.multiplyScalar(1 / mag);
  let t = camRayHit(head.x, head.y, head.z, _camDir.x, _camDir.y, _camDir.z, dist);
  t = Math.max(0.22, Math.min(dist, t - 0.14));
  camera.position.set(head.x + _camDir.x * t, head.y + _camDir.y * t, head.z + _camDir.z * t);
  if (camera.position.y < 0.16) {
    const dy = _camDir.y;
    if (dy < -1e-6) {
      const u = (0.16 - head.y) / dy;
      if (u > 0 && u < t) {
        t = u;
        camera.position.set(head.x + _camDir.x * t, 0.16, head.z + _camDir.z * t);
      } else camera.position.y = 0.16;
    } else camera.position.y = 0.16;
  }
  camera.lookAt(head.x, head.y, head.z);
}

function snapLocalRig() {
  if (!localPeer?.rig || inCar) return;
  const eye = eyeY();
  const off = sitting ? 0.22 : Math.max(0, bodyPos.y - eye);
  localPeer.rig.position.set(bodyPos.x, off, bodyPos.z);
  localPeer.rig.rotation.y = localPeer.byaw ?? localPeer.tyaw;
}

function localHeadWorld() {
  const head = localPeer?.rig?.userData?.head;
  if (!head) {
    _headWorld.set(bodyPos.x, inCar ? 1.18 : bodyPos.y, bodyPos.z);
    return _headWorld;
  }
  snapLocalRig();
  localPeer.rig.updateMatrixWorld(true);
  head.getWorldPosition(_headWorld);
  return _headWorld;
}

function applyView() {
  const drunk = drunkLevel();
  const yaw = viewMode === 2 ? view2Yaw : savedYaw;
  const pitch = viewMode === 2 ? view2Pitch : savedPitch;
  const showBody = viewMode !== 1;
  if (rightHand) rightHand.visible = viewMode === 1 && !inCar;
  if (leftHand) leftHand.visible = viewMode === 1 && !inCar;
  if (localPeer) {
    localPeer.tx = bodyPos.x;
    localPeer.tz = bodyPos.z;
    localPeer.ty = inCar ? eyeY() : bodyPos.y;
    localPeer.tyaw = (inCar ? inCar.yaw : yaw) + Math.PI;
    localPeer.tpit = inCar ? 0 : pitch;
    localPeer.bac = drunk;
    localPeer.held = heldLabel();
    localPeer.gf = glassState.fill;
    localPeer.gc = glassState.fill > 0.02 ? mixColor(glassState.parts) : 0;
    localPeer.pouring = pouring;
    localPeer.sit = Boolean(sitting);
    localPeer.pants = onToilet();
    localPeer.pee = Boolean(peeing);
    localPeer.peeAim = peeing ? peeTargetOf() : null;
    localPeer.gender = localGender;
    localPeer.freezeFacing = true;
    localPeer.freezeHead = viewMode === 2;
    localPeer.bodyLock = sitting?.yaw != null ? sitting.yaw : inCar ? inCar.yaw + Math.PI : null;
    const showSelf = showBody;
    const u = localPeer.rig.userData;
    localPeer.rig.visible = showSelf;
    if (u.body) u.body.visible = showSelf;
    if (u.head) u.head.visible = showBody;
    if (u.armL) u.armL.visible = showBody;
    if (u.armR) u.armR.visible = showBody;
    if (u.tag) u.tag.visible = showBody;
    const cupOn = localPeer.held === "cup";
    if (u.held) u.held.visible = showBody && Boolean(localPeer.held) && !cupOn;
    if (u.cup) u.cup.visible = showBody && cupOn;
    if (inCar) {
      const s = carSeat(inCar, carSeatI);
      localPeer.rig.position.set(s.x, 0.12, s.z);
      localPeer.byaw = inCar.yaw + Math.PI;
      localPeer.rig.rotation.y = localPeer.byaw;
    }
  }
  if (viewMode === 1) {
    if (inCar) {
      const s = carSeat(inCar, carSeatI);
      camera.position.set(s.x, s.y, s.z);
    }
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    return;
  }
  const dist = viewMode === 2 ? (inCar ? 5.4 : 2.55) : inCar ? 8.4 : 3.5;
  const head = localHeadWorld();
  if (viewMode === 2) {
    orbitHeadCam(head, dist, yaw, pitch, true);
    aimLocalHeadAtCamera();
  } else {
    orbitHeadCam(head, dist, yaw, pitch, false);
  }
}

function updateLocalAvatar(dt) {
  if (!localPeer) return;
  tickAvatar(localPeer, dt, tWorld);
}

function updatePlayer(dt) {
  if (inCar) {
    bindRideCar(null);
    maybeTakeWheel();
    if (carSeatI === 0) updateCar(dt);
    else {
      const s = carSeat(inCar, carSeatI);
      const spd = Math.hypot(inCar.vx || 0, inCar.vz || 0) || Math.abs(inCar.speed || 0);
      camera.position.set(s.x, s.y + spd * 0.008, s.z);
      bodyPos.set(s.x, s.y, s.z);
      applyDrunkCam(dt, Math.min(0.16, spd * 0.004 + Math.abs(inCar.drift || 0) * 0.05));
    }
    return;
  }
  stickToRideCar();
  if (sitting) {
    if (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || keys.Space) standUp();
    else {
      camera.position.set(sitting.x, sitHeight(), sitting.z);
      applyDrunkCam(dt);
      return;
    }
  }
  const drunk = drunkLevel();
  const stunned = stunT > 0;
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 4.2 : 2.6) * (1 - Math.min(0.7, drunk * 0.42)) * (peeing ? 0.45 : 1) * (stunned ? 0.12 : 1);
  const fwd = Number(!!keys.KeyW) - Number(!!keys.KeyS);
  const side = Number(!!keys.KeyD) - Number(!!keys.KeyA);
  const len = Math.hypot(fwd, side);
  if (len > 0) {
    const f = (fwd / len) * speed * dt;
    const s = (side / len) * speed * dt;
    const slip = (Math.random() - 0.5) * drunk * 0.4 * dt;
    const hitch = Math.max(0, Math.sin(walkT)) * drunk * 0.7 * dt;
    if (viewMode === 2) {
      const yaw = view2Yaw;
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const rx = Math.cos(yaw);
      const rz = -Math.sin(yaw);
      camera.position.x += fx * (f + slip - hitch * 0.35) + rx * (s + slip * 0.5 + hitch);
      camera.position.z += fz * (f + slip - hitch * 0.35) + rz * (s + slip * 0.5 + hitch);
    } else {
      camera.updateMatrix();
      controls.moveForward(f + slip - hitch * 0.35);
      controls.moveRight(s + slip * 0.5 + hitch);
    }
  }
  const eye = eyeY();
  if (keys.Space && onGround && !peeing) {
    vy = standY > 0.5 ? 6.55 : 5.85;
    onGround = false;
    audio.jump();
  }
  if (!onGround) {
    vy -= 18 * dt;
    camera.position.y += vy * dt;
  }
  const feet = camera.position.y - eye;
  const [nx, nz] = collide(camera.position.x, camera.position.z, 0.28, onGround ? standY : Math.max(feet, standY), !onGround);
  camera.position.x = nx;
  camera.position.z = nz;
  const top = climbTopUnder(nx, nz, onGround ? standY : feet, !onGround);
  if (!onGround) {
    const want = eye + top;
    const canVault = top > standY + 0.05 && feet + 0.72 >= top && (vy <= 0.55 || feet >= top - 0.74);
    if (canVault || (vy <= 0 && camera.position.y <= want + 0.04)) {
      audio.land(top > standY + 0.15 || vy < -2.6);
      standY = top;
      camera.position.y = want;
      vy = 0;
      onGround = true;
      bindRideCar(top > 0.2 ? climbCarHit : null);
    }
  } else if (top < standY - 0.05) {
    onGround = false;
    if (top < 0.2) bindRideCar(null);
  } else {
    standY = top;
    bindRideCar(top > 0.2 ? climbCarHit : null);
  }
  const ceil = ceilingAt(nx, nz);
  const headClear = 0.16;
  if (Number.isFinite(ceil) && camera.position.y + headClear > ceil) {
    camera.position.y = ceil - headClear;
    if (vy > 0.2) audio.bump();
    if (vy > 0) vy = -Math.min(2.2, vy * 0.35);
  }
  if (onGround && len > 0) {
    const prevWalk = walkT;
    walkT += dt * (7 + drunk * 5);
    if (((prevWalk / Math.PI) | 0) !== ((walkT / Math.PI) | 0)) audio.step();
    const limpBob = 0.055 + drunk * 0.05;
    const hitchBob = Math.max(0, -Math.sin(walkT)) * drunk * 0.04;
    camera.position.y = Math.min(eye + standY + Math.abs(Math.sin(walkT)) * limpBob + hitchBob, (Number.isFinite(ceil) ? ceil : 99) - headClear);
  } else if (onGround) {
    camera.position.y = Math.min(eye + standY, (Number.isFinite(ceil) ? ceil : 99) - headClear);
  }
  if (!inCar && (knockVx || knockVz)) {
    const [kx, kz, nvx, nvz] = stepKnock(camera.position.x, camera.position.z, knockVx, knockVz, dt, collide, 0.28);
    camera.position.x = kx;
    camera.position.z = kz;
    knockVx = nvx;
    knockVz = nvz;
    bodyPos.x = kx;
    bodyPos.z = kz;
  }
  applyDrunkCam(dt, stunT > 0 ? 0.2 : 0);
  if (camera.position.z > 16 && tryPads()) return;
}

function bottleNearGlass() {
  if (!held || !glassMesh || held === glassMesh) return false;
  if (held.userData.kind !== "bottle") return false;
  held.updateMatrixWorld(true);
  glassMesh.updateMatrixWorld(true);
  const tip = new THREE.Vector3(0, 0.18, 0);
  held.localToWorld(tip);
  const dim = glassDims(glassState.type);
  const rim = new THREE.Vector3(0, dim.y + dim.h, 0);
  glassMesh.localToWorld(rim);
  return Math.hypot(tip.x - rim.x, tip.z - rim.z) < 0.38 && tip.y > rim.y - 0.22;
}

function updatePour(dt) {
  const overGlass = (look && look.userData.kind === "glass") || bottleNearGlass();
  const fromHand =
    mouseDown &&
    held &&
    held.userData.kind === "bottle" &&
    overGlass &&
    held.userData.volume > 0 &&
    glassState.fill < 1;
  const fromShelf =
    mouseDown &&
    held &&
    held.userData.kind === "glass" &&
    look &&
    look.userData.kind === "bottle" &&
    (look.userData.volume || 0) > 0 &&
    glassState.fill < 1;
  const should = fromHand || fromShelf;
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
  const src = fromHand ? held : look;
  const add = pourIntoGlass(src.userData.drink, dt * 0.55);
  src.userData.volume = Math.max(0, (src.userData.volume || 1) - add);
  if (Math.random() < 0.6 && fromHand) spawnDrop();
  if (fromHand && held.userData.volume <= 0) {
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
  if (punchT > 0) punchT = Math.max(0, punchT - dt);
  if (stunT > 0) stunT = Math.max(0, stunT - dt);
  if (crashCool > 0) crashCool = Math.max(0, crashCool - dt);
  if (hurtFlash > 0) {
    hurtFlash = Math.max(0, hurtFlash - dt * 1.35);
    const hurt = $("hurt");
    if (hurt) hurt.style.opacity = String(hurtFlash);
  } else {
    const hurt = $("hurt");
    if (hurt && hurt.style.opacity !== "0") hurt.style.opacity = "0";
  }
  if (peeing && peeUntil && tWorld > peeUntil) {
    const flush = sitting?.kind === "toilet";
    peeing = false;
    peeUntil = 0;
    audio.peeStop();
    if (flush) audio.flush();
  }
  if (peeing && glassState.fill < 1) {
    const aim = peeTargetOf();
    const cups = glassCatchVolumes();
    const aimed = !!(aim && cups.some((c) => {
      const dx = (aim.x || 0) - c.x;
      const dz = (aim.z || 0) - c.z;
      return dx * dx + dz * dz <= (c.r + 0.24) ** 2;
    }));
    if (held === glassMesh || aimed) catchPeeInCup(dt * PEE_FILL_RATE);
  }
  if (localGender === "f" && peeing && sitting?.kind !== "toilet") {
    peeing = false;
    peeUntil = 0;
    audio.peeStop();
  }
  if (bac > 0.0001) {
    if (tWorld < bacHoldUntil) {
      bacWait = bacHoldUntil - tWorld;
      bacSoberT = 0;
      bacDecayFrom = 0;
      bacDecayStart = 0;
    } else {
      bacWait = 0;
      if (!bacDecayStart) {
        bacDecayStart = tWorld;
        bacDecayFrom = bac;
      }
      bacSoberT = tWorld - bacDecayStart;
      const tau = 15;
      const u = (Math.exp(bacSoberT / tau) - 1) / (Math.exp(BAC_FADE / tau) - 1);
      bac = Math.max(0, bacDecayFrom * (1 - Math.min(1, u)));
      if (bacSoberT >= BAC_FADE || bac <= 0.00005) {
        bac = 0;
        bacSoberT = 0;
        bacDecayFrom = 0;
        bacDecayStart = 0;
        bacHoldUntil = 0;
      }
    }
  } else {
    bac = 0;
    bacWait = 0;
    bacSoberT = 0;
    bacDecayFrom = 0;
    bacDecayStart = 0;
    bacHoldUntil = 0;
  }
  if (neonA) neonA.intensity = 3.0 + Math.sin(tWorld * 7) * 0.3 + (Math.random() < 0.015 ? -0.8 : 0);
  if (neonB) neonB.intensity = 1.8 + Math.sin(tWorld * 5 + 1) * 0.2;
  if (jukeLight) jukeLight.color.setHSL((tWorld * 0.12) % 1, 0.85, 0.55);
  tickFrontDoor(dt);
  tickBathrooms(dt);
  tickCarDoors(dt);
  tickDriftFx(dt);
  restoreBodyPos();
  look = null;
  if (playing()) {
    const p = pick();
    look = p ? p.root : null;
    updatePlayer(dt);
    tickRemoteCars(dt);
    stickToRideCar();
    tickPolice(dt);
    if (!inCar) updatePour(dt);
    stashLook();
  } else {
    audio.pourStop();
    if (started && !passedOut && chatOpen) applyDrunkCam(dt);
  }
  updateDrops(dt);
  updateDeliveries(dt);
  if (playing()) houseGames?.tick(dt, tWorld);
  $("prompt").textContent = playing() ? promptFrom(look) : "";
  if (chatLines.length && !chatOpen) paintChat();
  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) $("toast").classList.remove("show");
  }
  if (winPopT > 0) {
    winPopT -= dt;
    if (winPopT <= 0) {
      const el = $("winPop");
      if (el) el.className = "";
    }
  }
  poseViewPants(dt);
  poseHands();
  try {
    tickMultiplayer(dt);
  } catch (err) {
    console.warn("mp", err);
  }
  const peerN = remotePeers().length;
  if (peerN !== lastPeerN) {
    lastPeerN = peerN;
    if (peerN && playing()) publishWorldSync();
  }
  seatRemoteDrivers();
  applyView();
  applyDrunkLook();
  if (localPeer) updateLocalAvatar(dt);
  tickHeartbeat(dt);
  hud();
  renderer.render(scene, camera);
  restoreBodyLook();
}

function bind() {
  window.addEventListener("resize", resize);
  const ident = loadIdentity();
  if ($("playerName")) $("playerName").value = ident.name;
  if ($("barCode")) $("barCode").value = ident.room.toUpperCase();
  localGender = ident.gender === "f" ? "f" : "m";
  document.querySelectorAll(".gender-picks button").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.g === localGender);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      localGender = btn.dataset.g === "f" ? "f" : "m";
      document.querySelectorAll(".gender-picks button").forEach((b) => b.classList.toggle("on", b === btn));
      try { localStorage.setItem("infinite-pour-gender", localGender); } catch (err) { /* ignore */ }
      if (onGround && !sitting && !inCar) {
        camera.position.y = eyeY() + standY;
        bodyPos.y = eyeY() + standY;
      }
    });
  });
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
    if (!summonOpen && !chatOpen && !passedOut && !started) $("title").classList.remove("hidden");
  });
  window.addEventListener("mousedown", (e) => {
    if (e.target.closest("#restock") || e.target.closest("#warp")) return;
    if (e.button !== 0) return;
    mouseDown = true;
    dragging = started && !controls.isLocked && !summonOpen && !chatOpen;
    if (!started) return;
    if (!controls.isLocked && !summonOpen && !chatOpen && !passedOut && !e.target.closest("#summon") && !e.target.closest("#chat") && !e.target.closest("#restock") && !e.target.closest("#warp")) {
      controls.lock();
    }
    if (playing() && houseGames?.pointerDown(look)) {
      return;
    }
    if (playing() && houseGames?.playing?.() == null && inCar == null && sitting == null && !peeing) {
      punchT = 0.32;
      if (localPeer) localPeer.punchT = 0.32;
      audio.punch();
      if (tryPunch() || punchCops()) audio.hit();
    }
    if (playing() && look && look !== held) {
      if (look.userData.kind === "bottle") {
        if (!(held && held.userData.kind === "glass")) attachHeld(look);
      } else if (look.userData.kind === "glass" && !(held && held.userData.kind === "bottle")) attachHeld(look);
      else if (look.userData.kind === "cupstack") grabCupFromStack(look.userData.stack);
      else if (look.userData.kind === "baton") attachHeld(look);
    }
  });
  window.addEventListener("mouseup", () => {
    mouseDown = false;
    dragging = false;
    houseGames?.pointerUp();
  });
  window.addEventListener("mousemove", (e) => {
    if (inCar || viewMode === 2) {
      if (!started || summonOpen || chatOpen || passedOut) return;
      if (!controls.isLocked && !dragging) return;
      const dx = e.movementX * 0.0024;
      const dy = e.movementY * 0.0024;
      if (inCar) {
        savedYaw -= dx;
        savedPitch = THREE.MathUtils.clamp(savedPitch - dy, -0.92, 0.58);
        view2Yaw = savedYaw;
        view2Pitch = savedPitch;
      } else {
        view2Yaw -= dx;
        view2Pitch = THREE.MathUtils.clamp(view2Pitch - dy, -1.35, 1.35);
      }
      return;
    }
    if (!dragging || controls.isLocked || summonOpen || chatOpen) return;
    camera.rotation.y -= e.movementX * 0.0024;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - e.movementY * 0.0024, -1.2, 1.2);
  });
  window.addEventListener("keydown", (e) => {
    const typing =
      chatOpen ||
      e.target === $("q") ||
      e.target === $("chatQ") ||
      e.target === $("playerName") ||
      e.target === $("barCode") ||
      (e.target && e.target.closest && (e.target.closest("#summon") || e.target.closest("#chat")));
    if (e.code === "Space" && !typing) e.preventDefault();
    if (!typing) {
      if (!e.repeat) keys[e.code] = true;
      else if (e.code !== "KeyF" && e.code !== "KeyG") keys[e.code] = true;
    }
    if (summonOpenedBy && e.key.toLowerCase() === summonOpenedBy) {
      e.preventDefault();
    }
    if (chatOpenedBy && (e.code === "KeyT" || e.key.toLowerCase() === "t")) {
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
    if (chatOpen || e.target === $("chatQ")) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeChat();
      } else if (e.key === "Enter") {
        e.preventDefault();
        sendChat();
      } else if (e.key === "Tab") {
        e.preventDefault();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
        e.preventDefault();
        insertChatChar(drunkTypeChar(e.key));
      }
      return;
    }
    if (summonOpen && e.key === "Escape") closeSummon();
    if (!playing()) return;
    if (e.repeat && (e.code === "KeyF" || e.code === "KeyG" || e.code === "KeyE")) return;
    if (e.code === "KeyE") {
      e.preventDefault();
      if (inCar) {
        exitCar();
        return;
      }
      if (houseGames?.use(look) || houseGames?.use(null)) return;
      if (houseGames?.playing?.()) {
        houseGames.leave();
        return;
      }
      if (look && (look.userData.kind === "restroomDoor" || look.userData.kind === "stallDoor")) {
        toggleSwing(look);
        return;
      }
      if (look && look.userData.kind === "toilet") {
        if (sitting) {
          standUp();
          return;
        }
        sitOn(look.userData.sit || look.userData.toilet?.userData.sit);
        return;
      }
      if (sitting) {
        standUp();
        return;
      }
      if (look && look.userData.kind === "stool") {
        sitOn(look.userData.sit || look.userData.root?.userData.sit);
        return;
      }
      if (look && (look.userData.kind === "car" || look.userData.kind === "copcar")) {
        enterCar(look.userData.car);
        return;
      }
      const car = nearestCar(3.4);
      if (car && (!look || look.userData.kind === "car" || look.userData.kind === "copcar")) {
        enterCar(car);
        return;
      }
      useLook();
    }
    if (e.code === "KeyH") {
      e.preventDefault();
      warpBar();
    }
    if (e.code === "Digit1" || e.code === "Numpad1") {
      e.preventDefault();
      setView(1);
    }
    if (e.code === "Digit2" || e.code === "Numpad2") {
      e.preventDefault();
      setView(2);
    }
    if (e.code === "Digit3" || e.code === "Numpad3") {
      e.preventDefault();
      setView(3);
    }
    if (e.code === "KeyP") {
      e.preventDefault();
      if (e.repeat) return;
      togglePee();
    }
    if (e.code === "KeyQ") dropHeld();
    if (e.code === "KeyR") {
      glassState.fill = 0;
      glassState.parts = [];
      updateGlassVisual();
      hud();
      pokePose();
      audio.splash();
    }
    if (e.code === "KeyF") {
      if (held && held.userData.kind === "bottle") drinkHeld("sip");
      else drinkGlass("sip");
    }
    if (e.code === "KeyG") {
      if (held && held.userData.kind === "bottle") drinkHeld("chug");
      else drinkGlass("chug");
    }
    if (e.code === "KeyY") {
      e.preventDefault();
      openSummon("y");
    }
    if (e.code === "KeyT") {
      e.preventDefault();
      openChat();
    }
    if (e.code === "KeyC") {
      zoomHold = true;
    }
    if (e.code === "KeyB") {
      restockDrinks();
      publishRestock();
      toast("bar restocked for everyone");
      audio.restock();
    }
    const glassKeys = {
      Digit4: "pint",
      Digit5: "wine",
      Digit6: "rocks",
      Digit7: "shot",
      Digit8: "highball",
      Digit9: "coupe",
    };
    if (glassKeys[e.code]) setGlassType(glassKeys[e.code]);
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "KeyC") zoomHold = false;
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
  $("warp")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!started || passedOut) return;
    warpBar();
  });
}

bootTextures();
buildWorld();
rightHand = makeHand(1);
camera.add(rightHand);
leftHand = makeHand(-1);
camera.add(leftHand);
viewPants = makeViewPants();
camera.add(viewPants);
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

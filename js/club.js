/** Nightclub next door: DJ set, strobes, mingling crowd, walkable balcony. */
import * as THREE from "three";

const CX0 = 10.18;
const CX1 = 27.85;
const CZ0 = -6.42;
const CZ1 = 6.28;
const CLUB_H = 5.42;
const BALC_Y = 2.68;
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10);

const SKINS = [0xe8b48a, 0xd4a07a, 0xc48a62, 0xf0c4a0, 0x8a5a3a, 0xb88858];
const HAIRS = [0x1a100c, 0x3a1a12, 0xc9a227, 0x8a2018, 0x0c0c12, 0x4a2040, 0x2a140c, 0x5a3018, 0xc47820];
const TOPS = [0x120814, 0xff3dac, 0xc41e3a, 0xf4ead0, 0x3dfff2, 0x6b1c9a, 0xe8c547, 0x1a1a28, 0x2e6bff, 0x8a1028];
const BOTS = [0x121014, 0x1a1220, 0x2a1a14, 0x0c0c12, 0x3a2030, 0x1c2438];
const SHIRTS = [0x121014, 0xf4ead0, 0x2e6bff, 0xc41e3a, 0x3a2030, 0x1a2a38, 0x4a3020, 0x202028];
const SKY = [0xff2244, 0x2244ff, 0xaa22ff, 0xff44aa, 0x4422cc];

function hash01(...xs) {
  let h = 2166136261;
  for (const x of xs) h = Math.imul(h ^ Math.floor((x + 13.7) * 1000), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function addMesh(parent, geo, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = false;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function createClub(api) {
  const {
    scene,
    lambert,
    worldSolid,
    floorSolid,
    climbSolid,
    railSolid,
    camBox,
    addCeiling,
    blockCars,
    registerPick,
    makeHingeDoor,
    neonTex,
    audio,
    makeBottle,
    makeGlassMesh,
    randomDrink,
    trackLooseGlass,
  } = api;

  const crowd = [];
  const chairs = [];
  const strobes = [];
  const spots = [];
  const platters = [];
  const knobs = [];
  let ledWall = null;
  let fader = null;
  let built = false;

  function playerPos() {
    return api.playerPos?.() || { x: 0, y: 0, z: 0 };
  }

  function inside(x, z) {
    return x > CX0 + 0.12 && x < CX1 - 0.12 && z > CZ0 + 0.12 && z < CZ1 - 0.12;
  }

  const DECKS = [
    { minx: 10.50, maxx: 27.54, minz: -6.24, maxz: -3.86 },
    { minx: 24.60, maxx: 27.64, minz: -5.02, maxz: 0.98 },
    { minx: 10.36, maxx: 12.74, minz: -4.24, maxz: 1.94 },
  ];

  function onDeck(x, z, pad = 0) {
    return DECKS.some((d) => x >= d.minx - pad && x <= d.maxx + pad && z >= d.minz - pad && z <= d.maxz + pad);
  }

  function clampToDeck(x, z) {
    let bestX = x;
    let bestZ = z;
    let best = 1e9;
    for (const d of DECKS) {
      const cx = THREE.MathUtils.clamp(x, d.minx, d.maxx);
      const cz = THREE.MathUtils.clamp(z, d.minz, d.maxz);
      const dist = Math.hypot(x - cx, z - cz);
      if (dist < best) {
        best = dist;
        bestX = cx;
        bestZ = cz;
      }
    }
    return { x: bestX, z: bestZ };
  }

  function onBalcony(x, z) {
    return onDeck(x, z, 0.04);
  }

  function wall(x, z, sx, sy, sz, mat) {
    addMesh(scene, unitBox, mat, x, sy / 2, z, sx, sy, sz);
    worldSolid(x, z, Math.max(0.28, sx + 0.08), Math.max(0.28, sz + 0.08), sy);
    camBox(x, sy / 2, z, sx + 0.08, sy, sz + 0.08);
  }

  function strip(x, y, z, sx, sy, sz, hex) {
    addMesh(scene, unitBox, lambert(hex, { emissive: hex, emissiveIntensity: 0.85 }), x, y, z, sx, sy, sz);
  }

  function sign(text, col, w, h, x, y, z, yaw = 0) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: neonTex(text, col), side: THREE.DoubleSide, transparent: true })
    );
    m.position.set(x, y, z);
    m.rotation.y = yaw;
    scene.add(m);
    return m;
  }

  function spiritDrink() {
    return (
      randomDrink?.((d) => d.bottle === "spirit" && (d.abv || 0) <= 45) || {
        name: "Handle",
        bottle: "spirit",
        type: "spirit",
        abv: 40,
        color: 0xc47b20,
        label: 0xd4af37,
      }
    );
  }

  function clubDrink() {
    const drink =
      randomDrink?.((d) => {
        const abv = Number(d.abv) || 0;
        return abv > 0 && abv <= 12 && (d.bottle === "beer" || d.bottle === "can" || d.type === "wine" || d.type === "seltzer" || d.type === "cider");
      }) || {
        name: "Club pour",
        bottle: "beer",
        type: "beer",
        abv: 5,
        color: 0xc41e3a,
        label: 0x3dfff2,
      };
    return { ...drink, abv: Math.min(12, Number(drink.abv) || 5) };
  }

  function holdCup() {
    if (!makeGlassMesh) return null;
    const cup = makeGlassMesh("pint");
    cup.scale.multiplyScalar(0.82);
    cup.position.set(0.02, -0.38, 0.06);
    cup.rotation.set(0.18, 0.08, 0.12);
    cup.traverse((o) => {
      if (o.name === "liquid") {
        o.visible = true;
        o.scale.set(0.034, 0.07, 0.034);
        o.position.y = 0.05;
      }
      if (o.name === "meniscus") o.visible = false;
    });
    return cup;
  }

  function holdBottle() {
    if (!makeBottle) return null;
    const bot = makeBottle(spiritDrink());
    bot.scale.multiplyScalar(0.58);
    bot.position.set(0.03, -0.46, 0.05);
    bot.rotation.set(0.12, 0.18, 0.32);
    return bot;
  }

  function dressWoman(body, skin, seed) {
    const style = (hash01(seed, 5) * 7) | 0;
    const topHex = TOPS[(hash01(seed, 3) * TOPS.length) | 0];
    const botHex = BOTS[(hash01(seed, 12) * BOTS.length) | 0];
    const accHex = TOPS[(hash01(seed, 18) * TOPS.length) | 0];
    const top = lambert(topHex, { emissive: topHex, emissiveIntensity: 0.05 });
    const bot = lambert(style === 1 || style === 4 ? topHex : botHex);
    const acc = lambert(accHex, { emissive: accHex, emissiveIntensity: 0.08 });
    addMesh(body, unitBox, skin, 0, 0.82, 0, 0.2, 0.22, 0.12);
    addMesh(body, unitBox, skin, 0, 1.16, 0, 0.09, 0.11, 0.09);
    addMesh(body, unitBox, skin, 0, 1.01, 0.08, 0.03, 0.07, 0.03);
    addMesh(body, unitBox, top, -0.08, 1.03, 0.08, 0.15, 0.13, 0.11);
    addMesh(body, unitBox, top, 0.08, 1.03, 0.08, 0.15, 0.13, 0.11);
    addMesh(body, unitBox, top, 0, 1.1, 0.07, 0.3, 0.05, 0.11);
    if (style === 1 || style === 4) {
      addMesh(body, unitBox, top, 0, 0.76, 0.02, 0.3, 0.36, 0.16);
    } else if (style === 2) {
      addMesh(body, unitBox, top, 0, 0.98, 0.03, 0.28, 0.08, 0.15);
      addMesh(body, unitBox, top, 0, 1.16, 0.02, 0.045, 0.14, 0.045);
      addMesh(body, unitBox, bot, 0, 0.62, 0.01, 0.23, 0.12, 0.14);
    } else if (style === 5) {
      addMesh(body, unitBox, top, 0, 1.0, 0.03, 0.3, 0.07, 0.15);
      addMesh(body, unitBox, bot, 0, 0.66, 0, 0.2, 0.15, 0.12);
    } else if (style === 6) {
      addMesh(body, unitBox, acc, 0, 0.99, 0.04, 0.3, 0.09, 0.16);
      addMesh(body, unitBox, bot, 0, 0.63, 0.01, 0.22, 0.13, 0.14);
    } else {
      addMesh(body, unitBox, top, 0, 0.99, 0.03, 0.28, 0.08, 0.15);
      addMesh(body, unitBox, bot, 0, 0.66, 0, 0.2, 0.15, 0.12);
    }
    if (hash01(seed, 19) > 0.55) addMesh(body, unitBox, acc, 0, 1.12, 0.02, 0.12, 0.02, 0.12);
    if (hash01(seed, 20) > 0.62) addMesh(body, unitBox, lambert(0xc9a227), -0.11, 0.62, 0.02, 0.03, 0.04, 0.03);
    return { style, top, bot, skinny: style === 0 || style === 3 || style === 5, mini: style === 2 || style === 6 };
  }

  function dressGuard(body, skin) {
    const shirt = lambert(0xf4ead0);
    const jacket = lambert(0x0c0c10);
    const pants = lambert(0x101014);
    const tie = lambert(0x1a1014);
    addMesh(body, unitBox, skin, 0, 0.98, 0, 0.32, 0.36, 0.18);
    addMesh(body, unitBox, skin, 0, 1.2, 0, 0.15, 0.14, 0.13);
    addMesh(body, unitBox, shirt, 0, 0.98, 0.03, 0.3, 0.4, 0.16);
    addMesh(body, unitBox, jacket, 0, 0.97, 0.0, 0.44, 0.52, 0.24);
    addMesh(body, unitBox, tie, 0, 0.94, 0.12, 0.05, 0.28, 0.02);
    addMesh(body, unitBox, pants, 0, 0.68, 0, 0.38, 0.2, 0.22);
    return { shirt: jacket, pants };
  }

  function dressMan(body, skin, seed, dj) {
    const style = dj ? 4 : (hash01(seed, 6) * 6) | 0;
    const shirtHex = dj ? 0x121014 : SHIRTS[(hash01(seed, 3) * SHIRTS.length) | 0];
    const pantHex = BOTS[(hash01(seed, 7) * BOTS.length) | 0];
    const extraHex = SHIRTS[(hash01(seed, 16) * SHIRTS.length) | 0];
    const shirt = lambert(shirtHex, { emissive: shirtHex, emissiveIntensity: 0.04 });
    const pants = lambert(pantHex);
    addMesh(body, unitBox, skin, 0, 0.96, 0, 0.26, 0.3, 0.14);
    addMesh(body, unitBox, skin, 0, 1.18, 0, 0.1, 0.11, 0.1);
    addMesh(body, unitBox, shirt, 0, 0.95, 0.01, 0.36, 0.46, 0.2);
    if (style === 1) {
      addMesh(body, unitBox, shirt, 0, 1.16, 0.05, 0.22, 0.05, 0.12);
    } else if (style === 2) {
      addMesh(body, unitBox, lambert(0x1a1a22), 0, 0.98, 0.04, 0.4, 0.42, 0.22);
    } else if (style === 3) {
      addMesh(body, unitBox, shirt, 0, 1.14, 0.06, 0.16, 0.04, 0.1);
    } else if (style === 5) {
      addMesh(body, unitBox, lambert(extraHex), 0, 0.92, 0.04, 0.4, 0.38, 0.22);
      addMesh(body, unitBox, lambert(extraHex), 0, 1.14, 0.02, 0.2, 0.08, 0.16);
    } else if (dj || style === 4) {
      addMesh(body, unitBox, lambert(0x1a1a22), 0, 0.98, 0.03, 0.38, 0.44, 0.22);
    }
    addMesh(body, unitBox, pants, 0, 0.68, 0, 0.34, 0.18, 0.2);
    if (!dj && hash01(seed, 17) > 0.7) addMesh(body, unitBox, lambert(0xc9a227), 0, 1.08, 0.11, 0.04, 0.1, 0.01);
    return { style, shirt, pants };
  }

  function makeGoer(kind, seed) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const girl = kind === "f" || kind === "djf";
    const dj = kind === "dj" || kind === "djf";
    const guard = kind === "guard";
    const skinHex = guard ? 0x8a5a3a : SKINS[(hash01(seed, 1) * SKINS.length) | 0];
    const hairHex = HAIRS[(hash01(seed, 2) * HAIRS.length) | 0];
    const skin = lambert(skinHex, { emissive: 0x3a1810, emissiveIntensity: 0.12 });
    const hair = lambert(guard ? 0x1a100c : hairHex);
    const shoe = lambert(girl ? 0x1a0a10 : 0x121014);
    const eye = lambert(0x140808);
    const fit = girl ? dressWoman(body, skin, seed) : guard ? dressGuard(body, skin) : dressMan(body, skin, seed, dj);
    const sleeve = girl ? skin : fit.shirt;
    const legMat = girl && (fit.skinny || fit.mini) ? skin : fit.bot || fit.pants;
    const skinny = !!(girl && fit.skinny);

    const head = new THREE.Group();
    head.position.set(0, 1.3, 0);
    head.rotation.order = "YXZ";
    head.scale.setScalar(1.06);
    addMesh(head, unitBox, skin, 0, 0, 0, 0.25, 0.25, 0.25);
    addMesh(head, unitBox, eye, -0.052, 0.03, 0.128, 0.055, 0.042, 0.03);
    addMesh(head, unitBox, eye, 0.052, 0.03, 0.128, 0.055, 0.042, 0.03);
    if (girl) {
      addMesh(head, unitBox, hair, 0, 0.12, -0.03, 0.32, 0.16, 0.34);
      addMesh(head, unitBox, hair, 0, -0.02, -0.16, 0.14, 0.3, 0.14);
      addMesh(head, unitBox, hair, 0.13, 0.05, 0.05, 0.09, 0.18, 0.18);
      addMesh(head, unitBox, hair, -0.13, 0.05, 0.05, 0.09, 0.18, 0.18);
      if (hash01(seed, 14) > 0.45) {
        addMesh(head, unitBox, lambert(0xe8c547), -0.14, 0.0, 0.04, 0.03, 0.08, 0.03);
        addMesh(head, unitBox, lambert(0xe8c547), 0.14, 0.0, 0.04, 0.03, 0.08, 0.03);
      }
    } else if (guard) {
      addMesh(head, unitBox, hair, 0, 0.11, -0.01, 0.28, 0.12, 0.28);
      addMesh(head, unitBox, hair, 0, 0.04, -0.12, 0.26, 0.12, 0.1);
      addMesh(head, unitBox, lambert(0x121014), 0, 0.03, 0.14, 0.17, 0.04, 0.03);
      addMesh(head, unitBox, lambert(0x2a2a32), 0.14, 0.02, 0.02, 0.03, 0.04, 0.03);
      addMesh(head, unitBox, lambert(0x2a2a32), 0.13, -0.08, -0.02, 0.012, 0.16, 0.012);
    } else {
      addMesh(head, unitBox, hair, 0, 0.12, -0.02, 0.3, 0.14, 0.3);
      addMesh(head, unitBox, hair, 0, 0.04, -0.13, 0.28, 0.14, 0.1);
      if (hash01(seed, 14) > 0.55) addMesh(head, unitBox, hair, 0, 0.02, 0.1, 0.2, 0.08, 0.08);
    }
    if (dj) {
      addMesh(head, unitBox, lambert(0x121014), 0, 0.02, 0, 0.3, 0.08, 0.22);
      addMesh(head, unitBox, lambert(0x1a1a22), -0.16, 0.02, 0, 0.06, 0.12, 0.1);
      addMesh(head, unitBox, lambert(0x1a1a22), 0.16, 0.02, 0, 0.06, 0.12, 0.1);
    }
    body.add(head);

    const armL = new THREE.Group();
    addMesh(armL, unitBox, sleeve, 0, -0.08, 0, 0.1, 0.3, 0.1);
    addMesh(armL, unitBox, skin, 0, -0.28, 0, 0.09, 0.14, 0.09);
    armL.position.set(0.23, 1.08, 0);
    body.add(armL);
    const armR = new THREE.Group();
    addMesh(armR, unitBox, sleeve, 0, -0.08, 0, 0.1, 0.3, 0.1);
    addMesh(armR, unitBox, skin, 0, -0.28, 0, 0.09, 0.14, 0.09);
    const heldRoll = hash01(seed, 8);
    let held = null;
    if (!dj && !guard && heldRoll > 0.58) {
      held = heldRoll > 0.82 ? holdBottle() : holdCup();
      if (held) armR.add(held);
    }
    armR.position.set(-0.23, 1.08, 0);
    body.add(armR);

    const lw = skinny ? 0.09 : 0.12;
    const legL = new THREE.Group();
    addMesh(legL, unitBox, girl && fit.mini ? skin : girl && skinny ? fit.bot || skin : legMat, 0, -0.2, 0, lw, 0.38, lw);
    addMesh(legL, unitBox, shoe, 0, -0.44, girl ? 0.04 : 0.02, 0.11, 0.08, girl ? 0.2 : 0.16);
    legL.position.set(-0.09, 0.72, 0);
    body.add(legL);
    const legR = new THREE.Group();
    addMesh(legR, unitBox, girl && fit.mini ? skin : girl && skinny ? fit.bot || skin : legMat, 0, -0.2, 0, lw, 0.38, lw);
    addMesh(legR, unitBox, shoe, 0, -0.44, girl ? 0.04 : 0.02, 0.11, 0.08, girl ? 0.2 : 0.16);
    legR.position.set(0.09, 0.72, 0);
    body.add(legR);

    if (girl) body.scale.setScalar(0.93);
    else if (guard) body.scale.set(1.04, 1.02, 1.04);
    else body.scale.setScalar(0.95);
    const stars = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      addMesh(stars, unitBox, lambert(0xffe066), Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2, 0.05, 0.05, 0.05);
    }
    stars.position.set(0, 0.26, 0);
    stars.visible = false;
    head.add(stars);

    g.userData = { body, head, armL, armR, legL, legR, stars, skin, held };
    return g;
  }

  function placePerson(kind, x, z, y, yaw, drunk, seed, mode, extra = {}) {
    const rig = makeGoer(kind, seed);
    rig.position.set(x, y, z);
    rig.rotation.y = yaw;
    scene.add(rig);
    const person = {
      rig,
      x,
      z,
      y,
      yaw,
      homeX: x,
      homeZ: z,
      tx: x,
      tz: z,
      drunk,
      gender: kind === "f" || kind === "djf" ? "f" : "m",
      r: kind === "guard" ? 0.46 : kind.startsWith("dj") ? 0.4 : 0.4,
      phase: hash01(seed, 21) * Math.PI * 2,
      style: (hash01(seed, 22) * 4) | 0,
      mode,
      walk: hash01(seed, 23) * 10,
      wait: hash01(seed, 24) * 0.25,
      speed: 1.2 + hash01(seed, 25) * 0.95,
      partner: extra.partner || null,
      chair: extra.chair || null,
      kissSide: extra.kissSide || 0,
      hp: 10,
      hurtT: 0,
      dead: false,
    };
    crowd.push(person);
    return person;
  }

  function packSpots(cx, cz, w, d, n, minR, avoid, taken = []) {
    const out = [];
    let tries = 0;
    const blocked = (x, z) =>
      !!(avoid && avoid(x, z)) ||
      out.some((s) => Math.hypot(s.x - x, s.z - z) < minR) ||
      taken.some((s) => Math.hypot(s.x - x, s.z - z) < minR);
    while (out.length < n && tries < n * 90) {
      tries++;
      const x = cx + (hash01(tries, n, 3) - 0.5) * w;
      const z = cz + (hash01(tries, n, 7) - 0.5) * d;
      if (blocked(x, z)) continue;
      out.push({ x, z });
    }
    taken.push(...out);
    return out;
  }

  function packLine(x0, z0, x1, z1, n, minR, avoid, taken, yaw) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = n <= 1 ? 0.5 : i / (n - 1);
      const x = x0 + (x1 - x0) * u;
      const z = z0 + (z1 - z0) * u;
      if (avoid && avoid(x, z)) continue;
      if (taken.some((s) => Math.hypot(s.x - x, s.z - z) < minR)) continue;
      out.push({ x, z, yaw });
    }
    taken.push(...out);
    return out;
  }

  function blockedFloor(x, z) {
    if (x > 24.8 && z > 1.02) return true;
    if (z < -3.4 && x > 15.1 && x < 22.9) return true;
    if (x < 12.6 && z > 2.85) return true;
    if (Math.abs(x - 19) < 1.2 && z > 5.05) return true;
    if (x < CX0 + 0.55 || x > CX1 - 0.55) return true;
    if (z < CZ0 + 0.55 || z > CZ1 - 0.55) return true;
    return false;
  }

  function buildBooth() {
    const dark = lambert(0x121018);
    const deck = lambert(0x1a1a24);
    const chrome = lambert(0xc8d0d8);
    const glow = lambert(0xff3dac, { emissive: 0xff3dac, emissiveIntensity: 0.7 });
    const cyan = lambert(0x3dfff2, { emissive: 0x3dfff2, emissiveIntensity: 0.6 });
    addMesh(scene, unitBox, dark, 19.0, 0.2, -5.15, 6.2, 0.4, 2.0);
    worldSolid(19.0, -5.15, 6.3, 2.1, 0.4);
    climbSolid(19.0, -5.15, 6.3, 2.1, 0.4);
    addMesh(scene, unitBox, deck, 19.0, 0.74, -5.22, 4.8, 0.08, 1.2);
    worldSolid(19.0, -5.22, 4.9, 1.25, 0.8);
    addMesh(scene, unitBox, lambert(0x0a0a10), 17.55, 0.84, -5.1, 1.2, 0.08, 0.72);
    addMesh(scene, unitBox, lambert(0x0a0a10), 20.45, 0.84, -5.1, 1.2, 0.08, 0.72);
    addMesh(scene, unitBox, lambert(0x16161e), 19.0, 0.86, -5.1, 0.95, 0.1, 0.58);
    for (const x of [17.2, 17.9, 20.1, 20.8]) {
      const platter = addMesh(scene, unitCyl, chrome, x, 0.9, -4.95, 0.09, 0.03, 0.09);
      addMesh(platter, unitCyl, lambert(0x121014), 0, 0.4, 0, 0.72, 0.4, 0.72);
      addMesh(platter, unitCyl, glow, 0, 0.7, 0, 0.12, 0.5, 0.12);
      platters.push(platter);
    }
    for (let i = 0; i < 8; i++) addMesh(scene, unitBox, i % 2 ? glow : cyan, 18.7 + (i - 3.5) * 0.08, 0.92, -5.1, 0.05, 0.04, 0.08);
    for (let i = 0; i < 6; i++) {
      const knob = addMesh(scene, unitCyl, cyan, 18.55 + i * 0.16, 0.93, -5.28, 0.03, 0.03, 0.03);
      knobs.push(knob);
    }
    fader = addMesh(scene, unitBox, cyan, 19.0, 0.94, -5.05, 0.18, 0.04, 0.06);
    addMesh(scene, unitBox, lambert(0x1a1a22), 19.0, 0.94, -5.48, 0.66, 0.08, 0.4);
    addMesh(scene, unitBox, lambert(0x3dfff2, { emissive: 0x2244aa, emissiveIntensity: 0.45 }), 19.0, 0.99, -5.48, 0.52, 0.01, 0.3);
    ledWall = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 1.8), new THREE.MeshBasicMaterial({ color: 0xff3dac }));
    ledWall.position.set(19.0, 2.2, -6.28);
    scene.add(ledWall);
    sign("PULSE", 0x3dfff2, 2.6, 0.42, 19.0, 3.22, -6.26);
    for (const x of [15.55, 22.45]) {
      addMesh(scene, unitBox, dark, x, 0.95, -5.4, 0.72, 1.75, 0.58);
      addMesh(scene, unitBox, glow, x, 1.58, -5.4, 0.55, 0.12, 0.4);
      addMesh(scene, unitBox, dark, x, 2.08, -5.4, 0.64, 0.5, 0.5);
      worldSolid(x, -5.4, 0.82, 0.68, 2.2);
    }
  }

  function buildStairs() {
    const wood = lambert(0x2a1a22);
    const tread = lambert(0x3a2430);
    const rail = lambert(0x3dfff2, { emissive: 0x3dfff2, emissiveIntensity: 0.4 });
    const n = 13;
    const rise = BALC_Y / n;
    const run = 0.36;
    const x = 26.1;
    const w = 2.08;
    const zTop = 1.18;
    for (let i = 0; i < n; i++) {
      const z = zTop + (n - 1 - i) * run;
      const h = (i + 1) * rise;
      addMesh(scene, unitBox, i % 2 ? tread : wood, x, h / 2, z, w, h, run - 0.04);
      climbSolid(x, z, w + 0.12, run + 0.05, h);
      camBox(x, h / 2, z, w + 0.04, h, run);
    }
    const railZ = zTop + 1.05 + ((n - 6) * run) / 2;
    const span = (n - 6) * run + 0.18;
    addMesh(scene, unitBox, rail, x - w / 2 - 0.03, 1.1, railZ, 0.05, 2.16, span);
    addMesh(scene, unitBox, rail, x + w / 2 + 0.03, 1.1, railZ, 0.05, 2.16, span);
    worldSolid(x - w / 2 - 0.03, railZ, 0.1, span, 2.16);
    worldSolid(x + w / 2 + 0.03, railZ, 0.1, span, 2.16);
    addMesh(scene, unitBox, wood, x, BALC_Y - 0.07, 1.08, w + 0.1, 0.14, 0.34);
    floorSolid(x, 1.08, w + 0.14, 0.36, BALC_Y, 0.16);
    strip(x, 0.04, zTop + (n - 1) * run + 0.2, w - 0.24, 0.03, 0.08, 0x3dfff2);
    strip(x, BALC_Y + 0.02, 1.02, w - 0.28, 0.03, 0.04, 0x3dfff2);
  }

  function makeChair(x, z, yaw) {
    const seat = lambert(0xe45a88, { emissive: 0x7a2048, emissiveIntensity: 0.28 });
    const chrome = lambert(0xc8d4dc);
    addMesh(scene, unitBox, seat, x, BALC_Y + 0.28, z, 0.44, 0.09, 0.44);
    addMesh(scene, unitBox, seat, x + Math.sin(yaw) * 0.16, BALC_Y + 0.54, z + Math.cos(yaw) * 0.16, 0.44, 0.44, 0.08);
    for (const [sx, sz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
      addMesh(scene, unitCyl, chrome, x + sx, BALC_Y + 0.13, z + sz, 0.025, 0.26, 0.025);
    }
    const hit = addMesh(scene, unitBox, seat, x, BALC_Y + 0.24, z, 0.28, 0.1, 0.28);
    hit.userData.kind = "clubChair";
    hit.userData.root = hit;
    hit.userData.sitter = null;
    hit.userData.sit = {
      x,
      z,
      y: BALC_Y + 1.18,
      yaw,
      floor: BALC_Y,
      standX: x - Math.sin(yaw) * 0.5,
      standZ: z - Math.cos(yaw) * 0.5,
      fixture: hit,
    };
    registerPick(hit);
    chairs.push(hit);
    return hit;
  }

  function buildBalcony() {
    const plank = lambert(0x2a1824);
    const rail = lambert(0x3a2438);
    const glow = lambert(0xff3dac, { emissive: 0xff3dac, emissiveIntensity: 0.45 });
    const decks = [
      { x: 19.02, z: -5.05, w: 17.2, d: 2.55, ceil: true },
      { x: 26.12, z: -2.02, w: 3.22, d: 6.16, ceil: "walk" },
      { x: 11.55, z: -1.15, w: 2.55, d: 6.35, ceil: true },
    ];
    for (const d of decks) {
      addMesh(scene, unitBox, plank, d.x, BALC_Y - 0.07, d.z, d.w, 0.14, d.d);
      floorSolid(d.x, d.z, d.w, d.d, BALC_Y, 0.16);
      camBox(d.x, BALC_Y - 0.07, d.z, d.w, 0.14, d.d);
      if (d.ceil === true) addCeiling(d.x, d.z, d.w, d.d, BALC_Y - 0.08);
      if (d.ceil === "walk") addCeiling(d.x, -2.35, d.w, 5.3, BALC_Y - 0.08);
    }
    const rails = [
      { x: 17.05, z: -3.8, w: 13.1, d: 0.08 },
      { x: 24.52, z: -1.42, w: 0.08, d: 3.4 },
      { x: 12.8, z: -0.55, w: 0.08, d: 5.1 },
      { x: 10.42, z: -1.2, w: 0.08, d: 6.4 },
      { x: 27.64, z: -2.02, w: 0.08, d: 6.16 },
      { x: 11.55, z: 2.0, w: 2.5, d: 0.08 },
    ];
    for (const r of rails) {
      addMesh(scene, unitBox, rail, r.x, BALC_Y + 0.46, r.z, r.w, 0.92, r.d);
      addMesh(scene, unitBox, glow, r.x, BALC_Y + 0.88, r.z, Math.max(r.w, 0.04), 0.04, Math.max(r.d, 0.04));
      railSolid(r.x, r.z, Math.max(0.16, r.w + 0.06), Math.max(0.16, r.d + 0.06), BALC_Y, BALC_Y + 0.95);
    }
    for (const x of [12.4, 14.5, 16.6, 18.7, 20.8, 22.9]) makeChair(x, -4.55, 0);
    makeChair(25.4, -0.4, -Math.PI / 2);
    makeChair(25.4, -1.7, -Math.PI / 2);
    makeChair(25.4, -3.0, -Math.PI / 2);
    makeChair(12.1, -0.2, Math.PI / 2);
    makeChair(12.1, -1.6, Math.PI / 2);
    addMesh(scene, unitBox, lambert(0x2a1a22), 15.4, BALC_Y + 0.32, -5.4, 0.72, 0.08, 0.4);
    addMesh(scene, unitBox, lambert(0x2a1a22), 21.6, BALC_Y + 0.32, -5.4, 0.72, 0.08, 0.4);
  }

  function addSkySpot(x, z, phase, hex, kind = "wash") {
    const tight = kind === "strobe";
    const sl = new THREE.SpotLight(hex, tight ? 7.4 : 5.4, 26, tight ? 0.2 : 0.34, 0.38, 1.0);
    sl.position.set(x, 5.12, z);
    sl.target.position.set(19, 0.92, 0.25);
    scene.add(sl);
    scene.add(sl.target);
    const coneH = tight ? 5.7 : 5.25;
    const coneR = tight ? 0.34 : 0.7;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(coneR, coneH, 18, 1, true),
      new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: tight ? 0.08 : 0.16,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    cone.rotation.x = Math.PI / 2;
    cone.position.z = -coneH * 0.5;
    const beam = new THREE.Group();
    beam.add(cone);
    beam.position.copy(sl.position);
    scene.add(beam);
    spots.push({ light: sl, hex, phase, ax: x, az: z, beam, cone, kind, coneH });
  }

  function buildLights() {
    const wash = new THREE.PointLight(0x4a1840, 1.05, 16);
    wash.position.set(19.0, 3.5, 0.2);
    scene.add(wash);
    strobes.push({ light: wash, wash: true, phase: 0 });
    const booth = new THREE.PointLight(0xff66cc, 1.35, 8);
    booth.position.set(19.0, 2.7, -4.1);
    scene.add(booth);
    const vip = new THREE.PointLight(0xff88aa, 0.95, 8);
    vip.position.set(19.0, 4.5, -4.7);
    scene.add(vip);
    const skyPos = [
      [13.2, -2.4],
      [16.8, -2.4],
      [20.4, -2.4],
      [24.0, -2.4],
      [13.2, 1.8],
      [16.8, 1.8],
      [20.4, 1.8],
      [24.0, 1.8],
      [14.6, -0.3],
      [19.0, -0.3],
      [23.2, -0.3],
      [15.4, 3.4],
      [19.0, 3.4],
      [22.6, 3.4],
    ];
    skyPos.forEach((pt, i) => addSkySpot(pt[0], pt[1], i * 0.72, SKY[i % SKY.length], "wash"));
    const strobePos = [
      [12.8, -3.1],
      [25.1, -3.1],
      [12.8, 3.6],
      [25.1, 3.6],
      [19.0, 4.2],
      [19.0, -3.4],
    ];
    strobePos.forEach((pt, i) => addSkySpot(pt[0], pt[1], i * 1.15 + 0.4, SKY[(i + 2) % SKY.length], "strobe"));
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(SKY[i % SKY.length], 0.4, 8);
      pl.position.set(14.2 + (i % 2) * 8.4, 4.85, -1.4 + Math.floor(i / 2) * 3.6);
      scene.add(pl);
      strobes.push({ light: pl, hex: SKY[i % SKY.length], phase: i * 0.9 });
    }
  }

  function scatterTrash() {
    const puddleCols = [0xc41e3a, 0x3dfff2, 0x6b1c9a, 0xff3dac, 0x2e6bff];
    for (let i = 0; i < 52; i++) {
      const x = 11.05 + hash01(i, 2) * 13.2;
      const z = -3.25 + hash01(i, 5) * 8.8;
      if (blockedFloor(x, z)) continue;
      const roll = hash01(i, 8);
      const drink = clubDrink();
      if (makeGlassMesh && roll > 0.32) {
        const type = hash01(i, 9) > 0.64 ? "shot" : hash01(i, 10) > 0.5 ? "rocks" : "pint";
        const cup = makeGlassMesh(type);
        cup.scale.multiplyScalar(0.9);
        const tipped = roll > 0.68;
        cup.position.set(x, tipped ? 0.03 : 0.07, z);
        cup.rotation.set(tipped ? Math.PI / 2 : 0.06, hash01(i, 11) * 6, tipped ? 0.18 : 0.04);
        cup.userData.type = type;
        cup.userData.gtype = type;
        cup.userData.gfill = 0.16 + hash01(i, 14) * 0.34;
        cup.userData.gparts = [{ name: drink.name, amount: cup.userData.gfill, color: drink.color, abv: drink.abv }];
        scene.add(cup);
        registerPick(cup);
        trackLooseGlass?.(cup);
      } else if (makeBottle) {
        const bot = makeBottle(drink);
        bot.scale.multiplyScalar(0.72);
        bot.position.set(x, 0.04, z);
        bot.rotation.set(Math.PI / 2, hash01(i, 12) * 4, 0.15);
        bot.userData.stock = false;
        bot.userData.volume = 0.14 + hash01(i, 16) * 0.22;
        scene.add(bot);
        registerPick(bot);
      }
    }
    for (let i = 0; i < 38; i++) {
      const x = 11.0 + hash01(i, 20) * 13.3;
      const z = -3.2 + hash01(i, 21) * 8.7;
      if (blockedFloor(x, z)) continue;
      const col = puddleCols[i % puddleCols.length];
      const puddle = new THREE.Mesh(
        new THREE.CircleGeometry(0.1 + hash01(i, 22) * 0.18, 10),
        lambert(col, { transparent: true, opacity: 0.26, emissive: col, emissiveIntensity: 0.08 })
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(x, 0.015, z);
      scene.add(puddle);
    }
  }

  function balconyTargets() {
    return [
      [13.4, -4.5],
      [19.0, -4.4],
      [24.2, -4.45],
      [25.7, -4.2],
      [25.85, -2.4],
      [25.8, -0.6],
      [25.7, 0.55],
      [12.4, -2.2],
      [12.3, 0.4],
      [16.8, -4.6],
      [22.2, -4.5],
      [14.2, -4.3],
      [23.6, -4.2],
      [26.1, -3.4],
      [11.8, -3.6],
    ].filter((t) => onBalcony(t[0], t[1]));
  }

  function floorTargets() {
    const out = [];
    for (let i = 0; i < 72; i++) {
      const x = 11.15 + hash01(i, 40) * 13.4;
      const z = -3.15 + hash01(i, 41) * 8.6;
      if (!blockedFloor(x, z)) out.push([x, z]);
    }
    return out.length ? out : [[16.5, 0.4]];
  }

  function pickTarget(p) {
    const pool = p.y > 1 ? balconyTargets() : floorTargets();
    const t = pool[(hash01(p.x, p.z, p.wait + 1, p.phase) * pool.length) | 0] || pool[0];
    p.tx = t[0];
    p.tz = t[1];
  }

  function seatPerson(p, chair) {
    p.mode = "sit";
    p.chair = chair;
    p.x = chair.userData.sit.x;
    p.z = chair.userData.sit.z;
    p.y = BALC_Y;
    p.yaw = chair.userData.sit.yaw;
    chair.userData.sitter = p;
    p.rig.rotation.y = p.yaw;
  }

  function kickChair(chair) {
    const p = chair.userData.sitter;
    if (!p || p === "player") return false;
    chair.userData.sitter = null;
    p.chair = null;
    p.mode = "mingle";
    p.y = BALC_Y;
    p.x = chair.userData.sit.standX;
    p.z = chair.userData.sit.standZ;
    p.wait = 0.2;
    pickTarget(p);
    return true;
  }

  function facePartner(p) {
    if (!p.partner) return;
    p.yaw = Math.atan2(p.partner.x - p.x, p.partner.z - p.z);
    p.rig.rotation.y = p.yaw;
  }

  function addKiss(x, z, yaw, seed, y = 0) {
    if (y < 1 && blockedFloor(x, z)) return;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const gap = 0.39;
    const a = placePerson("f", x + fx * gap, z + fz * gap, y, yaw + Math.PI, 0.4 + hash01(seed, 60) * 0.5, seed, "kiss", {
      kissSide: -1,
    });
    const b = placePerson(hash01(seed, 61) > 0.25 ? "m" : "f", x - fx * gap, z - fz * gap, y, yaw, 0.35 + hash01(seed, 62) * 0.5, seed + 10, "kiss", {
      kissSide: 1,
    });
    a.partner = b;
    b.partner = a;
    a.r = 0.28;
    b.r = 0.28;
    facePartner(a);
    facePartner(b);
  }

  function buildCrowd() {
    const taken = [
      { x: 15.2, z: 1.8 },
      { x: 21.4, z: -0.6 },
      { x: 17.8, z: 3.1 },
      { x: 19.6, z: 0.8 },
    ];
    const dancers = packSpots(18.35, 0.9, 14.6, 8.3, 80, 0.76, blockedFloor, taken);
    dancers.forEach((s, i) => {
      const girl = hash01(i, 4) > 0.4;
      placePerson(girl ? "f" : "m", s.x, s.z, 0, (hash01(i, 11) - 0.5) * 2.2, 0.2 + hash01(i, 9) * 1.2, i + 3, "dance");
    });
    const minglers = packSpots(18.3, 0.95, 14.8, 8.4, 40, 0.8, blockedFloor, taken);
    minglers.forEach((s, i) => {
      const girl = hash01(i, 50) > 0.42;
      const p = placePerson(girl ? "f" : "m", s.x, s.z, 0, hash01(i, 51) * 6, 0.15 + hash01(i, 52) * 0.9, i + 80, "mingle");
      pickTarget(p);
    });
    const walls = [
      ...packLine(10.9, -3.15, 10.9, 2.45, 9, 0.78, blockedFloor, taken, Math.PI / 2),
      ...packLine(11.5, 5.52, 17.25, 5.52, 8, 0.78, blockedFloor, taken, Math.PI),
      ...packLine(20.75, 5.52, 23.35, 5.52, 4, 0.78, blockedFloor, taken, Math.PI),
      ...packLine(13.35, -3.22, 23.7, -3.22, 11, 0.78, blockedFloor, taken, 0),
      ...packLine(24.15, -3.05, 24.15, 0.55, 5, 0.78, blockedFloor, taken, -Math.PI / 2),
    ];
    walls.forEach((s, i) => {
      const girl = hash01(i, 88) > 0.38;
      const dance = hash01(i, 89) > 0.28;
      const p = placePerson(girl ? "f" : "m", s.x, s.z, 0, s.yaw || 0, 0.18 + hash01(i, 90) * 0.9, i + 240, dance ? "dance" : "mingle");
      if (!dance) pickTarget(p);
    });
    addKiss(15.2, 1.8, 0.4, 120);
    addKiss(21.4, -0.6, -0.7, 121);
    addKiss(17.8, 3.1, 1.2, 122);
    addKiss(19.6, 0.8, -0.2, 123);
    addKiss(16.4, -4.35, 0.2, 124, BALC_Y);
    addKiss(22.6, 2.4, -0.5, 125);
    addKiss(13.8, 1.15, 0.9, 126);
    placePerson(hash01(90, 1) > 0.45 ? "djf" : "dj", 19.0, -5.38, 0.4, 0, 0.28, 90, "dj");
    const sitChairs = [chairs[0], chairs[2], chairs[4], chairs[6], chairs[8], chairs[10]].filter(Boolean);
    sitChairs.forEach((ch, i) => {
      const girl = hash01(i, 70) > 0.32;
      const p = placePerson(girl ? "f" : "m", ch.userData.sit.x, ch.userData.sit.z, BALC_Y, ch.userData.sit.yaw, 0.25 + hash01(i, 71) * 0.8, i + 160, "sit", {
        chair: ch,
      });
      seatPerson(p, ch);
    });
    const vipWalk = [
      [14.8, -4.2],
      [21.2, -4.15],
      [25.75, -0.7],
      [12.4, -0.9],
      [18.4, -4.35],
      [23.8, -4.1],
      [16.2, -4.5],
      [25.7, -2.5],
      [25.7, 0.55],
      [13.2, -4.55],
      [20.0, -4.5],
      [11.9, -1.8],
      [25.65, -3.6],
      [22.8, -4.25],
      [15.5, -4.4],
      [12.2, 0.7],
    ].filter((s) => onBalcony(s[0], s[1]));
    vipWalk.forEach((s, i) => {
      const girl = hash01(i, 75) > 0.4;
      const p = placePerson(girl ? "f" : "m", s[0], s[1], BALC_Y, 0, 0.2 + hash01(i, 76) * 0.7, i + 180, "mingle");
      pickTarget(p);
    });
    placePerson("guard", 20.92, 7.32, 0, 0, 0, 200, "guard");
    const gold = lambert(0xc9a227, { emissive: 0x6a4a10, emissiveIntensity: 0.18 });
    const rope = lambert(0x6b1020);
    addMesh(scene, unitCyl, gold, 21.75, 0.48, 7.55, 0.04, 0.96, 0.04);
    addMesh(scene, unitCyl, gold, 21.75, 0.98, 7.55, 0.07, 0.04, 0.07);
    addMesh(scene, unitCyl, gold, 23.05, 0.48, 7.55, 0.04, 0.96, 0.04);
    addMesh(scene, unitCyl, gold, 23.05, 0.98, 7.55, 0.07, 0.04, 0.07);
    addMesh(scene, unitBox, rope, 22.4, 0.86, 7.55, 1.22, 0.04, 0.04);
    worldSolid(21.75, 7.55, 0.16, 0.16, 1.0);
    worldSolid(23.05, 7.55, 0.16, 0.16, 1.0);
  }

  function buildRoom() {
    const plaster = lambert(0x120814);
    const trim = lambert(0x1a0c14);
    const floor = lambert(0x0c0810);
    const cx = (CX0 + CX1) / 2;
    const cz = (CZ0 + CZ1) / 2;
    const w = CX1 - CX0;
    const d = CZ1 - CZ0;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floor);
    fl.rotation.x = -Math.PI / 2;
    fl.position.set(cx, 0.008, cz);
    fl.receiveShadow = true;
    scene.add(fl);
    addMesh(scene, unitBox, trim, cx, CLUB_H, cz, w, 0.16, d);
    camBox(cx, CLUB_H, cz, w, 0.2, d);
    addCeiling(cx, cz, w, d, CLUB_H - 0.06);

    wall(CX0, cz, 0.22, CLUB_H, d, plaster);
    wall(CX1, cz, 0.22, CLUB_H, d, plaster);
    wall(cx, CZ0, w, CLUB_H, 0.22, plaster);

    const frontDoorX = 19.0;
    const frontW = 1.62;
    const leftW = frontDoorX - frontW / 2 - CX0;
    const rightW = CX1 - (frontDoorX + frontW / 2);
    wall((CX0 + frontDoorX - frontW / 2) / 2, CZ1, leftW, CLUB_H, 0.22, plaster);
    wall((CX1 + frontDoorX + frontW / 2) / 2, CZ1, rightW, CLUB_H, 0.22, plaster);
    addMesh(scene, unitBox, plaster, frontDoorX, 3.9, CZ1, frontW + 0.1, 1.5, 0.22);
    camBox(frontDoorX, 3.9, CZ1, frontW + 0.16, 1.5, 0.28);
    makeHingeDoor(frontDoorX - frontW / 2, CZ1, 0, frontW, 2.32, "clubDoor", 1);

    strip(cx, 2.6, CZ1 - 0.14, w - 0.6, 0.05, 0.04, 0xff2244);
    strip(cx, 2.6, CZ0 + 0.14, w - 0.6, 0.05, 0.04, 0x4422cc);
    strip(CX1 - 0.14, 2.8, cz, 0.04, 0.05, d - 0.6, 0x2244ff);
    strip(CX0 + 0.14, 2.8, cz, 0.04, 0.05, d - 0.6, 0xaa22ff);

    sign("AFTER HOURS", 0xff3dac, 4.8, 0.72, frontDoorX, 3.58, CZ1 + 0.14);
    sign("PULSE", 0x3dfff2, 2.2, 0.4, frontDoorX, 2.96, CZ1 + 0.14);
    sign("VIP", 0xe8c547, 1.1, 0.28, 24.4, BALC_Y + 1.15, 0.2, Math.PI / 2);

    addMesh(scene, unitBox, lambert(0x1a1018), 11.55, 0.55, 4.15, 1.7, 1.1, 2.2);
    worldSolid(11.55, 4.15, 1.8, 2.3, 1.15);
    addMesh(scene, unitBox, lambert(0x2a1a22), 11.55, 1.12, 4.15, 1.82, 0.06, 2.32);
    for (let i = 0; i < 6; i++) addMesh(scene, unitCyl, lambert(0x3dfff2), 11.15 + (i % 3) * 0.22, 1.28, 3.55 + Math.floor(i / 3) * 0.7, 0.04, 0.22, 0.04);
    sign("COAT", 0x3dfff2, 0.7, 0.18, 11.55, 2.15, 3.0);

    for (let i = 0; i < 5; i++) {
      addMesh(scene, unitBox, lambert(0x1a1220), 13.2 + i * 3.0, 5.12, 0.15, 2.4, 0.08, 0.14);
      addMesh(
        scene,
        unitBox,
        lambert(SKY[i % SKY.length], { emissive: SKY[i % SKY.length], emissiveIntensity: 0.7 }),
        13.2 + i * 3.0,
        4.95,
        0.15,
        0.18,
        0.1,
        0.18
      );
    }

    blockCars(cx, cz, w + 1.4, d + 1.4);
    const stoop = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.6), lambert(0x121018));
    stoop.rotation.x = -Math.PI / 2;
    stoop.position.set(frontDoorX, 0.02, CZ1 + 1.2);
    scene.add(stoop);
    const alley = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 13.2), lambert(0x161018));
    alley.rotation.x = -Math.PI / 2;
    alley.position.set(9.12, 0.01, 0);
    scene.add(alley);
  }

  function poseDance(p, t) {
    const u = p.rig.userData;
    const d = p.drunk;
    const beat = t * 2.15 + p.phase;
    const hop = Math.max(0, Math.sin(beat * Math.PI));
    const jump = hop * hop;
    u.body.position.y = jump * (0.16 + (p.style === 2 || p.style === 3 ? 0.08 : 0.03) + d * 0.04);
    u.body.position.x = Math.sin(beat * 0.5) * 0.03;
    u.body.rotation.set(Math.sin(beat) * 0.08, 0, Math.sin(beat * 0.5) * (0.12 + d * 0.06));
    if (p.style === 0) {
      u.armL.rotation.set(-1.25 + Math.sin(beat) * 0.85, 0.1, 0.45);
      u.armR.rotation.set(-1.15 + Math.cos(beat) * 0.8, -0.1, -0.4);
    } else if (p.style === 1) {
      u.armL.rotation.set(-0.55 - jump * 0.7, 0.15, 1.15 + Math.sin(beat) * 0.4);
      u.armR.rotation.set(-0.55 - jump * 0.7, -0.15, -1.15 + Math.cos(beat) * 0.4);
    } else if (p.style === 3) {
      u.armL.rotation.set(-1.65 + jump * 0.95, 0.2, 0.35);
      u.armR.rotation.set(-1.65 + jump * 0.95, -0.2, -0.35);
    } else {
      u.armL.rotation.set(-0.95 + Math.sin(beat + 1) * 0.65, 0, 0.6);
      u.armR.rotation.set(-0.95 + Math.cos(beat + 1) * 0.65, 0, -0.6);
    }
    const tuck = jump * 0.48;
    u.legL.rotation.set(Math.sin(beat) * 0.22 - tuck, 0, 0.06);
    u.legR.rotation.set(Math.sin(beat + Math.PI) * 0.2 - tuck, 0, -0.04);
    const spin = d > 0.95 ? t * (0.5 + d) + p.phase : Math.sin(t * (0.7 + d) + p.phase) * d * 0.4;
    u.head.rotation.set(Math.sin(t * 1.3 + p.phase) * (0.1 + d * 0.14), spin * (d > 0.95 ? 1 : 0.3), Math.sin(t * 1.5 + p.phase) * d * 0.16);
    if (u.stars) u.stars.visible = d > 0.95;
    if (u.stars?.visible) u.stars.rotation.y = t * 3 + p.phase;
  }

  function poseSit(p, t) {
    const u = p.rig.userData;
    u.body.position.y = -0.16;
    u.body.rotation.set(0.08, 0, Math.sin(t * 0.55 + p.phase) * p.drunk * 0.04);
    u.legL.rotation.set(-1.22, 0, 0.08);
    u.legR.rotation.set(-1.16, 0, -0.06);
    u.armL.rotation.set(-0.65, 0.1, 0.22);
    u.armR.rotation.set(-0.5, 0, -0.18);
    u.head.rotation.set(0.1 + Math.sin(t + p.phase) * p.drunk * 0.1, Math.sin(t * 0.45 + p.phase) * 0.18, 0);
    if (u.stars) u.stars.visible = p.drunk > 1.05;
  }

  function poseDj(p, t) {
    const u = p.rig.userData;
    const beat = t * 2.15;
    const scratch = Math.sin(t * 7.2);
    const slide = Math.sin(t * 1.35);
    const hop = Math.abs(Math.sin(beat * Math.PI)) * 0.04;
    u.body.position.set(slide * 0.07, hop, 0.08);
    u.body.rotation.set(-0.26, slide * 0.14, 0);
    u.armL.position.set(0.2, 0.82, 0.26);
    u.armL.rotation.set(-1.12 + Math.sin(t * 1.6) * 0.12, 0.22, 0.48);
    u.armR.position.set(-0.22, 0.8, 0.22);
    u.armR.rotation.set(-1.08 + scratch * 0.28, -0.42, -0.38);
    u.legL.rotation.set(0.08, 0, 0.04);
    u.legR.rotation.set(-0.06, 0, -0.03);
    u.head.rotation.set(-0.18 + Math.sin(t * 2.1) * 0.12, Math.sin(t * 0.7) * 0.28, 0);
  }

  function poseSway(p, t) {
    const u = p.rig.userData;
    u.body.position.y = Math.abs(Math.sin(t * 2.3 + p.phase)) * 0.055;
    u.body.rotation.set(0.05, 0, Math.sin(t * 0.9 + p.phase) * (0.08 + p.drunk * 0.05));
    u.armL.rotation.set(-0.35 + Math.sin(t * 1.4 + p.phase) * 0.28, 0, 0.4 + Math.sin(t + p.phase) * 0.18);
    u.armR.rotation.set(-0.45 + Math.cos(t * 1.4 + p.phase) * 0.22, 0, -0.3);
    u.legL.rotation.set(0.06, 0, 0.06);
    u.legR.rotation.set(-0.05, 0, -0.04);
    u.head.rotation.set(Math.sin(t * 1.05 + p.phase) * p.drunk * 0.12, Math.sin(t * 0.55 + p.phase) * 0.22, 0);
    if (u.stars) u.stars.visible = p.drunk > 1.0;
  }

  function poseWalk(p, t) {
    const u = p.rig.userData;
    const gait = t * 6.2 + p.phase;
    u.body.position.y = Math.abs(Math.sin(gait)) * 0.075;
    u.body.rotation.set(0.06, 0, Math.sin(gait) * 0.06);
    u.armL.rotation.set(Math.sin(gait + Math.PI) * 0.7, 0, 0.14);
    u.armR.rotation.set(Math.sin(gait) * 0.7, 0, -0.14);
    u.legL.rotation.set(Math.sin(gait) * 0.62, 0, 0);
    u.legR.rotation.set(Math.sin(gait + Math.PI) * 0.62, 0, 0);
    u.head.rotation.set(0.05, 0, 0);
  }

  function poseGuard(p, t) {
    const u = p.rig.userData;
    const pos = playerPos();
    const dx = pos.x - p.x;
    const dz = pos.z - p.z;
    const dist = Math.hypot(dx, dz);
    const look = dist < 4.6 ? Math.atan2(dx, dz) - p.yaw : 0;
    const yaw = THREE.MathUtils.clamp(look, -0.72, 0.72);
    u.body.position.set(0, 0, 0);
    u.body.rotation.set(0.04, 0, 0);
    u.armL.position.set(0.22, 1.02, 0.08);
    u.armL.rotation.set(-1.18, 0.18, 0.88);
    u.armR.position.set(-0.22, 1.02, 0.08);
    u.armR.rotation.set(-1.18, -0.18, -0.88);
    u.legL.rotation.set(0.05, 0, 0.07);
    u.legR.rotation.set(-0.03, 0, -0.04);
    u.head.rotation.set(0.05, yaw, 0);
    if (u.stars) u.stars.visible = false;
  }

  function poseKiss(p, t) {
    const u = p.rig.userData;
    if (p.partner) {
      p.yaw = Math.atan2(p.partner.x - p.x, p.partner.z - p.z);
      const dx = p.partner.x - p.x;
      const dz = p.partner.z - p.z;
      const dist = Math.hypot(dx, dz) || 0.0001;
      const want = 0.78;
      if (Math.abs(dist - want) > 0.01) {
        const midX = (p.x + p.partner.x) * 0.5;
        const midZ = (p.z + p.partner.z) * 0.5;
        const ux = dx / dist;
        const uz = dz / dist;
        p.x = midX - ux * (want * 0.5);
        p.z = midZ - uz * (want * 0.5);
        p.partner.x = midX + ux * (want * 0.5);
        p.partner.z = midZ + uz * (want * 0.5);
        p.partner.yaw = Math.atan2(p.x - p.partner.x, p.z - p.partner.z);
      }
    }
    const sway = Math.sin(t * 1.35 + p.phase) * 0.025;
    u.body.position.set(0, 0.01, 0.02);
    u.body.rotation.set(-0.12 + sway, 0, p.kissSide * 0.03);
    u.armL.rotation.set(-0.55, 0.72, 1.28);
    u.armR.rotation.set(-0.48, -0.62, -1.18);
    u.legL.rotation.set(0.1, 0, 0.08);
    u.legR.rotation.set(-0.04, 0, -0.06);
    u.head.rotation.set(-0.16 + sway * 0.5, 0, p.kissSide * 0.04);
    if (u.stars) u.stars.visible = p.drunk > 1.05;
  }

  function stepMingle(p, dt) {
    if (p.wait > 0) {
      p.wait -= dt;
      if (p.wait <= 0) pickTarget(p);
      return false;
    }
    const dx = p.tx - p.x;
    const dz = p.tz - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.16) {
      p.wait = 0.16 + hash01(p.x, p.z, p.phase) * 0.7;
      if (p.backDance && hash01(p.x, p.wait, p.phase) > 0.45) {
        p.mode = "dance";
        p.backDance = false;
        p.tx = p.homeX;
        p.tz = p.homeZ;
      }
      return false;
    }
    const step = Math.min(dist, p.speed * dt);
    p.x += (dx / dist) * step;
    p.z += (dz / dist) * step;
    if (p.y < 1 && blockedFloor(p.x, p.z)) {
      p.x -= (dx / dist) * step;
      p.z -= (dz / dist) * step;
      pickTarget(p);
      return false;
    }
    if (p.y > 1 && !onBalcony(p.x, p.z)) {
      p.x -= (dx / dist) * step;
      p.z -= (dz / dist) * step;
      pickTarget(p);
      return false;
    }
    p.yaw = Math.atan2(dx, dz);
    return true;
  }

  function flushSkin(p) {
    if (p.mode === "guard") return;
    const flush = Math.min(1, p.drunk * 0.7);
    p.rig.userData.skin.color.setRGB(0.91 + flush * 0.08, 0.7 - flush * 0.42, 0.54 - flush * 0.38);
  }

  function separate(dt) {
    const pos = playerPos();
    const feet = Math.max(0, (pos.y || 0) - 1.5);
    for (let i = 0; i < crowd.length; i++) {
      const a = crowd[i];
      if (a.dead || a.mode === "sit" || a.mode === "dj" || a.mode === "guard") continue;
      for (let j = i + 1; j < crowd.length; j++) {
        const b = crowd[j];
        if (b.dead || a.partner === b || b.partner === a) continue;
        if (Math.abs(a.y - b.y) > 1.1) continue;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const need = a.r + b.r;
        if (dist >= need) continue;
        const push = (need - dist) * 0.82;
        const ux = dx / dist;
        const uz = dz / dist;
        if (a.mode !== "kiss") {
          a.x += ux * push;
          a.z += uz * push;
        }
        if (b.mode !== "kiss" && b.mode !== "sit" && b.mode !== "dj") {
          b.x -= ux * push;
          b.z -= uz * push;
        }
      }
      if (Math.abs(a.y - feet) < 1.15 && a.mode !== "kiss") {
        const dx = a.x - pos.x;
        const dz = a.z - pos.z;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const need = a.r + 0.32;
        if (dist < need) {
          a.x += (dx / dist) * (need - dist) * 0.85;
          a.z += (dz / dist) * (need - dist) * 0.85;
        }
      }
      if (a.mode === "dance") {
        a.x += (a.homeX - a.x) * Math.min(1, dt * 0.05);
        a.z += (a.homeZ - a.z) * Math.min(1, dt * 0.05);
        if (a.y < 1) {
          a.x = THREE.MathUtils.clamp(a.x, CX0 + 0.7, 24.7);
          a.z = THREE.MathUtils.clamp(a.z, CZ0 + 0.7, CZ1 - 0.7);
        }
      }
      pinPerson(a);
      a.rig.position.set(a.x, a.y, a.z);
      if (a.mode !== "sit") a.rig.rotation.y = a.yaw;
    }
  }

  function pinPerson(p) {
    if (!p || p.dead || p.mode === "dj" || p.mode === "guard") return;
    if (p.y > 1) {
      const c = clampToDeck(p.x, p.z);
      p.x = c.x;
      p.z = c.z;
      p.y = BALC_Y;
    } else if (blockedFloor(p.x, p.z)) {
      p.x = THREE.MathUtils.clamp(p.x, CX0 + 0.72, 24.65);
      p.z = THREE.MathUtils.clamp(p.z, CZ0 + 0.72, CZ1 - 0.72);
    }
  }

  function collide(px, pz, r = 0.28, feet = 0) {
    for (const p of crowd) {
      if (p.dead) continue;
      if (Math.abs((p.y || 0) - feet) > 1.15) continue;
      const dx = px - p.x;
      const dz = pz - p.z;
      const cr = r + p.r;
      const dist2 = dx * dx + dz * dz;
      if (dist2 >= cr * cr) continue;
      const dist = Math.sqrt(dist2) || 0.0001;
      const need = cr - dist;
      px += (dx / dist) * need;
      pz += (dz / dist) * need;
    }
    return [px, pz];
  }

  function tick(dt, t) {
    if (!built) return;
    const pos = playerPos();
    const inHere = inside(pos.x, pos.z);
    audio.clubTick?.(dt, inHere ? 1 : 0);

    const beat = (t * 2.15) % 1;
    const flash = beat < 0.08 || (beat > 0.5 && beat < 0.58) || (beat > 0.75 && beat < 0.8);
    for (const s of strobes) {
      if (s.wash) s.light.intensity = 0.85 + Math.sin(t * 1.3 + s.phase) * 0.25;
      else {
        s.light.intensity = flash ? 3.1 : 0.14 + Math.sin(t * 9 + s.phase) * 0.1;
        s.light.color.setHex(SKY[(Math.floor(t * 2.4 + s.phase) + (flash ? 1 : 0)) % SKY.length]);
      }
    }
    const lit = crowd.filter((p) => !p.dead && (p.mode === "dance" || p.mode === "mingle" || p.mode === "kiss"));
    for (const s of spots) {
      const ang = t * (s.kind === "strobe" ? 0.86 : 0.4) + s.phase;
      const rad = (s.kind === "strobe" ? 5.4 : 4.5) + Math.sin(t * 0.28 + s.phase) * 1.35;
      let tx = 18.85 + Math.cos(ang) * rad;
      let tz = 0.45 + Math.sin(ang * 0.84) * 3.15;
      let ty = 0.92;
      if (lit.length) {
        const i = (Math.floor(t * 0.5 + s.phase * 2.2) + spots.indexOf(s) * 3) % lit.length;
        const a = lit[i];
        const b = lit[(i + 7) % lit.length];
        const u = 0.5 + 0.5 * Math.sin(t * 1.05 + s.phase);
        tx = tx * 0.35 + (a.x + (b.x - a.x) * u) * 0.65;
        tz = tz * 0.35 + (a.z + (b.z - a.z) * u) * 0.65;
        ty = 0.9 + (a.y || 0) * 0.15;
      }
      s.light.target.position.set(tx, ty, tz);
      s.light.target.updateMatrixWorld?.();
      const hue = SKY[(Math.floor(t * 1.8 + s.phase) + (flash ? 1 : 0)) % SKY.length];
      s.light.color.setHex(hue);
      if (s.cone?.material) s.cone.material.color.setHex(hue);
      const strobe = s.kind === "strobe";
      s.light.intensity = strobe ? (flash ? 11.2 : 0.06) : flash ? 8.8 : 3.7 + Math.sin(t * 7 + s.phase) * 1.05;
      if (s.cone?.material) s.cone.material.opacity = strobe ? (flash ? 0.36 : 0.025) : flash ? 0.3 : 0.15 + Math.sin(t * 5 + s.phase) * 0.04;
      if (s.beam) {
        s.beam.position.copy(s.light.position);
        s.beam.lookAt(tx, ty, tz);
        s.beam.visible = s.light.intensity > 0.2;
      }
    }
    if (ledWall) ledWall.material.color.setHSL((t * 0.22) % 1, 0.9, 0.48);
    for (const p of platters) p.rotation.y = t * 4.8;
    for (let i = 0; i < knobs.length; i++) knobs[i].rotation.y = t * (1.6 + i * 0.35);
    if (fader) fader.position.x = 19.0 + Math.sin(t * 1.3) * 0.16;

    for (const p of crowd) {
      if (p.hurtT > 0) p.hurtT -= dt;
      if (p.dead) poseDead(p, t);
      else if (p.hurtT > 0) poseHurt(p, t);
      else if (p.mode === "mingle") {
        const walking = stepMingle(p, dt);
        if (walking) poseWalk(p, t);
        else poseSway(p, t);
      } else if (p.mode === "dance") {
        if (hash01(p.phase, Math.floor(t * 0.35), p.x) > 0.84) {
          p.mode = "mingle";
          p.backDance = true;
          p.wait = 0;
          pickTarget(p);
        }
        poseDance(p, t);
      } else if (p.mode === "sit") poseSit(p, t);
      else if (p.mode === "dj") poseDj(p, t);
      else if (p.mode === "kiss") poseKiss(p, t);
      else if (p.mode === "guard") poseGuard(p, t);
      else poseSway(p, t);
      flushSkin(p);
    }
    separate(dt);
  }

  function poseDead(p, t) {
    const u = p.rig.userData;
    u.body.position.set(0, 0.1, 0);
    u.body.rotation.set(1.38, 0, 0.22);
    u.armL.rotation.set(-0.25, 0.1, 1.15);
    u.armR.rotation.set(-0.18, -0.08, -1.05);
    u.legL.rotation.set(0.12, 0, 0.28);
    u.legR.rotation.set(-0.1, 0, -0.2);
    u.head.rotation.set(0.28, 0.35, 0.18);
    if (u.stars) {
      u.stars.visible = true;
      u.stars.rotation.y = t * 2.2 + p.phase;
    }
  }

  function poseHurt(p, t) {
    const u = p.rig.userData;
    u.body.position.y = 0.02;
    u.body.rotation.set(-0.12, 0, 0.2);
    u.armL.rotation.set(-1.45, 0.18, 0.85);
    u.armR.rotation.set(-1.5, -0.16, -0.8);
    u.head.rotation.set(-0.22, 0.28, 0.08);
    if (u.stars) {
      u.stars.visible = true;
      u.stars.rotation.y = t * 4 + p.phase;
    }
  }

  function punch(aim = {}) {
    const pos = playerPos();
    const x = pos.x || 0;
    const z = pos.z || 0;
    const feet = Math.max(0, (pos.y || 0) - 1.5);
    let fx = Number(aim.fx);
    let fz = Number(aim.fz);
    const aimLen = Math.hypot(fx, fz);
    if (!aimLen) return null;
    fx /= aimLen;
    fz /= aimLen;
    let best = null;
    let bestDist = 2.2;
    for (const p of crowd) {
      if (p.dead) continue;
      if (Math.abs((p.y || 0) - feet) > 1.25) continue;
      const dx = p.x - x;
      const dz = p.z - z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.12 || dist > bestDist) continue;
      const along = dist > 0.001 ? (dx * fx + dz * fz) / dist : 0;
      if (along < 0.18) continue;
      best = p;
      bestDist = dist;
    }
    if (!best) return null;
    best.hp = Math.max(0, (best.hp ?? 10) - (aim.dmg || 1));
    best.hurtT = 0.38;
    best.x += fx * 0.22;
    best.z += fz * 0.22;
    if (best.chair) {
      best.chair.userData.sitter = null;
      best.chair = null;
    }
    if (best.partner) {
      const other = best.partner;
      best.partner = null;
      other.partner = null;
      if (!other.dead && other.mode === "kiss") {
        other.mode = "mingle";
        other.wait = 0.2;
        pickTarget(other);
      }
    }
    if (best.mode === "kiss" || best.mode === "sit") best.mode = "mingle";
    if (best.y > 1) {
      const c = clampToDeck(best.x, best.z);
      best.x = c.x;
      best.z = c.z;
    }
    best.rig.position.set(best.x, best.y, best.z);
    if (best.hp > 0) return "hit";
    best.dead = true;
    best.mode = "dead";
    best.r = 0.08;
    return "kill";
  }

  function build() {
    if (built) return;
    buildRoom();
    buildBooth();
    buildStairs();
    buildBalcony();
    buildLights();
    scatterTrash();
    buildCrowd();
    built = true;
  }

  function prompt(obj) {
    if (obj?.userData?.kind === "clubDoor") {
      return Math.abs(obj.userData.ang || 0) > 0.45 ? "E close the club door" : "E open the club";
    }
    if (obj?.userData?.kind === "clubChair") {
      const who = obj.userData.sitter;
      if (who && who !== "player") return "E kick them out of the chair";
      return "E sit and watch the floor";
    }
    return "";
  }

  function use(obj) {
    if (obj?.userData?.kind !== "clubChair") return false;
    if (obj.userData.sitter && obj.userData.sitter !== "player") return kickChair(obj);
    return false;
  }

  function claimChair(obj) {
    if (obj?.userData) obj.userData.sitter = "player";
  }

  function freeChair(obj) {
    if (obj?.userData?.sitter === "player") obj.userData.sitter = null;
  }

  return { build, tick, collide, inside, prompt, use, claimChair, freeChair, punch };
}

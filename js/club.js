/** Nightclub next door: DJ set, strobes, mingling crowd, walkable balcony. */
import * as THREE from "three";

const CX0 = 10.18;
const CX1 = 27.85;
const CZ0 = -6.42;
const CZ1 = 6.28;
const CLUB_H = 5.42;
const BALC_Y = 2.68;
const MAX_WALKING_PEOPLE = 3;
const MAX_STAIR_TRAVELERS = 1;
const BALCONY_SEAT_LIMIT = 10;
const BALCONY_WALKER_LIMIT = 3;
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10);

const dizzyGeo = new THREE.OctahedronGeometry(0.075, 0);
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
    makeBatonMesh,
    seatBatonOnArm,
    hitPlayer,
    collideWorld,
  } = api;

  const crowd = [];
  const chairs = [];
  const strobes = [];
  const spots = [];
  const platters = [];
  const knobs = [];
  const ledWalls = [];
  let fader = null;
  let built = false;
  let wantUp = 0;
  let wantDown = 0;
  let wantDance = 0;
  let rebalanceT = 0;

  function playerPos() {
    return api.playerPos?.() || { x: 0, y: 0, z: 0 };
  }

  function inside(x, z) {
    return x > CX0 + 0.12 && x < CX1 - 0.12 && z > CZ0 + 0.12 && z < CZ1 - 0.12;
  }

  const DECKS = [
    { minx: 10.50, maxx: 27.54, minz: -6.24, maxz: -4.00 },
    { minx: 24.72, maxx: 27.64, minz: -5.10, maxz: 1.20 },
    { minx: 10.36, maxx: 12.62, minz: -4.24, maxz: 1.88 },
  ];
  const STAIR_X = 26.1;
  const STAIR_Z0 = 5.46;
  const STAIR_Z1 = 1.16;

  function onDeck(x, z, pad = 0) {
    return DECKS.some((d) => x >= d.minx - pad && x <= d.maxx + pad && z >= d.minz - pad && z <= d.maxz + pad);
  }

  function clampToDeck(x, z, pad = 0) {
    const inset = Math.max(0, Number(pad) || 0);
    let bestX = x;
    let bestZ = z;
    let best = 1e9;
    for (const d of DECKS) {
      const minx = Math.min(d.maxx, d.minx + inset);
      const maxx = Math.max(d.minx, d.maxx - inset);
      const minz = Math.min(d.maxz, d.minz + inset);
      const maxz = Math.max(d.minz, d.maxz - inset);
      const cx = THREE.MathUtils.clamp(x, minx, maxx);
      const cz = THREE.MathUtils.clamp(z, minz, maxz);
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

  function onStairs(x, z) {
    return x > 25.02 && x < 27.18 && z >= STAIR_Z1 - 0.08 && z <= STAIR_Z0 + 0.12;
  }

  function inStairwell(x, z) {
    return x > 24.45 && x < 27.25 && z > 1.04 && z < 5.72;
  }

  function stairHeight(z) {
    const u = THREE.MathUtils.clamp((STAIR_Z0 - z) / (STAIR_Z0 - STAIR_Z1), 0, 1);
    return u * BALC_Y;
  }

  function walkingCount() {
    return crowd.reduce((n, p) => n + (p.walking && !p.dead && !p.gone ? 1 : 0), 0);
  }

  function balconyWalkingCount() {
    return crowd.reduce((n, p) => n + (p.walking && !p.dead && !p.gone && (p.y > 1.15 || onBalcony(p.x, p.z) || usingStairs(p)) ? 1 : 0), 0);
  }

  function usingStairs(p) {
    return !!(p && (p.route === "up" || p.route === "down"));
  }

  function stairCount() {
    return crowd.reduce((n, p) => n + (!p.dead && !p.gone && usingStairs(p) ? 1 : 0), 0);
  }

  function setLevel(p) {
    if (!p || p.dead || p.mode === "dj" || p.mode === "guard") return;
    if (usingStairs(p)) {
      if (onStairs(p.x, p.z)) p.y = stairHeight(p.z);
      return;
    }
    if (p.y > 1.15) {
      if (onBalcony(p.x, p.z)) p.y = BALC_Y;
      else if (onStairs(p.x, p.z)) p.y = stairHeight(p.z);
      return;
    }
    p.y = 0;
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
    let baton = null;
    if (guard && makeBatonMesh) {
      baton = makeBatonMesh();
      seatBatonOnArm?.(baton);
      baton.visible = false;
      armR.add(baton);
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
    if (!guard) {
      const starMats = [
        lambert(0xffe066, { emissive: 0xffa000, emissiveIntensity: 0.72 }),
        lambert(0xffc928, { emissive: 0xff8a00, emissiveIntensity: 0.62 }),
      ];
      for (let i = 0; i < 3; i++) {
        const star = new THREE.Mesh(dizzyGeo, starMats[i % starMats.length]);
        const a = (i / 3) * Math.PI * 2 + hash01(seed, 30) * 0.4;
        const radius = 0.2 + hash01(seed, 31 + i) * 0.05;
        star.position.set(Math.cos(a) * radius, 0.02 + hash01(seed, 34 + i) * 0.07, Math.sin(a) * radius);
        star.scale.setScalar(0.72 + hash01(seed, 38 + i) * 0.42);
        star.rotation.set(hash01(seed, 42 + i) * 0.8, a, hash01(seed, 46 + i) * 0.8);
        star.castShadow = false;
        stars.add(star);
      }
    }
    stars.position.set(0, 0.34, 0);
    stars.visible = false;
    head.add(stars);

    g.userData = { body, head, armL, armR, legL, legR, stars, skin, held, baton };
    const seen = new Set();
    const flashBase = [];
    g.traverse((obj) => {
      const mat = obj.material;
      if (!mat || !mat.color || seen.has(mat)) return;
      seen.add(mat);
      flashBase.push({ m: mat, r: mat.color.r, g: mat.color.g, b: mat.color.b });
    });
    g.userData.flashBase = flashBase;
    return g;
  }

  function placePerson(kind, x, z, y, yaw, drunk, seed, mode, extra = {}) {
    const rig = makeGoer(kind, seed);
    rig.position.set(x, y, z);
    rig.rotation.y = yaw;
    scene.add(rig);
    if (kind === "dj" || kind === "djf") {
      rig.userData.kind = "clubDj";
      rig.userData.root = rig;
      registerPick?.(rig);
    }
    const person = {
      rig,
      x,
      z,
      y,
      yaw,
      homeX: x,
      homeZ: z,
      homeLevel: y > 1.2 ? "up" : "down",
      tx: x,
      tz: z,
      drunk,
      dizzyAt: 0.82 + hash01(seed, 26) * 0.28,
      dizzyRate: 1.3 + hash01(seed, 27) * 1.4,
      gender: kind === "f" || kind === "djf" ? "f" : "m",
      r: kind === "guard" ? 0.48 : kind.startsWith("dj") ? 0.42 : 0.44,
      phase: hash01(seed, 21) * Math.PI * 2,
      style: (hash01(seed, 22) * 4) | 0,
      mode,
      walk: hash01(seed, 23) * 10,
      wait: hash01(seed, 24) * 0.25,
      speed: 1.2 + hash01(seed, 25) * 0.95,
      partner: extra.partner || null,
      chair: extra.chair || null,
      route: "",
      stairTrip: "",
      kissSide: extra.kissSide || 0,
      hp: kind === "guard" ? 12 : 10,
      hurtT: 0,
      angry: false,
      drawT: 0,
      swingT: 0,
      swingLanded: false,
      dead: false,
      deadT: 0,
      gone: false,
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
    if (inStairwell(x, z) || onStairs(x, z)) return true;
    if (x > 24.8 && z > 1.02) return true;
    if (z < -3.4 && x > 15.1 && x < 22.9) return true;
    if (x < 11.2 && z > 4.85) return true;
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
    addLedScreen(6.0, 1.8, 19.0, 2.22, -6.18);
    addLedScreen(2.2, 1.35, 14.8, 2.18, -6.18);
    addLedScreen(2.2, 1.35, 23.2, 2.18, -6.18);
    addLedScreen(0.5, 0.34, 15.55, 1.74, -5.08);
    addLedScreen(0.5, 0.34, 22.45, 1.74, -5.08);
    sign("PULSE", 0x3dfff2, 2.6, 0.42, 19.0, 3.28, -6.16);
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

  function faceCenter(x, z) {
    return Math.atan2(19.0 - x, 0.25 - z);
  }

  function addLedScreen(w, h, x, y, z, yaw = 0) {
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.12, h + 0.12),
      new THREE.MeshBasicMaterial({ color: 0x08080c, side: THREE.DoubleSide })
    );
    back.position.set(x - Math.sin(yaw) * 0.02, y, z - Math.cos(yaw) * 0.02);
    back.rotation.y = yaw;
    scene.add(back);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xff3dac }));
    m.position.set(x, y, z);
    m.rotation.y = yaw;
    scene.add(m);
    ledWalls.push(m);
    return m;
  }

  function makeChair(x, z, yaw = faceCenter(x, z)) {
    const seat = lambert(0xe45a88, { emissive: 0x7a2048, emissiveIntensity: 0.28 });
    const chrome = lambert(0xc8d4dc);
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    scene.add(g);
    addMesh(g, unitBox, seat, 0, BALC_Y + 0.28, 0.02, 0.44, 0.09, 0.44);
    addMesh(g, unitBox, seat, 0, BALC_Y + 0.56, -0.2, 0.46, 0.48, 0.08);
    for (const [sx, sz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
      addMesh(g, unitCyl, chrome, sx, BALC_Y + 0.13, sz, 0.025, 0.26, 0.025);
    }
    const hit = addMesh(g, unitBox, seat, 0, BALC_Y + 0.24, 0, 0.28, 0.1, 0.28);
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    hit.userData.kind = "clubChair";
    hit.userData.root = hit;
    hit.userData.sitter = null;
    hit.userData.sit = {
      x,
      z,
      y: BALC_Y + 1.18,
      yaw,
      floor: BALC_Y,
      standX: x - fx * 0.52,
      standZ: z - fz * 0.52,
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
      { x: 26.12, z: -1.97, w: 3.22, d: 6.26, ceil: "walk" },
      { x: 11.55, z: -1.15, w: 2.55, d: 6.35, ceil: true },
    ];
    for (const d of decks) {
      addMesh(scene, unitBox, plank, d.x, BALC_Y - 0.07, d.z, d.w, 0.14, d.d);
      floorSolid(d.x, d.z, d.w, d.d, BALC_Y, 0.16);
      camBox(d.x, BALC_Y - 0.07, d.z, d.w, 0.14, d.d);
      if (d.ceil === true) addCeiling(d.x, d.z, d.w, d.d, BALC_Y - 0.08);
      if (d.ceil === "walk") addCeiling(d.x, -2.35, d.w, 5.3, BALC_Y - 0.08);
    }
    const innerS = -3.78;
    const innerE = 24.54;
    const innerW = 12.80;
    const eastN = 1.10;
    const westN = 2.00;
    const rails = [
      { x: (innerW + innerE) / 2, z: innerS, w: innerE - innerW + 0.18, d: 0.08 },
      { x: innerE, z: (innerS + eastN) / 2, w: 0.08, d: eastN - innerS + 0.18 },
      { x: innerW, z: (innerS + westN) / 2, w: 0.08, d: westN - innerS + 0.18 },
      { x: 11.55, z: westN, w: 2.52, d: 0.08 },
      { x: 24.82, z: eastN, w: 0.64, d: 0.08 },
      { x: 10.42, z: -1.15, w: 0.08, d: 6.3 },
      { x: 27.64, z: -1.97, w: 0.08, d: 6.26 },
    ];
    for (const r of rails) {
      addMesh(scene, unitBox, rail, r.x, BALC_Y + 0.46, r.z, r.w, 0.92, r.d);
      addMesh(scene, unitBox, glow, r.x, BALC_Y + 0.88, r.z, Math.max(r.w, 0.04), 0.04, Math.max(r.d, 0.04));
      railSolid(r.x, r.z, Math.max(0.16, r.w + 0.06), Math.max(0.16, r.d + 0.06), BALC_Y, BALC_Y + 0.95);
    }
    for (const x of [11.7, 13.15, 14.6, 16.05, 17.5, 18.95, 20.4, 21.85, 23.3]) makeChair(x, -4.28);
    for (const z of [0.75, -0.4, -1.55, -2.7, -3.85]) makeChair(25.12, z);
    for (const z of [1.2, -0.15, -1.5, -2.85]) makeChair(12.38, z);
    addMesh(scene, unitBox, lambert(0x2a1a22), 15.4, BALC_Y + 0.32, -5.92, 0.72, 0.08, 0.4);
    addMesh(scene, unitBox, lambert(0x2a1a22), 21.6, BALC_Y + 0.32, -5.92, 0.72, 0.08, 0.4);
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
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = coneH * 0.5;
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
      const puddle = new THREE.Mesh(
        new THREE.CircleGeometry(0.08 + hash01(i, 22) * 0.14, 10),
        lambert(0x16141a, { transparent: true, opacity: 0.22 })
      );
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(x, 0.012, z);
      scene.add(puddle);
    }
  }

  function balconyTargets() {
    return [
      [11.15, -5.52],
      [13.4, -5.55],
      [15.6, -5.5],
      [17.8, -5.58],
      [19.9, -5.52],
      [22.1, -5.48],
      [23.8, -5.55],
      [26.35, -5.5],
      [26.4, -3.55],
      [26.42, -2.15],
      [26.38, -0.7],
      [26.35, 0.55],
      [11.08, -3.35],
      [11.05, -1.85],
      [11.1, -0.4],
      [11.12, 1.15],
    ].filter((t) => onBalcony(t[0], t[1]));
  }

  function balconySteer(x, z, tx, tz) {
    const srcS = z <= -4.15;
    const dstS = tz <= -4.15;
    const srcE = x >= 24.8 && z > -4.15;
    const dstE = tx >= 24.8 && tz > -4.15;
    const srcW = x <= 12.6 && z > -4.15;
    const dstW = tx <= 12.6 && tz > -4.15;
    if ((srcS && dstS) || (srcE && dstE) || (srcW && dstW)) return null;
    if ((srcE && dstS) || (srcS && dstE)) return { x: 26.35, z: -5.5 };
    if ((srcW && dstS) || (srcS && dstW)) return { x: 11.1, z: -5.5 };
    if (srcE && dstW) return z > -5.15 ? { x: 26.35, z: -5.5 } : { x: 11.1, z: -5.5 };
    if (srcW && dstE) return z > -5.15 ? { x: 11.1, z: -5.5 } : { x: 26.35, z: -5.5 };
    return null;
  }

  function keepBehindChairs(p) {
    if (!p || p.dead || p.mode === "sit" || p.mode === "dj" || p.mode === "guard" || usingStairs(p)) return;
    if (p.y < 1.2) return;
    if (p.z <= -4.02) {
      if (p.z > -5.16) p.z = -5.38;
    } else if (p.x >= 24.7) {
      if (p.x < 26.02) p.x = 26.22;
    } else if (p.x <= 12.75) {
      if (p.x > 11.42) p.x = 11.12;
    }
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

  function pickFloorTarget(p, upstairs) {
    const pool = upstairs ? balconyTargets() : floorTargets();
    const t = pool[(hash01(p.x, p.z, p.wait + 1, p.phase) * pool.length) | 0] || pool[0];
    p.tx = t[0];
    p.tz = t[1];
  }

  function countable(p) {
    return !!(p && !p.dead && !p.gone && p.mode !== "dj" && p.mode !== "guard");
  }

  function isUpstairs(p) {
    if (!p) return false;
    if (p.route === "up") return true;
    if (p.route === "down") return false;
    return p.y > 1.35 || (p.y > 1.15 && onBalcony(p.x, p.z));
  }

  function levelCounts() {
    let up = 0;
    let down = 0;
    for (const p of crowd) {
      if (!countable(p)) continue;
      if (isUpstairs(p)) up++;
      else down++;
    }
    return { up, down };
  }

  function lockCrowdRatio() {
    const c = levelCounts();
    wantUp = c.up;
    wantDown = c.down;
    wantDance = 0;
    for (const p of crowd) {
      if (countable(p) && p.mode === "dance") wantDance++;
    }
  }

  function floorShort() {
    return wantDown > 0 && levelCounts().down < wantDown;
  }

  function deckShort() {
    return wantUp > 0 && levelCounts().up < wantUp;
  }

  function danceCount() {
    let n = 0;
    for (const p of crowd) {
      if (countable(p) && p.mode === "dance" && !isUpstairs(p)) n++;
    }
    return n;
  }

  function sendHomeOrFill(p, upstairs) {
    if (!p || p.backDance || p.mode === "kiss" || p.mode === "dance") return false;
    if ((p.stairCool || 0) > 0 || stairCount() >= MAX_STAIR_TRAVELERS) return false;
    if (upstairs) {
      if (p.homeLevel === "down" || floorShort() || p.homeLevel === "up") {
        p.route = "down";
        p.stairTrip = p.homeLevel === "up" || floorShort() ? "up" : "";
        p.walking = false;
        return true;
      }
      return false;
    }
    if (p.stairTrip === "up") {
      p.route = "up";
      p.stairTrip = "";
      p.walking = false;
      return true;
    }
    if (p.homeLevel === "up" && deckShort() && !floorShort()) {
      p.route = "up";
      p.walking = false;
      return true;
    }
    return false;
  }

  function putBackOnFloor(p) {
    if (!p || p.dead || p.gone) return;
    p.mode = "dance";
    p.backDance = false;
    p.route = "";
    p.walking = false;
    p.wait = 0;
    p.tx = p.homeX;
    p.tz = p.homeZ;
    if (p.y < 1.2) p.y = 0;
  }

  function refillDance() {
    if (!wantDance || danceCount() >= wantDance) return;
    const extras = crowd.filter(
      (p) => countable(p) && !p.route && !isUpstairs(p) && p.mode === "mingle" && p.homeLevel === "down"
    );
    extras.sort((a, b) => Math.hypot(a.x - a.homeX, a.z - a.homeZ) - Math.hypot(b.x - b.homeX, b.z - b.homeZ));
    for (const p of extras) {
      putBackOnFloor(p);
      if (danceCount() >= wantDance) break;
    }
  }

  function rebalanceCrowd() {
    if (!wantDown && !wantUp) return;
    if (levelCounts().down < wantDown) {
      const extras = crowd.filter((p) => countable(p) && !p.route && isUpstairs(p) && p.mode !== "kiss");
      extras.sort((a, b) => Number(a.homeLevel !== "down") - Number(b.homeLevel !== "down"));
      for (const p of extras) {
        if (stairCount() >= MAX_STAIR_TRAVELERS) break;
        if (p.mode === "sit" && p.chair) kickChair(p.chair);
        if (p.mode === "sit" || p.mode === "dance") continue;
        p.route = "down";
        p.stairTrip = "";
        p.walking = false;
        p.wait = 0;
        p.stairCool = 0;
        pickTarget(p);
        if (!floorShort()) break;
      }
    }
    refillDance();
  }

  function pickTarget(p) {
    if (!p || p.dead) return;
    const upstairs = p.y > 1.35 || (p.y > 1.15 && onBalcony(p.x, p.z));
    const lane = p.route === "down" ? -0.34 : 0.34;
    if (p.route === "up") {
      if (onStairs(p.x, p.z) && p.y < BALC_Y - 0.16) {
        p.tx = STAIR_X + lane;
        p.tz = STAIR_Z1 + 0.06;
        return;
      }
      if (p.y >= BALC_Y - 0.2 || (onBalcony(p.x, p.z) && p.z < STAIR_Z1 + 0.12)) {
        p.route = "";
        p.stairCool = 14 + hash01(p.phase, p.x) * 10;
        p.y = BALC_Y;
        pickFloorTarget(p, true);
        return;
      }
      p.tx = STAIR_X + lane;
      p.tz = STAIR_Z0;
      return;
    }
    if (p.route === "down") {
      if (onStairs(p.x, p.z) && p.y > 0.2) {
        p.tx = STAIR_X + lane;
        p.tz = STAIR_Z0;
        return;
      }
      if (p.y < 0.28 && !onBalcony(p.x, p.z)) {
        p.route = "";
        p.stairCool = 14 + hash01(p.phase, p.x) * 10;
        p.y = 0;
        pickFloorTarget(p, false);
        return;
      }
      p.tx = STAIR_X + lane;
      p.tz = STAIR_Z1;
      return;
    }
    if (sendHomeOrFill(p, upstairs)) {
      pickTarget(p);
      return;
    }
    pickFloorTarget(p, upstairs);
  }

  function emptyChairs() {
    return chairs.filter((c) => !c.userData.sitter);
  }

  function trySeatNearby(p) {
    if (!p || p.y < 1.4 || p.mode === "sit") return false;
    let best = null;
    let bestD = 1.48;
    for (const c of emptyChairs()) {
      const sit = c.userData.sit;
      const d = Math.hypot(p.x - sit.x, p.z - sit.z);
      if (d < bestD) {
        best = c;
        bestD = d;
      }
    }
    if (!best) return false;
    seatPerson(p, best);
    return true;
  }

  function seatPerson(p, chair) {
    p.mode = "sit";
    p.route = "";
    p.walking = false;
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
    p.route = "";
    p.walking = false;
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
    const dancers = packSpots(18.35, 0.9, 14.6, 8.3, 78, 0.9, blockedFloor, taken);
    dancers.forEach((s, i) => {
      const girl = hash01(i, 4) > 0.4;
      placePerson(girl ? "f" : "m", s.x, s.z, 0, (hash01(i, 11) - 0.5) * 2.2, 0.2 + hash01(i, 9) * 1.2, i + 3, "dance");
    });
    const minglers = packSpots(18.3, 0.95, 14.8, 8.4, 34, 0.92, blockedFloor, taken);
    minglers.forEach((s, i) => {
      const girl = hash01(i, 50) > 0.42;
      const p = placePerson(girl ? "f" : "m", s.x, s.z, 0, hash01(i, 51) * 6, 0.15 + hash01(i, 52) * 0.9, i + 80, "mingle");
      pickTarget(p);
    });
    const walls = [
      ...packLine(10.9, -3.15, 10.9, 5.15, 12, 0.9, blockedFloor, taken, Math.PI / 2),
      ...packLine(11.5, 5.52, 17.25, 5.52, 7, 0.9, blockedFloor, taken, Math.PI),
      ...packLine(20.75, 5.52, 23.35, 5.52, 4, 0.9, blockedFloor, taken, Math.PI),
      ...packLine(13.35, -3.22, 23.7, -3.22, 10, 0.9, blockedFloor, taken, 0),
      ...packLine(24.15, -3.05, 24.15, 0.55, 5, 0.9, blockedFloor, taken, -Math.PI / 2),
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
    addKiss(22.6, 2.4, -0.5, 125);
    addKiss(13.8, 1.15, 0.9, 126);
    placePerson(hash01(90, 1) > 0.45 ? "djf" : "dj", 19.0, -5.38, 0.4, 0, 0.28, 90, "dj");
    const chairOrder = chairs.map((_, i) => i).sort((a, b) => hash01(a, 70) - hash01(b, 71));
    let seated = 0;
    for (const i of chairOrder) {
      if (seated >= BALCONY_SEAT_LIMIT) break;
      const ch = chairs[i];
      if (!ch || ch.userData.sitter) continue;
      const girl = hash01(i, 70) > 0.32;
      const p = placePerson(girl ? "f" : "m", ch.userData.sit.x, ch.userData.sit.z, BALC_Y, ch.userData.sit.yaw, 0.25 + hash01(i, 71) * 0.8, i + 160, "sit", {
        chair: ch,
      });
      seatPerson(p, ch);
      seated++;
    }
    balconyTargets().slice(0, BALCONY_WALKER_LIMIT).forEach((s, i) => {
      const girl = hash01(i, 75) > 0.42;
      const p = placePerson(girl ? "f" : "m", s[0], s[1], BALC_Y, hash01(i, 76) * 6, 0.2 + hash01(i, 77) * 0.7, i + 180, "mingle");
      pickTarget(p);
    });
    placePerson("guard", 20.92, 7.32, 0, 0, 0, 200, "guard");
    lockCrowdRatio();
    let routed = 0;
    for (const p of crowd) {
      if (!p.route) continue;
      if (routed >= 1) {
        p.route = "";
        p.stairCool = 10;
        pickFloorTarget(p, p.y > 1.2);
      } else routed++;
    }
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
    const clubDoor = makeHingeDoor(frontDoorX - frontW / 2, CZ1, 0, frontW, 2.32, "clubDoor", 1);
    if (clubDoor) {
      clubDoor.material = lambert(0x6a2048, { emissive: 0xff2d6a, emissiveIntensity: 0.62 });
      const hinge = clubDoor.userData.hinge;
      const swing = clubDoor.userData.swingDir || 1;
      if (hinge) {
        addMesh(hinge, unitBox, lambert(0x3dfff2, { emissive: 0x3dfff2, emissiveIntensity: 0.95 }), (frontW / 2) * swing, 1.72, 0.042, 0.62, 0.58, 0.03);
        addMesh(hinge, unitBox, lambert(0xff3dac, { emissive: 0xff3dac, emissiveIntensity: 0.8 }), (frontW / 2) * swing, 0.42, 0.04, 0.9, 0.08, 0.03);
      }
    }
    const jamb = lambert(0x3dfff2, { emissive: 0x3dfff2, emissiveIntensity: 0.95 });
    const lintel = lambert(0xff3dac, { emissive: 0xff3dac, emissiveIntensity: 0.85 });
    addMesh(scene, unitBox, jamb, frontDoorX - frontW / 2 - 0.1, 1.16, CZ1 + 0.1, 0.14, 2.32, 0.2);
    addMesh(scene, unitBox, jamb, frontDoorX + frontW / 2 + 0.1, 1.16, CZ1 + 0.1, 0.14, 2.32, 0.2);
    addMesh(scene, unitBox, jamb, frontDoorX - frontW / 2 - 0.1, 1.16, CZ1 - 0.1, 0.14, 2.32, 0.16);
    addMesh(scene, unitBox, jamb, frontDoorX + frontW / 2 + 0.1, 1.16, CZ1 - 0.1, 0.14, 2.32, 0.16);
    addMesh(scene, unitBox, lintel, frontDoorX, 2.4, CZ1 + 0.1, frontW + 0.34, 0.12, 0.2);
    addMesh(scene, unitBox, lintel, frontDoorX, 2.4, CZ1 - 0.1, frontW + 0.34, 0.12, 0.16);
    strip(frontDoorX, 0.045, CZ1 + 0.28, frontW + 0.7, 0.05, 0.22, 0x3dfff2);
    strip(frontDoorX, 0.045, CZ1 - 0.2, frontW + 0.35, 0.04, 0.12, 0xff3dac);
    const doorLite = new THREE.PointLight(0xff66aa, 2.6, 7.2);
    doorLite.position.set(frontDoorX, 2.55, CZ1 + 0.7);
    scene.add(doorLite);
    const doorLiteIn = new THREE.PointLight(0x66fff2, 1.6, 5.5);
    doorLiteIn.position.set(frontDoorX, 2.35, CZ1 - 0.55);
    scene.add(doorLiteIn);
    sign("OPEN", 0x3dfff2, 1.05, 0.26, frontDoorX, 2.58, CZ1 + 0.18);

    strip(cx, 2.6, CZ1 - 0.14, w - 0.6, 0.05, 0.04, 0xff2244);
    strip(cx, 2.6, CZ0 + 0.14, w - 0.6, 0.05, 0.04, 0x4422cc);
    strip(CX1 - 0.14, 2.8, cz, 0.04, 0.05, d - 0.6, 0x2244ff);
    strip(CX0 + 0.14, 2.8, cz, 0.04, 0.05, d - 0.6, 0xaa22ff);

    sign("AFTER HOURS", 0xff3dac, 4.8, 0.72, frontDoorX, 3.58, CZ1 + 0.14);
    sign("PULSE", 0x3dfff2, 2.2, 0.4, frontDoorX, 2.96, CZ1 + 0.14);
    addLedScreen(2.5, 1.1, 10.34, 3.58, 3.55, Math.PI / 2);
    addLedScreen(2.5, 1.1, 27.7, 3.88, 3.2, -Math.PI / 2);
    addLedScreen(4.2, 0.8, frontDoorX, 4.18, CZ1 - 0.14, Math.PI);

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
    const stoop = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.6), lambert(0x2a1824, { emissive: 0x3a1020, emissiveIntensity: 0.22 }));
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
    const beat = t * 2.133 + p.phase;
    const hop = Math.max(0, Math.sin(beat * Math.PI));
    const jump = hop * hop;
    u.body.position.y = jump * (0.42 + (p.style === 2 || p.style === 3 ? 0.16 : 0.08) + d * 0.04);
    u.body.position.x = Math.sin(beat * 0.5) * 0.02;
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
    const beat = t * 2.133 + p.phase;
    const hop = Math.max(0, Math.sin(beat * Math.PI));
    const jump = hop * hop;
    u.body.position.y = jump * 0.28;
    u.body.rotation.set(0.05, 0, Math.sin(t * 0.9 + p.phase) * (0.08 + p.drunk * 0.05));
    u.armL.rotation.set(-0.85 - jump * 0.45 + Math.sin(t * 1.4 + p.phase) * 0.28, 0, 0.5 + Math.sin(t + p.phase) * 0.18);
    u.armR.rotation.set(-0.8 - jump * 0.4 + Math.cos(t * 1.4 + p.phase) * 0.22, 0, -0.45);
    u.legL.rotation.set(0.08 - jump * 0.35, 0, 0.06);
    u.legR.rotation.set(-0.05 - jump * 0.32, 0, -0.04);
    u.head.rotation.set(Math.sin(t * 1.05 + p.phase) * p.drunk * 0.12, Math.sin(t * 0.55 + p.phase) * 0.22, 0);
    if (u.stars) u.stars.visible = p.drunk > 1.0;
  }

  function poseWalk(p, t) {
    const u = p.rig.userData;
    const gait = t * 6.2 + p.phase;
    u.body.position.y = Math.abs(Math.sin(gait)) * 0.14;
    u.body.rotation.set(0.06, 0, Math.sin(gait) * 0.06);
    u.armL.rotation.set(Math.sin(gait + Math.PI) * 0.7, 0, 0.14);
    u.armR.rotation.set(Math.sin(gait) * 0.7, 0, -0.14);
    u.legL.rotation.set(Math.sin(gait) * 0.62, 0, 0);
    u.legR.rotation.set(Math.sin(gait + Math.PI) * 0.62, 0, 0);
    u.head.rotation.set(0.05, 0, 0);
  }
  function poseDizzy(p, t) {
    const stars = p.rig.userData.stars;
    if (!stars) return;
    const visible = !p.dead && p.mode !== "guard" && p.drunk >= p.dizzyAt;
    stars.visible = visible;
    if (!visible) return;
    const spin = t * p.dizzyRate + p.phase;
    stars.rotation.set(0, spin, Math.sin(spin * 0.7) * 0.16);
    stars.position.y = 0.31 + Math.sin(spin * 1.7) * 0.035;
    for (let i = 0; i < stars.children.length; i++) {
      const star = stars.children[i];
      const wobble = Math.sin(spin * (1.2 + i * 0.23) + i) * 0.12;
      star.rotation.x = wobble * 0.02;
      star.rotation.z = 0.04 + wobble;
    }
  }


  function planted(p) {
    return !!(p && (p.mode === "dj" || p.mode === "sit" || (p.mode === "guard" && !p.angry)));
  }

  function showBaton(p) {
    const baton = p?.rig?.userData?.baton;
    if (!baton) return;
    seatBatonOnArm?.(baton);
    baton.visible = true;
  }

  function poseGuard(p, t, moving = false, mood = "") {
    const u = p.rig.userData;
    const pos = playerPos();
    const dx = (pos.x || 0) - p.x;
    const dz = (pos.z || 0) - p.z;
    const dist = Math.hypot(dx, dz);
    if (u.stars) u.stars.visible = false;
    if (mood === "draw") {
      const uDraw = 1 - Math.min(1, (p.drawT || 0) / 0.32);
      u.body.position.set(0, 0, 0);
      u.body.rotation.set(0.08, 0, 0);
      u.armL.position.set(0.23, 1.08, 0);
      u.armL.rotation.set(-0.42, 0.16, 0.72);
      u.armR.position.set(-0.23, 1.08, 0);
      u.armR.rotation.set(-0.15 - uDraw * 0.18, 0.08, -0.62 + uDraw * 0.16);
      u.legL.rotation.set(0.08, 0, 0.06);
      u.legR.rotation.set(-0.04, 0, -0.05);
      u.head.rotation.set(0.1, 0, 0);
      return;
    }
    if (mood === "swing") {
      const a = Math.sin(Math.min(1, (p.swingT || 0) / 0.28) * Math.PI);
      u.body.position.set(0, 0.02, 0.04);
      u.body.rotation.set(-0.08 - a * 0.16, 0, 0);
      u.armL.position.set(0.23, 1.08, 0);
      u.armL.rotation.set(-0.95, 0.22, 0.78);
      u.armR.position.set(-0.23, 1.08, 0);
      u.armR.rotation.set(-0.18 - a * 1.75, 0.04, 0.12 + a * 0.52);
      u.legL.rotation.set(0.18, 0, 0.08);
      u.legR.rotation.set(-0.22, 0, -0.06);
      u.head.rotation.set(0.16, 0, 0);
      return;
    }
    if (mood === "chase" || p.angry) {
      const gait = t * 7.4 + p.phase;
      const swing = moving ? Math.sin(gait) * 0.58 : 0;
      u.body.position.set(0, moving ? Math.abs(Math.sin(gait)) * 0.11 : 0, 0);
      u.body.rotation.set(0.1, 0, 0);
      u.armL.position.set(0.23, 1.08, 0);
      u.armL.rotation.set(-0.92, 0.14, 0.7);
      u.armR.position.set(-0.23, 1.08, 0);
      u.armR.rotation.set(0.34, 0.05, -0.46);
      u.legL.rotation.set(swing, 0, 0.04);
      u.legR.rotation.set(-swing, 0, -0.04);
      u.head.rotation.set(0.1, 0, 0);
      return;
    }
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
  }

  function stepGuard(p, dt, t) {
    if (!p || p.dead || p.gone) return;
    const pos = playerPos();
    const dx = (pos.x || 0) - p.x;
    const dz = (pos.z || 0) - p.z;
    const dist = Math.hypot(dx, dz);
    if (!p.angry) {
      poseGuard(p, t, false, "");
      return;
    }
    p.yaw = Math.atan2(dx, dz);
    if ((p.drawT || 0) > 0) {
      p.drawT = Math.max(0, p.drawT - dt);
      showBaton(p);
      poseGuard(p, t, false, "draw");
      p.rig.rotation.y = p.yaw;
      return;
    }
    showBaton(p);
    const reach = 1.16;
    if ((p.swingT || 0) > 0) {
      p.swingT += dt;
      if (p.swingT > 0.16 && p.swingT < 0.34 && !p.swingLanded && dist < reach + 0.22) {
        p.swingLanded = true;
        const inv = dist || 1;
        hitPlayer?.(dx / inv, dz / inv, 3, "guard");
      }
      if (p.swingT > 0.55) {
        p.swingT = 0;
        p.swingLanded = false;
      }
      poseGuard(p, t, false, "swing");
    } else {
      const chasing = dist > 0.82 && (p.hurtT || 0) <= 0.08;
      if (chasing) {
        const step = Math.min(dist, 3.15 * dt);
        let nx = p.x + (dx / (dist || 1)) * step;
        let nz = p.z + (dz / (dist || 1)) * step;
        if (collideWorld) [nx, nz] = collideWorld(nx, nz, 0.32);
        p.x = nx;
        p.z = nz;
      }
      if (dist < reach && (p.hurtT || 0) <= 0) {
        p.swingT = 0.001;
        p.swingLanded = false;
        audio?.baton?.();
      }
      poseGuard(p, t, chasing, "chase");
    }
    p.rig.position.set(p.x, p.y, p.z);
    p.rig.rotation.y = p.yaw;
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
    let aimX = p.tx;
    let aimZ = p.tz;
    if (p.y > 1.2 && !p.route) {
      const via = balconySteer(p.x, p.z, p.tx, p.tz);
      if (via) {
        aimX = via.x;
        aimZ = via.z;
      }
    }
    const dx = aimX - p.x;
    const dz = aimZ - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.16) {
      p.walking = false;
      if (p.route) {
        pickTarget(p);
        return false;
      }
      p.wait = 0.16 + hash01(p.x, p.z, p.phase) * 0.7;
      if (p.y > 1.4 && hash01(p.x, p.wait, p.phase) > 0.42 && trySeatNearby(p)) return false;
      if (p.backDance && p.y < 0.4) {
        putBackOnFloor(p);
        return false;
      }
      return false;
    }
    const upper = p.y > 1.15 || onBalcony(p.x, p.z) || usingStairs(p);
    if (!p.walking && (walkingCount() >= MAX_WALKING_PEOPLE || (upper && balconyWalkingCount() >= BALCONY_WALKER_LIMIT))) return false;
    p.walking = true;
    const step = Math.min(dist, (p.route ? p.speed * 1.08 : p.speed) * dt);
    const nx = p.x + (dx / dist) * step;
    const nz = p.z + (dz / dist) * step;
    const stairing = usingStairs(p) && (onStairs(p.x, p.z) || onStairs(nx, nz) || inStairwell(nx, nz));
    if (!stairing) {
      if (p.y < 1 && blockedFloor(nx, nz)) {
        p.walking = false;
        pickTarget(p);
        return false;
      }
      if (p.y > 1 && !onBalcony(nx, nz)) {
        p.walking = false;
        pickTarget(p);
        return false;
      }
    }
    p.x = nx;
    p.z = nz;
    setLevel(p);
    p.yaw = Math.atan2(dx, dz);
    return true;
  }

  function flushSkin(p) {
    const u = p.rig.userData;
    const bases = u.flashBase || [];
    for (const b of bases) b.m.color.setRGB(b.r, b.g, b.b);
    if (p.mode === "guard" && p.angry && u.skin) {
      u.skin.color.setRGB(0.96, 0.4, 0.34);
    } else if (p.mode !== "guard" && u.skin) {
      const flush = Math.min(1, p.drunk * 0.7);
      u.skin.color.setRGB(0.91 + flush * 0.08, 0.7 - flush * 0.42, 0.54 - flush * 0.38);
    }
    if ((p.hurtT || 0) > 0) {
      const a = Math.min(1, p.hurtT / 0.12);
      for (const b of bases) b.m.color.setRGB(1, 0.28 * (1 - a), 0.28 * (1 - a));
      if (u.skin) u.skin.color.setRGB(1, 0.32, 0.32);
    }
  }

  function separate(dt) {
    const pos = playerPos();
    const feet = Math.max(0, (pos.y || 0) - 1.5);
    for (let i = 0; i < crowd.length; i++) {
      const a = crowd[i];
      if (a.dead || a.gone || a.mode === "guard" || planted(a)) continue;
      for (let j = i + 1; j < crowd.length; j++) {
        const b = crowd[j];
        if (b.dead || b.mode === "guard" || a.partner === b || b.partner === a) continue;
        if (Math.abs(a.y - b.y) > 1.1) continue;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const need = a.r + b.r + 0.04;
        if (dist >= need) continue;
        const push = (need - dist) * 0.95;
        const ux = dx / dist;
        const uz = dz / dist;
        if (a.mode !== "kiss" && a.mode !== "sit" && a.mode !== "dj") {
          a.x += ux * push;
          a.z += uz * push;
        }
        if (b.mode !== "kiss" && b.mode !== "sit" && b.mode !== "dj") {
          b.x -= ux * push;
          b.z -= uz * push;
        }
      }
      if (Math.abs(a.y - feet) < 1.15 && a.mode !== "sit") {
        const dx = a.x - pos.x;
        const dz = a.z - pos.z;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const need = a.r + 0.44;
        if (dist < need) {
          a.x += (dx / dist) * (need - dist) * 1.2;
          a.z += (dz / dist) * (need - dist) * 1.2;
          if (a.mode === "kiss" && a.partner) {
            a.partner.mode = "mingle";
            a.partner.partner = null;
            a.partner.wait = 0.15;
            pickTarget(a.partner);
            a.mode = "mingle";
            a.partner = null;
            a.wait = 0.15;
            pickTarget(a);
          }
        }
      }
      if (a.mode === "dance") {
        a.x += (a.homeX - a.x) * Math.min(1, dt * 0.05);
        a.z += (a.homeZ - a.z) * Math.min(1, dt * 0.05);
        if (a.y < 1 && !inStairwell(a.x, a.z) && !onStairs(a.x, a.z)) {
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
    if (!p || p.dead || p.mode === "dj" || (p.mode === "guard" && !p.angry)) return;
    if (usingStairs(p)) {
      const lane = p.route === "down" ? STAIR_X - 0.34 : STAIR_X + 0.34;
      p.x += (lane - p.x) * 0.45;
      p.x = THREE.MathUtils.clamp(p.x, STAIR_X - 0.82, STAIR_X + 0.82);
      p.z = THREE.MathUtils.clamp(p.z, STAIR_Z1 - 0.04, STAIR_Z0 + 0.08);
      if (onStairs(p.x, p.z)) p.y = stairHeight(p.z);
      else if (p.route === "up" && p.z <= STAIR_Z1 + 0.1) p.y = BALC_Y;
      else if (p.route === "down" && p.z >= STAIR_Z0 - 0.1) p.y = 0;
      return;
    }
    if (onStairs(p.x, p.z) || inStairwell(p.x, p.z)) {
      if (p.y > 1.15) {
        const c = clampToDeck(Math.min(p.x, 25.05), Math.min(p.z, 1.05), (p.r || 0.44) + 0.08);
        p.x = c.x;
        p.z = c.z;
        p.y = BALC_Y;
      } else {
        p.x = Math.min(p.x, 24.55);
        p.z = Math.max(p.z, 5.15);
        p.y = 0;
      }
      return;
    }
    if (p.y > 1) {
      const c = clampToDeck(p.x, p.z, (p.r || 0.44) + 0.08);
      p.x = c.x;
      p.z = c.z;
      p.y = BALC_Y;
      keepBehindChairs(p);
      const safe = clampToDeck(p.x, p.z, (p.r || 0.44) + 0.08);
      p.x = safe.x;
      p.z = safe.z;
    } else if (blockedFloor(p.x, p.z)) {
      p.x = THREE.MathUtils.clamp(p.x, CX0 + 0.72, 24.65);
      p.z = THREE.MathUtils.clamp(p.z, CZ0 + 0.72, CZ1 - 0.72);
    }
  }

  function collide(px, pz, r = 0.28, feet = 0) {
    for (const p of crowd) {
      if (p.dead || p.gone) continue;
      if (Math.abs((p.y || 0) - feet) > 1.15) continue;
      const dx = px - p.x;
      const dz = pz - p.z;
      const cr = r + p.r;
      const dist2 = dx * dx + dz * dz;
      if (dist2 >= cr * cr) continue;
      const dist = Math.sqrt(dist2) || 0.0001;
      const need = cr - dist;
      const ux = dx / dist;
      const uz = dz / dist;
      const isPlanted = planted(p);
      if (isPlanted) {
        px += ux * need;
        pz += uz * need;
        continue;
      }
      p.x -= ux * need * 0.92;
      p.z -= uz * need * 0.92;
      if (p.mode === "kiss" && p.partner) {
        const other = p.partner;
        p.partner = null;
        other.partner = null;
        if (!other.dead) {
          other.mode = "mingle";
          other.wait = 0.12;
          pickTarget(other);
        }
        p.mode = "mingle";
        p.wait = 0.12;
        pickTarget(p);
      }
      pinPerson(p);
      p.rig.position.set(p.x, p.y, p.z);
      px += ux * need * 0.12;
      pz += uz * need * 0.12;
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
    for (let i = 0; i < ledWalls.length; i++) {
      ledWalls[i].material.color.setHSL((t * 0.28 + i * 0.08) % 1, 0.92, 0.5);
    }
    for (const p of platters) p.rotation.y = t * 4.8;
    for (let i = 0; i < knobs.length; i++) knobs[i].rotation.y = t * (1.6 + i * 0.35);
    if (fader) fader.position.x = 19.0 + Math.sin(t * 1.3) * 0.16;

    rebalanceT += dt;
    if (rebalanceT > 1.2) {
      rebalanceT = 0;
      rebalanceCrowd();
    }
    for (const p of crowd) {
      if (p.gone) continue;
      if (p.stairCool > 0) p.stairCool -= dt;
      if (p.hurtT > 0) p.hurtT -= dt;
      if (p.dead) {
        p.deadT = (p.deadT || 0) + dt;
        if (p.deadT >= 10) {
          buryPerson(p);
          continue;
        }
        poseDead(p, t);
      } else if (p.hurtT > 0) poseHurt(p, t);
      else if (p.mode === "mingle") {
        const walking = stepMingle(p, dt);
        if (walking) poseWalk(p, t);
        else poseSway(p, t);
      } else if (p.mode === "dance") {
        if (danceCount() > wantDance + 1 && hash01(p.phase, Math.floor(t * 0.22), p.x) > 0.97) {
          p.mode = "mingle";
          p.backDance = true;
          p.wait = 0;
          pickTarget(p);
        }
        poseDance(p, t);
      } else if (p.mode === "sit") {
        if (p.hurtT <= 0 && hash01(p.phase, Math.floor(t * 0.11), p.x) > 0.8 && p.chair) kickChair(p.chair);
        else poseSit(p, t);
      }
      else if (p.mode === "dj") poseDj(p, t);
      else if (p.mode === "kiss") poseKiss(p, t);
      else if (p.mode === "guard") stepGuard(p, dt, t);
      else poseSway(p, t);
      poseDizzy(p, t);
      flushSkin(p);
    }
    separate(dt);
    for (let i = crowd.length - 1; i >= 0; i--) {
      if (crowd[i].gone) crowd.splice(i, 1);
    }
  }

  function buryPerson(p) {
    if (!p || p.gone) return;
    p.gone = true;
    p.dead = true;
    p.r = 0;
    if (p.chair) {
      p.chair.userData.sitter = null;
      p.chair = null;
    }
    if (p.partner) {
      const other = p.partner;
      p.partner = null;
      other.partner = null;
      if (other && !other.dead && other.mode === "kiss") {
        other.mode = "mingle";
        other.wait = 0.2;
        pickTarget(other);
      }
    }
    if (p.rig) {
      p.rig.parent?.remove(p.rig);
      p.rig = null;
    }
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
    const a = Math.min(1, (p.hurtT || 0) / 0.18);
    u.body.position.y = 0.02 * a;
    u.body.rotation.set(-0.22 * a, 0, 0.08 * a);
    u.armL.rotation.set(0.55 * a, 0.18 * a, 0.42 * a);
    u.armR.rotation.set(0.4 * a, -0.16 * a, -0.32 * a);
    u.head.rotation.set(0.34 * a, 0, 0.12 * a);
    if (u.stars) u.stars.visible = false;
  }

  function punchPick(aim = {}) {
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
    let bestDist = 2.25;
    for (const p of crowd) {
      if (p.dead || p.gone) continue;
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
    return best ? { person: best, dist: bestDist } : null;
  }

  function applyPunch(best, aim = {}) {
    if (!best || best.dead || best.gone) return null;
    let fx = Number(aim.fx);
    let fz = Number(aim.fz);
    const aimLen = Math.hypot(fx, fz) || 1;
    fx /= aimLen;
    fz /= aimLen;
    const wasGuard = best.mode === "guard";
    if (wasGuard) {
      if (!best.angry) {
        best.angry = true;
        best.drawT = 0.32;
        audio?.baton?.();
      }
      showBaton(best);
    }
    best.hp = Math.max(0, (best.hp ?? 10) - (aim.dmg || 1));
    best.hurtT = 0.28;
    best.walking = false;
    if (!wasGuard) {
      best.x += fx * 0.22;
      best.z += fz * 0.22;
    }
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
    if (best.y > 1) {
      const c = clampToDeck(best.x, best.z, (best.r || 0.44) + 0.08);
      best.x = c.x;
      best.z = c.z;
    }
    best.rig.position.set(best.x, best.y, best.z);
    if (best.hp > 0) return wasGuard ? "guardhit" : "hit";
    best.dead = true;
    best.mode = "dead";
    best.deadT = 0;
    best.r = 0.08;
    return wasGuard ? "guardkill" : "kill";
  }

  function punch(aim = {}) {
    const pick = punchPick(aim);
    if (!pick) return null;
    return applyPunch(pick.person, aim);
  }

  function buildMist() {
    const fogMat = (opacity) =>
      new THREE.MeshBasicMaterial({
        color: 0x59616b,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    const y0 = 0.34;
    const y1 = CLUB_H - 0.12;
    const n = 18;
    for (let i = 0; i < n; i++) {
      const u = n <= 1 ? 0.5 : i / (n - 1);
      const y = y0 + (y1 - y0) * u;
      const o = 0.025 + Math.sin(u * Math.PI) * 0.045;
      const w = 16.7 - Math.abs(u - 0.5) * 0.7;
      const d = 10.5 - Math.abs(u - 0.5) * 0.5;
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fogMat(o));
      mist.rotation.x = -Math.PI / 2;
      mist.position.set(19.0, y, -0.35);
      mist.renderOrder = 4;
      scene.add(mist);
    }
    const sheets = [
      { x: 19.0, z: -0.35, w: 16.5, yaw: 0 },
      { x: 19.0, z: -0.35, w: 10.3, yaw: Math.PI / 2 },
      { x: 15.2, z: -0.35, w: 10.1, yaw: Math.PI / 2 },
      { x: 22.8, z: -0.35, w: 10.1, yaw: Math.PI / 2 },
    ];
    const h = y1 - y0;
    for (const sh of sheets) {
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(sh.w, h), fogMat(0.05));
      mist.position.set(sh.x, (y0 + y1) * 0.5, sh.z);
      mist.rotation.y = sh.yaw;
      mist.renderOrder = 4;
      scene.add(mist);
    }
  }

  function build() {
    if (built) return;
    buildRoom();
    buildBooth();
    buildStairs();
    buildBalcony();
    buildLights();
    buildMist();
    scatterTrash();
    buildCrowd();
    built = true;
  }

  function prompt(obj) {
    if (obj?.userData?.kind === "clubDj") {
      return audio?.clubPrompt?.() || "E skip club song";
    }
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

  function angryGuards() {
    const out = [];
    for (const p of crowd) {
      if (p.mode === "guard" && p.angry && !p.dead && !p.gone) out.push({ x: p.x, z: p.z });
    }
    return out;
  }

  return { build, tick, collide, inside, prompt, use, claimChair, freeChair, punch, punchPick, applyPunch, angryGuards };
}

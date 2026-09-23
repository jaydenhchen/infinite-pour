/** Nightclub next door: DJ, strobes, packed dance floor, balcony. */
import * as THREE from "three";

const CX0 = 8.14;
const CX1 = 25.42;
const CZ0 = -6.38;
const CZ1 = 6.24;
const CLUB_H = 5.28;
const BALC_Y = 2.62;
const DOOR_Z0 = -0.55;
const DOOR_Z1 = 0.68;
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10);

const SKINS = [0xe8b48a, 0xd4a07a, 0xc48a62, 0xf0c4a0, 0x8a5a3a];
const HAIRS = [0x1a100c, 0x3a1a12, 0xc9a227, 0x8a2018, 0x0c0c12, 0x4a2040];
const DRESS = [0x120814, 0xff3dac, 0xc41e3a, 0xf4ead0, 0x3dfff2, 0x6b1c9a, 0xe8c547, 0x1a1a28];
const SHIRTS = [0x121014, 0xf4ead0, 0x2e6bff, 0xc41e3a, 0x3a2030];

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
  } = api;

  const crowd = [];
  const strobes = [];
  const tiles = [];
  const beams = [];
  let ledWall = null;
  let ball = null;
  let haze = [];
  let built = false;

  function playerPos() {
    return api.playerPos?.() || { x: 0, y: 0, z: 0 };
  }

  function inside(x, z) {
    return x > CX0 + 0.12 && x < CX1 - 0.12 && z > CZ0 + 0.12 && z < CZ1 - 0.12;
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

  function makeGoer(kind, seed) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const girl = kind === "f" || kind === "djf";
    const dj = kind === "dj" || kind === "djf";
    const skinHex = SKINS[(hash01(seed, 1) * SKINS.length) | 0];
    const hairHex = HAIRS[(hash01(seed, 2) * HAIRS.length) | 0];
    const clothHex = girl ? DRESS[(hash01(seed, 3) * DRESS.length) | 0] : SHIRTS[(hash01(seed, 3) * SHIRTS.length) | 0];
    const skin = lambert(skinHex, { emissive: 0x3a1810, emissiveIntensity: 0.12 });
    const cloth = lambert(clothHex, { emissive: clothHex, emissiveIntensity: 0.08 });
    const hair = lambert(hairHex);
    const pantsHex = girl ? clothHex : hash01(seed, 4) > 0.45 ? 0x121018 : 0x1c2438;
    const pants = lambert(pantsHex);
    const shoe = lambert(girl ? 0x1a0a10 : 0x121014);
    const eye = lambert(0x140808);

    addMesh(body, unitBox, skin, 0, 0.96, 0, girl ? 0.28 : 0.3, 0.34, 0.16);
    if (girl) {
      addMesh(body, unitBox, skin, -0.085, 1.05, 0.11, 0.15, 0.13, 0.13);
      addMesh(body, unitBox, skin, 0.085, 1.05, 0.11, 0.15, 0.13, 0.13);
      const cut = hash01(seed, 5);
      if (cut < 0.34) {
        addMesh(body, unitBox, cloth, 0, 0.78, 0.02, 0.32, 0.46, 0.18);
        addMesh(body, unitBox, cloth, 0, 1.0, 0.08, 0.3, 0.08, 0.16);
      } else if (cut < 0.67) {
        addMesh(body, unitBox, cloth, 0, 0.9, 0.01, 0.3, 0.14, 0.18);
        addMesh(body, unitBox, cloth, 0, 0.68, 0.01, 0.3, 0.3, 0.16);
      } else {
        addMesh(body, unitBox, cloth, 0, 0.86, 0.02, 0.3, 0.22, 0.18);
        addMesh(body, unitBox, pants, 0, 0.62, 0, 0.3, 0.22, 0.16);
      }
    } else {
      const open = hash01(seed, 6) > 0.4;
      addMesh(body, unitBox, cloth, 0, 0.98, 0, 0.36, open ? 0.28 : 0.44, 0.2);
      if (open) addMesh(body, unitBox, skin, 0, 0.92, 0.06, 0.2, 0.22, 0.1);
      addMesh(body, unitBox, pants, 0, 0.7, 0, 0.34, 0.18, 0.2);
    }

    const head = new THREE.Group();
    head.position.set(0, 1.36, 0);
    head.rotation.order = "YXZ";
    addMesh(head, unitBox, skin, 0, 0, 0, 0.26, 0.26, 0.26);
    addMesh(head, unitBox, eye, -0.055, 0.02, 0.13, 0.045, 0.035, 0.03);
    addMesh(head, unitBox, eye, 0.055, 0.02, 0.13, 0.045, 0.035, 0.03);
    if (girl) {
      addMesh(head, unitBox, hair, 0, 0.1, -0.04, 0.3, 0.14, 0.32);
      addMesh(head, unitBox, hair, 0, -0.04, -0.15, 0.12, 0.28, 0.12);
      addMesh(head, unitBox, hair, 0.12, 0.04, 0.04, 0.08, 0.16, 0.16);
      addMesh(head, unitBox, hair, -0.12, 0.04, 0.04, 0.08, 0.16, 0.16);
      addMesh(head, unitBox, lambert(0xe8c547), -0.14, 0.0, 0.04, 0.03, 0.08, 0.03);
      addMesh(head, unitBox, lambert(0xe8c547), 0.14, 0.0, 0.04, 0.03, 0.08, 0.03);
    } else {
      addMesh(head, unitBox, hair, 0, 0.12, -0.02, 0.28, 0.08, 0.28);
    }
    if (dj) {
      addMesh(head, unitBox, lambert(0x121014), 0, 0.02, 0, 0.3, 0.08, 0.22);
      addMesh(head, unitBox, lambert(0x1a1a22), -0.16, 0.02, 0, 0.06, 0.12, 0.1);
      addMesh(head, unitBox, lambert(0x1a1a22), 0.16, 0.02, 0, 0.06, 0.12, 0.1);
    }
    body.add(head);

    const armL = new THREE.Group();
    addMesh(armL, unitBox, girl ? skin : cloth, 0, -0.08, 0, 0.11, 0.32, 0.11);
    addMesh(armL, unitBox, skin, 0, -0.28, 0, 0.1, 0.14, 0.1);
    armL.position.set(0.22, 1.08, 0);
    body.add(armL);
    const armR = new THREE.Group();
    addMesh(armR, unitBox, girl ? skin : cloth, 0, -0.08, 0, 0.11, 0.32, 0.11);
    addMesh(armR, unitBox, skin, 0, -0.28, 0, 0.1, 0.14, 0.1);
    if (hash01(seed, 8) > 0.45 && !dj) {
      const cup = addMesh(armR, unitCyl, lambert(0xd22b2b), 0.02, -0.4, 0.04, 0.035, 0.09, 0.035);
      addMesh(cup, unitCyl, lambert(0xe8c547, { transparent: true, opacity: 0.7 }), 0, 0.2, 0, 0.7, 0.45, 0.7);
    }
    armR.position.set(-0.22, 1.08, 0);
    body.add(armR);

    const legL = new THREE.Group();
    addMesh(legL, unitBox, girl && hash01(seed, 9) < 0.7 ? skin : pants, 0, -0.2, 0, 0.12, 0.38, 0.12);
    addMesh(legL, unitBox, shoe, 0, -0.44, girl ? 0.04 : 0.02, 0.12, 0.08, girl ? 0.2 : 0.16);
    legL.position.set(-0.1, 0.72, 0);
    body.add(legL);
    const legR = new THREE.Group();
    addMesh(legR, unitBox, girl && hash01(seed, 9) < 0.7 ? skin : pants, 0, -0.2, 0, 0.12, 0.38, 0.12);
    addMesh(legR, unitBox, shoe, 0, -0.44, girl ? 0.04 : 0.02, 0.12, 0.08, girl ? 0.2 : 0.16);
    legR.position.set(0.1, 0.72, 0);
    body.add(legR);

    if (girl) body.scale.setScalar(0.96);
    const stars = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      addMesh(stars, unitBox, lambert(0xffe066), Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2, 0.05, 0.05, 0.05);
    }
    stars.position.set(0, 0.26, 0);
    stars.visible = false;
    head.add(stars);

    g.userData = { body, head, armL, armR, legL, legR, stars, skin };
    return g;
  }

  function placePerson(kind, x, z, y, yaw, drunk, seed, mode) {
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
      drunk,
      gender: kind.startsWith("dj") ? (kind === "djf" ? "f" : "m") : kind,
      r: kind.startsWith("dj") ? 0.42 : 0.38,
      phase: hash01(seed, 21) * Math.PI * 2,
      style: (hash01(seed, 22) * 4) | 0,
      mode,
      walk: hash01(seed, 23) * 10,
    };
    crowd.push(person);
    return person;
  }

  function packSpots(cx, cz, w, d, n, y, minR, avoid) {
    const spots = [];
    let tries = 0;
    while (spots.length < n && tries < n * 40) {
      tries++;
      const x = cx + (hash01(tries, n, 3) - 0.5) * w;
      const z = cz + (hash01(tries, n, 7) - 0.5) * d;
      if (avoid && avoid(x, z)) continue;
      let ok = true;
      for (const s of spots) {
        if (Math.hypot(s.x - x, s.z - z) < minR) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      spots.push({ x, z, y });
    }
    return spots;
  }

  function blockedFloor(x, z) {
    if (x > 21.7) return true;
    if (z < -3.55) return true;
    if (x < 10.6 && z > 1.15 && z < 4.15) return true;
    if (x > 13.6 && x < 20.2 && z < -3.9) return true;
    if (Math.abs(x - 8.7) < 1.1 && Math.abs(z - 0.05) < 1.1) return true;
    return false;
  }

  function buildBooth() {
    const dark = lambert(0x121018);
    const deck = lambert(0x1a1a24);
    const chrome = lambert(0xc8d0d8);
    const glow = lambert(0xff3dac, { emissive: 0xff3dac, emissiveIntensity: 0.7 });
    const cyan = lambert(0x3dfff2, { emissive: 0x3dfff2, emissiveIntensity: 0.6 });
    addMesh(scene, unitBox, dark, 16.7, 0.2, -5.05, 5.6, 0.4, 1.9);
    worldSolid(16.7, -5.05, 5.7, 2.0, 0.4);
    climbSolid(16.7, -5.05, 5.7, 2.0, 0.4);
    addMesh(scene, unitBox, deck, 16.7, 0.72, -5.15, 4.4, 0.08, 1.15);
    worldSolid(16.7, -5.15, 4.5, 1.2, 0.78);
    addMesh(scene, unitBox, lambert(0x0a0a10), 15.4, 0.82, -5.05, 1.15, 0.08, 0.7);
    addMesh(scene, unitBox, lambert(0x0a0a10), 17.95, 0.82, -5.05, 1.15, 0.08, 0.7);
    addMesh(scene, unitBox, lambert(0x16161e), 16.7, 0.84, -5.05, 0.85, 0.1, 0.55);
    for (const x of [15.1, 15.7, 17.65, 18.25]) {
      addMesh(scene, unitCyl, chrome, x, 0.88, -4.88, 0.08, 0.04, 0.08);
      addMesh(scene, unitCyl, glow, x, 0.9, -5.22, 0.05, 0.02, 0.05);
    }
    for (let i = 0; i < 8; i++) addMesh(scene, unitBox, i % 2 ? glow : cyan, 16.4 + (i - 3.5) * 0.08, 0.9, -5.05, 0.05, 0.04, 0.08);
    addMesh(scene, unitBox, lambert(0x1a1a22), 16.7, 0.92, -5.42, 0.62, 0.08, 0.38);
    addMesh(scene, unitBox, lambert(0x3dfff2, { emissive: 0x2244aa, emissiveIntensity: 0.4 }), 16.7, 0.97, -5.42, 0.5, 0.01, 0.28);
    ledWall = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.7), new THREE.MeshBasicMaterial({ color: 0xff3dac }));
    ledWall.position.set(16.7, 2.15, -6.22);
    scene.add(ledWall);
    sign("PULSE", 0x3dfff2, 2.4, 0.42, 16.7, 3.15, -6.2);
    for (const x of [13.55, 19.85]) {
      addMesh(scene, unitBox, dark, x, 0.95, -5.35, 0.7, 1.7, 0.55);
      addMesh(scene, unitBox, glow, x, 1.55, -5.35, 0.55, 0.12, 0.4);
      addMesh(scene, unitBox, dark, x, 2.05, -5.35, 0.62, 0.5, 0.5);
      worldSolid(x, -5.35, 0.8, 0.65, 2.2);
    }
    addMesh(scene, unitCyl, chrome, 16.05, 1.15, -4.55, 0.02, 1.1, 0.02);
    addMesh(scene, unitCyl, lambert(0x22222a), 16.05, 1.72, -4.4, 0.03, 0.08, 0.03);
  }

  function buildStairs() {
    const wood = lambert(0x1a1218);
    const rail = lambert(0x3dfff2, { emissive: 0x3dfff2, emissiveIntensity: 0.35 });
    const n = 16;
    const rise = BALC_Y / n;
    const run = 0.3;
    const x = 23.55;
    const z0 = 4.28;
    for (let i = 0; i < n; i++) {
      const z = z0 - i * run;
      const h = (i + 1) * rise;
      addMesh(scene, unitBox, wood, x, h / 2, z, 1.7, h, run - 0.02);
      climbSolid(x, z, 1.74, run + 0.03, h);
      camBox(x, h / 2, z, 1.74, h, run);
    }
    const midZ = z0 - ((n - 1) * run) / 2;
    const span = n * run + 0.1;
    addMesh(scene, unitBox, rail, 22.68, 1.2, midZ, 0.05, 2.4, span);
    addMesh(scene, unitBox, rail, 24.42, 1.2, midZ, 0.05, 2.4, span);
    worldSolid(22.68, midZ, 0.12, span, 2.4);
    worldSolid(24.42, midZ, 0.12, span, 2.4);
  }

  function buildBalcony() {
    const plank = lambert(0x161018);
    const rail = lambert(0x2a2030);
    const glow = lambert(0xff3dac, { emissive: 0xff3dac, emissiveIntensity: 0.45 });
    const decks = [
      { x: 16.78, z: -4.95, w: 16.9, d: 2.55 },
      { x: 23.55, z: -1.85, w: 3.4, d: 3.55 },
    ];
    for (const d of decks) {
      addMesh(scene, unitBox, plank, d.x, BALC_Y - 0.07, d.z, d.w, 0.14, d.d);
      floorSolid(d.x, d.z, d.w, d.d, BALC_Y, 0.16);
      camBox(d.x, BALC_Y - 0.07, d.z, d.w, 0.14, d.d);
      addCeiling(d.x, d.z, d.w, d.d, BALC_Y - 0.08);
    }
    const rails = [
      { x: 16.78, z: -3.72, w: 16.7, d: 0.08, y: BALC_Y + 0.46 },
      { x: 21.88, z: -1.9, w: 0.08, d: 3.4, y: BALC_Y + 0.46 },
      { x: 8.55, z: -4.95, w: 0.08, d: 2.4, y: BALC_Y + 0.46 },
      { x: 25.05, z: -3.2, w: 0.08, d: 6.0, y: BALC_Y + 0.46 },
    ];
    for (const r of rails) {
      addMesh(scene, unitBox, rail, r.x, r.y, r.z, r.w, 0.92, r.d);
      addMesh(scene, unitBox, glow, r.x, r.y + 0.42, r.z, Math.max(r.w, 0.04), 0.04, Math.max(r.d, 0.04));
      railSolid(r.x, r.z, Math.max(0.16, r.w + 0.06), Math.max(0.16, r.d + 0.06), BALC_Y, BALC_Y + 0.95);
    }
    const chair = (x, z, yaw) => {
      const seat = lambert(0x1a0c14);
      addMesh(scene, unitBox, seat, x, BALC_Y + 0.28, z, 0.42, 0.08, 0.42);
      addMesh(scene, unitBox, seat, x + Math.sin(yaw) * 0.16, BALC_Y + 0.52, z + Math.cos(yaw) * 0.16, 0.42, 0.42, 0.08);
      const stool = addMesh(scene, unitBox, seat, x, BALC_Y + 0.22, z, 0.2, 0.08, 0.2);
      stool.userData.kind = "stool";
      stool.userData.root = stool;
      stool.userData.sit = {
        x,
        z,
        y: BALC_Y + 1.18,
        yaw,
        floor: BALC_Y,
        standX: x - Math.sin(yaw) * 0.45,
        standZ: z - Math.cos(yaw) * 0.45,
      };
      registerPick(stool);
    };
    chair(11.2, -4.55, 0);
    chair(13.1, -4.55, 0);
    chair(15.0, -4.55, 0);
    chair(18.4, -4.55, 0);
    chair(20.3, -4.55, 0);
    chair(22.6, -1.15, -Math.PI / 2);
    chair(22.6, -2.35, -Math.PI / 2);
    addMesh(scene, unitBox, lambert(0x2a1a22), 12.15, BALC_Y + 0.32, -5.35, 0.7, 0.08, 0.4);
    addMesh(scene, unitBox, lambert(0x2a1a22), 19.35, BALC_Y + 0.32, -5.35, 0.7, 0.08, 0.4);
  }

  function buildLights() {
    const cols = [0xff3dac, 0x3dfff2, 0x6b1cff, 0xc41e3a, 0xe8c547, 0x2e6bff];
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.PointLight(cols[i], 0.8, 9);
      pl.position.set(11.2 + (i % 3) * 4.1, 3.15, -1.4 + Math.floor(i / 3) * 3.4);
      scene.add(pl);
      strobes.push({ light: pl, hex: cols[i], phase: i * 0.7 });
    }
    const wash = new THREE.PointLight(0x6a2048, 1.1, 14);
    wash.position.set(16.4, 3.4, 0.4);
    scene.add(wash);
    strobes.push({ light: wash, hex: 0x6a2048, phase: 2.2, wash: true });
    const booth = new THREE.PointLight(0xff66cc, 1.4, 8);
    booth.position.set(16.7, 2.6, -4.2);
    scene.add(booth);
    const vip = new THREE.PointLight(0xff88aa, 0.9, 7);
    vip.position.set(16.5, 4.4, -4.6);
    scene.add(vip);
    for (let i = 0; i < 4; i++) {
      const beam = addMesh(
        scene,
        unitBox,
        lambert(0xffffff, { transparent: true, opacity: 0.08, emissive: 0xffffff, emissiveIntensity: 0.2 }),
        12 + i * 2.4,
        2.4,
        0.6,
        0.08,
        3.2,
        0.08
      );
      beams.push({ mesh: beam, phase: i * 1.1 });
    }
    ball = addMesh(scene, new THREE.SphereGeometry(0.22, 10, 8), lambert(0xd0d8e0, { emissive: 0x8899aa, emissiveIntensity: 0.4 }), 16.2, 3.55, 0.8, 1, 1, 1);
    for (let i = 0; i < 3; i++) {
      const h = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 2.4),
        lambert(0xff66cc, { transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false })
      );
      h.position.set(16.2, 1.1 + i * 0.55, 0.2);
      h.rotation.x = -0.15;
      scene.add(h);
      haze.push(h);
    }
  }

  function buildFloorTiles() {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 4; j++) {
        const tile = addMesh(
          scene,
          unitBox,
          lambert(0x220818, { emissive: 0xff3dac, emissiveIntensity: 0.2 }),
          11.4 + i * 2.05,
          0.02,
          -1.6 + j * 1.45,
          1.85,
          0.03,
          1.28
        );
        tiles.push(tile);
      }
    }
  }

  function buildCrowd() {
    const floor = packSpots(15.4, 0.55, 10.8, 6.2, 32, 0, 0.78, blockedFloor);
    floor.forEach((s, i) => {
      const girl = hash01(i, 4) > 0.38;
      const drunk = 0.18 + hash01(i, 9) * 1.25;
      const yaw = (hash01(i, 11) - 0.5) * 1.6 + (s.z < -2 ? 0 : Math.PI);
      placePerson(girl ? "f" : "m", s.x, s.z, 0, yaw, drunk, i + 3, "dance");
    });
    placePerson(hash01(90, 1) > 0.5 ? "djf" : "dj", 16.7, -4.72, 0.4, 0, 0.35, 90, "dj");
    const vip = [
      { x: 11.2, z: -4.55, sit: true },
      { x: 15.0, z: -4.55, sit: true },
      { x: 20.3, z: -4.55, sit: true },
      { x: 22.6, z: -2.35, sit: true },
      { x: 13.8, z: -4.2, sit: false },
      { x: 18.8, z: -4.15, sit: false },
      { x: 23.1, z: -1.0, sit: false },
    ];
    vip.forEach((s, i) => {
      const girl = hash01(i, 30) > 0.35;
      const drunk = 0.22 + hash01(i, 31) * 0.9;
      const yaw = s.x > 22 ? -Math.PI / 2 : 0;
      placePerson(girl ? "f" : "m", s.x, s.z, BALC_Y, yaw, drunk, i + 40, s.sit ? "sit" : "sway");
    });
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

    const doorZ = (DOOR_Z0 + DOOR_Z1) / 2;
    const southL = DOOR_Z0 - CZ0;
    const northL = CZ1 - DOOR_Z1;
    wall(CX0, CZ0 + southL / 2, 0.2, CLUB_H, southL, plaster);
    wall(CX0, CZ1 - northL / 2, 0.2, CLUB_H, northL, plaster);
    addMesh(scene, unitBox, plaster, CX0, 3.75, doorZ, 0.2, 1.5, DOOR_Z1 - DOOR_Z0 + 0.08);
    camBox(CX0, 3.75, doorZ, 0.28, 1.5, DOOR_Z1 - DOOR_Z0 + 0.1);

    const frontDoorX = 16.35;
    const frontW = 1.58;
    const leftW = frontDoorX - frontW / 2 - CX0;
    const rightW = CX1 - (frontDoorX + frontW / 2);
    wall((CX0 + frontDoorX - frontW / 2) / 2, CZ1, leftW, CLUB_H, 0.22, plaster);
    wall((CX1 + frontDoorX + frontW / 2) / 2, CZ1, rightW, CLUB_H, 0.22, plaster);
    addMesh(scene, unitBox, plaster, frontDoorX, 3.85, CZ1, frontW + 0.1, 1.4, 0.22);
    camBox(frontDoorX, 3.85, CZ1, frontW + 0.16, 1.4, 0.28);
    wall(cx, CZ0, w, CLUB_H, 0.22, plaster);
    wall(CX1, cz, 0.22, CLUB_H, d, plaster);

    makeHingeDoor(CX0, DOOR_Z1, Math.PI / 2, 1.22, 2.22, "clubDoor", 1);
    makeHingeDoor(frontDoorX - frontW / 2, CZ1, 0, frontW, 2.32, "clubDoor", 1);

    strip(cx, 2.55, CZ1 - 0.14, w - 0.6, 0.05, 0.04, 0xff3dac);
    strip(cx, 2.55, CZ0 + 0.14, w - 0.6, 0.05, 0.04, 0x3dfff2);
    strip(CX1 - 0.14, 2.7, cz, 0.04, 0.05, d - 0.6, 0xff3dac);
    strip(CX0 + 0.14, 1.4, -2.8, 0.04, 0.05, 4.2, 0x3dfff2);

    sign("AFTER HOURS", 0xff3dac, 4.6, 0.7, frontDoorX, 3.55, CZ1 + 0.14);
    sign("PULSE", 0x3dfff2, 2.2, 0.4, frontDoorX, 2.95, CZ1 + 0.14);
    sign("CLUB", 0xff3dac, 1.4, 0.32, 8.28, 2.55, 0.05, -Math.PI / 2);
    sign("VIP", 0xe8c547, 1.1, 0.28, 21.7, BALC_Y + 1.15, 0.4, Math.PI / 2);

    addMesh(scene, unitBox, lambert(0x1a1018), 9.55, 0.55, 2.55, 1.7, 1.1, 2.4);
    worldSolid(9.55, 2.55, 1.8, 2.5, 1.15);
    addMesh(scene, unitBox, lambert(0x2a1a22), 9.55, 1.12, 2.55, 1.82, 0.06, 2.52);
    for (let i = 0; i < 6; i++) addMesh(scene, unitCyl, lambert(0x3dfff2), 9.2 + (i % 3) * 0.22, 1.28, 1.9 + Math.floor(i / 3) * 0.7, 0.04, 0.22, 0.04);
    addMesh(scene, unitBox, lambert(0x12080e), 9.9, 1.05, 5.15, 0.7, 2.1, 0.55);
    worldSolid(9.9, 5.15, 0.8, 0.65, 2.1);
    sign("COAT", 0x3dfff2, 0.7, 0.18, 9.9, 2.2, 4.86);

    for (let i = 0; i < 5; i++) {
      addMesh(scene, unitBox, lambert(0x1a1220), 10.2 + i * 2.8, 4.85, 0.2, 2.2, 0.08, 0.12);
      addMesh(scene, unitBox, lambert(0xff3dac, { emissive: 0xff3dac, emissiveIntensity: 0.5 }), 10.2 + i * 2.8, 4.7, 0.2, 0.16, 0.1, 0.16);
    }

    blockCars(cx, cz, w + 1.2, d + 1.2);
    const stoop = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.4), lambert(0x121018));
    stoop.rotation.x = -Math.PI / 2;
    stoop.position.set(frontDoorX, 0.02, CZ1 + 1.15);
    scene.add(stoop);
  }

  function poseDance(p, t) {
    const u = p.rig.userData;
    const d = p.drunk;
    const beat = t * 2.15 + p.phase;
    const bounce = Math.abs(Math.sin(beat * Math.PI)) * (0.03 + (p.style === 2 ? 0.025 : 0.01));
    const sway = Math.sin(beat * 0.5) * (0.08 + d * 0.06);
    const limp = Math.min(1, d);
    u.body.position.y = bounce + Math.sin(t * 1.1 + p.phase) * d * 0.02;
    u.body.rotation.set(Math.sin(beat) * 0.06, 0, sway * 0.35 + Math.sin(t * 0.8 + p.phase) * d * 0.05);
    if (p.style === 0) {
      u.armL.rotation.set(-1.1 + Math.sin(beat) * 0.7, 0.1, 0.4 + Math.sin(beat * 2) * 0.25);
      u.armR.rotation.set(-1.0 + Math.cos(beat) * 0.65, -0.1, -0.35);
    } else if (p.style === 1) {
      u.armL.rotation.set(-0.4, 0.2, 1.1 + Math.sin(beat) * 0.35);
      u.armR.rotation.set(-0.4, -0.2, -1.1 + Math.cos(beat) * 0.35);
    } else if (p.style === 2) {
      u.armL.rotation.set(-1.6 + Math.sin(beat * 2) * 0.2, 0.3, 0.2);
      u.armR.rotation.set(-0.3 + Math.sin(beat) * 0.4, 0, -0.2);
    } else {
      u.armL.rotation.set(-0.8 + Math.sin(beat + 1) * 0.5, 0, 0.55);
      u.armR.rotation.set(-0.8 + Math.cos(beat + 1) * 0.5, 0, -0.55);
    }
    u.legL.rotation.set(Math.sin(beat) * 0.28 * (1 - limp * 0.35), 0, limp * 0.12);
    u.legR.rotation.set(Math.sin(beat + Math.PI) * 0.22 * (1 + limp * 0.2), 0, -limp * 0.06);
    const spin = d > 0.95 ? t * (0.6 + d) + p.phase : Math.sin(t * (0.7 + d) + p.phase) * d * 0.45;
    u.head.rotation.set(
      Math.sin(t * 1.4 + p.phase) * (0.12 + d * 0.18),
      spin * (d > 0.95 ? 1 : 0.35),
      Math.sin(t * 1.7 + p.phase) * d * 0.2
    );
    if (u.stars) u.stars.visible = d > 0.95;
    if (u.stars?.visible) u.stars.rotation.y = t * 3 + p.phase;
    const flush = Math.min(1, d * 0.7);
    u.skin.color.setRGB(0.91 + flush * 0.08, 0.7 - flush * 0.42, 0.54 - flush * 0.38);
  }

  function poseSit(p, t) {
    const u = p.rig.userData;
    u.body.position.y = -0.18;
    u.body.rotation.set(0.08, 0, Math.sin(t * 0.6 + p.phase) * p.drunk * 0.04);
    u.legL.rotation.set(-1.25, 0, 0.08);
    u.legR.rotation.set(-1.18, 0, -0.06);
    u.armL.rotation.set(-0.7, 0.1, 0.25);
    u.armR.rotation.set(-0.55, 0, -0.2);
    u.head.rotation.set(0.08 + Math.sin(t + p.phase) * p.drunk * 0.12, Math.sin(t * 0.5 + p.phase) * 0.2, 0);
    if (u.stars) u.stars.visible = p.drunk > 1.05;
  }

  function poseDj(p, t) {
    const u = p.rig.userData;
    const beat = t * 2.15;
    u.body.position.y = Math.abs(Math.sin(beat * Math.PI)) * 0.025;
    u.body.rotation.set(0.12, Math.sin(t * 0.4) * 0.08, 0);
    u.armL.rotation.set(-0.85 + Math.sin(t * 1.6) * 0.25, 0.2, 0.15);
    u.armR.rotation.set(-1.05 + Math.cos(t * 2.1) * 0.35, -0.15, -0.12);
    u.legL.rotation.set(0.08, 0, 0);
    u.legR.rotation.set(-0.05, 0, 0);
    u.head.rotation.set(0.2 + Math.sin(beat) * 0.08, Math.sin(t * 0.7) * 0.15, 0);
  }

  function poseSway(p, t) {
    const u = p.rig.userData;
    u.body.position.y = Math.sin(t * 1.2 + p.phase) * 0.02;
    u.body.rotation.set(0.04, 0, Math.sin(t * 0.8 + p.phase) * (0.06 + p.drunk * 0.04));
    u.armL.rotation.set(-0.25, 0, 0.35 + Math.sin(t + p.phase) * 0.15);
    u.armR.rotation.set(-0.4, 0, -0.25);
    u.legL.rotation.set(0.05, 0, 0.08);
    u.legR.rotation.set(-0.04, 0, -0.04);
    u.head.rotation.set(Math.sin(t * 1.1 + p.phase) * p.drunk * 0.15, Math.sin(t * 0.6 + p.phase) * 0.25, 0);
    if (u.stars) u.stars.visible = p.drunk > 1.0;
  }

  function separate(dt) {
    const pos = playerPos();
    const feet = Math.max(0, (pos.y || 0) - 1.5);
    for (let i = 0; i < crowd.length; i++) {
      const a = crowd[i];
      if (a.mode === "sit" || a.mode === "dj") continue;
      for (let j = i + 1; j < crowd.length; j++) {
        const b = crowd[j];
        if (Math.abs(a.y - b.y) > 1.1) continue;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const need = a.r + b.r;
        if (dist < need) {
          const push = (need - dist) * 0.55;
          const ux = dx / dist;
          const uz = dz / dist;
          if (a.mode === "dance") {
            a.x += ux * push;
            a.z += uz * push;
          }
          if (b.mode === "dance") {
            b.x -= ux * push;
            b.z -= uz * push;
          }
        }
      }
      if (Math.abs(a.y - feet) < 1.15) {
        const dx = a.x - pos.x;
        const dz = a.z - pos.z;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const need = a.r + 0.32;
        if (dist < need && a.mode === "dance") {
          const push = (need - dist) * 0.8;
          a.x += (dx / dist) * push;
          a.z += (dz / dist) * push;
        }
      }
      if (a.mode === "dance") {
        const hx = a.homeX - a.x;
        const hz = a.homeZ - a.z;
        a.x += hx * Math.min(1, dt * 0.35);
        a.z += hz * Math.min(1, dt * 0.35);
        a.x = THREE.MathUtils.clamp(a.x, 9.5, 21.4);
        a.z = THREE.MathUtils.clamp(a.z, -3.2, 4.5);
        if (blockedFloor(a.x, a.z)) {
          a.x += (a.homeX - a.x) * 0.5;
          a.z += (a.homeZ - a.z) * 0.5;
        }
      }
      a.rig.position.x = a.x;
      a.rig.position.z = a.z;
      a.rig.position.y = a.y;
    }
  }

  function collide(px, pz, r = 0.28, feet = 0) {
    for (const p of crowd) {
      if (Math.abs((p.y || 0) - feet) > 1.15) continue;
      const dx = px - p.x;
      const dz = pz - p.z;
      const cr = r + p.r;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < cr * cr) {
        const dist = Math.sqrt(dist2) || 0.0001;
        const need = cr - dist;
        px += (dx / dist) * need;
        pz += (dz / dist) * need;
      }
    }
    return [px, pz];
  }

  function tick(dt, t) {
    if (!built) return;
    const pos = playerPos();
    const inHere = inside(pos.x, pos.z);
    const dist = Math.hypot(pos.x - 16.4, pos.z - 0.2);
    const vol = inHere ? 1 : THREE.MathUtils.clamp(1.15 - dist / 18, 0, 0.55);
    audio.clubTick?.(dt, vol);

    const beat = (t * 2.15) % 1;
    const flash = beat < 0.08 || (beat > 0.5 && beat < 0.56);
    for (const s of strobes) {
      const pulse = s.wash ? 0.7 + Math.sin(t * 1.4 + s.phase) * 0.25 : flash ? 2.8 : 0.15 + Math.sin(t * 8 + s.phase) * 0.1;
      s.light.intensity = pulse;
      if (!s.wash) {
        const hue = (t * 0.18 + s.phase * 0.1) % 1;
        s.light.color.setHSL(hue, 0.9, 0.55);
      }
    }
    for (let i = 0; i < tiles.length; i++) {
      const hue = (t * 0.22 + i * 0.07) % 1;
      tiles[i].material.emissive.setHSL(hue, 0.85, flash ? 0.45 : 0.18);
      tiles[i].material.emissiveIntensity = flash ? 0.9 : 0.28;
    }
    if (ledWall) ledWall.material.color.setHSL((t * 0.25) % 1, 0.9, 0.5);
    if (ball) ball.rotation.y = t * 0.9;
    for (const b of beams) {
      b.mesh.rotation.z = Math.sin(t * 0.8 + b.phase) * 0.55;
      b.mesh.rotation.x = 0.2 + Math.cos(t * 0.6 + b.phase) * 0.25;
      b.mesh.material.opacity = flash ? 0.16 : 0.05;
      b.mesh.material.emissive.setHSL((t * 0.2 + b.phase) % 1, 1, 0.55);
    }
    for (const h of haze) h.material.opacity = 0.03 + Math.sin(t * 0.7) * 0.015;

    for (const p of crowd) {
      if (p.mode === "dance") poseDance(p, t);
      else if (p.mode === "sit") poseSit(p, t);
      else if (p.mode === "dj") poseDj(p, t);
      else poseSway(p, t);
    }
    separate(dt);
  }

  function build() {
    if (built) return;
    buildRoom();
    buildBooth();
    buildStairs();
    buildBalcony();
    buildFloorTiles();
    buildLights();
    buildCrowd();
    built = true;
  }

  function prompt(obj) {
    if (obj?.userData?.kind === "clubDoor") {
      return Math.abs(obj.userData.ang || 0) > 0.45 ? "E close the club door" : "E open the club";
    }
    return "";
  }

  return { build, tick, collide, inside, prompt };
}

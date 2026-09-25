/** Pool inside. Beer pong and beer die as two patio tables. */
import * as THREE from "three";

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphGeo = new THREE.SphereGeometry(1, 12, 10);
const dieGeo = new THREE.BoxGeometry(1, 1, 1);
const cupGeo = new THREE.CylinderGeometry(0.05, 0.038, 0.125, 12);
const PING_R = 0.028;
const CUP_OPEN_R = 0.036;
const CUP_OUTER_R = 0.051;
const CUP_RIM_Y = 0.122;
const cupInnerGeo = new THREE.CylinderGeometry(0.044, 0.033, 0.11, 12);
const rimGeo = new THREE.CylinderGeometry(0.051, 0.05, 0.012, 12);

function addMesh(parent, geo, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function createGames(api) {
  const { scene, camera, lambert, registerPick, solid, worldSolid, toast, audio } = api;
  function playerPos() {
    return api.playerPos?.() || camera.position;
  }

  const felt = lambert(0x1a6b38);
  const rail = lambert(0x4a2a14);
  const pocketMat = lambert(0x090806);
  const white = lambert(0xf4ead0);
  const soloRed = lambert(0xd22b2b);
  const soloInner = lambert(0xefefef);
  const beer = lambert(0xe8c547, { transparent: true, opacity: 0.78 });
  const dieMat = lambert(0xf4ead0);
  const pingMat = lambert(0xf2d2a0);
  const youMat = lambert(0x3dfff2);
  const themMat = lambert(0xff3dac);
  const ridge = lambert(0xb42020);
  let active = null;

  const BALL_COLORS = [
    0xf2d21a, 0x2e6bff, 0xc41e3a, 0x6b1c9a, 0xe07a3d, 0x1f8a4c, 0x7a1a12, 0x121014,
    0xf2d21a, 0x2e6bff, 0xc41e3a, 0x6b1c9a, 0xe07a3d, 0x1f8a4c, 0x7a1a12,
  ];

  const pool = {
    x: -4.35,
    z: 3.42,
    y: 0.8,
    innerW: 1.92,
    innerD: 0.98,
    balls: [],
    cue: null,
    racked: true,
    charge: 0,
    charging: false,
    turn: "you",
    botWait: 0,
    youGroup: null,
    themGroup: null,
    shotActive: false,
    shotScratch: false,
    shotSunk: [],
    over: false,
    winner: "",
  };

  const pong = {
    x: -8.2,
    z: 12.85,
    y: 0.76,
    w: 0.82,
    d: 2.55,
    cups: [],
    ball: null,
    charge: 0,
    charging: false,
    botWait: 0,
    youCups: 6,
    themCups: 6,
    queued: false,
    match: null,
    poss: "you",
    shotsThisTurn: 0,
    makesThisTurn: 0,
    pending: 0,
    threw: new Set(),
    over: false,
    winWait: 0,
  };

  const dye = {
    x: -12.35,
    z: 12.85,
    y: 0.76,
    w: 0.92,
    d: 0.92,
    cups: [],
    die: null,
    charge: 0,
    charging: false,
    botWait: 0,
    catchUntil: 0,
    youCups: 2,
    themCups: 2,
    queued: false,
    match: null,
    poss: "you",
    over: false,
    winWait: 0,
  };

  const fly = [];
  let _t = 0;
  const qpong = new Set();
  const qdie = new Set();

  function mark(obj, kind, extra = {}) {
    obj.userData.kind = kind;
    obj.userData.root = extra.root || obj;
    Object.assign(obj.userData, extra);
    return obj;
  }

  function humans() {
    return api.humans?.() || [];
  }

  function localId() {
    return api.localId?.() || "you";
  }

  function send(msg) {
    api.sendEvent?.(msg);
  }

  function vsHouse(table) {
    return !table.match;
  }

  function asArr(x) {
    if (!x) return [];
    return Array.isArray(x) ? x.filter(Boolean) : [x];
  }

  function qset(game) {
    return game === "pong" ? qpong : qdie;
  }

  function nameOf(id) {
    if (!id || id === "you" || id === localId()) return "you";
    if (id === "them" || id === "house") return "house";
    const p = humans().find((h) => h.id === id);
    return p?.name || "player";
  }

  function myTeamArr(table) {
    if (!table.match) return [localId() || "you"];
    const me = localId();
    const a = asArr(table.match.a);
    const b = asArr(table.match.b);
    if (a.includes(me)) return a;
    if (b.includes(me)) return b;
    return [me];
  }

  function isMyPoss(table) {
    if (!table.match) return table.poss === "you";
    const me = localId();
    const a = asArr(table.match.a);
    return table.poss === (a.includes(me) ? "a" : "b");
  }

  function isMyTeam(table, who) {
    if (who === "you" || who === localId()) return true;
    if (who === "them" || who === "house") return false;
    return myTeamArr(table).includes(who);
  }

  function otherPoss(p) {
    if (p === "you") return "them";
    if (p === "them") return "you";
    return p === "a" ? "b" : "a";
  }

  function possOfShooter(table, who) {
    if (!table.match) return isMyTeam(table, who) ? "you" : "them";
    const me = localId();
    const a = asArr(table.match.a);
    let id = who;
    if (id === "you") id = me;
    if (id === "them" || id === "house") return a.includes(me) ? "b" : "a";
    return a.includes(id) ? "a" : "b";
  }

  function loseLabel(table) {
    return table.match ? "THEY WIN" : "HOUSE WINS";
  }

  function flash(text, kind) {
    api.flash?.(text, kind);
  }

  function resetPongPoss(poss) {
    pong.poss = poss;
    pong.shotsThisTurn = 0;
    pong.makesThisTurn = 0;
    pong.pending = 0;
    pong.threw = new Set();
    pong.botWait = 0;
  }

  function resetPongPlay() {
    pong.over = false;
    pong.winWait = 0;
    pong.charging = false;
    pong.charge = 0;
    resetPongPoss(pong.match ? "a" : "you");
  }

  function resetDyePlay() {
    dye.over = false;
    dye.winWait = 0;
    dye.charging = false;
    dye.charge = 0;
    dye.poss = dye.match ? "a" : "you";
    dye.botWait = 0;
  }

  function canThrowPong() {
    if (pong.over || pong.shotsThisTurn >= 2) return false;
    if (!isMyPoss(pong)) return false;
    const team = myTeamArr(pong);
    if (pong.match?.mode === "2v2" && team.length >= 2) {
      const me = localId() || "you";
      return !pong.threw.has(me);
    }
    return true;
  }

  function canThrowDie() {
    if (dye.over || dye.die) return false;
    return isMyPoss(dye);
  }

  function pongTurnText() {
    if (pong.over) return pong.youCups <= 0 ? loseLabel(pong).toLowerCase() : "you win";
    if (!isMyPoss(pong)) return `their throw ${Math.min(2, pong.shotsThisTurn + (pong.pending ? 0 : 1))}/2`;
    const team = myTeamArr(pong);
    const me = localId() || "you";
    if (pong.match?.mode === "2v2" && team.length >= 2 && pong.threw.has(me) && pong.shotsThisTurn < 2) {
      return "teammate's throw";
    }
    return `your throw ${Math.min(2, pong.shotsThisTurn + 1)}/2`;
  }

  function notePongThrow(who) {
    if (pong.over) return;
    pong.threw.add(who);
    pong.shotsThisTurn++;
    pong.pending++;
  }

  function maybeFinishPongPoss() {
    if (pong.over) return;
    if (pong.shotsThisTurn < 2) {
      if (vsHouse(pong) && pong.poss === "them" && !pingInAir()) pong.botWait = 0.62;
      return;
    }
    if (pong.pending > 0) return;
    const cupsLeft = pong.youCups > 0 && pong.themCups > 0;
    if (pong.makesThisTurn >= 2 && cupsLeft) {
      const mine = isMyPoss(pong);
      flash("BALLS BACK", "back");
      const duo = pong.match?.mode === "2v2";
      toast(mine ? (duo ? "balls back — you both made it" : "balls back — both shots") : "they get balls back");
      resetPongPoss(pong.poss);
      if (vsHouse(pong) && pong.poss === "them") pong.botWait = 0.7;
      return;
    }
    const next = otherPoss(pong.poss);
    resetPongPoss(next);
    if (vsHouse(pong) && next === "them") pong.botWait = 0.85;
    else if (isMyPoss(pong)) toast("your throw");
    else toast("their throw");
  }

  function onPingDone(legalMake) {
    if (pong.pending > 0) pong.pending--;
    if (legalMake && !pong.over) pong.makesThisTurn++;
    maybeFinishPongPoss();
  }

  function endTable(table, winnerSide) {
    if (table.over) return;
    table.over = true;
    table.charging = false;
    const youWon = winnerSide === "you";
    flash(youWon ? "YOU WIN" : loseLabel(table), youWon ? "win" : "lose");
    const label = table === pong ? "beer pong" : "beer die";
    toast(youWon ? `${label} — you win` : `${label} — they win`);
    if (youWon) api.score?.(table === pong ? 120 : 80);
    table.winWait = 2.8;
  }

  function nextDiePoss(who) {
    if (dye.over) return;
    if (!dye.match) {
      dye.poss = isMyTeam(dye, who) ? "them" : "you";
      if (dye.poss === "them") dye.botWait = 1.1;
      else toast("your toss");
      return;
    }
    dye.poss = otherPoss(possOfShooter(dye, who));
    if (isMyPoss(dye)) toast("your toss");
    else toast("their toss");
  }

  function groupOf(n) {
    if (n === 8) return "eight";
    if (n <= 7) return "solids";
    return "stripes";
  }

  function groupLabel(g) {
    if (g === "solids") return "SOLIDS 1–7";
    if (g === "stripes") return "STRIPES 9–15";
    return "open table";
  }

  function makeCup(x, y, z, owner) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(cupGeo, soloRed);
    body.position.y = 0.062;
    body.castShadow = true;
    g.add(body);
    const inner = new THREE.Mesh(cupInnerGeo, soloInner);
    inner.position.y = 0.068;
    g.add(inner);
    const rim = new THREE.Mesh(rimGeo, white);
    rim.position.y = 0.122;
    g.add(rim);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.05, 10), beer);
    liq.position.y = 0.055;
    g.add(liq);
    for (const yy of [0.048, 0.062, 0.076]) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.041, 0.007, 12), ridge);
      ring.position.y = yy;
      g.add(ring);
    }
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.049, 0.042, 0.01, 12), owner === "you" ? youMat : themMat);
    stripe.position.y = 0.026;
    g.add(stripe);
    g.position.set(x, y, z);
    g.userData = { kind: "cup", owner, live: true, root: g };
    scene.add(g);
    return g;
  }

  function rackPong() {
    for (const c of pong.cups) scene.remove(c);
    pong.cups = [];
    const rows = [1, 2, 3];
    const place = (owner, z0, dir) => {
      rows.forEach((n, r) => {
        const z = z0 + dir * r * 0.13;
        const x0 = -((n - 1) * 0.11) / 2;
        for (let k = 0; k < n; k++) {
          pong.cups.push(makeCup(pong.x + x0 + k * 0.11, pong.y + 0.06, z, owner));
        }
      });
    };
    place("you", pong.z - 1.02, 1);
    place("them", pong.z + 1.02, -1);
    pong.youCups = 6;
    pong.themCups = 6;
    resetPongPlay();
  }

  function rackDye() {
    for (const c of dye.cups) scene.remove(c);
    dye.cups = [];
    const spots = [
      ["you", -0.28, -0.32],
      ["you", 0.28, -0.32],
      ["them", -0.28, 0.32],
      ["them", 0.28, 0.32],
    ];
    for (const [owner, dx, dz] of spots) {
      dye.cups.push(makeCup(dye.x + dx, dye.y + 0.06, dye.z + dz, owner));
    }
    dye.youCups = 2;
    dye.themCups = 2;
    resetDyePlay();
  }

  function clearFly() {
    for (const f of fly) scene.remove(f.mesh);
    fly.length = 0;
    pong.ball = null;
    dye.die = null;
  }

  function spawnPing(from, vel, who) {
    const m = new THREE.Mesh(sphGeo, pingMat);
    m.scale.setScalar(0.028);
    m.position.copy(from);
    scene.add(m);
    const rec = { mesh: m, vel: vel.clone(), kind: "ping", who, life: 4, bounced: false };
    fly.push(rec);
    pong.ball = rec;
    notePongThrow(who);
    return rec;
  }

  function spawnDie(from, vel, who) {
    const m = new THREE.Mesh(dieGeo, dieMat);
    m.scale.setScalar(0.055);
    m.position.copy(from);
    scene.add(m);
    const rec = {
      mesh: m,
      vel: vel.clone(),
      kind: "die",
      who,
      life: 5,
      spin: new THREE.Vector3(Math.random() * 12, Math.random() * 10, Math.random() * 12),
      settled: false,
      face: 0,
    };
    fly.push(rec);
    dye.die = rec;
    return rec;
  }

  function ballMesh(n, color, striped, eight) {
    const g = new THREE.Group();
    const r = 0.038;
    if (n === 0) {
      addMesh(g, sphGeo, lambert(0xf7f3e8), 0, 0, 0, r, r, r);
    } else if (eight) {
      addMesh(g, sphGeo, lambert(0x121014), 0, 0, 0, r, r, r);
      addMesh(g, sphGeo, white, 0, 0.01, 0.026, 0.014, 0.014, 0.008);
    } else if (striped) {
      addMesh(g, sphGeo, white, 0, 0, 0, r, r, r);
      addMesh(g, sphGeo, lambert(color), 0, 0, 0, r * 1.045, r * 0.74, r * 1.045);
      addMesh(g, sphGeo, lambert(color), 0, 0, 0, r * 1.02, r * 0.62, r * 1.02);
    } else {
      addMesh(g, sphGeo, lambert(color), 0, 0, 0, r, r, r);
      addMesh(g, sphGeo, white, 0, 0.01, 0.026, 0.012, 0.012, 0.006);
    }
    return g;
  }

  function ballTalk(n) {
    if (n === 8) return "the 8-ball";
    if (n <= 7) return `the ${n} (solid)`;
    return `the ${n} (stripe)`;
  }

  function announceSink(n, scratch) {
    const house = pool.turn === "them";
    const who = house ? "house" : "you";
    if (scratch) {
      flash("SCRATCH", "lose");
      toast(house ? "house scratched" : "scratch — cue ball in");
      return;
    }
    if (n === 8) {
      flash("8-BALL", house ? "lose" : "win");
      toast(`${who} sank the 8-ball`);
      return;
    }
    flash(`${n} IN`, "back");
    toast(`${who} sank ${ballTalk(n)}`);
  }

  function liveOf(group) {
    return pool.balls.filter((b) => b.live && groupOf(b.n) === group).length;
  }

  function rackPool() {
    const r = 0.04;
    const gap = r * 2.02;
    const ox = pool.x + 0.48;
    const oz = pool.z;
    const spots = [];
    for (let row = 0; row < 5; row++) {
      const count = row + 1;
      for (let i = 0; i < count; i++) {
        spots.push({
          x: ox + row * gap * 0.87,
          z: oz + (i - (count - 1) / 2) * gap,
        });
      }
    }
    const place = (b, spot) => {
      if (!b || !spot) return;
      b.live = true;
      b.mesh.visible = true;
      b.x = spot.x;
      b.z = spot.z;
      b.vx = 0;
      b.vz = 0;
      b.mesh.position.set(b.x, pool.y + 0.038, b.z);
    };
    const eight = pool.balls.find((b) => b.n === 8);
    const solids = pool.balls.filter((b) => b.n <= 7);
    const stripes = pool.balls.filter((b) => b.n >= 9);
    const rest = [...solids, ...stripes];
    for (let i = rest.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = rest[i];
      rest[i] = rest[j];
      rest[j] = tmp;
    }
    place(eight, spots[4]);
    const cornerSolid = rest.find((b) => b.n <= 7);
    const cornerStripe = rest.find((b) => b.n >= 9);
    place(cornerSolid, spots[10]);
    place(cornerStripe, spots[14]);
    const used = new Set([eight, cornerSolid, cornerStripe]);
    let s = 0;
    for (let i = 0; i < 15; i++) {
      if (i === 4 || i === 10 || i === 14) continue;
      while (rest[s] && used.has(rest[s])) s++;
      place(rest[s], spots[i]);
      used.add(rest[s]);
      s++;
    }
    const cue = pool.cue;
    cue.live = true;
    cue.mesh.visible = true;
    cue.x = pool.x - 0.62;
    cue.z = pool.z;
    cue.vx = 0;
    cue.vz = 0;
    cue.mesh.position.set(cue.x, pool.y + 0.038, cue.z);
    pool.turn = "you";
    pool.botWait = 0;
    pool.racked = true;
    pool.youGroup = null;
    pool.themGroup = null;
    pool.shotActive = false;
    pool.shotScratch = false;
    pool.shotSunk = [];
    pool.over = false;
    pool.winner = "";
  }

  function pockets() {
    const hw = pool.innerW / 2;
    const hd = pool.innerD / 2;
    return [
      [pool.x - hw, pool.z - hd],
      [pool.x, pool.z - hd],
      [pool.x + hw, pool.z - hd],
      [pool.x - hw, pool.z + hd],
      [pool.x, pool.z + hd],
      [pool.x + hw, pool.z + hd],
    ];
  }

  function moving() {
    return (
      pool.balls.some((b) => b.live && Math.hypot(b.vx, b.vz) > 0.04) ||
      (pool.cue.live && Math.hypot(pool.cue.vx, pool.cue.vz) > 0.04)
    );
  }

  function shootCue(dirX, dirZ, power) {
    if (!pool.cue.live || moving() || pool.over) return false;
    const len = Math.hypot(dirX, dirZ) || 1;
    const p = 2.2 + power * 5.4;
    pool.cue.vx = (dirX / len) * p;
    pool.cue.vz = (dirZ / len) * p;
    pool.racked = false;
    pool.shotActive = true;
    pool.shotScratch = false;
    pool.shotSunk = [];
    audio.beep(220, 0.08, "square", 0.05);
    return true;
  }

  function lookDir() {
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    return d;
  }

  function throwFromCamera(kind, power, who) {
    const d = lookDir();
    const from = camera.position.clone().add(d.clone().multiplyScalar(0.45));
    const tableY = kind === "ping" ? pong.y : dye.y;
    from.y = Math.max(from.y, tableY + 0.2);
    const spd = 3.4 + power * 7.2;
    const vel = d.multiplyScalar(spd);
    vel.y += 1.6 + power * 1.8;
    const whoId = who === "you" ? localId() || "you" : who;
    if (kind === "ping") spawnPing(from, vel, whoId);
    else spawnDie(from, vel, whoId);
    audio.beep(kind === "die" ? 180 : 640, 0.07, "square", 0.04);
    if (kind === "ping" && pong.match) {
      send({ t: "pshot", g: "pong", x: from.x, y: from.y, z: from.z, vx: vel.x, vy: vel.y, vz: vel.z });
    }
    if (kind === "die" && dye.match) {
      send({ t: "pshot", g: "die", x: from.x, y: from.y, z: from.z, vx: vel.x, vy: vel.y, vz: vel.z });
    }
  }

  function houseThrowPong() {
    if (!vsHouse(pong) || pong.over || pong.poss !== "them") return;
    const targets = pong.cups.filter((c) => c.userData.live && c.userData.owner === "you");
    if (!targets.length) return;
    const cup = targets[(Math.random() * targets.length) | 0];
    const from = new THREE.Vector3(pong.x + (Math.random() - 0.5) * 0.2, pong.y + 0.55, pong.z + 1.5);
    const to = cup.position.clone();
    to.y += CUP_RIM_Y;
    const vel = to.sub(from);
    const t = 0.72 + Math.random() * 0.1;
    vel.x = vel.x / t + (Math.random() - 0.5) * 0.1;
    vel.z = vel.z / t + (Math.random() - 0.5) * 0.1;
    vel.y = vel.y / t + 2.4;
    spawnPing(from, vel, "them");
  }

  function houseThrowDie() {
    if (!vsHouse(dye) || dye.over || dye.poss !== "them") return;
    const from = new THREE.Vector3(dye.x, dye.y + 0.5, dye.z + 0.7);
    const vel = new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.2, -2.0 - Math.random() * 0.6);
    spawnDie(from, vel, "them");
  }

  function housePoolShot() {
    if (pool.over) return;
    const group = pool.themGroup;
    const cleared = group && liveOf(group) === 0;
    let targets = pool.balls.filter((b) => {
      if (!b.live) return false;
      if (!group) return b.n !== 8;
      if (cleared) return b.n === 8;
      return groupOf(b.n) === group;
    });
    if (!targets.length) targets = pool.balls.filter((b) => b.live && b.n !== 8);
    if (!targets.length || !pool.cue.live) {
      rackPool();
      return;
    }
    const t = targets[(Math.random() * targets.length) | 0];
    shootCue(t.x - pool.cue.x, t.z - pool.cue.z, 0.45 + Math.random() * 0.4);
  }

  function endPool(winner, msg) {
    pool.over = true;
    pool.winner = winner;
    const youWon = winner === "you";
    flash(youWon ? "YOU WIN" : "HOUSE WINS", youWon ? "win" : "lose");
    toast(msg);
    if (youWon) api.score?.(80);
    pool.botWait = 2.4;
  }

  function resolvePoolShot() {
    const shooter = pool.turn;
    const sunk = pool.shotSunk.slice();
    const scratch = pool.shotScratch;
    pool.shotActive = false;
    pool.shotSunk = [];
    pool.shotScratch = false;

    const eight = sunk.find((n) => n === 8);
    const objects = sunk.filter((n) => n !== 8);
    const myGroup = shooter === "you" ? pool.youGroup : pool.themGroup;

    if (eight) {
      const cleared = myGroup && liveOf(myGroup) === 0;
      if (scratch || !cleared) {
        endPool(shooter === "you" ? "them" : "you", shooter === "you" ? "8-ball early. you lose." : "house scratched the 8. you win.");
      } else {
        endPool(shooter, shooter === "you" ? "8-ball. you win." : "house sank the 8.");
      }
      return;
    }

    if (!pool.youGroup && objects.length) {
      const g = groupOf(objects[0]);
      if (shooter === "you") {
        pool.youGroup = g;
        pool.themGroup = g === "solids" ? "stripes" : "solids";
        toast(`you are ${groupLabel(g).toLowerCase()}`);
      } else {
        pool.themGroup = g;
        pool.youGroup = g === "solids" ? "stripes" : "solids";
        toast(`house is ${groupLabel(g).toLowerCase()} · you are ${groupLabel(pool.youGroup).toLowerCase()}`);
      }
    }

    const legal = objects.filter((n) => {
      const g = groupOf(n);
      if (!myGroup) return g !== "eight";
      return g === myGroup;
    });
    const keep = !scratch && legal.length > 0;
    if (keep) {
      const names = legal.map((n) => String(n)).join(" + ");
      toast(shooter === "you" ? `you keep shooting · ${names} down` : `house keeps the table · ${names} down`);
      if (shooter === "them") pool.botWait = 0.8;
      return;
    }
    if (scratch) toast(shooter === "you" ? "scratch. house's shot" : "house scratch. your shot");
    else if (objects.length) toast(shooter === "you" ? "wrong ball. house's shot" : "house hit the wrong suit. your shot");
    else toast(shooter === "you" ? "nothing down. house's shot" : "house missed. your shot");
    pool.turn = shooter === "you" ? "them" : "you";
    if (pool.turn === "them") pool.botWait = 0.9;
  }

  function legalPongMake(who, cup) {
    if (isMyTeam(pong, who)) return cup.userData.owner !== "you";
    return cup.userData.owner === "you";
  }

  function sinkCup(cup, who, table) {
    if (!cup.userData.live) return false;
    cup.userData.live = false;
    cup.visible = false;
    if (cup.userData.owner === "you") table.youCups = Math.max(0, table.youCups - 1);
    else table.themCups = Math.max(0, table.themCups - 1);
    audio.beep(880, 0.1, "square", 0.06);
    audio.splash?.();
    const yours = cup.userData.owner === "you";
    const mine = isMyTeam(table, who);
    if (mine && !yours) toast("cup. their rack.");
    else if (!mine && yours) toast("they hit your cup.");
    else if (mine && yours) toast("that's your cup.");
    else toast("they hit their own.");
    if (table.themCups <= 0) endTable(table, "you");
    else if (table.youCups <= 0) endTable(table, "them");
    return table === pong ? legalPongMake(who, cup) : mine !== yours;
  }

  function resolvePingCup(f) {
    const p = f.mesh.position;
    let best = null;
    let bestDist = Infinity;
    for (const c of pong.cups) {
      if (!c.userData.live) continue;
      const dx = p.x - c.position.x;
      const dz = p.z - c.position.z;
      const dist = Math.hypot(dx, dz);
      const rimY = c.position.y + CUP_RIM_Y;
      const baseY = c.position.y;
      if (p.y > rimY + PING_R + 0.04) continue;
      if (p.y < baseY - PING_R) continue;
      if (dist < CUP_OUTER_R + PING_R && dist < bestDist) {
        best = c;
        bestDist = dist;
      }
    }
    if (!best) return null;
    const legal = sinkCup(best, f.who, pong);
    return legal ? "in" : "own";
  }

  function onRect(table, x, z) {
    return Math.abs(x - table.x) < table.w / 2 - 0.02 && Math.abs(z - table.z) < table.d / 2 - 0.02;
  }

  function tickPool(dt) {
    const balls = pool.cue ? [pool.cue, ...pool.balls] : [];
    const hw = pool.innerW / 2 - 0.04;
    const hd = pool.innerD / 2 - 0.04;
    const pocks = pockets();
    for (const b of balls) {
      if (!b.live) continue;
      b.vx *= Math.pow(0.12, dt);
      b.vz *= Math.pow(0.12, dt);
      if (Math.hypot(b.vx, b.vz) < 0.03) {
        b.vx = 0;
        b.vz = 0;
      }
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      if (b.x < pool.x - hw) {
        b.x = pool.x - hw;
        b.vx *= -0.72;
      }
      if (b.x > pool.x + hw) {
        b.x = pool.x + hw;
        b.vx *= -0.72;
      }
      if (b.z < pool.z - hd) {
        b.z = pool.z - hd;
        b.vz *= -0.72;
      }
      if (b.z > pool.z + hd) {
        b.z = pool.z + hd;
        b.vz *= -0.72;
      }
      b.mesh.position.set(b.x, pool.y + 0.038, b.z);
      const sunk = pocks.some(([px, pz]) => Math.hypot(b.x - px, b.z - pz) < 0.11);
      if (sunk) {
        b.live = false;
        b.mesh.visible = false;
        b.vx = b.vz = 0;
        audio.beep(140, 0.12, "sine", 0.05);
        if (b.cue) {
          pool.shotScratch = true;
          b.live = true;
          b.mesh.visible = true;
          b.x = pool.x - 0.62;
          b.z = pool.z;
          b.vx = 0;
          b.vz = 0;
          b.mesh.position.set(b.x, pool.y + 0.038, b.z);
          announceSink(0, true);
        } else {
          pool.shotSunk.push(b.n);
          announceSink(b.n, false);
          api.score?.(8);
        }
      }
    }
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (!a.live) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (!b.live) continue;
        let dx = b.x - a.x;
        let dz = b.z - a.z;
        const dist = Math.hypot(dx, dz) || 0.0001;
        const min = 0.078;
        if (dist < min) {
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = min - dist;
          a.x -= nx * overlap * 0.5;
          a.z -= nz * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.z += nz * overlap * 0.5;
          const rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
          if (rel < 0) continue;
          a.vx -= rel * nx;
          a.vz -= rel * nz;
          b.vx += rel * nx;
          b.vz += rel * nz;
        }
      }
    }
    if (pool.charging) pool.charge = Math.min(1, pool.charge + dt * 0.9);
    if (pool.over) {
      pool.botWait -= dt;
      if (pool.botWait <= 0) rackPool();
      return;
    }
    if (pool.shotActive && !moving()) resolvePoolShot();
    if (pool.turn === "them" && !moving() && !pool.shotActive) {
      pool.botWait -= dt;
      if (pool.botWait <= 0) housePoolShot();
    }
  }

  function pingInAir() {
    return fly.some((f) => f.kind === "ping");
  }

  function finishPing(f, i, legalMake) {
    scene.remove(f.mesh);
    fly.splice(i, 1);
    pong.ball = fly.find((x) => x.kind === "ping") || null;
    onPingDone(legalMake);
  }

  function tickWinRacks(dt) {
    if (pong.over) {
      pong.winWait -= dt;
      if (pong.winWait <= 0) {
        if (pong.match) {
          pong.match = null;
          qpong.clear();
          pong.queued = false;
        }
        rackPong();
      }
    }
    if (dye.over) {
      dye.winWait -= dt;
      if (dye.winWait <= 0) {
        if (dye.match) {
          dye.match = null;
          qdie.clear();
          dye.queued = false;
        }
        rackDye();
      }
    }
  }

  function tickFly(dt) {
    for (let i = fly.length - 1; i >= 0; i--) {
      const f = fly[i];
      f.life -= dt;
      f.vel.y -= 9.4 * dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      if (f.kind === "die") {
        f.mesh.rotation.x += f.spin.x * dt;
        f.mesh.rotation.y += f.spin.y * dt;
        f.mesh.rotation.z += f.spin.z * dt;
      }
      const p = f.mesh.position;
      const table = f.kind === "ping" ? pong : dye;
      const on = onRect(table, p.x, p.z);
      if (f.kind === "ping") {
        const hit = resolvePingCup(f);
        if (hit === "in" || hit === "own") {
          finishPing(f, i, hit === "in");
          continue;
        }
      }
      if (p.y < table.y + 0.04 && on) {
        p.y = table.y + 0.04;
        if (f.vel.y < 0) {
          f.vel.y *= -0.46;
          f.vel.x *= 0.86;
          f.vel.z *= 0.86;
          f.bounced = true;
          if (f.kind === "die") f.spin.multiplyScalar(0.7);
          audio.beep(420, 0.04, "square", 0.03);
        }
        if (Math.abs(f.vel.y) < 0.35 && Math.hypot(f.vel.x, f.vel.z) < 0.35) {
          f.vel.set(0, 0, 0);
          if (f.kind === "die" && !f.settled) {
            f.settled = true;
            f.face = 1 + ((Math.random() * 6) | 0);
            resolveDie(f);
          }
          if (f.kind === "ping") {
            finishPing(f, i, false);
            continue;
          }
        }
      } else if (p.y < 0.04 || (!on && p.y < table.y - 0.2)) {
        if (f.kind === "ping") {
          if (isMyTeam(pong, f.who) && !f.bounced) toast("airball");
          finishPing(f, i, false);
          continue;
        }
        if (f.kind === "die" && !f.settled) {
          f.settled = true;
          toast(isMyTeam(dye, f.who) ? "die off the table" : "they threw it away");
          nextDiePoss(f.who);
        }
        scene.remove(f.mesh);
        fly.splice(i, 1);
        if (f === pong.ball) pong.ball = null;
        if (f === dye.die) dye.die = null;
        continue;
      }
      if (f.kind === "die" && !f.settled && on && p.z < dye.z && !isMyTeam(dye, f.who)) {
        dye.catchUntil = _t + 0.85;
      }
      if (f.life <= 0) {
        if (f.kind === "ping") {
          finishPing(f, i, false);
          continue;
        }
        if (f.kind === "die" && !f.settled) {
          f.settled = true;
          nextDiePoss(f.who);
        }
        scene.remove(f.mesh);
        fly.splice(i, 1);
        if (f === dye.die) dye.die = null;
      }
    }
    tickWinRacks(dt);
    if (vsHouse(pong) && !pong.over && !pingInAir() && pong.poss === "them" && pong.botWait > 0) {
      pong.botWait -= dt;
      if (pong.botWait <= 0) houseThrowPong();
    }
    if (vsHouse(dye) && !dye.over && !dye.die && dye.poss === "them" && dye.botWait > 0) {
      dye.botWait -= dt;
      if (dye.botWait <= 0) houseThrowDie();
    }
    if (pong.charging) pong.charge = Math.min(1, pong.charge + dt * 0.95);
    if (dye.charging) dye.charge = Math.min(1, dye.charge + dt * 0.95);
  }

  function resolveDie(f) {
    const face = f.face;
    toast(`die shows ${face}`);
    const mine = isMyTeam(dye, f.who);
    if (face === 5) {
      toast(mine ? "five — their cup" : "five — your cup");
      const owner = mine ? "them" : "you";
      const cup = dye.cups.find((c) => c.userData.live && c.userData.owner === owner);
      if (cup) sinkCup(cup, f.who, dye);
    } else if (face === 1 || face === 6) {
      toast(face === 1 ? "ace — both sip" : "six — both sip");
    }
    nextDiePoss(f.who);
  }

  function standMarker(x, z, color, cupOnTop, dieOnTop) {
    const g = new THREE.Group();
    addMesh(g, boxGeo, lambert(0x2a1a12), 0, 0.45, 0, 0.16, 0.9, 0.16);
    addMesh(g, boxGeo, lambert(color), 0, 0.92, 0, 0.22, 0.08, 0.22);
    if (cupOnTop) {
      addMesh(g, cupGeo, soloRed, 0, 1.05, 0, 1, 1, 1);
      addMesh(g, rimGeo, white, 0, 1.11, 0, 1, 1, 1);
    }
    if (dieOnTop) {
      addMesh(g, dieGeo, dieMat, 0, 1.05, 0, 0.12, 0.12, 0.12);
      addMesh(g, dieGeo, lambert(0x1a0c08), 0, 1.12, 0.05, 0.03, 0.03, 0.03);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  }

  function buildPool() {
    const g = new THREE.Group();
    const wood = lambert(0x5a3218);
    const darkWood = lambert(0x3a1e10);
    const cushion = lambert(0x14532d);
    const ivory = lambert(0xe8d9b0);
    addMesh(g, boxGeo, darkWood, 0, 0.38, 0, 2.36, 0.76, 1.42);
    addMesh(g, boxGeo, wood, 0, 0.78, 0, 2.32, 0.08, 1.38);
    addMesh(g, boxGeo, felt, 0, 0.805, 0, 1.92, 0.035, 0.98);
    const railY = 0.86;
    addMesh(g, boxGeo, cushion, -0.52, railY, -0.515, 0.84, 0.09, 0.08);
    addMesh(g, boxGeo, cushion, 0.52, railY, -0.515, 0.84, 0.09, 0.08);
    addMesh(g, boxGeo, cushion, -0.52, railY, 0.515, 0.84, 0.09, 0.08);
    addMesh(g, boxGeo, cushion, 0.52, railY, 0.515, 0.84, 0.09, 0.08);
    addMesh(g, boxGeo, cushion, -0.995, railY, 0, 0.08, 0.09, 0.72);
    addMesh(g, boxGeo, cushion, 0.995, railY, 0, 0.08, 0.09, 0.72);
    addMesh(g, boxGeo, wood, -0.52, railY + 0.05, -0.56, 0.88, 0.04, 0.1);
    addMesh(g, boxGeo, wood, 0.52, railY + 0.05, -0.56, 0.88, 0.04, 0.1);
    addMesh(g, boxGeo, wood, -0.52, railY + 0.05, 0.56, 0.88, 0.04, 0.1);
    addMesh(g, boxGeo, wood, 0.52, railY + 0.05, 0.56, 0.88, 0.04, 0.1);
    addMesh(g, boxGeo, wood, -1.06, railY + 0.05, 0, 0.12, 0.04, 0.78);
    addMesh(g, boxGeo, wood, 1.06, railY + 0.05, 0, 0.12, 0.04, 0.78);
    const pocketGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
    for (const [x, z] of [
      [-1.0, -0.52],
      [0, -0.54],
      [1.0, -0.52],
      [-1.0, 0.52],
      [0, 0.54],
      [1.0, 0.52],
    ]) {
      addMesh(g, pocketGeo, pocketMat, x, 0.78, z, 0.1, 0.06, 0.1);
    }
    for (const x of [-0.72, -0.36, 0.36, 0.72]) {
      addMesh(g, boxGeo, ivory, x, railY + 0.072, -0.56, 0.03, 0.012, 0.03);
      addMesh(g, boxGeo, ivory, x, railY + 0.072, 0.56, 0.03, 0.012, 0.03);
    }
    for (const z of [-0.26, 0.26]) {
      addMesh(g, boxGeo, ivory, -1.06, railY + 0.072, z, 0.03, 0.012, 0.03);
      addMesh(g, boxGeo, ivory, 1.06, railY + 0.072, z, 0.03, 0.012, 0.03);
    }
    g.position.set(pool.x, 0, pool.z);
    mark(g, "pool");
    registerPick(g);
    scene.add(g);
    solid(pool.x, pool.z, 2.3, 1.36, 0.91);
    worldSolid(pool.x, pool.z, 2.3, 1.36, 0.91);

    pool.balls = [];
    for (let i = 0; i < 15; i++) {
      const n = i + 1;
      const striped = n >= 9;
      const mesh = ballMesh(n, BALL_COLORS[i], striped, n === 8);
      scene.add(mesh);
      pool.balls.push({ mesh, n, live: true, x: 0, z: 0, vx: 0, vz: 0, cue: false });
    }
    const cueMesh = ballMesh(0, 0xf7f3e8, false, false);
    scene.add(cueMesh);
    pool.cue = { mesh: cueMesh, n: 0, live: true, x: 0, z: 0, vx: 0, vz: 0, cue: true };
    rackPool();
  }

  function buildTable(table, kind, w, d) {
    const g = new THREE.Group();
    addMesh(g, boxGeo, rail, 0, 0.38, 0, w + 0.08, 0.76, d + 0.08);
    addMesh(g, boxGeo, felt, 0, 0.765, 0, w, 0.03, d);
    addMesh(g, boxGeo, youMat, 0, 0.782, -d * 0.28, w * 0.92, 0.008, d * 0.38);
    addMesh(g, boxGeo, themMat, 0, 0.782, d * 0.28, w * 0.92, 0.008, d * 0.38);
    addMesh(g, boxGeo, youMat, 0, 0.79, -d * 0.08, 0.1, 0.02, d * 0.22);
    addMesh(g, boxGeo, themMat, 0, 0.79, d * 0.08, 0.1, 0.02, d * 0.22);
    g.position.set(table.x, 0, table.z);
    mark(g, kind);
    registerPick(g);
    scene.add(g);
    worldSolid(table.x, table.z, w + 0.2, d + 0.2, 0.79);
  }

  function buildYard() {
    buildTable(pong, "pong", pong.w, pong.d);
    buildTable(dye, "die", dye.w, dye.d);
    const pongStand = standMarker(pong.x - 0.7, pong.z - 0.15, 0x2a1a12, false, false);
    mark(pongStand, "pong-join");
    registerPick(pongStand);
    const dyeStand = standMarker(dye.x - 0.7, dye.z, 0xf4ead0, false, true);
    mark(dyeStand, "die-join");
    registerPick(dyeStand);
    rackPong();
    rackDye();
  }

  
  const DART_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  const darts = {
    x: 7.68,
    y: 1.73,
    z: 4.88,
    lineX: 5.28,
    r: 0.228,
    turn: "you",
    you: 501,
    them: 501,
    dartsLeft: 3,
    turnStart: 501,
    charging: false,
    charge: 0,
    over: false,
    winner: "",
    botWait: 0,
    flying: [],
    stuck: [],
    board: null,
  };

  function dartTex() {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d");
    const cx = 256;
    const cy = 256;
    const R = 250;
    ctx.fillStyle = "#0d0c0a";
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    const rings = [
      [1, "#121014"],
      [0.95, "#d8c9a0"],
      [0.90, "#121014"],
      [0.62, "#d8c9a0"],
      [0.57, "#121014"],
    ];
    for (let i = 0; i < 20; i++) {
      const a0 = ((i * 18 - 9) * Math.PI) / 180 - Math.PI / 2;
      const a1 = (((i + 1) * 18 - 9) * Math.PI) / 180 - Math.PI / 2;
      const dark = i % 2 === 0;
      ctx.fillStyle = dark ? "#1a120c" : "#e8d9b0";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R * 0.90, a0, a1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = dark ? "#1f8a4c" : "#c41e3a";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.95, a0, a1);
      ctx.arc(cx, cy, R * 0.90, a1, a0, true);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.62, a0, a1);
      ctx.arc(cx, cy, R * 0.57, a1, a0, true);
      ctx.closePath();
      ctx.fill();
      const mid = (a0 + a1) / 2;
      ctx.fillStyle = dark ? "#f4ead0" : "#121014";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(DART_ORDER[i]), cx + Math.cos(mid) * R * 0.82, cy + Math.sin(mid) * R * 0.82);
    }
    ctx.fillStyle = "#1f8a4c";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.085, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c41e3a";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.032, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function dartAngleOf(n) {
    const i = DART_ORDER.indexOf(n);
    return ((i < 0 ? 0 : i) * 18 * Math.PI) / 180;
  }

  function scoreDart(lx, ly) {
    const r = Math.hypot(lx, ly);
    const boardR = darts.r;
    if (r > boardR * 1.02) return { score: 0, label: "MISS", double: false };
    if (r <= boardR * 0.032) return { score: 50, label: "D-BULL", double: true };
    if (r <= boardR * 0.085) return { score: 25, label: "BULL", double: false };
    let ang = Math.atan2(-lx, ly);
    if (ang < 0) ang += Math.PI * 2;
    const idx = Math.floor((ang * 180 / Math.PI + 9) / 18) % 20;
    const n = DART_ORDER[idx];
    const rr = r / boardR;
    if (rr >= 0.90 && rr <= 1.0) return { score: n * 2, label: `D${n}`, double: true };
    if (rr >= 0.57 && rr <= 0.62) return { score: n * 3, label: `T${n}`, double: false };
    return { score: n, label: String(n), double: false };
  }

  function makeDartMesh(color = 0xc41e3a) {
    const g = new THREE.Group();
    addMesh(g, boxGeo, lambert(0xc9b49a), 0, 0, 0, 0.012, 0.012, 0.16);
    addMesh(g, boxGeo, lambert(color), 0, 0, -0.07, 0.04, 0.002, 0.05);
    addMesh(g, boxGeo, lambert(color), 0, 0, -0.07, 0.002, 0.04, 0.05);
    addMesh(g, boxGeo, lambert(0xc9a227), 0, 0, 0.075, 0.01, 0.01, 0.03);
    return g;
  }

  function clearDarts(list) {
    for (const d of list) scene.remove(d.mesh);
    list.length = 0;
  }

  function resetDartsPlay() {
    darts.you = 501;
    darts.them = 501;
    darts.turn = "you";
    darts.dartsLeft = 3;
    darts.turnStart = 501;
    darts.charging = false;
    darts.charge = 0;
    darts.over = false;
    darts.winner = "";
    darts.botWait = 0;
    clearDarts(darts.flying);
    clearDarts(darts.stuck);
  }

  function applyDartScore(who, hit) {
    if (darts.over) return;
    const key = who === "you" ? "you" : "them";
    const next = darts[key] - hit.score;
    if (next < 0 || next === 1 || (next === 0 && !hit.double)) {
      darts[key] = darts.turnStart;
      darts.dartsLeft = 0;
      toast(who === "you" ? `bust · ${hit.label}` : `house bust · ${hit.label}`);
      audio.beep(140, 0.1, "square", 0.05);
      return;
    }
    darts[key] = next;
    toast(who === "you" ? `${hit.label} · you ${next}` : `${hit.label} · house ${next}`);
    if (next === 0) {
      darts.over = true;
      darts.winner = who;
      flash(who === "you" ? "YOU WIN" : "HOUSE WINS", who === "you" ? "" : "lose");
      if (who === "you") api.score?.(30);
      else api.houseDrink?.("lost at darts. drink.");
      darts.botWait = 2.4;
    }
  }

  function endDartTurn() {
    if (darts.over) return;
    darts.turn = darts.turn === "you" ? "them" : "you";
    darts.dartsLeft = 3;
    darts.turnStart = darts.turn === "you" ? darts.you : darts.them;
    clearDarts(darts.stuck);
    if (darts.turn === "them") darts.botWait = 0.55;
  }

  function worldFromBoard(lx, ly) {
    return new THREE.Vector3(darts.x - 0.04, darts.y + ly, darts.z + lx);
  }

  function throwDart(from, vel, who) {
    const mesh = makeDartMesh(who === "you" ? 0x3dfff2 : 0xff3dac);
    mesh.position.copy(from);
    scene.add(mesh);
    darts.flying.push({ mesh, vel: vel.clone(), who, life: 2.4 });
    audio.beep(640, 0.05, "square", 0.035);
  }

  function behindDartLine() {
    const p = playerPos();
    if (p.x > darts.lineX + 0.02) return false;
    if (p.x < darts.lineX - 1.85) return false;
    if (Math.abs(p.z - darts.z) > 1.15) return false;
    return true;
  }

  function canThrowDarts() {
    return active === "darts" && !darts.over && darts.turn === "you" && !darts.flying.length && behindDartLine();
  }

  function throwFromLook(power, who) {
    if (who === "you" && !behindDartLine()) {
      toast("throw from behind the line");
      return;
    }
    const d = lookDir();
    const from = camera.position.clone().add(d.clone().multiplyScalar(0.42));
    const spd = 7.2 + power * 9.5;
    const vel = d.multiplyScalar(spd);
    vel.y += 0.15 + power * 0.25;
    throwDart(from, vel, who);
    if (who === "you") send({ t: "pshot", g: "darts", x: from.x, y: from.y, z: from.z, vx: vel.x, vy: vel.y, vz: vel.z });
  }

  function houseThrowDart() {
    const remain = darts.them;
    let n = 20;
    let rr = 0.4;
    if (remain === 50) {
      n = 20;
      rr = 0.01;
    } else if (remain <= 40 && remain % 2 === 0) {
      n = remain / 2;
      rr = 0.925;
    } else if (remain > 60) {
      n = 20;
      rr = 0.595;
    } else if (remain % 2 === 1) {
      n = 1;
      rr = 0.4;
    }
    const ang = dartAngleOf(n) + (Math.random() - 0.5) * 0.18;
    const r = Math.max(0, rr + (Math.random() - 0.5) * 0.08) * darts.r;
    const lx = -Math.sin(ang) * r;
    const ly = Math.cos(ang) * r;
    const target = worldFromBoard(lx, ly);
    const from = new THREE.Vector3(darts.lineX - 0.12, 1.55 + Math.random() * 0.1, darts.z + (Math.random() - 0.5) * 0.15);
    const vel = target.clone().sub(from);
    const t = 0.38;
    vel.x /= t;
    vel.y = vel.y / t + 4.9 * t;
    vel.z /= t;
    throwDart(from, vel, "them");
  }

  function stickDart(f, lx, ly) {
    const hit = scoreDart(lx, ly);
    f.mesh.position.copy(worldFromBoard(lx, ly));
    f.mesh.rotation.set(0, -Math.PI / 2, 0);
    darts.stuck.push(f);
    audio.dart?.();
    applyDartScore(f.who, hit);
    darts.dartsLeft = Math.max(0, darts.dartsLeft - 1);
    if (!darts.over && darts.dartsLeft <= 0) endDartTurn();
  }

  function tickDarts(dt) {
    if (darts.charging && !behindDartLine()) {
      darts.charging = false;
      darts.charge = 0;
      toast("step behind the line");
    }
    if (darts.charging) darts.charge = Math.min(1, darts.charge + dt * 0.95);
    if (darts.over) {
      darts.botWait -= dt;
      if (darts.botWait <= 0) resetDartsPlay();
    } else if (active === "darts" && darts.turn === "them" && darts.flying.length === 0) {
      darts.botWait -= dt;
      if (darts.botWait <= 0) houseThrowDart();
    }
    for (let i = darts.flying.length - 1; i >= 0; i--) {
      const f = darts.flying[i];
      f.life -= dt;
      f.vel.y -= 9.8 * dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      if (f.vel.lengthSq() > 0.01) {
        f.mesh.lookAt(f.mesh.position.x + f.vel.x, f.mesh.position.y + f.vel.y, f.mesh.position.z + f.vel.z);
      }
      const p = f.mesh.position;
      if (p.x >= darts.x - 0.08 && f.vel.x > 0) {
        const lx = p.z - darts.z;
        const ly = p.y - darts.y;
        if (Math.hypot(lx, ly) <= darts.r * 1.05) {
          darts.flying.splice(i, 1);
          stickDart(f, lx, ly);
          continue;
        }
      }
      if (f.life <= 0 || p.y < 0.04 || p.x > 8.4) {
        scene.remove(f.mesh);
        darts.flying.splice(i, 1);
        applyDartScore(f.who, { score: 0, label: "MISS", double: false });
        darts.dartsLeft = Math.max(0, darts.dartsLeft - 1);
        audio.beep(90, 0.08, "sine", 0.04);
        if (!darts.over && darts.dartsLeft <= 0) endDartTurn();
      }
    }
  }

  function buildDarts() {
    const g = new THREE.Group();
    const tex = dartTex();
    const faceMat = new THREE.MeshLambertMaterial({
      map: tex,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(darts.r, 48), faceMat);
    face.rotation.y = -Math.PI / 2;
    face.position.set(-0.04, darts.y, 0);
    face.renderOrder = 2;
    g.add(face);
    addMesh(g, boxGeo, lambert(0x3a1e10), 0.05, darts.y, 0, 0.08, 0.58, 0.58);
    addMesh(g, boxGeo, lambert(0x5a3218), 0.00, darts.y, 0, 0.04, 0.52, 0.52);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(darts.r + 0.012, 0.012, 8, 28), lambert(0xc9a227));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-0.04, darts.y, 0);
    ring.renderOrder = 2;
    g.add(ring);
    g.position.set(darts.x, 0, darts.z);
    mark(g, "darts");
    registerPick(g);
    registerPick(face);
    face.userData.kind = "darts";
    face.userData.root = g;
    scene.add(g);
    darts.board = g;
    const oche = addMesh(scene, boxGeo, lambert(0xf4ead0), darts.lineX, 0.02, darts.z, 0.06, 0.02, 1.35);
    mark(oche, "darts");
  }

  function build() {
    buildPool();
    buildYard();
    buildDarts();
  }

  function tryQueue(game) {
    const people = humans();
    const table = game === "pong" ? pong : dye;
    if (table.match && !table.over) {
      toast("match in play");
      return true;
    }
    if (!people.length) {
      toast(
        game === "pong"
          ? "beer pong vs the house. two shots a turn. both in = balls back. shoot FAR pink."
          : "beer die vs the house. toss on your turn."
      );
      table.queued = false;
      table.match = null;
      if (game === "pong") resetPongPlay();
      else resetDyePlay();
      return true;
    }
    const me = localId();
    const q = qset(game);
    if (q.has(me)) {
      q.delete(me);
      table.queued = false;
      send({ t: "qleave", g: game });
      toast("left the queue");
      return true;
    }
    q.add(me);
    table.queued = true;
    send({ t: "qjoin", g: game });
    toast(
      q.size >= 3
        ? `queued for 2v2 ${game === "pong" ? "beer pong" : "beer die"} (${q.size}/4)`
        : `queued for ${game === "pong" ? "beer pong" : "beer die"} (${q.size}) · 2 for 1v1, 4 for 2v2`
    );
    maybeMatch(game);
    return true;
  }

  function maybeMatch(game) {
    const table = game === "pong" ? pong : dye;
    if (table.match) return;
    const q = [...qset(game)];
    const me = localId();
    if (!q.includes(me)) return;
    if (q.length >= 4) {
      const four = q.slice(0, 4);
      const leader = [...four].sort()[0];
      if (me !== leader) return;
      const payload = { t: "match", g: game, mode: "2v2", a: [four[0], four[1]], b: [four[2], four[3]] };
      send(payload);
      startMatch(table, payload);
    } else if (q.length >= 2) {
      const two = q.slice(0, 2);
      const leader = [...two].sort()[0];
      if (me !== leader) return;
      const payload = { t: "match", g: game, mode: "1v1", a: [two[0]], b: [two[1]] };
      send(payload);
      startMatch(table, payload);
    }
  }

  function startMatch(table, msg) {
    const a = asArr(msg.a);
    const b = asArr(msg.b);
    const game = msg.g || (table === pong ? "pong" : "die");
    const mode = msg.mode || (a.length + b.length >= 4 ? "2v2" : "1v1");
    table.match = { a, b, mode, game };
    table.queued = false;
    qset(game).clear();
    if (game === "pong") rackPong();
    else rackDye();
    const me = localId();
    const mine = a.includes(me) ? a : b;
    const opp = mine === a ? b : a;
    const mate = mine.find((id) => id !== me);
    const vs = opp.map(nameOf).join(" + ");
    if (mode === "2v2") {
      toast(
        game === "pong"
          ? `2v2 pong · you + ${nameOf(mate)} vs ${vs} · both make = balls back`
          : `2v2 beer die · you + ${nameOf(mate)} vs ${vs}`
      );
    } else {
      toast(game === "pong" ? `pong vs ${vs}. two shots — both in = balls back` : `beer die vs ${vs}`);
    }
  }

  function kindFromLook(look) {
    const k = look?.userData?.kind;
    if (k === "pool") return "pool";
    if (k === "pong" || k === "pong-join" || k === "cup") return "pong";
    if (k === "die" || k === "die-join") return "die";
    if (k === "darts") return "darts";
    return null;
  }

  function gameName(kind) {
    if (kind === "pool") return "8-ball";
    if (kind === "pong") return "beer pong";
    if (kind === "die") return "beer die";
    if (kind === "darts") return "501 darts";
    return "the table";
  }

  function enterGame(kind) {
    if (!kind) return false;
    if (active === kind) return true;
    active = kind;
    audio.table?.();
    if (kind === "pool") toast("8-ball. click-hold to shoot · E leave");
    if (kind === "pong") {
      if (humans().length && !pong.match) tryQueue("pong");
      else toast("beer pong vs the house. click-hold to throw · E leave");
    }
    if (kind === "die") {
      if (humans().length && !dye.match) tryQueue("die");
      else toast("beer die vs the house. click-hold to toss · E leave");
    }
    if (kind === "darts") {
      resetDartsPlay();
      toast("501. double out. 3 darts a turn. throw from behind the line · E leave");
    }
    return true;
  }

  function leaveGame() {
    if (!active) return false;
    const name = gameName(active);
    pool.charging = false;
    pong.charging = false;
    dye.charging = false;
    darts.charging = false;
    if (active === "pong" && pong.queued) tryQueue("pong");
    if (active === "die" && dye.queued) tryQueue("die");
    active = null;
    audio.summonClose?.();
    toast(`left ${name}`);
    return true;
  }

  function prompt(look) {
    if (dye.catchUntil > _t) return "E CATCH THE DIE";
    const kind = kindFromLook(look);
    if (!active) {
      if (kind === "pool") return "E play 8-ball";
      if (kind === "pong") return "E play beer pong";
      if (kind === "die") return "E play beer die";
      if (kind === "darts") return "E play 501 darts";
      return "";
    }
    if (active === "pool") {
      if (pool.over) return pool.winner === "you" ? "YOU WIN · re-racking… · E leave" : "HOUSE WINS · re-racking… · E leave";
      if (moving() || pool.shotActive) return "balls are rolling · E leave";
      if (pool.turn !== "you") return "their shot · E leave";
      const suit = pool.youGroup ? `you are ${groupLabel(pool.youGroup)}` : "open table · first pocket sets solids or stripes";
      return pool.charging
        ? `power ${Math.round(pool.charge * 100)}%  ·  release  ·  ${suit}`
        : `click-hold to shoot  ·  ${suit}  ·  E leave`;
    }
    if (active === "pong") {
      if (pong.over) return "game over · re-racking… · E leave";
      if (pong.queued) return "queued for beer pong · E leave table";
      if (humans().length && !pong.match) return "E queue  ·  2 = 1v1, 4 = 2v2  ·  E leave";
      if (!canThrowPong()) {
        if (!isMyPoss(pong)) return "not your throw · E leave";
        if (pong.match?.mode === "2v2") return "wait — teammate throws · E leave";
        return "wait for the ball · E leave";
      }
      return pong.charging
        ? `throw ${Math.round(pong.charge * 100)}%  ·  ${pongTurnText()}`
        : `BEER PONG  ·  ${pongTurnText()}  ·  click-hold at FAR pink  ·  E leave`;
    }
    if (active === "die") {
      if (dye.over) return "game over · re-racking… · E leave";
      if (dye.queued) return "queued for beer die · E leave table";
      if (humans().length && !dye.match) return "E queue for beer die · E leave";
      if (!canThrowDie()) return (isMyPoss(dye) ? "wait for the die" : "not your toss") + " · E leave";
      return dye.charging
        ? `toss ${Math.round(dye.charge * 100)}%  ·  release`
        : "BEER DIE  ·  your toss  ·  click-hold  ·  E leave";
    }
    if (active === "darts") {
      if (darts.over) return (darts.winner === "you" ? "YOU WIN" : "HOUSE WINS") + " · re-throwing… · E leave";
      if (darts.turn !== "you") return "house is throwing · E leave";
      if (darts.flying.length) return "dart in the air · E leave";
      if (!behindDartLine()) return "step behind the line to throw · E leave";
      return darts.charging
        ? `throw ${Math.round(darts.charge * 100)}%  ·  ${darts.dartsLeft} left  ·  you ${darts.you}`
        : `501  you ${darts.you}  house ${darts.them}  ·  ${darts.dartsLeft} darts  ·  click-hold  ·  E leave`;
    }
    return "E leave the table";
  }

  function hudText() {
    if (active === "pool") {
      const solids = liveOf("solids");
      const stripes = liveOf("stripes");
      const eight = pool.balls.find((b) => b.n === 8)?.live ? "8 in play" : "8 down";
      const you = pool.youGroup ? groupLabel(pool.youGroup) : "OPEN";
      const turn = pool.over ? (pool.winner === "you" ? "YOU WIN" : "HOUSE WINS") : pool.turn === "you" ? "your shot" : "their shot";
      return `8-BALL  you ${you}  ·  solids ${solids}  stripes ${stripes}  ·  ${eight}  ·  ${turn}`;
    }
    if (active === "pong") {
      const vs = pong.match ? (pong.match.mode === "2v2" ? "2v2" : "1v1") : pong.queued ? "queued" : "house";
      return `BEER PONG  your cups ${pong.youCups}  ·  their cups ${pong.themCups}  ·  ${vs}  ·  ${pongTurnText()}`;
    }
    if (active === "die") {
      const vs = dye.match ? (dye.match.mode === "2v2" ? "2v2" : "1v1") : dye.queued ? "queued" : "house";
      const turn = dye.over ? (dye.youCups <= 0 ? loseLabel(dye) : "YOU WIN") : isMyPoss(dye) ? "your toss" : "their toss";
      return `BEER DIE  vs ${vs}  ·  your cups ${dye.youCups}  their cups ${dye.themCups}  ·  ${turn}` + (dye.catchUntil > _t ? "  ·  CATCH" : "");
    }
    if (active === "darts") {
      const turn = darts.over ? (darts.winner === "you" ? "YOU WIN" : "HOUSE WINS") : darts.turn === "you" ? `${darts.dartsLeft} darts` : "house throw";
      return `501  you ${darts.you}  ·  house ${darts.them}  ·  ${turn}`;
    }
    return "";
  }

  function use(look) {
    if (dye.catchUntil > _t && dye.die && !dye.die.settled) {
      dye.catchUntil = 0;
      scene.remove(dye.die.mesh);
      const idx = fly.indexOf(dye.die);
      if (idx >= 0) fly.splice(idx, 1);
      const who = dye.die.who;
      dye.die = null;
      toast("caught");
      audio.catch?.();
      api.score?.(10);
      nextDiePoss(who);
      return true;
    }
    const kind = kindFromLook(look);
    if (kind && active !== kind) return enterGame(kind);
    return false;
  }

  function pointerDown(look) {
    if (active === "pool") {
      if (pool.turn === "you" && !moving() && !pool.over) {
        pool.charging = true;
        pool.charge = 0.12;
      }
      return true;
    }
    if (active === "pong") {
      if (pong.over) return true;
      if (!canThrowPong()) {
        if (!isMyPoss(pong)) toast("not your throw");
        else if (pong.match?.mode === "2v2" && pong.threw.has(localId() || "you")) toast("teammate's throw");
        return true;
      }
      pong.charging = true;
      pong.charge = 0.12;
      return true;
    }
    if (active === "die") {
      if (dye.over) return true;
      if (!canThrowDie()) {
        if (!isMyPoss(dye)) toast("not your toss");
        return true;
      }
      dye.charging = true;
      dye.charge = 0.12;
      return true;
    }
    if (active === "darts") {
      if (darts.over || darts.turn !== "you" || darts.flying.length) return true;
      if (!behindDartLine()) {
        toast("throw from behind the line");
        return true;
      }
      darts.charging = true;
      darts.charge = 0.12;
      return true;
    }
    if (kindFromLook(look)) return true;
    return false;
  }

  function pointerUp() {
    if (pool.charging) {
      pool.charging = false;
      const d = lookDir();
      if (pool.turn === "you" && !moving() && !pool.over) shootCue(d.x, d.z, pool.charge);
      pool.charge = 0;
      return true;
    }
    if (pong.charging) {
      pong.charging = false;
      const pwr = pong.charge;
      pong.charge = 0;
      if (canThrowPong()) throwFromCamera("ping", pwr, "you");
      return true;
    }
    if (dye.charging) {
      dye.charging = false;
      const pwr = dye.charge;
      dye.charge = 0;
      if (canThrowDie()) throwFromCamera("die", pwr, "you");
      return true;
    }
    if (darts.charging) {
      darts.charging = false;
      const pwr = darts.charge;
      darts.charge = 0;
      if (canThrowDarts()) throwFromLook(pwr, "you");
      else if (active === "darts" && darts.turn === "you") toast("throw from behind the line");
      return true;
    }
    return false;
  }

  function onNet(msg) {
    if (!msg || !msg.t) return;
    const me = localId();
    if (msg.t === "qjoin" && msg.from && msg.from !== me) {
      qset(msg.g).add(msg.from);
      toast("someone queued for a table");
      if (msg.g === "pong" && pong.queued) maybeMatch("pong");
      if (msg.g === "die" && dye.queued) maybeMatch("die");
    }
    if (msg.t === "qleave" && msg.from && msg.from !== me) {
      qset(msg.g).delete(msg.from);
    }
    if (msg.t === "match" && (asArr(msg.a).includes(me) || asArr(msg.b).includes(me))) {
      const table = msg.g === "pong" ? pong : dye;
      startMatch(table, msg);
    }
    if (msg.t === "pshot" && msg.from !== me) {
      const from = new THREE.Vector3(msg.x, msg.y, msg.z);
      const vel = new THREE.Vector3(msg.vx, msg.vy, msg.vz);
      const who = msg.from || "them";
      if (msg.g === "pong") spawnPing(from, vel, who);
      else if (msg.g === "die") spawnDie(from, vel, who);
      else if (msg.g === "darts") throwDart(from, vel, "them");
    }
  }

  function tick(dt, t) {
    _t = t;
    tickPool(dt);
    tickFly(dt);
    tickDarts(dt);
    if (dye.catchUntil && dye.catchUntil < t) dye.catchUntil = 0;
  }

  function reset() {
    active = null;
    pool.charging = false;
    pong.charging = false;
    dye.charging = false;
    darts.charging = false;
    resetDartsPlay();
    pong.queued = false;
    dye.queued = false;
    pong.match = null;
    dye.match = null;
    qpong.clear();
    qdie.clear();
    clearFly();
    rackPool();
    rackPong();
    rackDye();
  }

  function pickRange(kind) {
    if (kind === "pool" || kind === "pong" || kind === "die" || kind === "pong-join" || kind === "die-join" || kind === "cup" || kind === "darts") return 4.8;
    return 0;
  }

  return { build, tick, prompt, use, pointerDown, pointerUp, hudText, reset, pickRange, onNet, leave: leaveGame, playing: () => active };
}

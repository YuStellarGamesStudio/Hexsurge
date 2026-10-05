// Enemy creation, steering AI (R-spec 8.1: toward player + separation, no pathfinding), statuses and the spawn director.
import { ARENA, COMBAT, PLAYER, REACTION, SIM, STATUS, TIMELINE } from '../data/config.js';
import { ENEMY_BY_ID, FAMILIES, VARIANTS } from '../data/enemies.js';
import { DENSITY, FAMILY_SCHEDULE, FINAL_STAND, GROUPS, HP_GROWTH, SPAWN, TIER_ODDS } from '../data/spawns.js';
import { dotDamage, emit, hurtPlayer, killEnemy } from './combat.js';
import { spawnEnemyProjectile } from './entities.js';
import { angleTo, clamp, TAU } from './math.js';
import { resolveObstacles } from './terrain.js';

function keyframe(table, t) {
  if (t <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (t <= table[i][0]) {
      const [t0, v0] = table[i - 1], [t1, v1] = table[i];
      const k = (t - t0) / (t1 - t0);
      if (Array.isArray(v0)) return v0.map((x, j) => x + (v1[j] - x) * k);
      return v0 + (v1 - v0) * k;
    }
  }
  return table[table.length - 1][1];
}

/** Enemy hp multiplier from elapsed time + difficulty (+ endless growth). */
export function hpScale(run) {
  const minutes = run.t / 60;
  let s = (1 + HP_GROWTH.perMinute * minutes) * run.difficulty.hp;
  if (run.endless) s *= 1 + TIMELINE.endlessHpPerMin * ((run.t - TIMELINE.runLength) / 60);
  return s;
}

export function spawnEnemy(run, def, x, z, opts = {}) {
  const diff = run.difficulty;
  const elite = !!opts.elite;
  const ew = SPAWN.eliteWave;
  const hp = def.hp * hpScale(run) * (elite ? ew.hpMult : 1) * (opts.hpMult ?? 1);
  const e = {
    id: run.nextId++, def, x, z, kx: 0, kz: 0,
    hp, maxHp: hp, r: def.radius * (elite ? ew.sizeMult : 1),
    speed: def.speed * diff.speed, dmg: def.dmg * (elite ? ew.dmgMult : 1), flying: !!def.flying, elite,
    xpMult: elite ? ew.xpMult : 1, atkCd: 0.3 + run.rng() * 0.4, dead: false, boss: false, hitFlash: 0,
    chillT: 0, chillHits: 0, freezeT: 0, shockT: 0, burnT: 0, burnDps: 0, burnStacks: 0, burnTick: 0, burnSrc: null,
    erodeT: 0, erodeAmp: 0, attuneT: 0, reactCd: 0, buffT: 0, buffSpeed: 0, buffDmg: 0,
    aiT: run.rng() * 1.5, state: 0, fuseT: 0, lungeT: 0, summoner: opts.summoner ?? null, facing: 0, age: 0,
  };
  run.enemies.push(e);
  run.seen.enemies.add(def.id);
  return e;
}

/* ------------------------------------------------------------------ steering */

function moveTo(run, e, tx, tz, speed, dt) {
  const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz) || 1;
  e.x += (dx / d) * speed * dt; e.z += (dz / d) * speed * dt;
  e.facing = Math.atan2(dz, dx);
  return d;
}

function moveAway(run, e, fx, fz, speed, dt) {
  const dx = e.x - fx, dz = e.z - fz, d = Math.hypot(dx, dz) || 1;
  e.x += (dx / d) * speed * dt; e.z += (dz / d) * speed * dt;
}

function strafe(run, e, px, pz, speed, dt, dir) {
  const a = angleTo(px, pz, e.x, e.z) + dir * Math.PI / 2;
  e.x += Math.cos(a) * speed * dt; e.z += Math.sin(a) * speed * dt;
}

function shoot(run, e, count, spread, speed, life) {
  const p = run.player;
  const base = angleTo(e.x, e.z, p.x, p.z);
  for (let i = 0; i < count; i++) {
    const a = count === 1 ? base : base + (i / (count - 1) - 0.5) * 2 * spread * (count - 1) * 0.5;
    spawnEnemyProjectile(run, { x: e.x, z: e.z, angle: a, speed, damage: e.dmg * (1 + e.buffDmg), life, radius: 0.32 + e.def.radius * 0.1,
      vfx: { shape: 'orb', color: e.def.accent, size: 0.55, glow: 1.1 } });
  }
  emit(run, { type: 'enemyShot', x: e.x, z: e.z });
}

const AI = {
  swarm(run, e, dt, sp) { moveTo(run, e, run.player.x, run.player.z, sp, dt); },

  fast(run, e, dt, sp) {
    const a = e.def.ai;
    e.aiT -= dt;
    if (e.lungeT > 0) { e.lungeT -= dt; sp *= a.lungeMult; }
    else if (e.aiT <= 0) { e.aiT = a.lungeEvery * (0.8 + run.rng() * 0.4); e.lungeT = a.lungeTime; }
    moveTo(run, e, run.player.x, run.player.z, sp, dt);
  },

  tank(run, e, dt, sp) { moveTo(run, e, run.player.x, run.player.z, sp, dt); },

  ranged(run, e, dt, sp) {
    const p = run.player, a = e.def.ai;
    const d = Math.hypot(p.x - e.x, p.z - e.z);
    if (d > a.range) moveTo(run, e, p.x, p.z, sp, dt);
    else if (d < a.range * 0.65) moveAway(run, e, p.x, p.z, sp * 0.85, dt);
    else strafe(run, e, p.x, p.z, sp * 0.45, dt, e.id % 2 ? 1 : -1);
    e.aiT -= dt;
    if (e.aiT <= 0 && d < a.range * 1.3) { e.aiT = a.interval * (0.85 + run.rng() * 0.3); shoot(run, e, a.count, a.spread, a.shotSpeed, a.shotLife); }
  },

  split(run, e, dt, sp) { moveTo(run, e, run.player.x, run.player.z, sp, dt); },

  exploder(run, e, dt, sp) {
    const p = run.player, a = e.def.ai;
    const d = moveTo(run, e, p.x, p.z, e.fuseT > 0 ? sp * 0.35 : sp, dt);
    if (e.fuseT <= 0 && d < a.trigger) { e.fuseT = a.fuse; emit(run, { type: 'fuse', x: e.x, z: e.z, id: e.id }); }
    if (e.fuseT > 0) {
      e.fuseT -= dt;
      if (e.fuseT <= 0) explode(run, e, a.blast);
    }
  },

  flyer(run, e, dt, sp) {
    const p = run.player;
    const weave = e.def.ai?.weave ?? (e.def.tier === 2 ? 0.9 : 0.35);
    const d = moveTo(run, e, p.x, p.z, sp, dt);
    const side = Math.sin(run.t * 2.4 + e.id) * weave * sp * dt;
    const a = angleTo(e.x, e.z, p.x, p.z) + Math.PI / 2;
    e.x += Math.cos(a) * side; e.z += Math.sin(a) * side;
    return d;
  },

  buffer(run, e, dt, sp) {
    const p = run.player, a = e.def.ai;
    const d = Math.hypot(p.x - e.x, p.z - e.z);
    if (d > a.keep) moveTo(run, e, p.x, p.z, sp, dt);
    else strafe(run, e, p.x, p.z, sp * 0.4, dt, e.id % 2 ? 1 : -1);
    e.aiT -= dt;
    if (e.aiT <= 0) {
      e.aiT = 0.25;
      run.grid.query(e.x, e.z, a.radius, (n) => {
        if (n === e) return;
        n.buffT = 0.4; n.buffSpeed = Math.max(n.buffSpeed, a.speed); n.buffDmg = Math.max(n.buffDmg, a.damage);
      });
    }
  },

  healer(run, e, dt, sp) {
    const p = run.player, a = e.def.ai;
    const d = Math.hypot(p.x - e.x, p.z - e.z);
    if (d > a.keep) moveTo(run, e, p.x, p.z, sp, dt);
    else strafe(run, e, p.x, p.z, sp * 0.4, dt, e.id % 2 ? 1 : -1);
    e.aiT -= dt;
    if (e.aiT <= 0) {
      e.aiT = a.interval;
      let healed = 0;
      run.grid.query(e.x, e.z, a.radius, (n) => {
        if (n === e || n.boss || n.hp >= n.maxHp) return;
        n.hp = Math.min(n.maxHp, n.hp + n.maxHp * a.heal); healed++;
      });
      emit(run, { type: 'healpulse', x: e.x, z: e.z, r: a.radius, healed });
    }
  },

  summoner(run, e, dt, sp) {
    const p = run.player, a = e.def.ai;
    const d = Math.hypot(p.x - e.x, p.z - e.z);
    if (d > a.keep) moveTo(run, e, p.x, p.z, sp, dt);
    else moveAway(run, e, p.x, p.z, sp * 0.5, dt);
    e.aiT -= dt;
    if (e.aiT <= 0) {
      e.aiT = a.interval;
      if (run.enemies.length < SIM.maxAlive - 2 && countSummoned(run, e) < a.cap) {
        const def = ENEMY_BY_ID[a.into];
        for (let i = 0; i < a.count; i++) {
          const ang = run.rng() * TAU;
          spawnEnemy(run, def, e.x + Math.cos(ang) * 1.2, e.z + Math.sin(ang) * 1.2, { summoner: e.id, hpMult: 0.8 });
        }
        emit(run, { type: 'summon', x: e.x, z: e.z, element: null });
      }
    }
  },
};

function countSummoned(run, e) {
  let n = 0;
  for (const o of run.enemies) if (o.summoner === e.id && !o.dead) n++;
  return n;
}

function explode(run, e, blast) {
  const p = run.player;
  emit(run, { type: 'burst', x: e.x, z: e.z, r: blast, element: 'fire', kind: 'enemy_explosion' });
  if ((p.x - e.x) ** 2 + (p.z - e.z) ** 2 < (blast + p.r) ** 2) hurtPlayer(run, e.dmg * run.difficulty.damage * (1 + e.buffDmg), { invuln: PLAYER.invuln });
  killEnemy(run, e, {});
}

/** Death hook: splitting enemies bud off children. */
export function onEnemyDied(run, e) {
  const a = e.def.ai;
  if (e.def.family === 'split' && a?.into && !e.boss) {
    const def = ENEMY_BY_ID[a.into];
    for (let i = 0; i < a.count; i++) {
      if (run.enemies.length >= SIM.maxAlive + 6) break;
      const ang = (i / a.count) * TAU + run.rng();
      const c = spawnEnemy(run, def, e.x + Math.cos(ang) * 0.5, e.z + Math.sin(ang) * 0.5, { hpMult: 1 });
      c.kx = Math.cos(ang) * 5; c.kz = Math.sin(ang) * 5;
    }
  }
}

/* ------------------------------------------------------------------- updating */

let sepSelf = null, sepX = 0, sepZ = 0;
function separate(n) {
  if (n === sepSelf) return;
  const dx = sepSelf.x - n.x, dz = sepSelf.z - n.z;
  const min = sepSelf.r + n.r;
  const d2 = dx * dx + dz * dz;
  if (d2 >= min * min * 0.9) return;
  const d = Math.sqrt(d2) || 0.01;
  const push = (min * 0.95 - d) * 0.5;
  const w = n.boss ? 1 : 0.5; // bosses are immovable; others share the push
  sepX += (dx / d) * push * w; sepZ += (dz / d) * push * w;
}

export function updateEnemies(run, dt) {
  const p = run.player;
  const list = run.enemies;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (e.dead) continue;
    e.age += dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.reactCd > 0) e.reactCd -= dt;
    if (e.buffT > 0) { e.buffT -= dt; if (e.buffT <= 0) { e.buffSpeed = 0; e.buffDmg = 0; } }

    // Status timers and damage over time.
    if (e.burnT > 0) {
      e.burnT -= dt;
      e.burnTick += dt;
      if (e.burnTick >= STATUS.burn.tick) {
        e.burnTick -= STATUS.burn.tick;
        const stacks = 1 + e.burnStacks * REACTION.burnout.dpsPerStack;
        dotDamage(run, e, e.burnDps * stacks * STATUS.burn.tick * run.player.stats.damage, 'fire', e.burnSrc);
        if (e.dead) continue;
      }
      if (e.burnT <= 0) { e.burnStacks = 0; e.burnDps = 0; }
    }
    if (e.chillT > 0) e.chillT -= dt;
    if (e.freezeT > 0) e.freezeT -= dt;
    if (e.shockT > 0) e.shockT -= dt;
    if (e.erodeT > 0) { e.erodeT -= dt; if (e.erodeT <= 0) e.erodeAmp = 0; }
    if (e.attuneT > 0) e.attuneT -= dt;

    // Knockback velocity.
    if (e.kx || e.kz) {
      e.x += e.kx * dt; e.z += e.kz * dt;
      const decay = Math.max(0, 1 - COMBAT.knockbackDecay * dt);
      e.kx *= decay; e.kz *= decay;
      if (Math.abs(e.kx) + Math.abs(e.kz) < 0.05) { e.kx = 0; e.kz = 0; }
    }

    if (e.boss) continue; // bosses are driven by src/sim/boss.js

    let speed = e.speed * (1 + e.buffSpeed);
    if (e.freezeT > 0) speed = 0;
    else if (e.chillT > 0) speed *= Math.max(STATUS.slowFloor, 1 - STATUS.chill.slow);
    if (speed > 0) AI[e.def.family](run, e, dt, speed);

    // Separation from neighbours (ground units collide; fliers drift through each other at half strength).
    sepSelf = e; sepX = 0; sepZ = 0;
    run.grid.query(e.x, e.z, e.r * 0.4, separate);
    const sepK = e.flying ? 0.4 : 1;
    e.x += sepX * sepK; e.z += sepZ * sepK;
    if (!e.flying) resolveObstacles(run, e, e.r);

    // Contact damage.
    e.atkCd -= dt;
    const dx = p.x - e.x, dz = p.z - e.z, rr = e.r + p.r;
    if (dx * dx + dz * dz < rr * rr && e.atkCd <= 0 && e.def.family !== 'exploder' && e.freezeT <= 0) {
      if (hurtPlayer(run, e.dmg * run.difficulty.damage * (1 + e.buffDmg), { invuln: PLAYER.invuln })) e.atkCd = COMBAT.contactCooldown;
    }

    // Recycle strays that fell far behind so density stays around the player.
    if (dx * dx + dz * dz > COMBAT.enemyDespawnDistance ** 2) {
      const pos = ringPosition(run, e.flying);
      e.x = pos.x; e.z = pos.z;
    }
  }
}

/** Compacts the enemy list after a step. */
export function sweepDead(run) {
  const list = run.enemies;
  let w = 0;
  for (let i = 0; i < list.length; i++) if (!list[i].dead) list[w++] = list[i];
  list.length = w;
}

/* ------------------------------------------------------------------- director */

export function ringPosition(run, flying) {
  const p = run.player;
  const a = run.rng() * TAU;
  const d = ARENA.spawnMin + run.rng() * (ARENA.spawnMax - ARENA.spawnMin);
  let x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
  const lim = ARENA.radius - 1;
  const len = Math.hypot(x, z);
  if (len > lim) { x *= lim / len; z *= lim / len; }
  return { x, z };
}

/** Chooses a family+variant for the current moment. */
export function pickSpawn(run) {
  const diff = run.difficulty;
  const t = run.t;
  const weights = [];
  for (const f of FAMILIES) {
    // Special families (everything but swarm) debut earlier at higher difficulty.
    const tt = f === 'swarm' ? t : t + diff.earlySpecial;
    let w = keyframe(FAMILY_SCHEDULE[f], tt) * (run.map.themeWeights[f] ?? 1);
    if (run.boss && f !== 'swarm') w *= 0.7;
    weights.push([f, w]);
  }
  const family = run.rng.weighted(weights) ?? 'swarm';
  const odds = keyframe(TIER_ODDS, t + (family === 'swarm' ? 0 : diff.earlySpecial * 0.5));
  const variants = VARIANTS[family];
  let tier = run.rng.weighted([[1, odds[0]], [2, odds[1]], [3, odds[2]]]) ?? 1;
  // Choose the variant of that tier, else the nearest available.
  let best = variants[0], bestGap = 99;
  for (const v of variants) {
    const gap = Math.abs(v.tier - tier);
    if (gap < bestGap || (gap === bestGap && run.rng() < 0.5)) { best = v; bestGap = gap; }
  }
  return { family, def: best };
}

export function desiredAlive(run) {
  const t = run.t;
  let n = keyframe(DENSITY, Math.min(t, TIMELINE.runLength)) * run.difficulty.density;
  if (t >= FINAL_STAND.from) n *= 1 + (FINAL_STAND.mult - 1) * clamp((t - FINAL_STAND.from) / (FINAL_STAND.to - FINAL_STAND.from), 0, 1);
  if (run.endless) n *= 1 + TIMELINE.endlessDensityPerMin * ((t - TIMELINE.runLength) / 60);
  if (run.boss) n *= SPAWN.bossReduce;
  return Math.min(n, SIM.maxAlive - 2);
}

export function updateDirector(run, dt) {
  const d = run.director;
  const want = desiredAlive(run);
  d.credit = Math.min(d.credit + SPAWN.perSecond * dt, 12);
  while (d.credit >= 1 && run.enemies.length < want && run.enemies.length < SIM.maxAlive) {
    const { family, def } = pickSpawn(run);
    const [lo, hi] = GROUPS[family];
    let n = run.rng.int(lo, hi);
    n = Math.min(n, SIM.maxAlive - run.enemies.length, Math.ceil(want - run.enemies.length));
    if (n < 1) break;
    const base = ringPosition(run, !!def.flying);
    for (let i = 0; i < n; i++) {
      const a = run.rng() * TAU, r = run.rng() * SPAWN.groupRadius;
      let x = base.x + Math.cos(a) * r, z = base.z + Math.sin(a) * r;
      const len = Math.hypot(x, z), lim = ARENA.radius - 1;
      if (len > lim) { x *= lim / len; z *= lim / len; }
      spawnEnemy(run, def, x, z);
    }
    d.credit -= n;
  }
  // 5:00 elite wave.
  if (!d.eliteDone && run.t >= TIMELINE.eliteWaveTime) {
    d.eliteDone = true;
    const ew = SPAWN.eliteWave;
    for (let i = 0; i < ew.count; i++) {
      const a = (i / ew.count) * TAU, dist = ARENA.spawnMin + 1;
      let x = run.player.x + Math.cos(a) * dist, z = run.player.z + Math.sin(a) * dist;
      const len = Math.hypot(x, z), lim = ARENA.radius - 1;
      if (len > lim) { x *= lim / len; z *= lim / len; }
      const def = VARIANTS.tank[0];
      spawnEnemy(run, i % 2 ? VARIANTS.swarm[1] : def, x, z, { elite: true });
    }
    emit(run, { type: 'eliteWave' });
  }
}



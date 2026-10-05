// Generic entity systems + the "spell kit" that spell handlers build on.
// Spell authors never touch run internals directly: they call spawn*/sync* helpers and set `vfx` descriptors.
//
// vfx descriptor (consumed by src/render): { shape, color, size, glow, trail, spin }
//   shape: 'orb'|'shard'|'disc'|'ring'|'bolt'|'star'|'leaf'|'skull'|'crescent'|'rune'|'flame'|'crystal'
//   color: '#rrggbb'   size: world units   glow: emissive intensity (1 = normal)   trail: element name | null
import { SIM, PLAYER, XP } from '../data/config.js';
import { damageEnemy, emit, hurtPlayer } from './combat.js';
import { angleDiff, angleTo, TAU } from './math.js';

/* ------------------------------------------------------------------ queries */

export const enemiesIn = (run, x, z, r, fn) => run.grid.query(x, z, r, fn);
export const nearestEnemy = (run, x, z, range, filter) => run.grid.nearest(x, z, range, filter);

/** Up to n distinct nearest enemies within range, nearest first. */
export function nearestN(run, x, z, range, n, filter) {
  const found = [];
  run.grid.query(x, z, range, (e) => { if (!filter || filter(e)) found.push(e); });
  found.sort((a, b) => (a.x - x) ** 2 + (a.z - z) ** 2 - ((b.x - x) ** 2 + (b.z - z) ** 2));
  return found.length > n ? found.slice(0, n) : found;
}

/** Random living enemy within range of (x,z), or null. */
export function randomEnemy(run, x, z, range, filter) {
  const found = [];
  run.grid.query(x, z, range, (e) => { if (!filter || filter(e)) found.push(e); });
  return found.length ? found[Math.floor(run.rng() * found.length)] : null;
}

/** Aim angle at nearest enemy within range, falling back to player facing. */
export function aimAngle(run, x, z, range = 22) {
  const t = run.grid.nearest(x, z, range);
  return t ? angleTo(x, z, t.x, t.z) : run.player.facing;
}

/* -------------------------------------------------------------- projectiles */

/**
 * o: { x, z, angle, speed, damage, radius, pierce=0, life=2, homing=0, element, spellId, vfx, knock=0,
 *      onHit(run,p,e), onExpire(run,p), onUpdate(run,p,dt), accel=0, maxSpeed, noReact, bounces=0 }
 */
export function spawnProjectile(run, o) {
  if (run.projectiles.length >= SIM.maxProjectiles) return null;
  const p = {
    id: run.nextId++, x: o.x, z: o.z, angle: o.angle, speed: o.speed ?? 12,
    vx: 0, vz: 0, r: o.radius ?? 0.4, dmg: o.damage, pierce: o.pierce ?? 0, life: o.life ?? 2, age: 0,
    homing: o.homing ?? 0, target: null, element: o.element, spellId: o.spellId, vfx: o.vfx, knock: o.knock ?? 0,
    onHit: o.onHit, onExpire: o.onExpire, onUpdate: o.onUpdate, accel: o.accel ?? 0, maxSpeed: o.maxSpeed ?? Infinity,
    noReact: !!o.noReact, bounces: o.bounces ?? 0, hits: new Set(), dead: false, data: o.data ?? null,
  };
  p.vx = Math.cos(p.angle) * p.speed; p.vz = Math.sin(p.angle) * p.speed;
  run.projectiles.push(p);
  return p;
}

/** Re-aim projectile at the nearest enemy it has not hit. Returns the new target or null. */
export function redirectToNearest(run, p, range) {
  const t = run.grid.nearest(p.x, p.z, range, (e) => !p.hits.has(e.id));
  if (!t) return null;
  p.angle = angleTo(p.x, p.z, t.x, t.z);
  p.vx = Math.cos(p.angle) * p.speed; p.vz = Math.sin(p.angle) * p.speed;
  return t;
}

function updateProjectiles(run, dt) {
  const list = run.projectiles;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.age += dt; p.life -= dt;
    if (p.homing > 0) {
      if (!p.target || p.target.dead) p.target = run.grid.nearest(p.x, p.z, 16, (e) => !p.hits.has(e.id));
      if (p.target) {
        const want = angleTo(p.x, p.z, p.target.x, p.target.z);
        const d = angleDiff(p.angle, want);
        p.angle += Math.max(-p.homing * dt, Math.min(p.homing * dt, d));
      }
    }
    if (p.accel) p.speed = Math.min(p.maxSpeed, Math.max(0, p.speed + p.accel * dt));
    p.vx = Math.cos(p.angle) * p.speed; p.vz = Math.sin(p.angle) * p.speed;
    p.x += p.vx * dt; p.z += p.vz * dt;
    p.onUpdate?.(run, p, dt);
    if (!p.dead) {
      run.grid.query(p.x, p.z, p.r, (e) => {
        if (p.hits.has(e.id) || p.dead) return;
        p.hits.add(e.id);
        damageEnemy(run, e, p.dmg, { element: p.element, spellId: p.spellId, knock: p.knock, kx: p.x - p.vx * 0.05, kz: p.z - p.vz * 0.05, noReact: p.noReact });
        p.onHit?.(run, p, e);
        if (p.bounces > 0 && !p.dead) { p.bounces--; if (!redirectToNearest(run, p, 12)) p.dead = true; return; }
        if (p.pierce > 0) p.pierce--; else p.dead = true;
      });
    }
    if (p.dead || p.life <= 0 || Math.hypot(p.x, p.z) > 80) {
      if (!p.dead) { p.dead = true; p.onExpire?.(run, p); }
      list[i] = list[list.length - 1]; list.pop();
    }
  }
}

/* ------------------------------------------------------------------- areas */

/**
 * Persistent / pulsing zone.
 * o: { x, z, radius, duration, tick=0.5, damage, element, spellId, vfx, follow=false, delay=0,
 *      slow=0 (chill seconds applied per tick), pull=0, knock=0, onTick(run,a,hits[]), onExpire(run,a), onUpdate }
 */
export function spawnArea(run, o) {
  const a = {
    id: run.nextId++, x: o.x, z: o.z, r: o.radius, life: o.duration, maxLife: o.duration, tick: o.tick ?? 0.5, tickT: o.delay ?? 0,
    dmg: o.damage ?? 0, element: o.element, spellId: o.spellId, vfx: o.vfx, follow: !!o.follow, slow: o.slow ?? 0, pull: o.pull ?? 0,
    knock: o.knock ?? 0, onTick: o.onTick, onExpire: o.onExpire, onUpdate: o.onUpdate, noReact: !!o.noReact, data: o.data ?? null,
    warm: o.delay ?? 0, dead: false,
  };
  run.areas.push(a);
  return a;
}

function updateAreas(run, dt) {
  const list = run.areas;
  const p = run.player;
  for (let i = list.length - 1; i >= 0; i--) {
    const a = list[i];
    a.life -= dt;
    if (a.follow) { a.x = p.x; a.z = p.z; }
    a.onUpdate?.(run, a, dt);
    if (a.warm > 0) a.warm -= dt;
    else {
      if (a.pull) run.grid.query(a.x, a.z, a.r, (e) => {
        if (e.boss) return;
        const ang = angleTo(e.x, e.z, a.x, a.z), d = Math.hypot(a.x - e.x, a.z - e.z);
        const k = Math.min(d, a.pull * dt);
        e.x += Math.cos(ang) * k; e.z += Math.sin(ang) * k;
      });
      a.tickT -= dt;
      if (a.tickT <= 0) {
        a.tickT += a.tick;
        const hits = [];
        run.grid.query(a.x, a.z, a.r, (e) => { hits.push(e); });
        if (a.onTick) a.onTick(run, a, hits);
        else for (const e of hits) {
          if (a.dmg > 0) damageEnemy(run, e, a.dmg, { element: a.element, spellId: a.spellId, knock: a.knock, kx: a.x, kz: a.z, noReact: a.noReact });
          if (a.slow > 0 && e.chillT < a.slow) e.chillT = a.slow;
        }
      }
    }
    if (a.life <= 0 || a.dead) { a.onExpire?.(run, a); list[i] = list[list.length - 1]; list.pop(); }
  }
}

/* ----------------------------------------------------------------- strikes */

/** Delayed instant AoE (meteor, lightning). o: { x, z, radius, damage, delay, element, spellId, vfx, knock, onImpact(run,s,hits), warn=true, kind } */
export function spawnStrike(run, o) {
  const s = {
    id: run.nextId++, x: o.x, z: o.z, r: o.radius, dmg: o.damage, t: o.delay ?? 0.6, delay: o.delay ?? 0.6, element: o.element,
    spellId: o.spellId, vfx: o.vfx, knock: o.knock ?? 0, onImpact: o.onImpact, warn: o.warn !== false, kind: o.kind ?? 'strike', noReact: !!o.noReact,
  };
  run.strikes.push(s);
  return s;
}

function updateStrikes(run, dt) {
  const list = run.strikes;
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    s.t -= dt;
    if (s.t > 0) continue;
    const hits = [];
    run.grid.query(s.x, s.z, s.r, (e) => { hits.push(e); });
    emit(run, { type: 'burst', x: s.x, z: s.z, r: s.r, element: s.element, kind: s.kind });
    if (s.onImpact) s.onImpact(run, s, hits);
    else for (const e of hits) damageEnemy(run, e, s.dmg, { element: s.element, spellId: s.spellId, knock: s.knock, kx: s.x, kz: s.z, noReact: s.noReact });
    list[i] = list[list.length - 1]; list.pop();
  }
}

/** Instant burst around a point (nova). Emits a burst event for visuals. */
export function burst(run, o) {
  emit(run, { type: 'burst', x: o.x, z: o.z, r: o.radius, element: o.element, kind: o.kind ?? 'nova' });
  const hits = [];
  run.grid.query(o.x, o.z, o.radius, (e) => { hits.push(e); });
  for (const e of hits) damageEnemy(run, e, o.damage, { element: o.element, spellId: o.spellId, knock: o.knock ?? 0, kx: o.x, kz: o.z, noReact: o.noReact });
  return hits;
}

/** Visual lightning polyline; points = [[x,z],...]. Damage is the caller's job. */
export function emitArc(run, points, element, ttl = 0.18) { emit(run, { type: 'arc', points, element, ttl }); }

/* ---------------------------------------------------------------- orbiters */

/**
 * Keep `count` orbiting bodies alive for this spell and advance them.
 * Call from handler.update every step. o: { count, radius, speed (rad/s), damage, size, hitInterval=0.45, element, vfx, knock, onHit }
 */
export function syncOrbiters(run, spell, o, dt) {
  const key = spell.def.id;
  const mine = spell.orbiters ?? (spell.orbiters = []);
  while (mine.length < o.count) {
    const orb = { id: run.nextId++, key, angle: 0, x: 0, z: 0, hits: new Map(), r: o.size ?? 0.5, data: null };
    mine.push(orb); run.orbiters.push(orb);
  }
  while (mine.length > o.count) { const orb = mine.pop(); orb.dead = true; }
  spell.orbitAngle = (spell.orbitAngle ?? 0) + o.speed * dt;
  const p = run.player;
  for (let i = 0; i < mine.length; i++) {
    const orb = mine[i];
    orb.angle = spell.orbitAngle + (i / mine.length) * TAU;
    orb.x = p.x + Math.cos(orb.angle) * o.radius; orb.z = p.z + Math.sin(orb.angle) * o.radius;
    orb.r = o.size ?? 0.5; orb.dmg = o.damage; orb.element = o.element; orb.spellId = spell.def.id; orb.vfx = o.vfx;
    orb.hitInterval = o.hitInterval ?? 0.45; orb.knock = o.knock ?? 0; orb.onHit = o.onHit; orb.orbitR = o.radius;
  }
}

/** Remove a spell's orbiters (on evolve / removal). */
export function clearOrbiters(run, spell) {
  for (const orb of spell.orbiters ?? []) orb.dead = true;
  spell.orbiters = [];
}

function updateOrbiters(run, dt) {
  const list = run.orbiters;
  for (let i = list.length - 1; i >= 0; i--) {
    const o = list[i];
    if (o.dead) { list[i] = list[list.length - 1]; list.pop(); continue; }
    for (const [id, t] of o.hits) { if (t - dt <= 0) o.hits.delete(id); else o.hits.set(id, t - dt); }
    run.grid.query(o.x, o.z, o.r, (e) => {
      if (o.hits.has(e.id)) return;
      o.hits.set(e.id, o.hitInterval);
      damageEnemy(run, e, o.dmg, { element: o.element, spellId: o.spellId, knock: o.knock, kx: run.player.x, kz: run.player.z });
      o.onHit?.(run, o, e);
    });
  }
}

/* ----------------------------------------------------------------- minions */

/**
 * Summoned ally. o: { x, z, ai: 'melee'|'ranged'|'flyer'|fn, speed, damage, radius, life, element, spellId, vfx,
 *   hitInterval, range, fireInterval, shot:{...spawnProjectile opts}, onUpdate(run,m,dt), data }
 * Built-in AIs: melee (hunt nearest), ranged (hover near player, shoot), flyer (strafing dives).
 */
export function spawnMinion(run, o) {
  const own = run.minions.filter((m) => m.spellId === o.spellId);
  if (run.minions.length >= SIM.maxMinions) {
    const victim = own[0] ?? run.minions[0];
    victim.dead = true;
  }
  const m = {
    id: run.nextId++, x: o.x, z: o.z, vx: 0, vz: 0, r: o.radius ?? 0.5, ai: o.ai ?? 'melee', speed: o.speed ?? 7, dmg: o.damage ?? 10,
    life: o.life ?? 20, element: o.element, spellId: o.spellId, vfx: o.vfx, hitInterval: o.hitInterval ?? 0.5, atkT: 0,
    range: o.range ?? 14, fireInterval: o.fireInterval ?? 1.2, shot: o.shot, onUpdate: o.onUpdate, data: o.data ?? {}, facing: 0,
    slot: o.slot ?? 0, slots: o.slots ?? 1, dead: false, phase: 0, knock: o.knock ?? 0, pierceDive: o.pierceDive ?? false, hits: new Map(),
  };
  run.minions.push(m);
  return m;
}

/** Keep exactly `count` minions of this spell alive (re-summon the missing ones). */
export function syncMinions(run, spell, count, make) {
  const mine = run.minions.filter((m) => m.spellId === spell.def.id && !m.dead);
  for (let i = mine.length; i < count; i++) make(i, count);
  let extra = mine.length - count;
  for (const m of mine) { if (extra-- > 0) m.dead = true; }
  const alive = run.minions.filter((m) => m.spellId === spell.def.id && !m.dead);
  alive.forEach((m, i) => { m.slot = i; m.slots = alive.length; });
}

function updateMinions(run, dt) {
  const list = run.minions;
  const pl = run.player;
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    m.life -= dt;
    if (m.life <= 0 || m.dead) { list[i] = list[list.length - 1]; list.pop(); continue; }
    m.atkT -= dt;
    for (const [id, t] of m.hits) { if (t - dt <= 0) m.hits.delete(id); else m.hits.set(id, t - dt); }
    if (typeof m.ai === 'function') m.ai(run, m, dt);
    else if (m.ai === 'melee') minionMelee(run, m, dt);
    else if (m.ai === 'ranged') minionRanged(run, m, dt, pl);
    else if (m.ai === 'flyer') minionFlyer(run, m, dt, pl);
    m.onUpdate?.(run, m, dt);
  }
}

function moveToward(m, tx, tz, speed, dt) {
  const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz);
  if (d < 0.01) return d;
  const k = Math.min(d, speed * dt) / d;
  m.x += dx * k; m.z += dz * k; m.facing = Math.atan2(dz, dx);
  return d;
}

function minionContact(run, m) {
  run.grid.query(m.x, m.z, m.r, (e) => {
    if (m.hits.has(e.id)) return;
    m.hits.set(e.id, m.hitInterval);
    damageEnemy(run, e, m.dmg, { element: m.element, spellId: m.spellId, knock: m.knock, kx: m.x, kz: m.z });
  });
}

function minionMelee(run, m, dt) {
  const pl = run.player;
  const t = run.grid.nearest(m.x, m.z, m.range, null);
  if (t) moveToward(m, t.x, t.z, m.speed, dt);
  else {
    const a = (m.slot / m.slots) * TAU + run.t * 0.6;
    moveToward(m, pl.x + Math.cos(a) * 2.2, pl.z + Math.sin(a) * 2.2, m.speed * 0.9, dt);
  }
  minionContact(run, m);
}

function minionRanged(run, m, dt, pl) {
  const a = (m.slot / m.slots) * TAU + run.t * 0.9;
  moveToward(m, pl.x + Math.cos(a) * 2.6, pl.z + Math.sin(a) * 2.6, m.speed, dt);
  if (m.atkT <= 0 && m.shot) {
    const t = run.grid.nearest(m.x, m.z, m.range);
    if (t) {
      m.atkT = m.fireInterval;
      spawnProjectile(run, { x: m.x, z: m.z, angle: angleTo(m.x, m.z, t.x, t.z), damage: m.dmg, element: m.element, spellId: m.spellId, vfx: m.vfx, ...m.shot });
    }
  }
}

// Flyer: circles the player, then dives through the nearest enemy and returns.
function minionFlyer(run, m, dt, pl) {
  if (m.phase === 0) {
    const a = (m.slot / m.slots) * TAU + run.t * 1.4;
    moveToward(m, pl.x + Math.cos(a) * 3.2, pl.z + Math.sin(a) * 3.2, m.speed, dt);
    if (m.atkT <= 0) {
      const t = run.grid.nearest(m.x, m.z, m.range);
      if (t) { m.phase = 1; m.data.tx = t.x; m.data.tz = t.z; m.data.dive = 0; }
    }
  } else {
    const d = moveToward(m, m.data.tx, m.data.tz, m.speed * 2.4, dt);
    minionContact(run, m);
    m.data.dive += dt;
    if (d < 0.4 || m.data.dive > 1.4) { m.phase = 0; m.atkT = m.fireInterval; }
  }
}

/* --------------------------------------------------- enemy projectiles (foe) */

/** o: { x, z, angle, speed, damage, radius, life, vfx, onUpdate } */
export function spawnEnemyProjectile(run, o) {
  if (run.eprojectiles.length >= SIM.maxEnemyProjectiles) return null;
  const p = {
    id: run.nextId++, x: o.x, z: o.z, angle: o.angle, speed: o.speed ?? 6, r: o.radius ?? 0.35, dmg: o.damage, life: o.life ?? 5,
    vfx: o.vfx ?? { shape: 'orb', color: '#ff4f9a', size: 0.5, glow: 1 }, onUpdate: o.onUpdate, accel: o.accel ?? 0, dead: false, data: o.data ?? null,
    turn: o.turn ?? 0,
  };
  run.eprojectiles.push(p);
  return p;
}

function updateEnemyProjectiles(run, dt) {
  const list = run.eprojectiles, pl = run.player;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life -= dt;
    if (p.accel) p.speed = Math.max(0, p.speed + p.accel * dt);
    if (p.turn) p.angle += p.turn * dt;
    p.x += Math.cos(p.angle) * p.speed * dt; p.z += Math.sin(p.angle) * p.speed * dt;
    p.onUpdate?.(run, p, dt);
    if (!p.dead && (p.x - pl.x) ** 2 + (p.z - pl.z) ** 2 < (p.r + pl.r) ** 2) {
      if (hurtPlayer(run, p.dmg * run.difficulty.damage, { invuln: PLAYER.invuln })) p.dead = true;
    }
    if (p.dead || p.life <= 0 || Math.hypot(p.x, p.z) > 90) { list[i] = list[list.length - 1]; list.pop(); }
  }
}

/* -------------------------------------------------------------------- gems */

function updateGems(run, dt) {
  const pl = run.player, list = run.gems;
  const pickup = pl.stats.pickupRadius;
  for (let i = list.length - 1; i >= 0; i--) {
    const g = list[i];
    const dx = pl.x - g.x, dz = pl.z - g.z, d = Math.hypot(dx, dz);
    if (!g.pulled && d < pickup) g.pulled = true;
    if (g.pulled) {
      g.speed = Math.min(40, (g.speed ?? PLAYER.magnetPull * 0.5) + 60 * dt);
      const k = Math.min(d, g.speed * dt) / (d || 1);
      g.x += dx * k; g.z += dz * k;
    }
    if (d < pl.r + 0.35) {
      list[i] = list[list.length - 1]; list.pop();
      run.hooks.gainXp(run, g.v);
      emit(run, { type: 'pickup', x: g.x, z: g.z, v: g.v });
    }
  }
}

/** Map a gem value to its visual/xp tier index (0..4). */
export function gemTier(v) {
  const t = XP.gemValues;
  let tier = 0;
  for (let i = 0; i < t.length; i++) if (v >= t[i]) tier = i;
  return tier;
}

export function updateEntities(run, dt) {
  updateProjectiles(run, dt);
  updateAreas(run, dt);
  updateStrikes(run, dt);
  updateOrbiters(run, dt);
  updateMinions(run, dt);
  updateEnemyProjectiles(run, dt);
  updateGems(run, dt);
  // Arcs are pure presentation events; the renderer owns their lifetime.
}

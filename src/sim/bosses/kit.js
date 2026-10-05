// Boss pattern toolkit. A boss brain composes these helpers; it never edits run internals directly.
//
// Brain contract (src/sim/bosses/<id>.js):  export default { init(run, boss), update(run, boss, dt, ctx) }
//   boss.data      free scratch space for the brain (set in init)
//   ctx = { tier: 0|1|2, enraged: bool, hpFrac: 0..1, dmgMult }   dmgMult = tier damage scaling (difficulty is applied on hit)
//   Pattern timers should use `boss.data.cd` style countdowns and the shared `ctx.rate` (<1 when enraged = faster).
import { BOSS_RULES } from '../../data/bosses.js';
import { ENEMY_BY_ID } from '../../data/enemies.js';
import { SIM, ARENA } from '../../data/config.js';
import { emit } from '../combat.js';
import { spawnEnemyProjectile } from '../entities.js';
import { spawnEnemy } from '../enemies.js';
import { spawnZone } from '../hazards.js';
import { angleTo, TAU } from '../math.js';

/** Marks the boss as casting for `seconds` (models read boss.casting to play a wind-up). ring()/fan()/blast() call it for you. */
export function markCast(b, seconds = 0.6) { b.casting = Math.max(b.casting ?? 0, seconds); }

export const toPlayer = (run, b) => angleTo(b.x, b.z, run.player.x, run.player.z);

export function moveToward(run, b, tx, tz, speed, dt) {
  const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz) || 1;
  const k = Math.min(d, speed * dt) / d;
  b.x += dx * k; b.z += dz * k; b.facing = Math.atan2(dz, dx);
  clampToArena(b);
  return d;
}

export function clampToArena(b, pad = 2) {
  const lim = ARENA.radius - pad, d = Math.hypot(b.x, b.z);
  if (d > lim) { b.x *= lim / d; b.z *= lim / d; }
}

/** Single enemy bullet. o: { angle, speed, damage, radius, life, accel, turn, vfx, from: {x,z} } */
export function bullet(run, b, o) {
  return spawnEnemyProjectile(run, {
    x: o.from?.x ?? b.x, z: o.from?.z ?? b.z, angle: o.angle, speed: o.speed ?? 6, damage: o.damage, radius: o.radius ?? 0.45,
    life: o.life ?? 7, accel: o.accel, turn: o.turn, vfx: o.vfx ?? { shape: 'orb', color: b.def.accent, size: 0.8, glow: 1.2 },
  });
}

/** Evenly spaced ring of bullets. o: { count, speed, damage, offset=0, ...bullet opts } */
export function ring(run, b, o) {
  for (let i = 0; i < o.count; i++) bullet(run, b, { ...o, angle: (o.offset ?? 0) + (i / o.count) * TAU });
  markCast(b);
  emit(run, { type: 'bossCast', x: b.x, z: b.z, kind: 'ring' });
}

/** Aimed fan. o: { count, spread (total arc, rad), speed, damage, ...bullet opts } */
export function fan(run, b, o) {
  const base = o.angle ?? toPlayer(run, b);
  for (let i = 0; i < o.count; i++) {
    const t = o.count === 1 ? 0 : i / (o.count - 1) - 0.5;
    bullet(run, b, { ...o, angle: base + t * o.spread });
  }
  markCast(b);
  emit(run, { type: 'bossCast', x: b.x, z: b.z, kind: 'fan' });
}

/** Telegraphed circular blast. o: { x, z, radius, warn, damage, color, element, kind } */
export function blast(run, o) {
  return spawnZone(run, { warn: 1.2, active: 0.4, owner: 'boss', ...o });
}

/** Lingering damage pool. o: { x, z, radius, life, damage, tick, slow, color, element, kind, warn } */
export function pool(run, o) {
  return spawnZone(run, { warn: 0.8, active: o.life ?? 6, oneShot: false, owner: 'boss', ...o, active: o.life ?? 6 });
}

/** Summon `count` adds of `defId` around the boss, bounded by BOSS_RULES.summonCap and the global cap. */
export function summon(run, b, defId, count, radius = 2.5) {
  const def = ENEMY_BY_ID[defId];
  let alive = 0;
  for (const e of run.enemies) if (e.summoner === b.id && !e.dead) alive++;
  const room = Math.min(count, BOSS_RULES.summonCap - alive, SIM.maxAlive - run.enemies.length);
  for (let i = 0; i < room; i++) {
    const a = (i / Math.max(1, room)) * TAU + run.rng();
    spawnEnemy(run, def, b.x + Math.cos(a) * radius, b.z + Math.sin(a) * radius, { summoner: b.id, hpMult: 0.7 });
  }
  if (room > 0) emit(run, { type: 'summon', x: b.x, z: b.z, boss: true });
  return room;
}

/** Cooldown helper: returns true (and rearms) when `key` elapsed. rate < 1 shortens cooldown (enrage). */
export function ready(b, key, dt, cooldown, rate = 1) {
  const d = b.data;
  d[key] = (d[key] ?? cooldown * 0.5) - dt;
  if (d[key] > 0) return false;
  d[key] = cooldown * rate;
  return true;
}

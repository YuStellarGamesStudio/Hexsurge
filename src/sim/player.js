// Player state, derived stats (base + mage + passives) and movement.
import { PLAYER, ARENA, COMBAT } from '../data/config.js';
import { PASSIVE_BY_ID, passiveValue } from '../data/passives.js';
import { clamp } from './math.js';
import { resolveObstacles } from './terrain.js';

export function createPlayer(mage) {
  const p = {
    x: 0, z: 0, vx: 0, vz: 0, facing: Math.PI / 2, moving: false,
    hp: PLAYER.baseHp, shield: 0, shieldRegenT: 0, invuln: 0, lastHurtT: -99,
    level: 1, xp: 0, xpNext: 0,
    dmgBuff: 1, hunger: { stacks: 0, t: 0 }, passiveT: 0,
    spellShield: {}, // spellId -> max shield granted by that spell (set by spell handlers, summed into shieldMax)
    stats: null, r: PLAYER.radius, mageId: mage.id,
  };
  return p;
}

/** Recompute derived stats; call whenever passives, mage or evolved set changes. */
export function recomputeStats(run) {
  const p = run.player, mage = run.mage;
  const s = {
    damage: 1, castSpeed: 1, area: 1, pickup: 1, moveSpeed: 1, luck: 0, maxHpMult: 1, shield: 0,
    xpGain: PLAYER.baseXpGain, cooldown: 0, count: 0, duration: 1, regen: 0,
    critChance: PLAYER.baseCritChance, critMult: PLAYER.baseCritMult,
  };
  const add = (stat, v) => {
    switch (stat) {
      case 'maxHp': s.maxHpMult += v; break;
      default: s[stat] = (s[stat] ?? 0) + v;
    }
  };
  for (const [stat, v] of Object.entries(mage.mods)) add(stat, v);
  for (const [id, level] of Object.entries(run.passives)) {
    const def = PASSIVE_BY_ID[id];
    add(def.stat, passiveValue(def, level));
    if (def.extra) for (const [k, v] of Object.entries(def.extra)) add(k, v * level);
  }
  s.maxHp = Math.round(PLAYER.baseHp * s.maxHpMult);
  s.cooldown = clamp(s.cooldown, 0, 0.6);
  s.critChance = clamp(s.critChance + s.luck * COMBAT.critLuckBonus, 0, 0.9);
  s.moveSpeedUnits = PLAYER.moveSpeed * s.moveSpeed;
  s.pickupRadius = PLAYER.pickupRadius * s.pickup;
  const prevMax = p.stats?.maxHp ?? s.maxHp;
  p.stats = s;
  if (s.maxHp > prevMax) p.hp += s.maxHp - prevMax; // gaining max HP also heals the gain
  p.hp = Math.min(p.hp, s.maxHp);
  const prevShield = p.shieldMax ?? 0;
  let spellShield = 0;
  for (const v of Object.values(p.spellShield)) spellShield += v;
  p.shieldMax = s.shield + spellShield;
  if (p.shieldMax > prevShield) p.shield += p.shieldMax - prevShield;
  p.shield = Math.min(p.shield, p.shieldMax);
}

/** move: { x, z } input vector, magnitude <= 1. */
export function updatePlayer(run, dt, move) {
  const p = run.player, s = p.stats;
  const len = Math.hypot(move.x, move.z);
  let mx = 0, mz = 0;
  if (len > 0.001) { const k = Math.min(1, len) / len; mx = move.x * k; mz = move.z * k; }
  p.moving = len > 0.001;
  const target = s.moveSpeedUnits * run.env.speedMult;
  const accel = run.map.accel ?? PLAYER.acceleration;
  const ax = mx * target - p.vx, az = mz * target - p.vz;
  const al = Math.hypot(ax, az);
  const maxStep = accel * dt;
  if (al > maxStep) { p.vx += (ax / al) * maxStep; p.vz += (az / al) * maxStep; } else { p.vx = mx * target; p.vz = mz * target; }
  // Hazards (wind, gravity wells) add an external velocity that is not subject to the input accel.
  p.x += (p.vx + (run.env.pushX ?? 0)) * dt;
  p.z += (p.vz + (run.env.pushZ ?? 0)) * dt;
  if (p.moving) p.facing = Math.atan2(mz, mx);
  resolveObstacles(run, p, p.r);
  const lim = ARENA.radius - ARENA.edgePad;
  const d = Math.hypot(p.x, p.z);
  if (d > lim) { p.x *= lim / d; p.z *= lim / d; }

  if (p.invuln > 0) p.invuln -= dt;
  if (s.regen > 0 && p.hp < s.maxHp) p.hp = Math.min(s.maxHp, p.hp + s.regen * dt);
  if (p.shieldMax > 0 && p.shield < p.shieldMax) {
    p.shieldRegenT += dt;
    if (p.shieldRegenT >= PLAYER.shieldRegenDelay) p.shield = Math.min(p.shieldMax, p.shield + p.shieldMax * PLAYER.shieldRegenRate * dt);
  }
}

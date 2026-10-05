// Damage pipeline: crit, synergy, reactions (R11), statuses, knockback, death & drops.
import { COMBAT, REACTION, STATUS, SCORE, XP } from '../data/config.js';
import { angleTo, TAU } from './math.js';
import { onEnemyKilled } from './magepassives.js';

export const ELEMENTS = Object.freeze(['fire', 'ice', 'thunder', 'arcane', 'nature', 'void']);

export function emit(run, event) { run.events.push(event); }

/** Mixed-element reaction power multiplier from the number of distinct elements held. */
export function reactionPower(run) { return run.reactionPower; }

function reactionChance(run, e) {
  const base = e.attuneT > 0 ? REACTION.attuneChance : REACTION.baseChance + run.player.stats.luck * REACTION.luckChance;
  return Math.min(1, base);
}

/** Duration scaling for a control status: attuned targets keep statuses longer, bosses resist. */
function statusTime(e, seconds) {
  let t = seconds;
  if (e.attuneT > 0) t *= 1 + REACTION.attune.statusBonus;
  if (e.boss) t *= STATUS.bossStatusScale;
  return t;
}

/**
 * Deal damage to an enemy.
 * src: { element, spellId, raw (skip player multipliers: for dot/reaction), noReact, noCrit, knock, kx, kz (origin),
 *        dot, mult, silent }
 * Returns the damage actually dealt.
 */
export function damageEnemy(run, e, base, src = {}) {
  if (e.dead || base <= 0) return 0;
  const stats = run.player.stats;
  const element = src.element;
  let mult = src.mult ?? 1;
  if (!src.raw) {
    mult *= stats.damage * run.player.dmgBuff;
    if (element) mult *= run.synergy[element] ?? 1;
    if (e.erodeT > 0) mult *= 1 + e.erodeAmp;
  }
  let crit = false;
  if (!src.raw && !src.noCrit && run.rng() < stats.critChance) { crit = true; mult *= stats.critMult; }

  const canReact = element && !src.noReact && !src.dot && e.reactCd <= 0;
  const power = run.reactionPower;
  let reacted = null;
  if (canReact) {
    // 融化 melt: ice -> fire. A frozen target takes amplified fire damage and thaws.
    if (element === 'fire' && e.freezeT > 0 && run.rng() < reactionChance(run, e)) {
      mult *= 1 + REACTION.melt.multiplier * power;
      e.freezeT = 0; e.chillHits = 0; reacted = 'melt';
    }
  }

  const amount = base * mult;
  e.hp -= amount;
  e.hitFlash = 0.12;
  run.stats.damage += amount;
  if (e.healBlock) e.healBlock = 0;
  if (src.knock && !e.boss && !e.def.knockImmune) {
    const a = src.kx !== undefined ? angleTo(src.kx, src.kz, e.x, e.z) : src.angle ?? 0;
    const k = src.knock / (e.def.mass ?? 1);
    e.kx += Math.cos(a) * k; e.kz += Math.sin(a) * k;
  }
  if (!src.silent) emit(run, { type: 'hit', x: e.x, z: e.z, amount, crit, element, dot: !!src.dot, id: e.id, boss: !!e.boss });

  if (element && !src.dot) applyElementStatus(run, e, element, amount, canReact, power, src);
  if (reacted) { e.reactCd = REACTION.cooldownPerEnemy; emit(run, { type: 'reaction', kind: reacted, x: e.x, z: e.z, id: e.id }); }

  if (e.hp <= 0) killEnemy(run, e, src);
  return amount;
}

function applyElementStatus(run, e, element, amount, canReact, power, src) {
  const chance = () => run.rng() < reactionChance(run, e);
  switch (element) {
    case 'fire': {
      e.burnT = statusTime(e, STATUS.burn.duration);
      e.burnDps = Math.max(e.burnDps, amount * STATUS.burn.dpsRatio);
      e.burnSrc = src.spellId;
      break;
    }
    case 'ice': {
      e.chillT = statusTime(e, STATUS.chill.duration);
      e.chillHits++;
      if (e.chillHits >= STATUS.chill.freezeHits && !e.boss) {
        e.chillHits = 0;
        e.freezeT = statusTime(e, STATUS.chill.freezeTime);
        emit(run, { type: 'freeze', x: e.x, z: e.z, id: e.id });
      }
      // 超導 superconduct: ice -> thunder-marked target conducts arcs to neighbours.
      if (canReact && e.shockT > 0 && chance()) {
        e.shockT = 0;
        conduct(run, e, amount * REACTION.superconduct.damageRatio * power, REACTION.superconduct.jumps + (power > 1.15 ? 1 : 0));
        e.reactCd = REACTION.cooldownPerEnemy;
        emit(run, { type: 'reaction', kind: 'superconduct', x: e.x, z: e.z, id: e.id });
      }
      break;
    }
    case 'thunder':
      e.shockT = statusTime(e, STATUS.shock.duration);
      break;
    case 'arcane':
      e.attuneT = REACTION.attune.duration;
      break;
    case 'void': {
      const er = REACTION.erosion;
      e.erodeT = statusTime(e, er.duration);
      e.erodeAmp = Math.min(er.maxAmp * power, e.erodeAmp + er.amp * power * 0.5);
      if (e.erodeAmp < er.amp * power) e.erodeAmp = er.amp * power;
      break;
    }
    case 'nature': {
      // 燃盡 burnout: fire -> nature stacks a damage-over-time on a burning target.
      if (canReact && e.burnT > 0 && chance()) {
        const b = REACTION.burnout;
        e.burnStacks = Math.min(b.maxStacks, e.burnStacks + Math.ceil(b.stacks * power));
        e.burnT = Math.max(e.burnT, statusTime(e, b.duration));
        e.burnDps = Math.max(e.burnDps, amount * 0.18);
        e.reactCd = REACTION.cooldownPerEnemy;
        emit(run, { type: 'reaction', kind: 'burnout', x: e.x, z: e.z, id: e.id });
      }
      break;
    }
    default: break;
  }
}

/** Arc damage from a target to the nearest neighbours (superconduct). */
function conduct(run, from, damage, jumps) {
  const hit = new Set([from.id]);
  let cur = from;
  const points = [[from.x, from.z]];
  for (let i = 0; i < jumps; i++) {
    const next = run.grid.nearest(cur.x, cur.z, REACTION.superconduct.range, (c) => !hit.has(c.id));
    if (!next) break;
    hit.add(next.id);
    points.push([next.x, next.z]);
    damageEnemy(run, next, damage, { element: 'thunder', raw: true, noReact: true, silent: false });
    cur = next;
  }
  if (points.length > 1) emit(run, { type: 'arc', points, element: 'thunder', ttl: 0.18 });
}

/** Damage-over-time ticks are applied by enemies.js via this helper. */
export function dotDamage(run, e, amount, element, spellId) {
  return damageEnemy(run, e, amount, { element, spellId, raw: true, noReact: true, dot: true, silent: true, noCrit: true });
}

export function killEnemy(run, e, src = {}) {
  if (e.dead) return;
  e.dead = true; e.hp = 0;
  run.kills++;
  run.stats.kills++;
  const elite = e.elite;
  run.hooks.addScore(run, elite ? SCORE.perEliteKill : SCORE.perKill, elite ? 'elites' : 'kills');
  emit(run, { type: 'kill', x: e.x, z: e.z, id: e.id, defId: e.def.id, elite, boss: !!e.boss, element: src.element, r: e.r });
  const xp = e.def.xp * (e.xpMult ?? 1);
  if (xp > 0 && !e.noDrop) dropGem(run, e.x, e.z, xp);
  run.hooks.enemyDied(run, e, src);
  onEnemyKilled(run, e, src);
  if (e.boss) run.hooks?.bossKilled?.(run, e);
}

export function dropGem(run, x, z, value) {
  if (run.gems.length >= XP.mergeThreshold) {
    // Consolidate: fold the oldest gem into a younger one so the field never floods.
    const old = run.gems.shift();
    if (old) value += old.v;
  }
  const a = run.rng() * TAU, d = run.rng() * 0.6;
  run.gems.push({ id: run.nextId++, x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, v: value, pulled: false });
}

export function healPlayer(run, amount) {
  const p = run.player;
  const before = p.hp;
  p.hp = Math.min(p.stats.maxHp, p.hp + amount);
  if (p.hp > before) emit(run, { type: 'heal', amount: p.hp - before });
}

/** Damage to the player. Returns true if it landed (not blocked by i-frames). */
export function hurtPlayer(run, amount, src = {}) {
  const p = run.player;
  if (p.god || (p.invuln > 0 && !src.ignoreInvuln)) return false;
  if (run.status !== 'running' && run.status !== 'won') return false;
  let dmg = amount;
  if (!src.ignoreShield && p.shield > 0) {
    const absorbed = Math.min(p.shield, dmg);
    p.shield -= absorbed; dmg -= absorbed;
    p.shieldRegenT = 0;
  }
  p.lastHurtT = run.t;
  p.invuln = src.invuln ?? 0;
  if (dmg > 0) {
    p.hp -= dmg;
    run.stats.damageTaken += dmg;
  }
  emit(run, { type: 'hurt', amount, x: p.x, z: p.z, shielded: dmg <= 0 });
  if (p.hp <= 0) { p.hp = 0; run.status = 'dead'; run.endReason = 'dead'; emit(run, { type: 'death', x: p.x, z: p.z }); }
  return true;
}

export { COMBAT };

// Boss lifecycle: warning -> spawn -> brain updates -> kill rewards / victory.
import { BOSS_BY_MAP, BOSS_RULES } from '../data/bosses.js';
import { ARENA, COMBAT, PLAYER, SCORE, TIMELINE } from '../data/config.js';
import { dropGem, emit, hurtPlayer } from './combat.js';
import { spawnEnemy } from './enemies.js';
import { BRAINS } from './bosses/index.js';
import { TAU } from './math.js';

/** Spawns boss #index (0,1,2 then endless repeats at tier 3). */
export function spawnBoss(run, index) {
  const bd = BOSS_BY_MAP[run.map.id];
  const tier = Math.min(2, index);
  const endlessN = Math.max(0, index - 2);
  const def = {
    id: bd.id, family: 'boss', tier: 3, hp: 1, speed: bd.speed, dmg: bd.contactDamage, radius: bd.radius, xp: 0,
    color: bd.color, accent: bd.accent, knockImmune: true, flying: false, mass: 99, name: bd.name,
  };
  const a = run.rng() * TAU;
  let x = run.player.x + Math.cos(a) * BOSS_RULES.spawnDistance, z = run.player.z + Math.sin(a) * BOSS_RULES.spawnDistance;
  const len = Math.hypot(x, z), lim = ARENA.radius - 3;
  if (len > lim) { x *= lim / len; z *= lim / len; }
  const e = spawnEnemy(run, def, x, z, {});
  run.seen.enemies.delete(def.id);
  run.seen.bosses.add(bd.id);
  const hp = bd.hp[tier] * run.difficulty.hp * (1 + 0.35 * endlessN);
  e.hp = e.maxHp = hp;
  e.boss = true; e.bossDef = bd; e.tier = tier; e.bossIndex = index; e.enraged = false; e.spawnT = run.t; e.data = {};
  e.dmg = bd.contactDamage * BOSS_RULES.tierDamage[tier];
  e.r = bd.radius;
  BRAINS[bd.id].init(run, e);
  run.bosses.push(e);
  run.boss = e;
  emit(run, { type: 'bossSpawn', id: e.id, bossId: bd.id, tier, x: e.x, z: e.z });
  return e;
}

export function updateBosses(run, dt) {
  const p = run.player;
  for (let i = run.bosses.length - 1; i >= 0; i--) {
    const e = run.bosses[i];
    if (e.dead) { run.bosses.splice(i, 1); continue; }
    if (e.casting > 0) e.casting -= dt;
    const hpFrac = e.hp / e.maxHp;
    if (!e.enraged && hpFrac <= e.bossDef.enrageAt) {
      e.enraged = true;
      emit(run, { type: 'bossEnrage', id: e.id, x: e.x, z: e.z });
    }
    BRAINS[e.bossDef.id].update(run, e, dt, { tier: e.tier, enraged: e.enraged, hpFrac, dmgMult: BOSS_RULES.tierDamage[e.tier] });
    if (e.freezeT > 0) e.freezeT = 0; // bosses are immune to freeze; status durations are also scaled in combat.js
    e.atkCd -= dt;
    const dx = p.x - e.x, dz = p.z - e.z, rr = e.r + p.r;
    if (dx * dx + dz * dz < rr * rr && e.atkCd <= 0) {
      if (hurtPlayer(run, e.dmg * run.difficulty.damage, { invuln: PLAYER.invuln })) e.atkCd = COMBAT.contactCooldown * 1.5;
    }
  }
  run.boss = run.bosses[0] ?? null;
}

/** Called by the director clock: fires the 8:00 / 14:00 / 18:00 bosses (+ endless repeats every 3 minutes). */
export function updateBossSchedule(run, dt) {
  const s = run.bossSchedule;
  const times = TIMELINE.bossTimes;
  let due = null;
  if (s.next < times.length) due = times[s.next];
  else if (run.endless) due = times[times.length - 1] + 180 * (s.next - times.length + 1);
  if (due === null) return;
  if (!s.warned && run.t >= due - TIMELINE.bossWarning) { s.warned = true; emit(run, { type: 'bossWarning', in: TIMELINE.bossWarning, index: s.next }); }
  if (run.t >= due) { spawnBoss(run, s.next); s.next++; s.warned = false; }
}

/** Hook: boss death. Rewards + victory on the final (18:00) boss. */
export function bossKilled(run, e) {
  run.stats.bossKills++;
  run.bossesKilled++;
  emit(run, { type: 'bossKill', id: e.id, bossId: e.bossDef.id, tier: e.tier, x: e.x, z: e.z, final: e.bossIndex === 2 });
  const xp = BOSS_RULES.xpDrop[e.tier];
  // Spread the reward over several gems so the pickup moment feels like a payout.
  for (let i = 0; i < 6; i++) dropGem(run, e.x, e.z, xp / 6);
  run.hooks.addScore(run, e.bossIndex === 2 ? SCORE.finalBossKill : SCORE.perBossKill);
  run.zones = run.zones.filter((z) => z.owner !== 'boss');
  run.eprojectiles.length = 0;
  for (const m of run.enemies) if (m.summoner === e.id && !m.dead) { m.hp = 0; m.noDrop = true; m.dead = true; }
  if (e.bossIndex === 2 && !run.won) {
    run.won = true; run.status = 'won'; run.endReason = 'won';
    emit(run, { type: 'victory' });
  }
}

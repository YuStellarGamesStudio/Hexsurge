// A run = one play session. Pure simulation: no DOM, no engine imports, deterministic given (seed, inputs).
// Presentation reads run.* each frame and drains run.events (see combat.js emit()).
import { ARENA, DIFFICULTY, SCORE, SIM, TIMELINE } from '../data/config.js';
import { MAGE_BY_ID } from '../data/mages.js';
import { MAP_BY_ID } from '../data/maps.js';
import { BASE_SPELLS } from '../data/spells/index.js';
import { updateBosses, updateBossSchedule, bossKilled } from './boss.js';
import { emit, killEnemy } from './combat.js';
import { updateEnemies, updateDirector, sweepDead, onEnemyDied } from './enemies.js';
import { updateEntities } from './entities.js';
import { updateHazards } from './hazards.js';
import { tickMagePassive } from './magepassives.js';
import { createPlayer, recomputeStats, updatePlayer } from './player.js';
import { addSpell, chooseUpgrade, gainXp, openLevelUp, recomputeSynergy, xpForLevel } from './progression.js';
import { createRng } from './rng.js';
import { Grid } from './spatial.js';
import { effectiveCooldown, HANDLERS, makeCtx } from './spells/index.js';
import { generateObstacles } from './terrain.js';

/**
 * opts: { mageId, mapId, difficulty (1..5), seed, unlockedSpells (iterable of base spell ids; default = all) }
 */
export function createRun(opts) {
  const mage = MAGE_BY_ID[opts.mageId];
  const map = MAP_BY_ID[opts.mapId];
  if (!mage || !map) throw new Error(`Unknown mage/map: ${opts.mageId}/${opts.mapId}`);
  const difficulty = DIFFICULTY[(opts.difficulty ?? 1) - 1];
  const seed = (opts.seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0;
  const run = {
    opts, seed, rng: createRng(seed), t: 0, status: 'running', endReason: null, won: false, endless: false, endlessStart: 0,
    mage, map, difficulty, mapId: map.id, mageId: mage.id,
    player: createPlayer(mage), passives: {}, spells: [], evolvedIds: new Set(),
    unlockedSpells: new Set(opts.unlockedSpells ?? BASE_SPELLS.map((s) => s.id)),
    synergy: {}, reactionPower: 1, elementCounts: {}, distinctElements: 0,
    enemies: [], projectiles: [], eprojectiles: [], areas: [], orbiters: [], minions: [], gems: [], strikes: [], zones: [],
    obstacles: [], bosses: [], boss: null, bossSchedule: { next: 0, warned: false }, bossesKilled: 0,
    grid: new Grid(), director: { credit: 0, eliteDone: false }, env: { pushX: 0, pushZ: 0, speedMult: 1, gust: null },
    hazardState: map.hazards.map(() => ({})),
    events: [], nextId: 1, rawScore: 0, score: 0, kills: 0, levelUp: null, pendingLevels: 0, chainDepth: 0,
    stats: { kills: 0, damage: 0, damageTaken: 0, bossKills: 0, maxLevel: 1, evolutions: 0 },
    seen: { enemies: new Set(), spells: new Set(), evolutions: new Set(), bosses: new Set() },
    hooks: null,
  };
  run.hooks = {
    gainXp, addScore, bossKilled, killEnemy,
    enemyDied: (r, e, src) => { onEnemyDied(r, e, src); },
  };
  run.obstacles = generateObstacles(createRng(seed ^ 0x9e3779b9), map, ARENA.radius);
  run.player.xpNext = xpForLevel(1);
  recomputeStats(run);
  run.player.hp = run.player.stats.maxHp;
  recomputeSynergy(run);
  addSpell(run, mage.startSpell);
  return run;
}

export function addScore(run, amount) {
  run.rawScore += amount * (run.endless ? TIMELINE.endlessScoreMult : 1);
  run.score = finalScore(run);
}

/** Final score = raw points x difficulty scale (data/config SCORE.difficultyScale). */
export function finalScore(run) {
  return Math.floor(run.rawScore * SCORE.difficultyScale[run.difficulty.id - 1]);
}

/** Advance the simulation by one fixed step. `input` = { x, z } movement vector (|v| <= 1). */
export function step(run, dt, input) {
  if (run.status !== 'running') return;
  run.t += dt;
  addScore(run, SCORE.perSecond * dt);

  updateHazards(run, dt);

  run.grid.clear();
  for (let i = 0; i < run.enemies.length; i++) if (!run.enemies[i].dead) run.grid.insert(run.enemies[i]);

  updatePlayer(run, dt, input);
  tickMagePassive(run, dt);
  updateSpells(run, dt);
  updateBossSchedule(run, dt);
  updateDirector(run, dt);
  updateEnemies(run, dt);
  updateBosses(run, dt);
  updateEntities(run, dt);
  sweepDead(run);

  if (run.status === 'running' && run.pendingLevels > 0) openLevelUp(run);
}

function updateSpells(run, dt) {
  for (const spell of run.spells) {
    const h = HANDLERS[spell.def.id];
    if (!h) continue;
    const ctx = makeCtx(run, spell);
    h.update?.(ctx, dt);
    if (h.cast && spell.def.base.cooldown !== undefined) {
      spell.cd -= dt;
      if (spell.cd <= 0) {
        const r = h.cast(ctx);
        if (r === false) spell.cd = 0.15; // no valid target: retry soon without burning the cooldown
        else {
          spell.cd = effectiveCooldown(run, spell);
          emit(run, { type: 'cast', spellId: spell.def.id, element: spell.def.element, x: run.player.x, z: run.player.z });
        }
      }
    }
  }
}

/** After the final boss: keep playing; score is doubled from here on (R21). */
export function continueEndless(run) {
  if (run.status !== 'won') return false;
  run.endless = true; run.endlessStart = run.t; run.status = 'running';
  return true;
}

/** Ends the run voluntarily (e.g. quit from pause or finish after victory). */
export function endRun(run, reason = 'quit') {
  if (run.status === 'dead') return;
  run.status = reason === 'won' ? 'won' : 'dead';
  run.endReason = run.endReason ?? reason;
}

export function getResult(run) {
  return {
    mageId: run.mageId, mapId: run.mapId, difficulty: run.difficulty.id, seed: run.seed,
    time: run.t, score: finalScore(run), kills: run.stats.kills, level: run.player.level, bossKills: run.stats.bossKills,
    evolutions: run.stats.evolutions, won: run.won, endless: run.endless, reason: run.endReason,
    spells: run.spells.map((s) => ({ id: s.def.id, level: s.level, evolved: s.evolved })),
    passives: { ...run.passives }, damage: Math.round(run.stats.damage),
  };
}

export { chooseUpgrade, SIM };

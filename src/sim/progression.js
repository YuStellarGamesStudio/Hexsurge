// XP curve, level-up three-pick, spells/passives acquisition and evolution (R10), synergy bookkeeping (R11).
import { PLAYER, SIM, XP, SCORE } from '../data/config.js';
import { PASSIVES, PASSIVE_BY_ID } from '../data/passives.js';
import { BASE_SPELLS, MAX_SPELL_LEVEL, SPELL_BY_ID } from '../data/spells/index.js';
import { SYNERGY } from '../data/config.js';
import { emit, healPlayer } from './combat.js';
import { recomputeStats } from './player.js';
import { onPlayerLevelUp } from './magepassives.js';
import { HANDLERS, makeCtx } from './spells/index.js';
import { ELEMENTS } from './combat.js';

export function xpForLevel(level) {
  return Math.round(XP.firstLevel * XP.growth ** (level - 1) + XP.linear * (level - 1));
}

export function addSpell(run, id) {
  const def = SPELL_BY_ID[id];
  const spell = { def, level: 1, cd: 0.25, evolved: false, orbiters: null, s: null, sLevel: -1, sDef: null, ctx: null, data: {} };
  run.spells.push(spell);
  run.seen.spells.add(id);
  HANDLERS[id]?.init?.(makeCtx(run, spell));
  recomputeSynergy(run);
  return spell;
}

export function spellOwned(run, id) { return run.spells.find((s) => s.def.id === id); }

/** Counts spells per element (evolved forms count) and derives the pure-set and mixed bonuses. */
export function recomputeSynergy(run) {
  const counts = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  for (const s of run.spells) counts[s.def.element]++;
  run.elementCounts = counts;
  let distinct = 0;
  for (const e of ELEMENTS) {
    let bonus = 0;
    for (const [n, v] of Object.entries(SYNERGY.pure)) if (counts[e] >= Number(n)) bonus = v;
    run.synergy[e] = 1 + bonus;
    if (counts[e] > 0) distinct++;
  }
  let power = 1;
  for (const [n, v] of Object.entries(SYNERGY.mixedPower)) if (distinct >= Number(n)) power = 1 + v;
  run.reactionPower = power;
  run.distinctElements = distinct;
}

/** Spells whose evolution prerequisites are met right now. */
export function evolutionReady(run) {
  if (run.spells.filter((s) => s.evolved).length >= SIM.maxEvolved) return [];
  return run.spells.filter((s) => {
    if (s.evolved || s.level < MAX_SPELL_LEVEL || !s.def.evolution) return false;
    return (run.passives[s.def.evolution.passive] ?? 0) >= s.def.evolution.level;
  });
}

export function evolveSpell(run, spell) {
  const evo = SPELL_BY_ID[spell.def.evolution.id];
  HANDLERS[spell.def.id]?.dispose?.(makeCtx(run, spell));
  const from = spell.def.id;
  spell.def = evo; spell.evolved = true; spell.level = MAX_SPELL_LEVEL; spell.sLevel = -1; spell.cd = 0.2;
  spell.orbiters?.forEach((o) => { o.dead = true; });
  spell.orbiters = null; spell.data = {};
  HANDLERS[evo.id]?.init?.(makeCtx(run, spell));
  run.stats.evolutions++;
  run.seen.evolutions.add(evo.id);
  run.evolvedIds.add(evo.id);
  recomputeSynergy(run);
  emit(run, { type: 'evolve', from, to: evo.id, element: evo.element });
}

/* ----------------------------------------------------------------------- xp */

export function gainXp(run, value) {
  const p = run.player;
  p.xp += value * p.stats.xpGain;
  while (p.xp >= p.xpNext && p.level < XP.maxLevel) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = xpForLevel(p.level);
    run.pendingLevels++;
    healPlayer(run, p.stats.maxHp * PLAYER.levelUpHeal);
    run.stats.maxLevel = p.level;
    run.hooks.addScore(run, SCORE.levelBonus, 'levels');
    onPlayerLevelUp(run);
  }
  if (p.level >= XP.maxLevel) p.xp = Math.min(p.xp, p.xpNext - 1);
}

/* ------------------------------------------------------------------ choices */

function candidateChoices(run) {
  const out = [];
  const spells = run.spells;
  const slotsFree = spells.length < SIM.spellSlots;
  const passiveSlotsFree = Object.keys(run.passives).length < SIM.passiveSlots;
  // Which passives would unlock an evolution for a nearly-maxed spell (guide the player, never punish).
  const wanted = new Map();
  for (const s of spells) {
    const evo = s.def.evolution;
    if (!evo || s.evolved) continue;
    const have = run.passives[evo.passive] ?? 0;
    if (have < evo.level) wanted.set(evo.passive, Math.max(wanted.get(evo.passive) ?? 0, s.level >= 5 ? 3 : 1.6));
  }
  for (const s of spells) {
    if (s.evolved || s.level >= MAX_SPELL_LEVEL) continue;
    out.push({ kind: 'spell_up', id: s.def.id, level: s.level + 1, weight: 3 + s.level * 0.25 });
  }
  if (slotsFree) {
    for (const def of BASE_SPELLS) {
      if (!run.unlockedSpells.has(def.id) || spellOwned(run, def.id)) continue;
      out.push({ kind: 'spell_new', id: def.id, level: 1, weight: 1.6 });
    }
  }
  for (const def of PASSIVES) {
    const have = run.passives[def.id] ?? 0;
    const boost = wanted.get(def.id) ?? 1;
    if (have > 0 && have < def.maxLevel) out.push({ kind: 'passive_up', id: def.id, level: have + 1, weight: 1.7 * boost });
    else if (have === 0 && passiveSlotsFree) out.push({ kind: 'passive_new', id: def.id, level: 1, weight: 1.1 * boost });
  }
  return out;
}

export function generateChoices(run) {
  const choices = [];
  const ready = evolutionReady(run);
  for (const s of ready.slice(0, 2)) choices.push({ kind: 'evolve', id: s.def.id, into: s.def.evolution.id, level: MAX_SPELL_LEVEL });
  const pool = candidateChoices(run);
  const want = XP.levelUpChoices + (run.rng() < run.player.stats.luck * XP.luckExtraChoiceChance ? 1 : 0);
  while (choices.length < want && pool.length) {
    const pick = run.rng.weighted(pool.map((c) => [c, c.weight]));
    pool.splice(pool.indexOf(pick), 1);
    choices.push({ kind: pick.kind, id: pick.id, level: pick.level });
  }
  // Pool exhausted: offer recovery cards so the 3-pick never shows a blank.
  const fallbacks = [{ kind: 'heal', id: 'heal', level: 0 }, { kind: 'score', id: 'score', level: 0 }];
  for (const f of fallbacks) if (choices.length < want) choices.push({ ...f });
  return choices;
}

export function openLevelUp(run) {
  run.levelUp = { choices: generateChoices(run) };
  run.status = 'levelup';
  emit(run, { type: 'levelup', level: run.player.level });
}

export function applyChoice(run, choice) {
  switch (choice.kind) {
    case 'spell_new': addSpell(run, choice.id); break;
    case 'spell_up': {
      const s = spellOwned(run, choice.id);
      s.level = choice.level; s.sLevel = -1;
      HANDLERS[choice.id]?.levelChanged?.(makeCtx(run, s));
      break;
    }
    case 'passive_new':
    case 'passive_up':
      run.passives[choice.id] = choice.level;
      recomputeStats(run);
      break;
    case 'evolve': evolveSpell(run, spellOwned(run, choice.id)); break;
    case 'heal': healPlayer(run, run.player.stats.maxHp * 0.35); break;
    case 'score': run.hooks.addScore(run, 400, 'bonus'); break;
    default: throw new Error(`Unknown choice kind ${choice.kind}`);
  }
  emit(run, { type: 'upgrade', choice });
}

/** UI entry: pick card `index` of the open level-up. */
export function chooseUpgrade(run, index) {
  if (run.status !== 'levelup' || !run.levelUp) return false;
  const choice = run.levelUp.choices[index];
  if (!choice) return false;
  applyChoice(run, choice);
  run.levelUp = null;
  run.pendingLevels--;
  if (run.pendingLevels > 0) openLevelUp(run); else run.status = 'running';
  return true;
}

export { PASSIVE_BY_ID };

// Spell database: 18 base spells (3 per element, all 7 types) + 18 evolved forms (R10).
// Per-element files own both numbers (here, in src/data/spells/<element>.js) and behaviour (src/sim/spells/<element>.js).
//
// Spell def shape:
//   { id, element, type, icon?, name{zh,en,ja}, desc{zh,en,ja},
//     base: { cooldown, damage, count, radius, speed, duration, ... any numeric param the handler reads },
//     perLevel: [ 7 delta objects: level 2..8, cumulative; each level raises TWO of damage / count / frequency (cooldown) ],
//     evolution: { id, passive, level },        // base spells only
//     evolvedFrom: '<baseId>',                  // evolved forms only (no perLevel; `base` is the final stat block)
//     vfx: { shape, color, size, glow, trail } }
import { FIRE_SPELLS } from './fire.js';
import { ICE_SPELLS } from './ice.js';
import { THUNDER_SPELLS } from './thunder.js';
import { ARCANE_SPELLS } from './arcane.js';
import { NATURE_SPELLS } from './nature.js';
import { VOID_SPELLS } from './void.js';

export const SPELLS = Object.freeze([
  ...FIRE_SPELLS, ...ICE_SPELLS, ...THUNDER_SPELLS, ...ARCANE_SPELLS, ...NATURE_SPELLS, ...VOID_SPELLS,
]);
export const SPELL_BY_ID = Object.freeze(Object.fromEntries(SPELLS.map((s) => [s.id, s])));
export const BASE_SPELLS = Object.freeze(SPELLS.filter((s) => !s.evolvedFrom));
export const EVOLVED_SPELLS = Object.freeze(SPELLS.filter((s) => s.evolvedFrom));
export const SPELL_TYPES = Object.freeze(['projectile', 'chain', 'area', 'burst', 'orbit', 'summon', 'aura']);
export const MAX_SPELL_LEVEL = 8;

/** Numeric stat block for a spell at a level (1..8). Evolved spells ignore level. */
export function spellStats(def, level) {
  const s = { ...def.base };
  if (def.perLevel) {
    const n = Math.min(level, MAX_SPELL_LEVEL) - 1;
    for (let i = 0; i < n; i++) for (const [k, v] of Object.entries(def.perLevel[i] ?? {})) s[k] = (s[k] ?? 0) + v;
  }
  return s;
}

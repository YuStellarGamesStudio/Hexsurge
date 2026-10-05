// Placeholder meta layer (replaced by the meta pass): see data/unlocks.js for the rules.
import { INITIAL } from '../data/unlocks.js';

export function unlockedSpells(data) { return [...new Set([...INITIAL.spells, ...data.unlocks.spells])]; }
export function recordRun() { return { newUnlocks: [], rank: null }; }

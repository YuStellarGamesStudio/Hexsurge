// Meta progression (R6): unlock-type only. Conditions are evaluated against save.stats after every run (src/meta/unlocks.js).
// kinds: runs | kills | bossKill (n total, or `map` = that map's boss) | evolve | wins  -> lifetime totals
//        level | survive | score                                                          -> best single run
// Unlocking a mage also unlocks its starting spell.
export const INITIAL = Object.freeze({
  mages: ['ignis'],
  maps: ['academy'],
  spells: ['fireball', 'chain_lightning', 'thorn_field', 'frost_nova', 'arcane_orbs', 'spirit_wolf', 'mana_barrier'],
  difficulty: 1,
});

export const SPELL_UNLOCKS = Object.freeze({
  ember_field: { kind: 'runs', n: 3 },
  flame_wheel: { kind: 'kills', n: 600 },
  glacial_ward: { kind: 'survive', n: 420 },
  thunderstrike: { kind: 'level', n: 12 },
  thunder_hawk: { kind: 'kills', n: 1500 },
  razor_leaf: { kind: 'evolve', n: 1 },
  shadow_familiar: { kind: 'evolve', n: 2 },
  entropy_aura: { kind: 'bossKill', n: 2 },
  // ice_lance / arcane_missiles / void_rift come with their mages.
});

export const DIFFICULTY_RULE = Object.freeze({ unlockBy: 'win' }); // clearing difficulty N (final boss) unlocks N+1

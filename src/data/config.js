// Global tuning. Every gameplay number lives under src/data/ (DESIGN.md mirrors this folder).
// Units: distance in world units (1 unit ~ one player diameter), time in seconds, angle in radians.

export const SIM = Object.freeze({
  step: 1 / 60,              // fixed simulation step
  maxStepsPerFrame: 5,       // catch-up cap (spiral-of-death guard)
  maxAlive: 60,              // hard guardrail: simultaneous enemies (§3.7)
  targetAliveMin: 30,        // design band for simultaneous enemies at density x1
  targetAliveMax: 50,
  maxProjectiles: 220,
  maxEnemyProjectiles: 160,
  maxGems: 160,
  maxMinions: 12,
  maxEvolved: 6,             // concurrent evolved spells (guardrail <= 8)
  spellSlots: 6,
  passiveSlots: 6,
  gridCell: 4,               // spatial hash cell size
});

export const ARENA = Object.freeze({
  radius: 44,                // circular arena radius
  edgePad: 0.8,              // player keeps this far from the rim
  spawnMin: 18,              // enemy ring spawn distance from player (just off-screen)
  spawnMax: 24,
});

export const TIMELINE = Object.freeze({
  runLength: 1080,           // 18:00 final boss time (s)
  bossTimes: [480, 840, 1080], // 8:00 / 14:00 / 18:00
  eliteWaveTime: 300,        // 5:00 elite wave
  bossWarning: 6,            // seconds of "boss incoming" warning before spawn
  bossCountdownShow: 90,     // HUD shows boss countdown within this many seconds
  bossFightMin: 45, bossFightMax: 180, // guardrail on boss fight length (s)
  endlessScoreMult: 2,       // R21: endless mode doubles score
  endlessDensityPerMin: 0.06, // extra density per minute past 18:00
  endlessHpPerMin: 0.08,
});

export const PLAYER = Object.freeze({
  baseHp: 100,
  heartHp: 10,               // 1 HUD heart = 10 hp
  moveSpeed: 5.4,
  radius: 0.5,
  pickupRadius: 2.4,
  magnetPull: 14,            // gem pull speed once inside pickup radius
  invuln: 0.45,              // i-frames after taking contact damage
  shieldRegenDelay: 4,
  shieldRegenRate: 0.25,     // fraction of max shield per second after delay
  acceleration: 60,          // units/s^2 (maps may override for ice)
  baseCritChance: 0.05,
  baseCritMult: 1.6,
  baseXpGain: 1,
});

export const XP = Object.freeze({
  firstLevel: 12,            // xp needed for level 1 -> 2
  growth: 1.155,             // exponential growth per level
  linear: 3,                 // flat add per level
  gemValues: [1, 3, 8, 20, 60], // tiers; renderer colours by tier
  mergeThreshold: 120,       // merge gems when this many exist
  maxLevel: 60,
  levelUpChoices: 3,
  luckExtraChoiceChance: 0.04, // per luck point (a 4th card)
});

export const COMBAT = Object.freeze({
  contactCooldown: 0.7,      // per-enemy melee cooldown (s)
  knockbackDecay: 9,
  damagePopupMin: 1,
  enemyDespawnDistance: 60,
  critLuckBonus: 0.02,       // crit chance per luck point
  bossResist: 0.0,
});

// R11 dual-track: pure-element set bonus and elemental reactions.
export const SYNERGY = Object.freeze({
  // Same-element spell count (evolved forms count) -> damage multiplier for that element.
  pure: Object.freeze({ 2: 0.12, 3: 0.26 }),
  // Distinct elements held (>=) -> reaction power multiplier (mixed-element bonus).
  mixedPower: Object.freeze({ 3: 0.1, 4: 0.2 }),
});

export const REACTION = Object.freeze({
  baseChance: 0.55,          // trigger chance per qualifying hit
  attuneChance: 1.0,         // chance when the target is attuned (arcane)
  luckChance: 0.015,         // per luck point
  cooldownPerEnemy: 0.35,    // an enemy cannot react more often than this (s)
  melt: Object.freeze({ ice: 'fire', multiplier: 0.9 }),         // frozen target: fire hit +90% (consumes freeze)
  burnout: Object.freeze({ fire: 'nature', stacks: 2, maxStacks: 8, dpsPerStack: 0.22, duration: 4 }),
  superconduct: Object.freeze({ shock: 'ice', jumps: 3, range: 6, damageRatio: 0.55 }),
  erosion: Object.freeze({ amp: 0.18, maxAmp: 0.36, duration: 5 }),   // void hit: target takes more from everything
  attune: Object.freeze({ duration: 4, statusBonus: 0.3 }),            // arcane: status durations +30%
});

export const STATUS = Object.freeze({
  burn: Object.freeze({ duration: 3, dpsRatio: 0.35, tick: 0.5 }),   // dot dps = ratio * hit damage
  chill: Object.freeze({ duration: 2.2, slow: 0.35, freezeHits: 4, freezeTime: 1.4 }),
  shock: Object.freeze({ duration: 3 }),
  slowFloor: 0.25,           // slow never reduces speed below this fraction
  bossStatusScale: 0.35,     // bosses take reduced control durations
});

export const SCORE = Object.freeze({
  perSecond: 2,              // survival base
  perKill: 1,
  perEliteKill: 25,
  perBossKill: 1500,
  finalBossKill: 6000,
  levelBonus: 10,
  difficultyScale: Object.freeze([1, 1.25, 1.55, 1.9, 2.4]),
  leaderboardSize: 20,
});

export const DIFFICULTY = Object.freeze([
  // hp / speed / density multipliers, and how much earlier special enemies debut (s)
  Object.freeze({ id: 1, hp: 1.0, speed: 1.0, density: 1.0, damage: 1.0, earlySpecial: 0 }),
  Object.freeze({ id: 2, hp: 1.35, speed: 1.07, density: 1.25, damage: 1.1, earlySpecial: 45 }),
  Object.freeze({ id: 3, hp: 1.8, speed: 1.14, density: 1.5, damage: 1.2, earlySpecial: 90 }),
  Object.freeze({ id: 4, hp: 2.4, speed: 1.22, density: 1.75, damage: 1.35, earlySpecial: 150 }),
  Object.freeze({ id: 5, hp: 3.0, speed: 1.3, density: 2.0, damage: 1.5, earlySpecial: 210 }),
]);

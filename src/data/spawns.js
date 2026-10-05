// Spawn director tables (§3.9, R12). Time in seconds. Keyframes are [t, value], linearly interpolated.
// Difficulty reorders the table by shifting non-swarm families earlier (DIFFICULTY[n].earlySpecial seconds).

/** Family weights over time. 0-3min = swarm period, 3-8 = swarming (+elite wave at 5:00), 8-14 = mixed, 14-18 = final stand. */
export const FAMILY_SCHEDULE = Object.freeze({
  swarm:    [[0, 100], [180, 70], [300, 50], [480, 32], [840, 26], [1080, 24]],
  fast:     [[0, 0], [75, 0], [76, 6], [180, 16], [480, 20], [840, 22], [1080, 22]],
  tank:     [[0, 0], [215, 0], [240, 6], [480, 18], [840, 22], [1080, 22]],
  ranged:   [[0, 0], [335, 0], [360, 6], [480, 16], [840, 18], [1080, 18]],
  split:    [[0, 0], [435, 0], [480, 5], [840, 12], [1080, 12]],
  exploder: [[0, 0], [495, 0], [540, 6], [840, 12], [1080, 12]],
  flyer:    [[0, 0], [465, 0], [500, 6], [840, 14], [1080, 14]],
  buffer:   [[0, 0], [570, 0], [600, 4], [840, 9], [1080, 9]],
  healer:   [[0, 0], [590, 0], [630, 3], [840, 8], [1080, 8]],
  summoner: [[0, 0], [620, 0], [660, 3], [840, 7], [1080, 7]],
});

/** Desired simultaneous enemies at density x1 (design band 30-50 once the run is rolling). */
export const DENSITY = Object.freeze([[0, 12], [60, 16], [180, 26], [300, 34], [480, 38], [840, 46], [1080, 50]]);

/** Extra multiplier on the 14:00-18:00 final stand ("密度倍增"), eased in from 14:00. */
export const FINAL_STAND = Object.freeze({ from: 840, to: 900, mult: 1.35 });

/** Chance of variant tier [1,2,3] over time. */
export const TIER_ODDS = Object.freeze([
  [0, [1, 0, 0]], [240, [0.85, 0.15, 0]], [480, [0.55, 0.4, 0.05]], [840, [0.25, 0.45, 0.3]], [1080, [0.1, 0.35, 0.55]],
]);

/** Enemy hp multiplier from elapsed time: 1 + perMinute * minutes. */
export const HP_GROWTH = Object.freeze({ perMinute: 0.09 });

/** Spawn grouping: how many bodies one spawn event brings per family. */
export const GROUPS = Object.freeze({
  swarm: [3, 6], fast: [2, 4], tank: [1, 2], ranged: [1, 2], split: [1, 2], exploder: [2, 3], flyer: [2, 4],
  buffer: [1, 1], healer: [1, 1], summoner: [1, 1],
});

export const SPAWN = Object.freeze({
  perSecond: 7,                // max bodies spawned per second while below target
  groupRadius: 2.2,            // cluster radius of one group
  eliteWave: Object.freeze({ count: 7, hpMult: 4.5, dmgMult: 1.3, sizeMult: 1.45, xpMult: 6 }),
  bossReduce: 0.55,            // regular density multiplier while a boss is alive
});

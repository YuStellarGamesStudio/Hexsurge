// Seeded PRNG (mulberry32). Simulation code must use run.rng, never Math.random, so runs replay exactly.
export function createRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = next;
  rng.range = (lo, hi) => lo + (hi - lo) * next();
  rng.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  rng.chance = (p) => next() < p;
  rng.pick = (list) => list[Math.floor(next() * list.length)];
  rng.angle = () => next() * Math.PI * 2;
  /** Weighted pick from [[item, weight], ...]; returns undefined when all weights are 0. */
  rng.weighted = (entries) => {
    let total = 0;
    for (const e of entries) total += e[1];
    if (total <= 0) return undefined;
    let r = next() * total;
    for (const e of entries) { r -= e[1]; if (r <= 0) return e[0]; }
    return entries[entries.length - 1][0];
  };
  return rng;
}

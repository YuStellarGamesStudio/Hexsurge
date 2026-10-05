// Static circular obstacles (pillars, trees, boulders). Ground units and the player collide; fliers do not.
export function resolveObstacles(run, body, radius) {
  const list = run.obstacles;
  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    const dx = body.x - o.x, dz = body.z - o.z;
    const min = o.r + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 0.001;
      body.x = o.x + (dx / d) * min;
      body.z = o.z + (dz / d) * min;
    }
  }
}

/** Deterministic obstacle layout: rings of props away from the spawn centre. */
export function generateObstacles(rng, map, arenaRadius) {
  const out = [];
  const count = map.obstacleCount ?? 14;
  const [rMin, rMax] = map.obstacleRadius ?? [0.9, 1.7];
  let guard = 0;
  while (out.length < count && guard++ < 400) {
    const a = rng() * Math.PI * 2;
    const d = 8 + rng() * (arenaRadius - 12);
    const r = rMin + rng() * (rMax - rMin);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r + 3.2)) continue;
    out.push({ x, z, r, kind: map.obstacleKinds?.[Math.floor(rng() * map.obstacleKinds.length)] ?? 'rock', seed: rng() });
  }
  return out;
}

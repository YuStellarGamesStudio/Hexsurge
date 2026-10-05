// Map hazards (R15) and generic telegraphed zones (also used by bosses).
// A zone first shows a telegraph (`warn` seconds), then becomes active. Visuals: renderer reads run.zones.
import { ARENA, PLAYER } from '../data/config.js';
import { emit, hurtPlayer } from './combat.js';
import { TAU } from './math.js';

const HAZARD_INVULN = PLAYER.invuln * 0.6;

/**
 * o: { x, z, radius, warn=1.2, active=0.4, damage, oneShot=true, tick=0.5, kind, color, element, pull=0, slow=0 (0..1 speed loss),
 *      driftToPlayer=0 (units/s), pullEnemies=false, hurtEnemies=0, owner='map'|'boss', life? }
 */
export function spawnZone(run, o) {
  const z = {
    id: run.nextId++, kind: o.kind ?? 'zone', x: o.x, z: o.z, r: o.radius, warn: o.warn ?? 1.2, warnMax: o.warn ?? 1.2,
    active: o.active ?? 0.4, activeMax: o.active ?? 0.4, dmg: o.damage ?? 0, oneShot: o.oneShot ?? true, tick: o.tick ?? 0.5, tickT: 0,
    color: o.color ?? '#ff4f6a', element: o.element, pull: o.pull ?? 0, slow: o.slow ?? 0, drift: o.driftToPlayer ?? 0,
    pullEnemies: !!o.pullEnemies, coreRadius: o.coreRadius ?? 0, owner: o.owner ?? 'map', fired: false, data: o.data ?? null,
  };
  run.zones.push(z);
  return z;
}

function inside(z, p, extra = 0) { return (p.x - z.x) ** 2 + (p.z - z.z) ** 2 <= (z.r + p.r + extra) ** 2; }

export function updateZones(run, dt) {
  const p = run.player;
  const list = run.zones;
  for (let i = list.length - 1; i >= 0; i--) {
    const z = list[i];
    if (z.warn > 0) { z.warn -= dt; continue; }
    if (z.drift) {
      const dx = p.x - z.x, dz = p.z - z.z, d = Math.hypot(dx, dz) || 1;
      z.x += (dx / d) * z.drift * dt; z.z += (dz / d) * z.drift * dt;
    }
    z.active -= dt;
    if (z.oneShot) {
      if (!z.fired) {
        z.fired = true;
        emit(run, { type: 'burst', x: z.x, z: z.z, r: z.r, element: z.element ?? 'fire', kind: 'hazard' });
        if (z.dmg > 0 && inside(z, p)) hurtPlayer(run, z.dmg * run.difficulty.damage, { invuln: HAZARD_INVULN });
      }
    } else {
      z.tickT -= dt;
      if (z.tickT <= 0) {
        z.tickT += z.tick;
        const hit = z.coreRadius ? inside({ x: z.x, z: z.z, r: z.coreRadius }, p) : inside(z, p);
        if (z.dmg > 0 && hit) hurtPlayer(run, z.dmg * run.difficulty.damage, { invuln: HAZARD_INVULN });
      }
    }
    if (inside(z, p)) {
      if (z.slow) run.env.speedMult = Math.min(run.env.speedMult, 1 - z.slow);
      if (z.pull) {
        const dx = z.x - p.x, dz = z.z - p.z, d = Math.hypot(dx, dz) || 1;
        run.env.pushX += (dx / d) * z.pull; run.env.pushZ += (dz / d) * z.pull;
      }
    }
    if (z.pull && z.pullEnemies) run.grid.query(z.x, z.z, z.r, (e) => {
      if (e.boss) return;
      const dx = z.x - e.x, dz = z.z - e.z, d = Math.hypot(dx, dz) || 1;
      e.x += (dx / d) * z.pull * 0.6 * dt; e.z += (dz / d) * z.pull * 0.6 * dt;
    });
    if (z.active <= 0) { list[i] = list[list.length - 1]; list.pop(); }
  }
}

function randomNear(run, minD, maxD) {
  const p = run.player;
  const a = run.rng() * TAU, d = minD + run.rng() * (maxD - minD);
  let x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
  const lim = ARENA.radius - 2, len = Math.hypot(x, z);
  if (len > lim) { x *= lim / len; z *= lim / len; }
  return { x, z };
}

// Each kind: (run, cfg, dt, state) called every step; state is per-hazard persistent scratch.
const KINDS = {
  rune_pylon(run, c, dt, s) {
    s.t = (s.t ?? c.every * 0.5) - dt;
    if (s.t > 0) return;
    s.t = c.every;
    for (let i = 0; i < c.count; i++) {
      const pos = randomNear(run, 3, 12);
      spawnZone(run, { ...pos, radius: c.radius, warn: c.warn, active: c.active, damage: c.damage, kind: 'rune_pylon', color: '#7a86ff', element: 'arcane' });
    }
  },
  spore_cloud(run, c, dt, s) {
    s.t = (s.t ?? c.every * 0.5) - dt;
    if (s.t > 0) return;
    s.t = c.every;
    for (let i = 0; i < c.count; i++) {
      const pos = randomNear(run, 7, 17);
      spawnZone(run, { ...pos, radius: c.radius, warn: 0.8, active: c.life, damage: c.damage, oneShot: false, tick: c.tick, kind: 'spore_cloud',
        color: '#58f0d0', element: 'nature', driftToPlayer: c.drift, slow: 0.22 });
    }
  },
  blizzard(run, c, dt, s) {
    s.t = (s.t ?? c.every * 0.6) - dt;
    if (s.phase === 'warn') {
      if (s.t <= 0) { s.phase = 'gust'; s.t = c.duration; emit(run, { type: 'blizzard', dir: s.angle, on: true }); }
      return;
    }
    if (s.phase === 'gust') {
      run.env.pushX += Math.cos(s.angle) * c.force; run.env.pushZ += Math.sin(s.angle) * c.force;
      run.grid.query(run.player.x, run.player.z, 30, (e) => { if (!e.boss) { e.x += Math.cos(s.angle) * c.force * 0.5 * dt; e.z += Math.sin(s.angle) * c.force * 0.5 * dt; } });
      run.env.gust = s.angle;
      if (s.t <= 0) { s.phase = null; s.t = c.every; emit(run, { type: 'blizzard', on: false }); }
      return;
    }
    if (s.t <= 0) { s.phase = 'warn'; s.t = c.warn; s.angle = run.rng() * TAU; emit(run, { type: 'blizzard', dir: s.angle, warn: true }); }
  },
  lava_burst(run, c, dt, s) {
    s.t = (s.t ?? 2) - dt;
    if (s.t > 0) return;
    s.t = c.every;
    for (let i = 0; i < c.count; i++) {
      const pos = i === 0 ? { x: run.player.x + (run.rng() - 0.5) * 3, z: run.player.z + (run.rng() - 0.5) * 3 } : randomNear(run, 2, 10);
      spawnZone(run, { ...pos, radius: c.radius, warn: c.warn, active: 0.4, damage: c.damage, kind: 'lava_burst', color: '#ff7a1a', element: 'fire' });
    }
  },
  void_rift(run, c, dt, s) {
    s.t = (s.t ?? c.every * 0.5) - dt;
    if (s.t > 0) return;
    s.t = c.every;
    for (let i = 0; i < c.count; i++) {
      const pos = randomNear(run, 8, 16);
      spawnZone(run, { ...pos, radius: c.radius, warn: 1.5, active: c.life, damage: c.damage, oneShot: false, tick: c.tick, kind: 'void_rift',
        color: '#ff7ad9', element: 'void', pull: c.pull, pullEnemies: true, coreRadius: 1.6 });
    }
  },
};

export function updateHazards(run, dt) {
  run.env.pushX = 0; run.env.pushZ = 0; run.env.speedMult = 1; run.env.gust = null;
  for (let i = 0; i < run.map.hazards.length; i++) {
    const cfg = run.map.hazards[i];
    KINDS[cfg.kind](run, cfg, dt, run.hazardState[i]);
  }
  updateZones(run, dt);
}

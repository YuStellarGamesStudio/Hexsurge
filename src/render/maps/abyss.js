// Batched basalt scenery; seams stay below spell luminance and vents follow zone phases.
import { Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { ARENA } from '../../data/config.js';
import { MeshBuilder } from '../geo.js';
import { matte, glow } from '../materials.js';
import { InstancePool } from '../pool.js';

export const look = {
  ambient: 0.65, sun: { dir: [-0.4, 1, 0.5], color: [1, 0.83, 0.72], intensity: 2.5 },
  fog: { color: [0.16, 0.065, 0.045], near: 48, far: 115 },
  bloom: { strength: 0.42, threshold: 1.25 }, exposure: 1.1,
  background: { zenith: [0.045, 0.018, 0.025], horizon: [0.27, 0.09, 0.035], ground: [0.085, 0.035, 0.027] },
};

export function build(ctx) {
  const meshes = [], pools = [], radius = ARENA.radius + 1;
  const add = (builder, material) => {
    const mesh = new Mesh({ geometry: builder.build(), material });
    ctx.add(mesh); meshes.push(mesh); return mesh;
  };
  const pool = (builder, material, capacity) => {
    const p = new InstancePool(ctx.scene, builder.build(), material, capacity);
    pools.push(p); return p;
  };
  const rock = new MeshBuilder(), lava = new MeshBuilder(), hot = new MeshBuilder();
  rock.cylinder(radius, 3, 64, '#211b1a', { pos: [0, -3.1, 0] }, 0.18);
  lava.disc(radius, 64, '#ffffff', undefined, 0, -0.055);
  // Closely packed hexagonal slabs leave hairline fissures, not projectile-like streaks.
  const tile = 2.5, stride = Math.sqrt(3) * tile;
  for (let row = -13; row <= 13; row++) for (let col = -13; col <= 13; col++) {
    const x = col * stride + (Math.abs(row) % 2) * stride * 0.5, z = row * tile * 1.5;
    if (Math.hypot(x, z) > radius - tile) continue;
    rock.cylinder(tile - 0.025, 0.14, 6, (row + col) % 3 ? ctx.palette.ground : '#302925',
      { pos: [x, -0.13, z], rot: [0, Math.PI / 6, 0] }, 0.12);
  }
  // Unbroken rim hides tile termination; lava rivers remain outside collision space.
  rock.ring(radius - 3.8, radius, 64, ctx.palette.ground, undefined, 0.12, 0.015);
  lava.ring(radius + 0.3, radius + 19, 80, '#ffffff', undefined, 0, -2.9);
  for (let i = 0; i < 48; i++) {
    const a = i * 2.39996, d = radius + 3 + ctx.rng() * 16, r = 1.5 + ctx.rng() * 3;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    rock.cone(r, 3 + ctx.rng() * 11, 5, '#282124', { pos: [x, -3, z], rot: [0, a, 0] }, 0.3, r * 0.28);
    hot.ring(r * 0.7, r * 0.8, 8, '#ffffff', { pos: [x, -2.85, z] });
  }
  for (const o of ctx.obstacles) {
    const t = { pos: [o.x, 0.02, o.z], rot: [0, o.seed * 6.28, 0] };
    rock.cone(o.r, o.r * 0.45, 8, '#3b3030', t, 0.22, o.r * 0.8);
    if (o.kind === 'spire') {
      rock.cone(o.r * 0.8, o.r * 3.3, 5, '#29232a', t, 0.35, o.r * 0.1);
      rock.cone(o.r * 0.35, o.r * 1.9, 5, '#41363d', { pos: [o.x + o.r * 0.55, 0, o.z], rot: [0, o.seed, -0.15] }, 0.2);
    } else {
      rock.ico(o.r, 0, o.kind === 'lavarock' ? '#493730' : '#383035',
        { pos: [o.x, o.r * 0.65, o.z], rot: [0, o.seed, 0], scale: [0.92, o.kind === 'lavarock' ? 0.95 : 0.7, 0.92] }, 0.3);
      if (o.kind === 'lavarock') hot.ring(o.r * 0.6, o.r * 0.66, 8, '#ffffff', { pos: [o.x, 0.06, o.z] });
    }
  }
  add(rock, matte()); add(lava, glow('#804021', 1.15)); add(hot, glow('#b9511e', 1.4));
  const ember = pool(new MeshBuilder().gem(1, 1.8, 1, 4, '#ffffff'), glow('#b96125', 1.3), 80);
  const ash = pool(new MeshBuilder().ico(1, 0, '#7e6e65'), matte(), 48);
  const vents = pool(new MeshBuilder().cone(1, 1, 7, '#ffffff', undefined, 0, 0.12), glow('#ff9b32', 3), 24);
  const sparks = pool(new MeshBuilder().gem(1, 1.8, 1, 4, '#ffffff'), glow('#ffd278', 3), 144);
  const drift = new Float32Array(80 * 4);
  for (let i = 0; i < 80; i++) {
    const a = ctx.rng() * Math.PI * 2, d = 12 + ctx.rng() * radius;
    drift.set([Math.cos(a) * d, Math.sin(a) * d, ctx.rng() * 10, ctx.rng() * 6.28], i * 4);
  }
  return {
    update(t, dt, run) {
      ember.begin(); ash.begin(); vents.begin(); sparks.begin();
      for (let i = 0; i < 80; i++) {
        const k = i * 4, y = (drift[k + 2] + t * 0.7) % 10;
        const x = drift[k] + Math.sin(t * 0.4 + drift[k + 3]) * 0.8, z = drift[k + 1];
        ember.push(x, y, z, 0.025, 0.035, 0.025, t + i);
        if (i < 48) ash.push(x + 1, (y + 3) % 10, z, 0.035, 0.013, 0.035, t * 0.3);
      }
      for (const zone of run.zones) {
        if (zone.kind !== 'lava_burst' || zone.warn > 0 || zone.active <= 0) continue;
        const phase = 1 - zone.active / zone.activeMax, h = 1.2 + Math.sin(phase * Math.PI) * 3.2;
        vents.push(zone.x, 0.12, zone.z, zone.r * 0.3, h, zone.r * 0.3, t);
        for (let i = 0; i < 12; i++) {
          const a = i * 2.39996 + t, d = zone.r * (0.18 + phase * 0.65);
          sparks.push(zone.x + Math.cos(a) * d, 0.3 + h * Math.sin((i + 1) / 13 * Math.PI), zone.z + Math.sin(a) * d,
            0.045, 0.12, 0.045, a);
        }
      }
      for (const p of pools) p.end();
    },
    dispose() {
      for (const p of pools) p.destroy(ctx.scene);
      for (const m of meshes) ctx.scene.remove(m);
    },
  };
}

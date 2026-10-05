// Floating-isle scenery is merged; drifting debris, stars and rift shards use fixed batches.
import { Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { ARENA } from '../../data/config.js';
import { MeshBuilder } from '../geo.js';
import { matte, glow } from '../materials.js';
import { InstancePool } from '../pool.js';

export const look = {
  ambient: 0.72, sun: { dir: [0.4, 1, -0.3], color: [0.8, 0.85, 1], intensity: 2.4 },
  fog: { color: [0.075, 0.047, 0.16], near: 55, far: 150 },
  bloom: { strength: 0.48, threshold: 1.3 }, exposure: 1.15,
  background: { zenith: [0.012, 0.007, 0.055], horizon: [0.12, 0.13, 0.34], ground: [0.042, 0.016, 0.09] },
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
  const rock = new MeshBuilder(), crystal = new MeshBuilder(), veins = new MeshBuilder();
  rock.disc(radius, 72, ctx.palette.ground, undefined, 0.1, 0);
  rock.cone(radius * 0.62, 7, 48, '#231935', { pos: [0, -7, 0] }, 0.2, radius);
  rock.cone(radius * 0.18, 11, 24, '#19142d', { pos: [0, -18, 0] }, 0.35, radius * 0.65);
  for (let i = 0; i < 72; i++) {
    const a = i * Math.PI * 2 / 72, d = radius - 1.4, r = 1.8 + ctx.rng() * 1.7;
    rock.gem(r, 0.8, 3 + ctx.rng() * 8, 5, i % 2 ? '#342449' : '#2c2544',
      { pos: [Math.cos(a) * d, -0.7, Math.sin(a) * d], rot: [0, a, 0] }, 0.25);
  }
  // Quiet geological facets and broken mineral veins provide scale without a luminous grid.
  for (let row = -12; row <= 12; row++) for (let col = -12; col <= 12; col++) {
    const x = col * 4.85 + (Math.abs(row) % 2) * 2.425, z = row * 4.2;
    if (Math.hypot(x, z) > radius - 3.5) continue;
    rock.disc(2.78, 6, (row + col) % 3 ? '#2c2246' : '#30264c', { pos: [x, 0.018, z], rot: [0, Math.PI / 6, 0] }, 0.08);
    if ((row * 7 + col) % 5 === 0) veins.box(0.028, 0.012, 1.7, '#ffffff', { pos: [x + 0.7, 0.035, z], rot: [0, row + col, 0] });
  }
  for (const o of ctx.obstacles) {
    const angle = o.seed * 6.28, base = { pos: [o.x, 0, o.z], rot: [0, angle, 0] };
    // The broad foot always occupies the simulation's complete collision radius.
    rock.cone(o.r, o.r * 0.4, 8, '#493854', base, 0.22, o.r * 0.78);
    if (o.kind === 'crystalspire') {
      crystal.gem(o.r * 0.5, o.r * 2.9, o.r * 0.45, 5, '#ffffff', { pos: [o.x, o.r * 0.65, o.z], rot: [0, angle, 0.15] }, 0.28);
      crystal.gem(o.r * 0.28, o.r * 1.5, o.r * 0.25, 5, '#a789d4', { pos: [o.x - o.r * 0.55, o.r * 0.35, o.z], rot: [0, angle, -0.25] }, 0.25);
    } else if (o.kind === 'obelisk') {
      rock.cone(o.r * 0.62, o.r * 2.9, 4, '#443859', base, 0.18, o.r * 0.42);
      crystal.gem(o.r * 0.25, o.r * 0.7, o.r * 0.3, 4, '#ffffff', { pos: [o.x, o.r * 2.5, o.z], rot: [0, angle, 0] }, 0.18);
      veins.box(o.r * 0.06, o.r * 1.65, o.r * 0.87, '#ffffff', { pos: [o.x, o.r * 1.3, o.z], rot: [0, angle, 0] });
    } else {
      rock.ico(o.r, 0, '#4c4061', { pos: [o.x, o.r * 0.9, o.z], scale: [0.9, 0.8, 0.9], rot: [0.1, angle, 0.15] }, 0.3);
      rock.gem(o.r * 0.6, o.r * 0.35, o.r * 0.8, 5, '#302746', { pos: [o.x, o.r * 0.55, o.z] }, 0.2);
    }
  }
  add(rock, matte()); add(crystal, glow('#b875af', 1.2)); add(veins, glow('#725985', 0.8));
  const stars = pool(new MeshBuilder().ico(1, 0, '#ffffff'), glow('#9dbbe8', 1.8), 260);
  const chunks = pool(new MeshBuilder().gem(1, 0.5, 2, 5, '#443454', undefined, 0.25), matte(), 36);
  const floatingCrystals = pool(new MeshBuilder().gem(1, 3, 1.4, 5, '#ffffff', undefined, 0.25), glow('#b875af', 1.3), 24);
  const rings = pool(new MeshBuilder().ring(0.85, 1, 48, '#ffffff'), glow('#8762ab', 1.8), 24);
  const shards = pool(new MeshBuilder().gem(1, 2, 1, 4, '#ffffff'), glow('#d88abd', 2), 96);
  const cores = pool(new MeshBuilder().disc(1, 32, '#100a21'), matte(), 12);
  const starData = new Float32Array(260 * 4), debris = new Float32Array(36 * 5);
  for (let i = 0; i < 260; i++) {
    const a = ctx.rng() * Math.PI * 2, d = 65 + ctx.rng() * 65;
    starData.set([Math.cos(a) * d, -28 + ctx.rng() * 70, Math.sin(a) * d, 0.035 + ctx.rng() * 0.1], i * 4);
  }
  for (let i = 0; i < 36; i++) {
    const a = i * 2.39996, d = radius + 6 + ctx.rng() * 24;
    debris.set([Math.cos(a) * d, -5 + ctx.rng() * 8, Math.sin(a) * d, 1 + ctx.rng() * 3, ctx.rng() * 6.28], i * 5);
  }
  return {
    update(t, dt, run) {
      for (const p of pools) p.begin();
      for (let i = 0; i < 260; i++) {
        const k = i * 4, s = starData[k + 3] * (0.85 + Math.sin(t * 0.5 + i) * 0.15);
        stars.push(starData[k], starData[k + 1], starData[k + 2], s, s, s);
      }
      for (let i = 0; i < 36; i++) {
        const k = i * 5, s = debris[k + 3], y = debris[k + 1] + Math.sin(t * 0.3 + debris[k + 4]) * 0.7;
        chunks.push(debris[k], y, debris[k + 2], s, s, s, debris[k + 4] + t * 0.025);
        if (i < 24) floatingCrystals.push(debris[k], y + s * 0.5, debris[k + 2], s * 0.22, s * 0.45, s * 0.22, -t * 0.07 + i);
      }
      for (const zone of run.zones) {
        if (zone.kind !== 'void_rift' || zone.warn > 0 || zone.active <= 0) continue;
        cores.push(zone.x, 0.065, zone.z, zone.r * 0.28, 1, zone.r * 0.28);
        for (let i = 0; i < 3; i++) {
          const s = zone.r * (0.24 + i * 0.13), tilt = Math.sin(t + i) * 0.15;
          rings.push(zone.x, 0.12 + i * 0.13, zone.z, s, 1, s, t * (i % 2 ? -1 : 1), 1, 1, 1, tilt);
        }
        for (let i = 0; i < 12; i++) {
          const a = t * 1.4 + i * Math.PI / 6, d = zone.r * (0.32 + Math.sin(t * 2 + i) * 0.06);
          shards.push(zone.x + Math.cos(a) * d, 0.5 + Math.sin(t * 2 + i) * 0.25, zone.z + Math.sin(a) * d,
            0.06, 0.18, 0.06, -a, 1, 1, 1, 0.35);
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

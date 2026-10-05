// Cream-stone academy plaza. Geometry is merged; animated details use fixed batches.
import { Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { ARENA } from '../../data/config.js';
import { MeshBuilder } from '../geo.js';
import { InstancePool } from '../pool.js';
import { matte, glow } from '../materials.js';
export const look = {
  ambient: 0.32, sun: { dir: [-0.4, 1, 0.3], color: [1, 0.93, 0.8], intensity: 1.25 },
  fog: { color: [0.37, 0.37, 0.47], near: 48, far: 105 }, bloom: { strength: 0.45, threshold: 1.15 }, exposure: 0.9,
  background: { zenith: [0.13, 0.17, 0.34], horizon: [0.55, 0.52, 0.57], ground: [0.18, 0.18, 0.24] },
};
export function build(ctx) {
  const owned = [];
  const add = (b, m = matte()) => { const mesh = ctx.add(new Mesh({ geometry: b.build(), material: m })); owned.push(mesh); return mesh; };
  const ground = new MeshBuilder().disc(ARENA.radius + 4, 96, '#a09b8d', undefined, 0.025);
  const inlay = new MeshBuilder();
  for (let r = 8; r < ARENA.radius; r += 8) inlay.ring(r, r + 0.055, 96, '#858581', undefined, 0, 0.014);
  for (let x = -44; x <= 44; x += 4) for (let z = -44; z <= 44; z += 4) {
    if (Math.hypot(x, z) > ARENA.radius - 2) continue;
    ground.box(3.96, 0.025, 3.96, ((x + z) % 8 === 0) ? '#aaa497' : '#a5a092', { pos: [x, -0.006, z] }, 0.015);
    if (Math.hypot(x, z) > 12 && (x * 3 + z) % 16 === 0) inlay.box(0.035, 0.018, 0.65, '#707789', { pos: [x, 0.024, z], rot: [0, Math.PI / 4, 0] });
  }
  ground.ring(ARENA.radius, ARENA.radius + 2, 96, '#b9b09b', undefined, 0.05, 0.035);
  add(ground); add(inlay);
  const stone = new MeshBuilder(), cloth = new MeshBuilder(), lights = new MeshBuilder();
  const tower = (x, z, h, a) => {
    stone.cylinder(2.1, h, 8, '#bab29e', { pos: [x, 0, z] });
    stone.cylinder(2.4, 0.4, 8, '#d0c6b0', { pos: [x, h - 0.5, z] });
    cloth.cone(2.7, 3.6, 8, '#34375f', { pos: [x, h, z] });
    stone.box(0.12, 5, 0.12, '#b6a477', { pos: [x, h + 3, z] });
    cloth.box(1.6, 2.8, 0.08, '#474476', { pos: [x + 0.7, h + 3, z], rot: [0, a, 0] });
    lights.box(0.5, 1.25, 0.06, '#ffffff', { pos: [x, h * 0.6, z + 2.12] });
  };
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2, x = Math.cos(a) * 49, z = Math.sin(a) * 49;
    tower(x, z, 6 + (i % 3) * 1.5, a);
    const nx = Math.cos(a + Math.PI / 20) * 49, nz = Math.sin(a + Math.PI / 20) * 49;
    stone.box(6.5, 0.65, 1.3, '#aaa28f', { pos: [nx, 4, nz], rot: [0, -a - Math.PI / 20 + Math.PI / 2, 0] });
    // Recessed bookshelves and indigo banners sit outside the traversable arena.
    cloth.box(2.4, 2.6, 0.5, '#35344c', { pos: [nx, 1.6, nz], rot: [0, -a, 0] });
    for (let k = 0; k < 7; k++) stone.box(0.2, 0.65, 0.35, k % 2 ? '#798094' : '#9c8b77', { pos: [nx + (k - 3) * 0.26, 1.5, nz + 0.3] });
  }
  for (const o of ctx.obstacles) {
    const t = { pos: [o.x, 0, o.z] }, r = o.r;
    stone.cylinder(r, 0.22, 8, '#797b80', t);
    if (o.kind === 'bookpile') {
      for (let k = 0; k < 5; k++) { const p = [o.x, 0.3 + k * 0.29, o.z], rot = [0, k * 0.7 + o.seed, 0]; cloth.box(r * 1.4, 0.29, r * 1.05, k % 2 ? '#55516f' : '#716858', { pos: p, rot }); stone.box(r * 1.28, 0.18, r * 0.95, '#c0b9a6', { pos: p, rot }); }
    } else {
      stone.cylinder(r * 0.72, o.kind === 'statue' ? 1 : 2.8, 8, '#bdb6a7', t);
      if (o.kind === 'statue') { stone.cone(r * 0.65, 1.8, 6, '#aaa99f', { pos: [o.x, 1, o.z] }, 0.12, r * 0.28); stone.ico(r * 0.36, 0, '#cac2ad', { pos: [o.x, 3.05, o.z] }); }
      else { stone.cylinder(r * 0.9, 0.28, 8, '#d0c8b6', { pos: [o.x, 2.8, o.z] }); cloth.box(r * 0.6, 1.2, 0.06, '#525478', { pos: [o.x, 1.75, o.z + r * 0.73] }); }
    }
  }
  add(stone); add(cloth); add(lights, glow('#ffd895', 1.15));
  const book = new MeshBuilder().box(0.65, 0.1, 0.45, '#777397').box(0.59, 0.11, 0.4, '#d9d1b8', { pos: [0, 0.08, 0] });
  const books = new InstancePool(ctx.scene, book.build(), matte(), 24);
  const motes = new InstancePool(ctx.scene, new MeshBuilder().gem(0.05, 0.1, 0.1, 4, '#ffffff').build(), glow('#9299dc', 0.85), 64);
  const pylons = new InstancePool(ctx.scene, new MeshBuilder().cone(0.28, 2, 4, '#8584ad', undefined, 0.1, 0.14).gem(0.23, 0.5, 0.2, 4, '#bdc2ea', { pos: [0, 2.2, 0] }).build(), glow('#848ccc', 0.85), 16);
  return {
    update(t, dt, run) {
      books.begin(); motes.begin(); pylons.begin();
      for (let i = 0; i < 24; i++) { const a = i * 2.4 + t * 0.025, r = 18 + i % 5 * 5; books.push(Math.cos(a) * r, 3 + Math.sin(t * 0.6 + i) * 0.5, Math.sin(a) * r, 1, 1, 1, a); }
      for (let i = 0; i < 64; i++) { const a = i * 2.399, r = 14 + i % 9 * 3.5; motes.push(Math.cos(a) * r, 0.8 + (i * 0.37 + t * 0.3) % 5, Math.sin(a) * r, 1, 1, 1); }
      for (const z of run.zones) if (z.kind === 'rune_pylon') pylons.push(z.x, -1.5 * Math.min(1, Math.max(0, z.warn)), z.z, 1, 1, 1, t * 0.3);
      books.end(); motes.end(); pylons.end();
    },
    dispose() { for (const p of [books, motes, pylons]) p.destroy(ctx.scene); for (const o of owned) { ctx.scene.remove(o); o.destroy(); } },
  };
}

// Blighted woodland: quiet matte floor, cyan growth restricted to sparse accents.
import { Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { ARENA } from '../../data/config.js';
import { MeshBuilder } from '../geo.js';
import { InstancePool } from '../pool.js';
import { matte, glow } from '../materials.js';
export const look = {
  ambient: 0.48, sun: { dir: [-0.5, 1, 0.2], color: [0.65, 0.82, 0.75], intensity: 1.3 },
  fog: { color: [0.055, 0.12, 0.1], near: 35, far: 88 }, bloom: { strength: 0.45, threshold: 1.2 }, exposure: 1.1,
  background: { zenith: [0.025, 0.055, 0.07], horizon: [0.09, 0.2, 0.17], ground: [0.03, 0.08, 0.065] },
};
export function build(ctx) {
  const owned = [];
  const add = (b, m = matte()) => { const mesh = ctx.add(new Mesh({ geometry: b.build(), material: m })); owned.push(mesh); };
  const ground = new MeshBuilder().disc(ARENA.radius + 6, 96, '#344039', undefined, 0.04);
  const wood = new MeshBuilder(), moss = new MeshBuilder(), caps = new MeshBuilder(), gills = new MeshBuilder();
  const tree = (x, z, r, h, seed) => {
    wood.cylinder(r, 0.2, 7, '#334137', { pos: [x, 0, z] });
    wood.cone(r * 0.65, h, 5, '#4a4942', { pos: [x, 0, z], rot: [0, seed, 0] }, 0.18, r * 0.2);
    for (let k = 0; k < 3; k++) { const a = seed + k * 2.1; wood.cone(r * 0.2, h * 0.5, 4, '#48483e', { pos: [x, h * (0.4 + k * 0.16), z], rot: [0.7, a, 0] }, 0.12, 0.04); wood.box(r * 1.3, 0.12, r * 0.22, '#45483e', { pos: [x + Math.cos(a) * r * 0.45, 0.08, z + Math.sin(a) * r * 0.45], rot: [0, -a, 0] }); }
  };
  const mushroom = (x, z, r, h) => {
    wood.cone(r * 0.25, h, 6, '#688476', { pos: [x, 0, z] }, 0.05, r * 0.17);
    caps.cone(r, r * 0.45, 7, '#416e60', { pos: [x, h, z] }, 0.18, r * 0.12);
    for (let k = 0; k < 5; k++) {
      const a = k * Math.PI * 0.4, d = r * 0.42;
      gills.ico(r * 0.07, 0, '#ffffff', { pos: [x + Math.cos(a) * d, h + r * 0.34, z + Math.sin(a) * d], scale: [1, 0.4, 1] });
    }
  };
  for (let i = 0; i < 150; i++) {
    const a = i * 2.399963, r = Math.sqrt((i + 0.5) / 150) * 46, x = Math.cos(a) * r, z = Math.sin(a) * r;
    ground.disc(0.9 + i % 4 * 0.65, 7, i % 2 ? '#37473b' : '#303d35', { pos: [x, 0.01, z] }, 0.03);
    if (r > 12) { moss.box(1.7, 0.05, 0.11, '#465044', { pos: [x, 0.05, z], rot: [0, a, 0] }); if (i % 9 === 0) mushroom(x, z, 0.27, 0.42); }
  }
  for (let i = 0; i < 48; i++) { const a = i * 2.399, r = 46 + i % 5 * 1.6; tree(Math.cos(a) * r, Math.sin(a) * r, 1.2 + i % 3 * 0.25, 6 + i % 4 * 1.4, a); }
  for (const o of ctx.obstacles) {
    if (o.kind === 'deadtree') tree(o.x, o.z, o.r, 4.5 + o.r, o.seed);
    else if (o.kind === 'mushroom') { wood.cylinder(o.r, 0.18, 7, '#3d4b40', { pos: [o.x, 0, o.z] }); mushroom(o.x, o.z, o.r, o.r * 1.1); }
    else { wood.cone(o.r, o.r * 1.3, 7, '#53534a', { pos: [o.x, 0, o.z] }, 0.12, o.r * 0.86); moss.disc(o.r * 0.75, 7, '#777765', { pos: [o.x, o.r * 1.3 + 0.015, o.z] }); moss.ring(o.r * 0.4, o.r * 0.45, 7, '#575d4e', { pos: [o.x, o.r * 1.3 + 0.02, o.z] }); }
  }
  add(ground); add(wood); add(moss); add(caps); add(gills, glow('#6dbda2', 0.45));
  const flies = new InstancePool(ctx.scene, new MeshBuilder().ico(0.035, 0, '#ffffff').build(), glow('#87d9b0', 1.1), 80);
  const spores = new InstancePool(ctx.scene, new MeshBuilder().ico(0.06, 0, '#ffffff').build(), glow('#649b88', 0.45, 0.38), 96);
  return {
    update(t, dt, run) {
      flies.begin(); spores.begin();
      for (let i = 0; i < 80; i++) { const a = i * 2.399, r = 13 + i % 11 * 3; flies.push(Math.cos(a) * r + Math.sin(t * 0.3 + i), 0.9 + Math.sin(t * 0.7 + i) * 0.5, Math.sin(a) * r + Math.cos(t * 0.3 + i), 1, 1, 1); }
      for (let i = 0; i < 48; i++) spores.push((i * 17.3 + t * 0.25) % 86 - 43, (i * 0.7 + t * 0.17) % 6, (i * 11.7) % 86 - 43, 1, 1, 1);
      for (const z of run.zones) if (z.kind === 'spore_cloud') for (let i = 0; i < 12; i++) { const a = i * 2.399 + t * 0.1, r = z.r * Math.sqrt((i + 0.5) / 12); spores.push(z.x + Math.cos(a) * r, 0.2 + (i * 0.37 + t * 0.3) % 2.2, z.z + Math.sin(a) * r, 2, 2, 2); }
      flies.end(); spores.end();
    },
    dispose() { flies.destroy(ctx.scene); spores.destroy(ctx.scene); for (const o of owned) { ctx.scene.remove(o); o.destroy(); } },
  };
}

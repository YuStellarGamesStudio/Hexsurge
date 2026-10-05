// Snow and blue ice, with wind-driven snow integrated against the simulation gust.
import { Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { ARENA } from '../../data/config.js';
import { MeshBuilder } from '../geo.js';
import { InstancePool } from '../pool.js';
import { matte, glow } from '../materials.js';
export const look = {
  ambient: 0.35, sun: { dir: [-0.4, 1, -0.3], color: [0.8, 0.9, 1], intensity: 1.1 },
  fog: { color: [0.39, 0.49, 0.6], near: 42, far: 105 }, bloom: { strength: 0.38, threshold: 1.2 }, exposure: 0.86,
  background: { zenith: [0.13, 0.25, 0.4], horizon: [0.57, 0.66, 0.73], ground: [0.24, 0.32, 0.41] },
};
export function build(ctx) {
  const owned = [];
  const add = (b, m = matte()) => { const mesh = ctx.add(new Mesh({ geometry: b.build(), material: m })); owned.push(mesh); };
  const ground = new MeshBuilder().disc(ARENA.radius + 6, 96, '#a1b5c4', undefined, 0.025);
  const snow = new MeshBuilder(), ice = new MeshBuilder(), pine = new MeshBuilder();
  for (let i = 0; i < 80; i++) {
    const a = i * 2.399, r = Math.sqrt((i + 0.5) / 80) * 44, x = Math.cos(a) * r, z = Math.sin(a) * r;
    ground.disc(1 + i % 5 * 0.6, 7, i % 4 ? '#a6b9c6' : '#879eaf', { pos: [x, 0.012, z], scale: [1.6, 1, 0.8], rot: [0, a, 0] }, 0.025);
    if (i % 4 === 0) ground.box(1.4, 0.018, 0.025, '#9eb1bf', { pos: [x, 0.032, z], rot: [0, a, 0] });
  }
  const tree = (x, z, r, h) => {
    pine.cylinder(r * 0.23, h * 0.8, 6, '#596a71', { pos: [x, 0, z] });
    snow.cylinder(r, 0.15, 8, '#b9c8d1', { pos: [x, 0, z] });
    for (let k = 0; k < 3; k++) { const rr = r * (1 - k * 0.23), y = h * (0.2 + k * 0.22); pine.cone(rr, h * 0.5, 6, '#506976', { pos: [x, y, z] }); snow.cone(rr * 0.87, h * 0.44, 6, '#c1d0d9', { pos: [x, y + h * 0.08, z] }); }
  };
  const crystal = (x, z, r) => { snow.cylinder(r, 0.18, 7, '#bbcbd5', { pos: [x, 0, z] }); ice.gem(r * 0.62, r * 2.9, 0.1, 5, '#79a5bd', { pos: [x, 0.2, z] }); ice.gem(r * 0.32, r * 1.65, 0.1, 5, '#a5ccdf', { pos: [x + r * 0.55, 0.1, z], rot: [0, 0, -0.2] }); };
  for (let i = 0; i < 40; i++) { const a = i * 2.399, r = 47 + i % 4 * 2; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (i % 4 === 0) crystal(x, z, 2); else tree(x, z, 1.8, 6 + i % 3); }
  for (const o of ctx.obstacles) {
    if (o.kind === 'pine') tree(o.x, o.z, o.r, o.r * 3.3);
    else if (o.kind === 'crystal') crystal(o.x, o.z, o.r);
    else { ice.ico(o.r, 1, '#93b0c5', { pos: [o.x, o.r * 0.65, o.z], scale: [1, 1.05, 1] }, 0.1); snow.cone(o.r * 0.85, o.r * 0.28, 7, '#c0d0dc', { pos: [o.x, o.r * 1.38, o.z] }, 0.06, o.r * 0.3); snow.disc(o.r, 8, '#b7c8d4', { pos: [o.x, 0.025, o.z] }); }
  }
  add(ground); add(snow); add(ice, matte('#ffffff', 0.7)); add(pine);
  const flakes = new InstancePool(ctx.scene, new MeshBuilder().box(0.035, 0.08, 0.035, '#ffffff').build(), glow('#bacddc', 0.25, 0.6), 200);
  const coords = new Float32Array(200 * 3);
  for (let i = 0; i < 200; i++) { coords[i * 3] = (i * 17.37) % 88 - 44; coords[i * 3 + 1] = (i * 0.731) % 12; coords[i * 3 + 2] = (i * 23.73) % 88 - 44; }
  return {
    update(t, dt, run) {
      const gust = run.env.gust, windy = gust != null, vx = windy ? Math.cos(gust) * 8 : 0.35, vz = windy ? Math.sin(gust) * 8 : 0.15;
      flakes.begin();
      for (let i = 0; i < 200; i++) { const j = i * 3; coords[j] = ((coords[j] + vx * dt + 132) % 88) - 44; coords[j + 2] = ((coords[j + 2] + vz * dt + 132) % 88) - 44; coords[j + 1] = (coords[j + 1] - dt * (windy ? 3 : 1.2) + 12) % 12; flakes.push(coords[j], coords[j + 1], coords[j + 2], 1, windy ? 3 : 1, 1, windy ? -gust + Math.PI / 2 : 0, 1, 1, 1, windy ? 1.1 : 0); }
      flakes.end();
    },
    dispose() { flakes.destroy(ctx.scene); for (const o of owned) { ctx.scene.remove(o); o.destroy(); } },
  };
}

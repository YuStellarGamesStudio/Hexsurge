// Fallback scenery: flat palette disc + generic obstacle blobs. Real maps live in sibling modules.
import { Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { ARENA } from '../../data/config.js';
import { MeshBuilder } from '../geo.js';
import { matte } from '../materials.js';

export const look = {
  ambient: 0.5, sun: { dir: [0.4, 1, 0.3], color: [1, 0.96, 0.9], intensity: 2.2 },
  fog: { color: [0.2, 0.22, 0.35], near: 45, far: 110 }, bloom: { strength: 0.6, threshold: 1.0 }, exposure: 1,
  background: { zenith: [0.1, 0.12, 0.25], horizon: [0.4, 0.45, 0.6], ground: [0.1, 0.1, 0.15] },
};

export function build(ctx) {
  const p = ctx.palette;
  const g = new MeshBuilder().ring(0, ARENA.radius + 2, 40, p.ground, undefined, 0.12);
  ctx.add(new Mesh({ geometry: g.build(), material: matte() }));
  const props = new MeshBuilder();
  for (const o of ctx.obstacles) props.cone(o.r, o.r * 2.2, 6, p.prop, { pos: [o.x, 0, o.z] }, 0.15, o.r * 0.3);
  ctx.add(new Mesh({ geometry: props.build(), material: matte() }));
  return { update() {}, dispose() {} };
}

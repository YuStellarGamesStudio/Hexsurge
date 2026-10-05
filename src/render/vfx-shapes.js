// Geometry for `vfx.shape` names used by sim entities (projectiles, orbiters, minions, areas).
// All shapes are ~1 unit across, centred on the origin (flat shapes lie in the XZ plane), forward = +X, white vertex colours
// (the material supplies the colour). Add a shape here and any spell can use it by name.
import { MeshBuilder } from './geo.js';
import * as fire from './shapes/fire.js';
import * as ice from './shapes/ice.js';
import * as thunder from './shapes/thunder.js';
import * as arcane from './shapes/arcane.js';
import * as nature from './shapes/nature.js';
import * as voidShapes from './shapes/void.js';

const W = '#ffffff';
const HALF_PI = Math.PI / 2;

const BUILDERS = {
  orb: () => new MeshBuilder().ico(0.5, 1, W, undefined, 0.06).build(),
  shard: () => new MeshBuilder().gem(0.2, 0.62, 0.62, 4, W, { rot: [0, 0, -HALF_PI] }, 0.1).build(),
  disc: () => new MeshBuilder().cylinder(0.5, 0.06, 20, W, { pos: [0, 0, 0] }, 0).build(),
  ring: () => new MeshBuilder().ring(0.4, 0.5, 24, W, undefined, 0, 0.02).build(),
  bolt: () => new MeshBuilder().box(1, 0.16, 0.16, W, undefined, 0.08).box(0.5, 0.1, 0.1, W, { pos: [0.25, 0.12, 0] }, 0.08).build(),
  star: () => new MeshBuilder().gem(0.5, 0.18, 0.18, 4, W, { rot: [HALF_PI, 0, 0] }, 0.08).gem(0.5, 0.18, 0.18, 4, W, undefined, 0.08).build(),
  leaf: () => new MeshBuilder().gem(0.22, 0.5, 0.5, 4, W, { rot: [0, 0, -HALF_PI], scale: [1, 1, 0.35] }, 0.1).build(),
  skull: () => new MeshBuilder().ico(0.32, 0, W, { pos: [0, 0.1, 0] }, 0.08).box(0.34, 0.16, 0.28, W, { pos: [0.05, -0.2, 0] }, 0.08).build(),
  crescent: () => {
    const b = new MeshBuilder();
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - 0.5) * 2.1;
      b.box(0.2, 0.1, 0.26 - Math.abs(i - 3) * 0.045, W, { pos: [Math.cos(a) * 0.34 - 0.2, 0, Math.sin(a) * 0.34], rot: [0, -a, 0] }, 0.06);
    }
    return b.build();
  },
  rune: () => new MeshBuilder().ring(0.38, 0.5, 6, W, undefined, 0, 0.02).box(0.9, 0.02, 0.08, W).box(0.08, 0.02, 0.9, W).ring(0.14, 0.22, 4, W, undefined, 0, 0.02).build(),
  flame: () => new MeshBuilder().cone(0.32, 0.9, 6, W, { pos: [0, -0.4, 0] }, 0.14).cone(0.18, 0.6, 5, W, { pos: [0.08, -0.3, 0.05] }, 0.14).build(),
  crystal: () => new MeshBuilder().gem(0.26, 0.7, 0.28, 6, W, undefined, 0.12).build(),
  gem: () => new MeshBuilder().gem(0.5, 0.65, 0.65, 4, W, undefined, 0.08).build(),
  spark: () => new MeshBuilder().gem(0.5, 0.5, 0.5, 4, W, undefined, 0.06).build(),
  // minions
  wolf: () => new MeshBuilder()
    .box(0.9, 0.45, 0.4, W, { pos: [0, 0.1, 0] }, 0.1).box(0.45, 0.4, 0.36, W, { pos: [0.6, 0.28, 0] }, 0.1).cone(0.12, 0.3, 4, W, { pos: [0.7, 0.45, 0.14] }, 0.1)
    .cone(0.12, 0.3, 4, W, { pos: [0.7, 0.45, -0.14] }, 0.1).box(0.5, 0.12, 0.12, W, { pos: [-0.62, 0.22, 0], rot: [0, 0, 0.5] }, 0.1)
    .box(0.12, 0.35, 0.12, W, { pos: [0.3, -0.2, 0.14] }).box(0.12, 0.35, 0.12, W, { pos: [0.3, -0.2, -0.14] }).box(0.12, 0.35, 0.12, W, { pos: [-0.3, -0.2, 0.14] }).box(0.12, 0.35, 0.12, W, { pos: [-0.3, -0.2, -0.14] }).build(),
  hawk: () => new MeshBuilder()
    .ico(0.28, 0, W, undefined, 0.1).cone(0.12, 0.3, 4, W, { pos: [0.28, 0, 0], rot: [0, 0, -HALF_PI] }, 0.1)
    .gem(0.1, 0.7, 0.05, 3, W, { rot: [HALF_PI, 0, 0], pos: [-0.05, 0, 0.35] }, 0.1).gem(0.1, 0.7, 0.05, 3, W, { rot: [-HALF_PI, 0, 0], pos: [-0.05, 0, -0.35] }, 0.1)
    .cone(0.1, 0.4, 4, W, { pos: [-0.28, 0, 0], rot: [0, 0, HALF_PI] }, 0.1).build(),
  wisp: () => new MeshBuilder().ico(0.3, 1, W, undefined, 0.06).cone(0.2, 0.7, 5, W, { pos: [-0.2, 0, 0], rot: [0, 0, HALF_PI] }, 0.1).build(),
  sprite: () => new MeshBuilder().ico(0.26, 0, W, { pos: [0, 0.1, 0] }, 0.08).gem(0.4, 0.04, 0.04, 4, W, { pos: [0, 0.1, 0], rot: [HALF_PI, 0, 0], scale: [1, 1, 0.5] }, 0.08).build(),
};

const ELEMENT_SHAPES = [fire, ice, thunder, arcane, nature, voidShapes];
for (const m of ELEMENT_SHAPES) Object.assign(BUILDERS, m.SHAPES);

const cache = new Map();
export function shapeGeometry(shape) {
  let g = cache.get(shape);
  if (!g) {
    const build = BUILDERS[shape] ?? BUILDERS.orb;
    g = build();
    cache.set(shape, g);
  }
  return g;
}
export const SHAPE_NAMES = Object.freeze(Object.keys(BUILDERS));
/** Shapes that lie flat on the ground (rendered at y ~ 0.05 rather than hovering). */
export const FLAT_SHAPES = Object.freeze(new Set(['disc', 'ring', 'rune', ...ELEMENT_SHAPES.flatMap((m) => m.FLAT)]));

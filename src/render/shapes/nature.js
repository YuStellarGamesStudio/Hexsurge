// Ground silhouettes use sparse raised thorns to preserve visibility of matte enemies.
import { MeshBuilder } from '../geo.js';
const W = '#ffffff';
const TAU = Math.PI * 2;
export const SHAPES = {
  thorn_patch() {
    const b = new MeshBuilder().ring(0.4, 0.46, 12, W, undefined, 0, 0.025);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU, d = i % 2 ? 0.3 : 0.16;
      b.cone(0.035, 0.18, 4, W, { pos: [Math.cos(a) * d, 0.08, Math.sin(a) * d], rot: [0.2 * Math.cos(a), 0, 0.2 * Math.sin(a)] }, 0.04);
    }
    return b.build();
  },
  world_root() {
    const b = new MeshBuilder().ring(0.36, 0.4, 8, W, undefined, 0, 0.025);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU;
      b.box(0.34, 0.065, 0.075, W, { pos: [Math.cos(a) * 0.22, 0.04, Math.sin(a) * 0.22], rot: [0, -a, 0] }, 0.04)
        .cone(0.055, 0.3, 4, W, { pos: [Math.cos(a) * 0.33, 0.15, Math.sin(a) * 0.33] }, 0.04)
        .box(0.17, 0.045, 0.04, W, { pos: [Math.cos(a + 0.25) * 0.38, 0.025, Math.sin(a + 0.25) * 0.38], rot: [0, -a - 0.6, 0] }, 0.04);
    }
    return b.build();
  },
};
export const FLAT = ['thorn_patch', 'world_root'];

// Element-specific VFX geometry, facing +X; material supplies the electric colour.
import { MeshBuilder } from '../geo.js';
const W = '#ffffff';
export const SHAPES = {
  stormRoc() {
    const b = new MeshBuilder()
      .gem(0.2, 0.65, 0.25, 5, W, { rot: [0, 0, -Math.PI / 2] }, 0.08)
      .ico(0.16, 0, W, { pos: [0.32, 0.08, 0] }, 0.05)
      .cone(0.075, 0.22, 4, W, { pos: [0.48, 0.05, 0], rot: [0, 0, -Math.PI / 2] })
      .cone(0.1, 0.35, 4, W, { pos: [-0.36, 0, 0], rot: [0, 0, Math.PI / 2] });
    for (const side of [-1, 1]) {
      b.gem(0.16, 0.8, 0.06, 4, W, { pos: [-0.06, 0.04, side * 0.32], rot: [side * Math.PI / 2, 0, -0.2] });
      for (let i = 0; i < 4; i++) b.gem(0.07, 0.4 - i * 0.045, 0.035, 3, W, {
        pos: [-0.22 - i * 0.045, 0, side * (0.24 + i * 0.12)], rot: [0, side * 0.4, Math.PI / 2],
      });
    }
    return b.build();
  },
};
export const FLAT = [];

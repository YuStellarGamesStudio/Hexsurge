// Vertex shading preserves dark cores even under the pink emissive material.
import { MeshBuilder } from '../geo.js';
const W = '#ffffff', DARK = '#170a22';
export const SHAPES = {
  void_rift: () => new MeshBuilder().ring(0.36, 0.5, 16, W, undefined, 0, 0.02)
    .cylinder(0.35, 0.035, 16, DARK).ring(0.19, 0.22, 8, '#93678f', undefined, 0, 0.025).build(),
  void_singularity: () => new MeshBuilder().ring(0.39, 0.5, 24, W, undefined, 0, 0.025)
    .ico(0.3, 1, DARK, { pos: [0, 0.3, 0] }, 0.08)
    .ring(0.32, 0.36, 16, '#bf86ba', { rot: [Math.PI / 3, 0, 0], pos: [0, 0.3, 0] }, 0, 0.025).build(),
  void_familiar: () => new MeshBuilder().gem(0.26, 0.48, 0.26, 5, DARK, undefined, 0.08)
    .ring(0.3, 0.39, 8, W, { rot: [Math.PI / 2, 0, 0] }, 0, 0.03)
    .ico(0.09, 0, W, { pos: [0.23, 0.1, 0.13] }).ico(0.09, 0, W, { pos: [0.23, 0.1, -0.13] }).build(),
  void_entropy: () => new MeshBuilder().ring(0.46, 0.5, 32, W, undefined, 0, 0.015)
    .ring(0.27, 0.29, 12, '#96688f', undefined, 0, 0.015).build(),
};
export const FLAT = ['void_rift', 'void_singularity', 'void_entropy'];

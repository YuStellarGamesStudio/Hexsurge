// White vertex colours preserve element tinting in the shared emissive material.
import { MeshBuilder } from '../geo.js';
const W = '#ffffff';
function rune(aegis = false) {
  const b = new MeshBuilder().ring(0.43, 0.49, 12, W, undefined, 0, 0.02).ring(0.25, 0.28, 6, W, undefined, 0, 0.02);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    b.box(0.12, 0.025, 0.045, W, { pos: [Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35], rot: [0, -a, 0] });
  }
  if (aegis) b.ring(0.35, 0.37, 6, W, undefined, 0, 0.02).gem(0.14, 0.1, 0.1, 4, W, { rot: [Math.PI / 2, 0, 0] });
  return b.build();
}
export const SHAPES = {
  arcane_missile: () => new MeshBuilder().gem(0.21, 0.75, 0.34, 4, W, { rot: [0, 0, -Math.PI / 2] }, 0.08).ring(0.22, 0.26, 6, W, { rot: [0, 0, Math.PI / 2] }, 0, 0.025).build(),
  arcane_warhead: () => new MeshBuilder().gem(0.26, 0.85, 0.4, 6, W, { rot: [0, 0, -Math.PI / 2] }, 0.08).ring(0.29, 0.34, 6, W, { rot: [0, 0, Math.PI / 2] }, 0, 0.035).build(),
  arcane_planet: () => new MeshBuilder().ico(0.32, 1, W, undefined, 0.05).ring(0.38, 0.48, 16, W, { rot: [0.4, 0, 0.25] }, 0, 0.03).build(),
  arcane_rune: () => rune(),
  arcane_aegis: () => rune(true),
  arcane_ward_outline: () => new MeshBuilder().ring(0.498, 0.5, 96, W, undefined, 0, 0.008).build(),
};
export const FLAT = ['arcane_rune', 'arcane_aegis', 'arcane_ward_outline'];

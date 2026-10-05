// Mage models. Contract: createMageModel(mage, { Group, Mesh, matte, glow }) -> { root, update(dt, player) }.
// (Placeholder: replaced by the character-models pass.)
import { Group, Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { MeshBuilder } from '../geo.js';
import { matte } from '../materials.js';

export function createMageModel(mage) {
  const c = mage.colors;
  const b = new MeshBuilder();
  b.cone(0.55, 1.2, 8, c.robe, { pos: [0, 0, 0] }, 0.1, 0.25);
  b.ico(0.3, 1, c.skin, { pos: [0, 1.35, 0] }, 0.05);
  b.cone(0.42, 0.75, 8, c.hat, { pos: [0, 1.55, 0] }, 0.1);
  b.cylinder(0.04, 1.7, 5, c.trim, { pos: [0.5, 0, 0.1] });
  b.ico(0.14, 0, c.glow, { pos: [0.5, 1.75, 0.1] }, 0);
  const root = new Group();
  const mesh = new Mesh({ geometry: b.build(), material: matte() });
  root.add(mesh);
  return { root, mesh, update(dt, player) { mesh.position.y = player.moving ? Math.abs(Math.sin(performance.now() * 0.012)) * 0.12 : Math.sin(performance.now() * 0.003) * 0.04; } };
}

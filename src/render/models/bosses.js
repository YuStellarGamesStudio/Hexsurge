// Boss models. Contract: createBossModel(bossDef) -> { root, update(dt, boss) } (root: Group; origin at the feet; forward +X).
// (Placeholder: replaced by the boss-models pass.)
import { Group, Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { MeshBuilder } from '../geo.js';
import { matte } from '../materials.js';

export function createBossModel(def) {
  const r = def.radius;
  const b = new MeshBuilder();
  b.ico(r, 1, def.color, { pos: [0, r, 0] });
  b.cone(r * 0.2, r * 1.2, 5, def.accent, { pos: [r * 0.4, r * 1.7, r * 0.5] });
  b.cone(r * 0.2, r * 1.2, 5, def.accent, { pos: [r * 0.4, r * 1.7, -r * 0.5] });
  const root = new Group();
  const mesh = new Mesh({ geometry: b.build(), material: matte() });
  root.add(mesh);
  return { root, update(dt, boss) { mesh.position.y = Math.sin(performance.now() * 0.002) * 0.2; } };
}

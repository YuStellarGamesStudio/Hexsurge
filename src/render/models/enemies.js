// Enemy geometry. Contract: buildEnemyGeometry(def) -> Geometry, origin at the feet (y = 0), facing +X, vertex-coloured
// from def.color (body) / def.accent (detail). One static geometry per enemy def; motion is done by the view via instance matrices.
// (Placeholder silhouettes: replaced by the enemy-models pass.)
import { MeshBuilder } from '../geo.js';

export function buildEnemyGeometry(def) {
  const r = def.radius, b = new MeshBuilder();
  const h = r * 2;
  b.ico(r, 0, def.color, { pos: [0, r * (def.flying ? 0 : 1), 0], scale: [1, 1.1, 1] });
  b.box(r * 0.3, r * 0.22, r * 0.5, def.accent, { pos: [r * 0.8, r * 1.2 + (def.flying ? 0 : 0), 0] });
  b.cone(r * 0.22, h * 0.45, 4, def.accent, { pos: [0, r * 2, 0] });
  return b.build();
}

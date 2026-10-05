// Title backdrop. Contract: createTitleView(game, opts) -> { scene, init(), sync(dt), resize(), dispose() }.
// (Placeholder: replaced by the title-scene pass — a low-poly Magic Academy diorama, R22.)
import { Mesh, Scene, Vector3 } from '../../vendor/xyz/dist/src/index.js';
import { MeshBuilder } from './geo.js';
import { initMaterials, matte } from './materials.js';

class TitleScene extends Scene { update(dt) { this.onTick?.(dt); } }

export function createTitleView(game) {
  const scene = new TitleScene();
  let t = 0;
  return {
    scene,
    async init() {
      await initMaterials();
      scene.ambientLight = 0.6;
      scene.directionalLight.intensity = 2;
      scene.add(new Mesh({ geometry: new MeshBuilder().ring(0, 30, 32, '#d9cfb8').cone(4, 12, 6, '#e8e0cc', { pos: [0, 0, 0] }).build(), material: matte() }));
      await game.setScene(scene);
    },
    sync(dt) {
      t += dt;
      scene.camera3D.position.set(Math.cos(t * 0.1) * 24, 10, Math.sin(t * 0.1) * 24);
      scene.camera3D.lookAt(new Vector3(0, 5, 0));
    },
    resize() {},
    dispose() { scene.destroy(); },
  };
}

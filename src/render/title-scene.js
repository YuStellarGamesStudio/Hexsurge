// R22: the academy above a violet tide; left foreground stays quiet for the menu.
import { EnvironmentMap, Mesh, Scene, Vector3 } from '../../vendor/xyz/dist/src/index.js';
import { MeshBuilder } from './geo.js';
import { initMaterials, matte, glow } from './materials.js';
import { InstancePool } from './pool.js';
class TitleScene extends Scene { update(dt) { this.onTick?.(dt); } }
export function createTitleView(game, opts = {}) {
  const scene = new TitleScene(), target = new Vector3(0, 7, 0);
  let t = 0, sparks, tide, ready = false;
  const view = {
    scene,
    async init() {
      if (ready) { await game.setScene(scene); return; }
      await initMaterials();
      scene.ambientLight = 0.35;
      scene.directionalLight.intensity = 1.6; scene.directionalLight.color = [1, 0.85, 0.69]; scene.directionalLight.direction.set(-0.5, 1, 0.3).normalize();
      scene.background = EnvironmentMap.gradient({ zenith: [0.04, 0.025, 0.13], horizon: [0.28, 0.19, 0.39], ground: [0.07, 0.045, 0.16], width: 64 });
      scene.fog.enabled = true; scene.fog.color = [0.15, 0.1, 0.25]; scene.fog.near = 65; scene.fog.far = 160;
      const pp = scene.postProcessing; pp.enabled = true; pp.toneMapping = 'aces'; pp.exposure = 0.95; pp.bloomStrength = 0.65; pp.bloomThreshold = 1; pp.bloomRadius = 6; pp.fxaa = true;
      scene.camera3D.fov = 48 * Math.PI / 180; scene.camera3D.near = 0.5; scene.camera3D.far = 240;
      const stone = new MeshBuilder(), roof = new MeshBuilder(), gold = new MeshBuilder(), windows = new MeshBuilder();
      const tower = (x, z, r, h) => {
        stone.cylinder(r, h, 8, '#c6bba7', { pos: [x, 0, z] });
        for (const y of [1, h * 0.55, h - 0.5]) stone.cylinder(r * 1.08, 0.35, 8, '#e2d3b6', { pos: [x, y, z] });
        roof.cone(r * 1.3, r * 2.1, 8, '#3b3c72', { pos: [x, h, z] });
        gold.gem(0.2, 0.8, 0.1, 4, '#e7c580', { pos: [x, h + r * 2.1, z] });
        for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; windows.box(0.52, 1.65, 0.07, '#ffffff', { pos: [x + Math.sin(a) * (r + 0.02), h * 0.63, z + Math.cos(a) * (r + 0.02)], rot: [0, a, 0] }); }
        gold.box(0.08, 3, 0.08, '#d4b888', { pos: [x, h + r * 2 + 1.3, z] });
        roof.box(1.5, 1.2, 0.05, '#685289', { pos: [x + 0.72, h + r * 2 + 2.2, z] });
      };
      // A stepped, pointed floating island supports the clustered right-hand silhouette.
      stone.cone(3, 13, 10, '#554965', { pos: [10, -13, 0] }, 0.2, 19);
      stone.cylinder(19, 1.1, 10, '#aaa295', { pos: [10, -0.5, 0] });
      stone.disc(18.3, 48, '#b9ad99', { pos: [10, 0.63, 0] });
      stone.box(14, 8, 8, '#bfb29d', { pos: [12, 4, -2] });
      roof.cone(1, 1, 4, '#3d3c6b', { pos: [12, 8, -2], scale: [10, 5, 6], rot: [0, Math.PI / 4, 0] });
      stone.box(5, 13, 5, '#cfc0a5', { pos: [16, 6.5, -7] });
      roof.cone(4, 5, 4, '#424476', { pos: [16, 13, -7], rot: [0, Math.PI / 4, 0] });
      tower(4, 2, 2.3, 12); tower(21, 3, 2.5, 16); tower(10, -10, 2, 19); tower(24, -8, 1.6, 12);
      for (let i = 0; i < 6; i++) { windows.box(0.7, 1.8, 0.06, '#ffffff', { pos: [6.5 + i * 2.2, 5, 2.03] }); stone.box(0.85, 0.15, 0.25, '#d9cbb5', { pos: [6.5 + i * 2.2, 4.1, 2.1] }); }
      // Arcaded approach, balcony balustrade, and small indigo banners.
      for (let i = 0; i < 9; i++) { stone.box(0.35, 2.5, 0.35, '#d5c6a9', { pos: [1 + i * 2.2, 1.9, 8] }); stone.box(2.25, 0.25, 0.55, '#d5c6a9', { pos: [1 + i * 2.2, 3.15, 8] }); roof.box(0.75, 1.5, 0.06, '#484272', { pos: [1 + i * 2.2, 2.1, 8.22] }); }
      stone.box(9, 0.45, 4, '#b0a28e', { pos: [6, 0.4, 9] });
      for (let i = 0; i < 4; i++) stone.box(6, 0.3, 0.9, '#c3b69f', { pos: [7, 0.4 - i * 0.25, 11 + i * 0.7] });
      for (let i = 0; i < 5; i++) { const x = 28 + i * 8, z = -25 - i * 5; stone.cone(0.8, 4, 7, '#675779', { pos: [x, 1 + i, z] }, 0.2, 4); stone.disc(4, 7, '#938a9e', { pos: [x, 5 + i, z] }); if (i % 2 === 0) tower(x, z, 0.8, 7 + i); }
      scene.add(new Mesh({ geometry: stone.build(), material: matte() })); scene.add(new Mesh({ geometry: roof.build(), material: matte() })); scene.add(new Mesh({ geometry: gold.build(), material: matte() })); scene.add(new Mesh({ geometry: windows.build(), material: glow('#ffd195', 2.1) }));
      const ribbons = new MeshBuilder();
      for (let k = 0; k < 4; k++) for (let i = 0; i < 90; i++) {
        const a = i / 90 * Math.PI * 2, b = (i + 1) / 90 * Math.PI * 2, r = 32 + k * 3, y = 14 + k * 2;
        ribbons.tri([Math.cos(a) * r, y + Math.sin(a * 3) * 2, Math.sin(a) * r], [Math.cos(b) * r, y + Math.sin(b * 3) * 2, Math.sin(b) * r], [Math.cos(b) * (r + 0.8), y + Math.sin(b * 3) * 2 + 0.8, Math.sin(b) * (r + 0.8)], [0.55, 0.3, 0.8]);
      }
      tide = scene.add(new Mesh({ geometry: ribbons.build(), material: glow('#9b68df', 0.8, 0.36) })); tide.position.set(14, 3, -50);
      sparks = new InstancePool(scene, new MeshBuilder().ico(0.06, 0, '#ffffff').build(), glow('#d2b2ff', 1.3), 100);
      ready = true; view.sync(0); await game.setScene(scene);
    },
    sync(dt) {
      if (!ready) return;
      t += dt;
      const a = opts.reducedMotion ? 0 : Math.sin(t * 0.035) * 0.075;
      scene.camera3D.position.set(Math.sin(a) * 48 - 15, 22 + Math.sin(a) * 2, Math.cos(a) * 48); scene.camera3D.lookAt(target);
      if (!opts.reducedMotion) tide.rotation.setFromEuler(0, t * 0.025, 0);
      sparks.begin();
      for (let i = 0; i < 100; i++) { const a = i * 2.399, r = 12 + i % 9 * 3; sparks.push(12 + Math.cos(a + t * 0.015) * r, 1 + (i * 0.371 + t * 0.22) % 23, Math.sin(a + t * 0.015) * r - 8, 1, 1, 1); }
      sparks.end();
    },
    resize() {},
    dispose() { ready = false; sparks?.destroy(scene); scene.destroy(); },
  };
  return view;
}

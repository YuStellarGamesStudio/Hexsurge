import { Game, Scene, Mesh, InstancedMesh, PBRMaterial, Texture, Vector3, Matrix4, Quaternion, Geometry } from '../../vendor/xyz/dist/src/index.js';
import { MeshBuilder } from '../../src/render/geo.js';
const q = new URLSearchParams(location.search);
const game = await Game.create({ canvas: '#game', renderer: q.get('renderer') ?? 'auto' });
window.game = game;
const c = new OffscreenCanvas(1, 1); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1, 1);
const white = await Texture.fromImage(c);
class S extends Scene {
  constructor() {
    super();
    this.ambientLight = 0.35;
    this.directionalLight.intensity = 2.2;
    this.directionalLight.direction.set(0.4, 1, 0.3).normalize();
    this.postProcessing.enabled = true;
    this.postProcessing.bloomStrength = Number(q.get('bloom') ?? 0.8);
    this.postProcessing.bloomThreshold = 1.0;
    this.postProcessing.toneMapping = 'aces';
    this.fog.enabled = true; this.fog.color = [0.1, 0.12, 0.25]; this.fog.near = 25; this.fog.far = 70;
    const ground = new MeshBuilder().ring(0, 60, 24, '#3a4a6a', { pos: [0, 0, 0] }, 0.1).build();
    this.add(new Mesh({ geometry: ground, material: new PBRMaterial({ texture: white, roughness: 1, metallic: 0 }) }));
    // matte enemies
    const eg = new MeshBuilder().ico(0.5, 0, '#a0567a', { pos: [0, 0.55, 0], scale: [1, 0.9, 1] }).cone(0.2, 0.4, 5, '#ffd86b', { pos: [0, 1.0, 0] }).box(0.7,0.1,0.7,'#222',{pos:[0,0.05,0]}).build();
    this.en = this.add(new InstancedMesh({ geometry: eg, material: new PBRMaterial({ texture: white, roughness: 1, metallic: 0 }), count: 40 }));
    const m = new Matrix4(), p = new Vector3(), r = new Quaternion(), s = new Vector3(1, 1, 1);
    for (let i = 0; i < 40; i++) { p.set((i % 8 - 4) * 1.5, 0, Math.floor(i / 8) * 1.5 - 2 + 6); r.setFromEuler(0, i, 0); this.en.setMatrixAt(i, m.compose(p, r, s)); this.en.setColorAt(i, 1, 1, 1); }
    // glowing orbs, emissive with instance colour
    const og = new MeshBuilder().ico(0.35, 1, '#ffffff', {pos:[0,0,0]}, 0).build();
    this.orbs = this.add(new InstancedMesh({ geometry: og, material: new PBRMaterial({ texture: white, roughness: 0.5, metallic: 0, emissive: [1, 1, 1] }), count: 6 }));
    const cols = [[4, 1.2, 0.2], [0.3, 2, 4], [4, 4, 0.4], [2.5, 0.5, 4], [0.3, 4, 0.8], [2, 0.3, 3]];
    cols.forEach((col, i) => { p.set(-6 + i * 2.4, 0.6, 2); r.setFromEuler(0, 0, 0); this.orbs.setMatrixAt(i, m.compose(p, r, s)); this.orbs.setColorAt(i, ...col); });
    // pure white-boost test: tint beyond 1 with no emissive
    this.orbs2 = this.add(new InstancedMesh({ geometry: og, material: new PBRMaterial({ texture: white, roughness: 0.5, metallic: 0 }), count: 3 }));
    [[4, 1.2, 0.2], [0.3, 2, 4], [2.5, 0.5, 4]].forEach((col, i) => { p.set(-3 + i * 3, 0.6, 4.5); this.orbs2.setMatrixAt(i, m.compose(p, r, s)); this.orbs2.setColorAt(i, ...col); });
    this.camera3D.position.set(0, 14, 11);
    this.camera3D.lookAt(new Vector3(0, 0, 1));
    this.camera3D.fov = 60 * Math.PI / 180;
  }
}
await game.setScene(new S());
game.start();
window.ready = true;
console.log('backend', game.graphics.backend);

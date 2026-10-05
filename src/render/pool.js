// Fixed-capacity instanced batch with a per-frame begin/push/end API. Unused instances are collapsed to zero scale.
import { InstancedMesh, Matrix4, Quaternion, Vector3 } from '../../vendor/xyz/dist/src/index.js';

const m4 = new Matrix4(), pos = new Vector3(), rot = new Quaternion(), scl = new Vector3();

export class InstancePool {
  constructor(scene, geometry, material, capacity) {
    this.capacity = capacity;
    this.mesh = scene.add(new InstancedMesh({ geometry, material, count: capacity }));
    this.mesh.frustumCulled = false;
    this.used = 0;
    this.prevUsed = capacity; // force the first end() to hide everything
    this.hidden = new Float32Array(16);
    m4.compose(pos.set(0, -999, 0), rot.set(0, 0, 0, 1), scl.set(0, 0, 0));
    this.hidden.set(m4.elements);
  }
  begin() { this.used = 0; }
  /** Adds one instance; returns false when the pool is full. Rotation is about Y (and optional X tilt). */
  push(x, y, z, sx, sy, sz, rotY = 0, r = 1, g = 1, b = 1, tiltX = 0) {
    if (this.used >= this.capacity) return false;
    const i = this.used++;
    pos.set(x, y, z);
    if (tiltX) rot.setFromEuler(tiltX, rotY, 0); else rot.setFromEuler(0, rotY, 0);
    scl.set(sx, sy, sz);
    this.mesh.setMatrixAt(i, m4.compose(pos, rot, scl));
    this.mesh.setColorAt(i, r, g, b);
    return true;
  }
  end() {
    for (let i = this.used; i < this.prevUsed; i++) {
      this.mesh.matrices.set(this.hidden, i * 16);
    }
    if (this.prevUsed > this.used) this.mesh.version++;
    this.prevUsed = this.used;
  }
  destroy(scene) { scene.remove(this.mesh); this.mesh.destroy?.(); }
}

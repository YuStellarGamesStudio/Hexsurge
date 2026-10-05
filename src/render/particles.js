// CPU particles, expanding rings and lightning arcs, all drawn through shared InstancePools (one per colour).
import { glow, zoneMaterial } from './materials.js';
import { shapeGeometry } from './vfx-shapes.js';
import { InstancePool } from './pool.js';
import { hexToRgb } from './colors.js';

const MAX_PARTICLES = 700;

export class ParticleFX {
  constructor(scene) {
    this.scene = scene;
    this.sparkPools = new Map();
    this.ringPools = new Map();
    this.arcPools = new Map();
    this.particles = [];
    this.rings = [];
    this.arcs = [];
  }

  pool(map, key, make) {
    let p = map.get(key);
    if (!p) { p = make(); map.set(key, p); }
    return p;
  }

  /** o: { color, count, speed, size, life, gravity=6, up=2, spread=1 } */
  burst(x, y, z, o) {
    const n = Math.min(o.count ?? 6, MAX_PARTICLES - this.particles.length);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (o.speed ?? 4) * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y, z, vx: Math.cos(a) * s * (o.spread ?? 1), vy: (o.up ?? 2) * (0.3 + Math.random()), vz: Math.sin(a) * s * (o.spread ?? 1),
        g: o.gravity ?? 6, life: (o.life ?? 0.5) * (0.6 + Math.random() * 0.6), age: 0, size: (o.size ?? 0.22) * (0.7 + Math.random() * 0.6), color: o.color,
        rot: Math.random() * 6.28,
      });
    }
  }

  /** Expanding flat ring on the ground. */
  ring(x, z, radius, color, dur = 0.45, from = 0.15, y = 0.08) {
    this.rings.push({ x, z, y, r: radius, from, age: 0, dur, color });
  }

  /** Lightning along `points` ([[x,z],...]). */
  arc(points, color, ttl = 0.18, y = 1.0) {
    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, az] = points[i], [bx, bz] = points[i + 1];
      const pieces = 5;
      let px = ax, pz = az;
      const nx = -(bz - az), nz = bx - ax, nl = Math.hypot(nx, nz) || 1;
      for (let k = 1; k <= pieces; k++) {
        const t = k / pieces;
        const j = k === pieces ? 0 : (Math.random() - 0.5) * 1.1;
        const qx = ax + (bx - ax) * t + (nx / nl) * j, qz = az + (bz - az) * t + (nz / nl) * j;
        segs.push([px, pz, qx, qz]);
        px = qx; pz = qz;
      }
    }
    this.arcs.push({ segs, ttl, age: 0, color, y });
  }

  update(dt) {
    for (const p of this.sparkPools.values()) p.begin();
    for (const p of this.ringPools.values()) p.begin();
    for (const p of this.arcPools.values()) p.begin();

    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      if (p.age >= p.life) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      p.vy -= p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.05) { p.y = 0.05; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
      const k = 1 - p.age / p.life;
      const pool = this.pool(this.sparkPools, p.color, () => new InstancePool(this.scene, shapeGeometry('spark'), glow(p.color, 2.2), 160));
      const s = p.size * (0.4 + 0.6 * k);
      pool.push(p.x, p.y, p.z, s, s, s, p.rot + p.age * 6, 1, 1, 1);
    }

    const rs = this.rings;
    for (let i = rs.length - 1; i >= 0; i--) {
      const r = rs[i];
      r.age += dt;
      if (r.age >= r.dur) { rs[i] = rs[rs.length - 1]; rs.pop(); continue; }
      const k = r.age / r.dur;
      const ease = 1 - (1 - k) * (1 - k);
      const radius = (r.from + (1 - r.from) * ease) * r.r * 2;
      const fade = 1 - k;
      const pool = this.pool(this.ringPools, r.color, () => new InstancePool(this.scene, shapeGeometry('ring'), glow(r.color, 1.8), 48));
      pool.push(r.x, r.y, r.z, radius, 1 + (1 - k) * 0.0, radius, 0, fade, fade, fade);
    }

    const as = this.arcs;
    for (let i = as.length - 1; i >= 0; i--) {
      const a = as[i];
      a.age += dt;
      if (a.age >= a.ttl) { as[i] = as[as.length - 1]; as.pop(); continue; }
      const f = 1 - a.age / a.ttl;
      const pool = this.pool(this.arcPools, a.color, () => new InstancePool(this.scene, shapeGeometry('bolt'), glow(a.color, 2.6), 300));
      for (const [x0, z0, x1, z1] of a.segs) {
        const len = Math.hypot(x1 - x0, z1 - z0) || 0.01;
        pool.push((x0 + x1) / 2, a.y, (z0 + z1) / 2, len * 1.05, 0.5 + f, 0.5 + f, -Math.atan2(z1 - z0, x1 - x0), 1, 1, 1);
      }
    }

    for (const p of this.sparkPools.values()) p.end();
    for (const p of this.ringPools.values()) p.end();
    for (const p of this.arcPools.values()) p.end();
  }

  dispose() {
    for (const m of [this.sparkPools, this.ringPools, this.arcPools]) for (const p of m.values()) p.destroy(this.scene);
    this.particles.length = this.rings.length = this.arcs.length = 0;
  }
}
export { hexToRgb, zoneMaterial };

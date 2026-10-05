// Low-poly geometry kit: flat-shaded, vertex-coloured primitives merged into one Geometry.
// Colours are authored as sRGB hex / [r,g,b] 0..1 and converted to linear for the renderer.
import { Geometry } from '../../vendor/xyz/dist/src/index.js';

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** '#rrggbb' | 0xrrggbb | [r,g,b] (0..1, sRGB) -> linear [r,g,b]. */
export function linear(color) {
  let r, g, b;
  if (Array.isArray(color)) [r, g, b] = color;
  else {
    const n = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
    r = ((n >> 16) & 255) / 255; g = ((n >> 8) & 255) / 255; b = (n & 255) / 255;
  }
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

const IDENT = { pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1] };

function rotate(v, rx, ry, rz) {
  let [x, y, z] = v;
  if (rx) { const c = Math.cos(rx), s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c]; }
  if (ry) { const c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c]; }
  if (rz) { const c = Math.cos(rz), s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c]; }
  return [x, y, z];
}

export class MeshBuilder {
  constructor() { this.positions = []; this.colors = []; }

  /** Adds one flat triangle (counter-clockwise seen from outside) with a single colour. */
  tri(a, b, c, rgb) {
    this.positions.push(...a, ...b, ...c);
    this.colors.push(...rgb, 1, ...rgb, 1, ...rgb, 1);
  }

  /** Adds a transformed copy of a triangle soup (array of [a,b,c] vertex triples). */
  soup(tris, color, t = IDENT, shade = 0.12, seed = 0) {
    const pos = t.pos ?? IDENT.pos, rot = t.rot ?? IDENT.rot, scale = t.scale ?? IDENT.scale;
    const base = linear(color);
    const place = (v) => {
      const r = rotate([v[0] * scale[0], v[1] * scale[1], v[2] * scale[2]], rot[0], rot[1], rot[2]);
      return [r[0] + pos[0], r[1] + pos[1], r[2] + pos[2]];
    };
    tris.forEach((tri, i) => {
      // Per-facet brightness jitter sells the faceted low-poly look without textures.
      const j = 1 + shade * (((Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1 - 0.5);
      this.tri(place(tri[0]), place(tri[1]), place(tri[2]), [base[0] * j, base[1] * j, base[2] * j]);
    });
    return this;
  }

  box(w, h, d, color, t, shade) {
    const x = w / 2, y = h / 2, z = d / 2;
    const p = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
    const q = (a, b, c, e) => [[p[a], p[b], p[c]], [p[a], p[c], p[e]]];
    const tris = [...q(4, 5, 6, 7), ...q(1, 0, 3, 2), ...q(5, 1, 2, 6), ...q(0, 4, 7, 3), ...q(7, 6, 2, 3), ...q(0, 1, 5, 4)];
    return this.soup(tris, color, t, shade);
  }

  /** Cone / frustum: bottom radius rb at y=0, top radius rt at y=h. */
  cone(rb, h, seg, color, t, shade, rt = 0) {
    const tris = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const b0 = [Math.cos(a0) * rb, 0, Math.sin(a0) * rb], b1 = [Math.cos(a1) * rb, 0, Math.sin(a1) * rb];
      const t0 = [Math.cos(a0) * rt, h, Math.sin(a0) * rt], t1 = [Math.cos(a1) * rt, h, Math.sin(a1) * rt];
      tris.push([b1, b0, t0]);
      if (rt > 0) tris.push([b1, t0, t1], [[0, h, 0], t1, t0]);
      tris.push([[0, 0, 0], b0, b1]);
    }
    return this.soup(tris, color, t, shade);
  }

  cylinder(r, h, seg, color, t, shade) { return this.cone(r, h, seg, color, t, shade, r); }

  /** Faceted sphere (icosphere) of given radius; detail 0 = 20 faces, 1 = 80. */
  ico(radius, detail, color, t, shade) {
    const f = (1 + Math.sqrt(5)) / 2;
    let v = [[-1, f, 0], [1, f, 0], [-1, -f, 0], [1, -f, 0], [0, -1, f], [0, 1, f], [0, -1, -f], [0, 1, -f], [f, 0, -1], [f, 0, 1], [-f, 0, -1], [-f, 0, 1]]
      .map((p) => { const l = Math.hypot(...p); return p.map((c) => c / l); });
    let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let d = 0; d < detail; d++) {
      const next = [];
      const mid = (a, b) => { const m = v[a].map((c, i) => (c + v[b][i]) / 2); const l = Math.hypot(...m); v.push(m.map((c) => c / l)); return v.length - 1; };
      for (const [a, b, c] of faces) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      faces = next;
    }
    const tris = faces.map(([a, b, c]) => [v[a].map((x) => x * radius), v[b].map((x) => x * radius), v[c].map((x) => x * radius)]);
    return this.soup(tris, color, t, shade);
  }

  /** Double pyramid (gem / crystal): ring of `seg` verts at y=0, tips at +top / -bottom. */
  gem(r, top, bottom, seg, color, t, shade) {
    const tris = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const p0 = [Math.cos(a0) * r, 0, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, 0, Math.sin(a1) * r];
      tris.push([p1, p0, [0, top, 0]]);
      if (bottom) tris.push([p0, p1, [0, -bottom, 0]]);
    }
    return this.soup(tris, color, t, shade);
  }

  /** Flat ring in the XZ plane facing +Y. */
  ring(rIn, rOut, seg, color, t, shade = 0, y = 0) {
    const tris = [];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const i0 = [Math.cos(a0) * rIn, y, Math.sin(a0) * rIn], i1 = [Math.cos(a1) * rIn, y, Math.sin(a1) * rIn];
      const o0 = [Math.cos(a0) * rOut, y, Math.sin(a0) * rOut], o1 = [Math.cos(a1) * rOut, y, Math.sin(a1) * rOut];
      tris.push([i0, o1, o0], [i0, i1, o1]);
    }
    return this.soup(tris, color, t, shade);
  }

  /** Flat disc facing +Y. */
  disc(r, seg, color, t, shade = 0, y = 0) { return this.ring(0, r, seg, color, t, shade, y); }

  build() {
    const n = this.positions.length / 3;
    const positions = new Float32Array(this.positions);
    const normals = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 3) {
      const o = i * 3;
      const ux = positions[o + 3] - positions[o], uy = positions[o + 4] - positions[o + 1], uz = positions[o + 5] - positions[o + 2];
      const vx = positions[o + 6] - positions[o], vy = positions[o + 7] - positions[o + 1], vz = positions[o + 8] - positions[o + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      for (let k = 0; k < 3; k++) { normals[o + k * 3] = nx; normals[o + k * 3 + 1] = ny; normals[o + k * 3 + 2] = nz; }
    }
    const indices = new Uint32Array(n);
    for (let i = 0; i < n; i++) indices[i] = i;
    const geometry = new Geometry({ positions, normals, uvs: new Float32Array(n * 2), indices, colors: new Float32Array(this.colors) });
    return geometry;
  }
}

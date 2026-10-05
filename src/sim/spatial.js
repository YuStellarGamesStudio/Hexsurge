// Uniform grid over live enemies; rebuilt once per simulation step.
import { SIM } from '../data/config.js';

export class Grid {
  constructor(cell = SIM.gridCell) {
    this.cell = cell;
    this.cells = new Map();
    this.pool = [];
  }
  clear() {
    for (const list of this.cells.values()) { list.length = 0; this.pool.push(list); }
    this.cells.clear();
  }
  key(cx, cz) { return (cx + 512) * 1024 + (cz + 512); }
  insert(e) {
    const k = this.key(Math.floor(e.x / this.cell), Math.floor(e.z / this.cell));
    let list = this.cells.get(k);
    if (!list) { list = this.pool.pop() ?? []; this.cells.set(k, list); }
    list.push(e);
  }
  /** Calls fn(enemy) for every enemy whose centre is within r + enemy.r of (x,z). Return false from fn to stop. */
  query(x, z, r, fn) {
    const c = this.cell, reach = r + 2.5; // 2.5 ~ largest ordinary enemy radius
    const x0 = Math.floor((x - reach) / c), x1 = Math.floor((x + reach) / c);
    const z0 = Math.floor((z - reach) / c), z1 = Math.floor((z + reach) / c);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const list = this.cells.get(this.key(cx, cz));
      if (!list) continue;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (e.dead) continue;
        const dx = e.x - x, dz = e.z - z, rr = r + e.r;
        if (dx * dx + dz * dz <= rr * rr && fn(e) === false) return;
      }
    }
  }
  /** Nearest live enemy within maxR (centre distance), optional filter(e). */
  nearest(x, z, maxR, filter) {
    let best = null, bestD = maxR * maxR;
    this.query(x, z, maxR, (e) => {
      if (filter && !filter(e)) return;
      const dx = e.x - x, dz = e.z - z, d = dx * dx + dz * dz;
      if (d < bestD) { bestD = d; best = e; }
    });
    return best;
  }
}

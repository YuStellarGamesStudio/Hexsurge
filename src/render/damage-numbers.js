// Damage / reaction popups on a dedicated 2D canvas: fixed font size in CSS pixels, independent of camera zoom (§4 readability).
const MAX_ITEMS = 48;

export class DamageNumbers {
  /** parent: element to host the canvas (pointer-events: none). */
  constructor(parent) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fx-canvas';
    Object.assign(this.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '2' });
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.items = [];
    this.dpr = 1; this.w = 0; this.h = 0;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = r.width; this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
  }

  /** o: { text, x, y, z (world), color, size=18, life=0.8, crit, rise=46 } */
  add(o) {
    if (this.items.length >= MAX_ITEMS) this.items.shift();
    this.items.push({ ...o, age: 0, life: o.life ?? 0.8, size: o.size ?? 18, rise: o.rise ?? 46, dx: (Math.random() - 0.5) * 24 });
  }

  clear() { this.items.length = 0; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }

  /** project(x,y,z) -> {x,y} in CSS px or null when behind the camera. */
  draw(dt, project) {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.age += dt;
      if (it.age >= it.life) { this.items.splice(i, 1); continue; }
      const p = project(it.x, it.y ?? 1.2, it.z);
      if (!p) continue;
      const k = it.age / it.life;
      const pop = it.crit ? 1 + Math.max(0, 0.45 - k * 2) : 1;
      const px = p.x + it.dx * k, py = p.y - it.rise * (1 - (1 - k) ** 2);
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.font = `800 ${Math.round(it.size * pop)}px "Trebuchet MS", "Noto Sans TC", "Hiragino Sans", system-ui, sans-serif`;
      ctx.lineWidth = Math.max(3, it.size * 0.2);
      ctx.strokeStyle = 'rgba(8,6,24,0.85)';
      ctx.strokeText(it.text, px, py);
      ctx.fillStyle = it.color ?? '#fff';
      ctx.fillText(it.text, px, py);
    }
    ctx.globalAlpha = 1;
  }
}

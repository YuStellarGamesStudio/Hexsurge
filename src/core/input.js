// Input (§5): one-handed play. Virtual floating joystick (touch / pen / mouse drag) and WASD / arrow keys.
// mode: 'auto' (keys while a keyboard was last used, joystick after touch), 'joystick', 'keys'.
// Vector convention: x = right, z = down-screen (world +z points toward the camera). Magnitude <= 1.
const KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};

export class Input {
  /** zone: element that receives pointer input (the battle screen); stick: container for the joystick visuals. */
  constructor(zone, stick) {
    this.zone = zone; this.stick = stick;
    this.mode = 'auto';
    this.down = new Set();
    this.joy = { active: false, id: -1, cx: 0, cz: 0, x: 0, z: 0 };
    this.lastDevice = 'keys';
    this.enabled = false;
    this.radius = 56;
    this.base = document.createElement('div'); this.base.className = 'joystick-base';
    this.knob = document.createElement('div'); this.knob.className = 'joystick-knob';
    this.base.appendChild(this.knob);
    this.base.hidden = true;
    stick.appendChild(this.base);
    this.onKeyDown = (e) => {
      if (!(e.code in KEYS)) return;
      this.down.add(e.code); this.lastDevice = 'keys';
      if (this.enabled) e.preventDefault();
    };
    this.onKeyUp = (e) => this.down.delete(e.code);
    this.onBlur = () => { this.down.clear(); this.release(); };
    this.onPointerDown = (e) => {
      if (!this.enabled || this.joy.active || e.target.closest('button, [data-no-stick]')) return;
      if (this.mode === 'keys') return;
      if (this.mode === 'auto' && e.pointerType === 'mouse' && e.button !== 0) return;
      this.joy.active = true; this.joy.id = e.pointerId; this.joy.cx = e.clientX; this.joy.cz = e.clientY; this.joy.x = 0; this.joy.z = 0;
      this.lastDevice = e.pointerType === 'mouse' ? 'mouse' : 'touch';
      const r = this.stick.getBoundingClientRect();
      this.base.style.left = `${e.clientX - r.left}px`; this.base.style.top = `${e.clientY - r.top}px`;
      this.knob.style.transform = 'translate(-50%, -50%)';
      this.base.hidden = false;
      zone.setPointerCapture?.(e.pointerId);
    };
    this.onPointerMove = (e) => {
      if (!this.joy.active || e.pointerId !== this.joy.id) return;
      let dx = e.clientX - this.joy.cx, dz = e.clientY - this.joy.cz;
      const d = Math.hypot(dx, dz);
      if (d > this.radius) { dx *= this.radius / d; dz *= this.radius / d; }
      this.joy.x = dx / this.radius; this.joy.z = dz / this.radius;
      this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dz}px))`;
    };
    this.onPointerUp = (e) => { if (e.pointerId === this.joy.id) this.release(); };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    zone.addEventListener('pointerdown', this.onPointerDown);
    zone.addEventListener('pointermove', this.onPointerMove);
    zone.addEventListener('pointerup', this.onPointerUp);
    zone.addEventListener('pointercancel', this.onPointerUp);
  }

  release() {
    this.joy.active = false; this.joy.id = -1; this.joy.x = 0; this.joy.z = 0;
    this.base.hidden = true;
  }

  setEnabled(on) { this.enabled = on; if (!on) { this.down.clear(); this.release(); } }
  setMode(mode) { this.mode = mode; this.release(); }

  /** Current movement vector. Keyboard wins while any movement key is held. */
  vector() {
    let x = 0, z = 0;
    if (this.mode !== 'joystick') for (const k of this.down) { x += KEYS[k][0]; z += KEYS[k][1]; }
    if (x || z) { const l = Math.hypot(x, z); return { x: x / l, z: z / l }; }
    if (this.joy.active) {
      const l = Math.hypot(this.joy.x, this.joy.z);
      const dead = 0.12;
      if (l < dead) return { x: 0, z: 0 };
      const k = Math.min(1, (l - dead) / (1 - dead)) / l;
      return { x: this.joy.x * k, z: this.joy.z * k };
    }
    return { x: 0, z: 0 };
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    for (const [n, f] of [['pointerdown', this.onPointerDown], ['pointermove', this.onPointerMove], ['pointerup', this.onPointerUp], ['pointercancel', this.onPointerUp]]) this.zone.removeEventListener(n, f);
    this.base.remove();
  }
}

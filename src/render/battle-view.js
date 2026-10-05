// BattleView: turns simulation state (a `run`) into the XYZ.js scene. All batches are instanced; enemies are matte,
// spells/pickups/telegraphs are emissive (§4 readability). The view never mutates the run.
import {
  EnvironmentMap, Group, Mesh, PointLight, Scene, Vector3,
} from '../../vendor/xyz/dist/src/index.js';
import { ARENA, XP } from '../data/config.js';
import { MeshBuilder } from './geo.js';
import { DamageNumbers } from './damage-numbers.js';
import { ELEMENT_COLORS, GEM_COLORS, hexToRgb } from './colors.js';
import { glow, initMaterials, matte, zoneMaterial } from './materials.js';
import { getMapModule } from './maps/index.js';
import { buildEnemyGeometry } from './models/enemies.js';
import { createMageModel } from './models/mages.js';
import { createBossModel } from './models/bosses.js';
import { ParticleFX } from './particles.js';
import { InstancePool } from './pool.js';
import { FLAT_SHAPES, shapeGeometry } from './vfx-shapes.js';
import { gemTier } from '../sim/entities.js';

class ArenaScene extends Scene {
  update(dt) { this.onTick?.(dt); }
}

const PITCH = 60 * Math.PI / 180;   // §5: 60° look-down angle
const FOV = 46 * Math.PI / 180;
const CAMERA_DIST = 21;
const ENEMY_CAPACITY = 72;
const lookAt = new Vector3();

export class BattleView {
  /**
   * opts: { overlayParent: HTMLElement for the damage-number canvas, t(key): localisation, reducedMotion }
   */
  constructor(game, run, opts = {}) {
    this.game = game; this.run = run; this.opts = opts;
    this.scene = new ArenaScene();
    this.time = 0;
    this.shake = 0;
    this.cam = { x: 0, z: 0 };
    this.pools = new Map();
    this.enemyPools = new Map();
    this.bossModels = new Map();
    this.effects = null;
    this.numbers = null;
    this.mage = null;
    this.mapInst = null;
    this.hitStamp = new Map();
    this.camPos = new Vector3();
    this.tmp = new Vector3();
    this.ndc = new Vector3();
  }

  async init() {
    await initMaterials();
    const { scene, run } = this;
    const mod = getMapModule(run.map.id);
    this.applyLook(mod.look);
    scene.add(this.addGroup = new Group());
    const add = (o) => scene.add(o);
    this.mapInst = mod.build({
      scene, run, map: run.map, palette: run.map.palette, obstacles: run.obstacles, rng: Math.random, add,
      matte, glow, zoneMaterial, MeshBuilder, InstancePool,
    });

    this.effects = new ParticleFX(scene);
    if (this.opts.overlayParent) this.numbers = new DamageNumbers(this.opts.overlayParent);

    // Player: model + soft light + blob shadow.
    this.mage = createMageModel(run.mage);
    scene.add(this.mage.root);
    this.playerLight = new PointLight({ position: [0, 3, 0], color: hexToRgb(ELEMENT_COLORS[run.mage.element]), intensity: 6, range: 12 });
    scene.pointLights.push(this.playerLight);

    // Shared batches.
    this.shadowPool = new InstancePool(scene, new MeshBuilder().disc(0.5, 12, '#000000', undefined, 0).build(), zoneMaterialDark(), 140);
    this.gemPools = GEM_COLORS.map((c) => new InstancePool(scene, shapeGeometry('gem'), glow(c, 2.0), 90));
    this.zoneDisc = new Map();

    this.ready = true;
    await this.game.setScene(scene);
    this.resize();
  }

  applyLook(look) {
    const { scene } = this;
    scene.ambientLight = look.ambient;
    scene.directionalLight.intensity = look.sun.intensity;
    scene.directionalLight.color = look.sun.color;
    scene.directionalLight.direction.set(...look.sun.dir).normalize();
    scene.fog.enabled = true;
    scene.fog.mode = 'linear';
    scene.fog.color = look.fog.color; scene.fog.near = look.fog.near; scene.fog.far = look.fog.far;
    const pp = scene.postProcessing;
    pp.enabled = true; pp.toneMapping = 'aces'; pp.exposure = look.exposure ?? 1;
    pp.bloomStrength = look.bloom.strength; pp.bloomThreshold = look.bloom.threshold; pp.bloomRadius = 6;
    pp.fxaa = true;
    if (look.background) {
      const b = look.background;
      scene.background = EnvironmentMap.gradient({ zenith: b.zenith, horizon: b.horizon, ground: b.ground, width: 64 });
      scene.backgroundIntensity = 1;
    }
    scene.camera3D.fov = FOV; scene.camera3D.near = 0.5; scene.camera3D.far = 220;
  }

  /** Called from the engine's Scene.update through app.js: advance visuals one frame. */
  sync(run, dt) {
    if (!this.ready) return;
    this.time += dt;
    this.updateCamera(run, dt);
    this.handleEvents(run);
    this.drawPlayer(run, dt);
    this.drawEnemies(run);
    this.drawBosses(run, dt);
    this.drawProjectiles(run);
    this.drawAreas(run);
    this.drawGems(run);
    this.mapInst?.update(this.time, dt, run);
    this.effects.update(dt);
    this.numbers?.draw(dt, (x, y, z) => this.project(x, y, z));
  }

  /* ----------------------------------------------------------------- camera */

  updateCamera(run, dt) {
    const p = run.player, cam = this.scene.camera3D;
    const k = 1 - Math.exp(-9 * dt);
    this.cam.x += (p.x - this.cam.x) * k;
    this.cam.z += (p.z - this.cam.z) * k;
    const aspect = this.game.width / Math.max(1, this.game.height);
    const dist = CAMERA_DIST * Math.min(1.6, Math.max(1, 1.7 / aspect) ** 0.8);
    let sx = 0, sz = 0;
    if (this.shake > 0 && !this.opts.reducedMotion) {
      this.shake = Math.max(0, this.shake - dt);
      const m = this.shake * 0.9;
      sx = (Math.random() - 0.5) * m; sz = (Math.random() - 0.5) * m;
    }
    cam.position.set(this.cam.x + sx, Math.sin(PITCH) * dist, this.cam.z + Math.cos(PITCH) * dist + sz);
    cam.lookAt(lookAt.set(this.cam.x + sx, 0, this.cam.z + sz));
  }

  /** World point -> CSS pixels inside the canvas, or null when behind the camera. */
  project(x, y, z) {
    const cam = this.scene.camera3D;
    const w = this.game.width, h = this.game.height;
    const m = cam.updateMatrix(w / Math.max(1, h));
    const e = m.elements;
    const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
    if (cw <= 0.001) return null;
    const nx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / cw;
    const ny = (e[1] * x + e[5] * y + e[9] * z + e[13]) / cw;
    const rect = this.numbers?.canvas.getBoundingClientRect();
    const rw = rect?.width ?? w, rh = rect?.height ?? h;
    return { x: (nx * 0.5 + 0.5) * rw, y: (1 - (ny * 0.5 + 0.5)) * rh };
  }

  resize() { this.numbers?.resize(); }

  /* ----------------------------------------------------------------- drawing */

  drawPlayer(run, dt) {
    const p = run.player;
    this.mage.root.position.set(p.x, 0, p.z);
    this.mage.root.rotation.setFromEuler(0, -p.facing, 0);
    this.mage.update(dt, p);
    this.playerLight.position.set(p.x, 3.2, p.z);
    if (p.invuln > 0) this.mage.root.visible = Math.floor(this.time * 20) % 2 === 0;
    else this.mage.root.visible = true;
  }

  enemyPool(def) {
    let e = this.enemyPools.get(def.id);
    if (!e) {
      e = { pool: new InstancePool(this.scene, buildEnemyGeometry(def), matte(), ENEMY_CAPACITY), def };
      this.enemyPools.set(def.id, e);
    }
    return e;
  }

  drawEnemies(run) {
    for (const e of this.enemyPools.values()) e.pool.begin();
    this.shadowPool.begin();
    const t = this.time;
    for (const e of run.enemies) {
      if (e.dead || e.boss) continue;
      const { pool } = this.enemyPool(e.def);
      const fly = e.flying;
      const bob = fly ? 1.5 + Math.sin(t * 5 + e.id) * 0.25 : Math.abs(Math.sin(t * 7 + e.id)) * 0.09 * (e.def.speed > 3 ? 1.6 : 1);
      const punch = e.hitFlash > 0 ? 1 + e.hitFlash * 1.2 : 1;
      const grow = e.elite ? 1.45 : 1;
      const spawn = Math.min(1, e.age / 0.25);
      const s = grow * spawn * (e.fuseT > 0 ? 1 + Math.sin(t * 40) * 0.12 : 1);
      // Status tints multiply the matte vertex colours: frozen = icy, burning = ember, hit = flash.
      let r = 1, g = 1, b = 1;
      if (e.freezeT > 0) { r = 0.55; g = 0.95; b = 1.7; }
      else if (e.chillT > 0) { r = 0.75; g = 0.95; b = 1.3; }
      else if (e.burnT > 0) { r = 1.5; g = 0.8; b = 0.5; }
      if (e.erodeT > 0) { r *= 0.8; g *= 0.5; b *= 1.4; }
      if (e.elite) { r *= 1.4; g *= 1.15; b *= 0.55; }
      if (e.hitFlash > 0) { const f = 1 + e.hitFlash * 8; r *= f; g *= f; b *= f; }
      pool.push(e.x, bob, e.z, s * punch, s / punch, s * punch, -e.facing, r, g, b);
      this.shadowPool.push(e.x, 0.04, e.z, e.r * 2.2 * s * (fly ? 0.7 : 1), 1, e.r * 2.2 * s * (fly ? 0.7 : 1));
    }
    for (const e of this.enemyPools.values()) e.pool.end();
    const p = run.player;
    this.shadowPool.push(p.x, 0.04, p.z, 1.3, 1, 1.3);
    this.shadowPool.end();
  }

  drawBosses(run, dt) {
    const alive = new Set();
    for (const b of run.bosses) {
      if (b.dead) continue;
      alive.add(b.id);
      let m = this.bossModels.get(b.id);
      if (!m) {
        m = createBossModel(b.bossDef);
        this.scene.add(m.root);
        this.bossModels.set(b.id, m);
      }
      m.root.position.set(b.x, 0, b.z);
      m.root.rotation.setFromEuler(0, -b.facing, 0);
      m.update(dt, b);
    }
    for (const [id, m] of this.bossModels) {
      if (!alive.has(id)) { this.scene.remove(m.root); this.bossModels.delete(id); }
    }
  }

  projectilePool(key, shape, color, power, cap) {
    let p = this.pools.get(key);
    if (!p) { p = new InstancePool(this.scene, shapeGeometry(shape), glow(color, power), cap); this.pools.set(key, p); }
    return p;
  }

  drawProjectiles(run) {
    for (const p of this.pools.values()) p.begin();
    const t = this.time;
    const put = (obj, power, tag, lift = 0.9) => {
      const v = obj.vfx ?? { shape: 'orb', color: '#ffffff', size: 0.6, glow: 1 };
      const pool = this.projectilePool(`${tag}|${v.shape}|${v.color}|${v.glow ?? 1}`, v.shape, v.color, (v.glow ?? 1) * power, 120);
      const size = (v.size ?? 0.6) * (obj.sizeMult ?? 1);
      const y = FLAT_SHAPES.has(v.shape) ? 0.1 : lift;
      const spin = v.spin ? t * v.spin : 0;
      pool.push(obj.x, y, obj.z, size, size, size, -(obj.angle ?? obj.facing ?? 0) + spin);
    };
    for (const p of run.projectiles) put(p, 1.4, 'p');
    for (const p of run.eprojectiles) put(p, 1.2, 'e');
    for (const o of run.orbiters) put(o, 1.4, 'o', 1.0);
    for (const m of run.minions) put(m, 1.0, 'm', 1.1);
    for (const p of this.pools.values()) p.end();
  }

  drawAreas(run) {
    const t = this.time;
    for (const p of this.zoneDisc.values()) p.begin();
    const zoneBatch = (color, kind, shape, opacity) => {
      const key = `${kind}|${shape}|${color}|${opacity}`;
      let p = this.zoneDisc.get(key);
      if (!p) { p = new InstancePool(this.scene, shapeGeometry(shape), zoneMaterial(color, kind === 'warn' ? 1.6 : 1.1, opacity), 40); this.zoneDisc.set(key, p); }
      return p;
    };
    // Persistent spell areas: translucent disc + bright ring so enemies stay readable on top.
    for (const a of run.areas) {
      const color = a.vfx?.color ?? ELEMENT_COLORS[a.element] ?? '#ffffff';
      const fade = Math.min(1, a.life / 0.6, (a.maxLife - a.life) / 0.2 + 0.2);
      const r = a.r * 2 * (a.warm > 0 ? 0.9 : 1) * (0.97 + Math.sin(t * 4 + a.id) * 0.03);
      zoneBatch(color, 'area', 'disc', 0.22).push(a.x, 0.06, a.z, r * Math.max(0.2, fade), 1, r * Math.max(0.2, fade), 0);
      zoneBatch(color, 'ring', 'ring', 0.75).push(a.x, 0.09, a.z, r, 1, r, t * 0.5);
    }
    // Delayed strikes: red-hot telegraph that fills as the impact nears.
    for (const s of run.strikes) {
      if (!s.warn) continue;
      const color = s.vfx?.color ?? ELEMENT_COLORS[s.element] ?? '#ff4f6a';
      const k = 1 - Math.max(0, s.t / s.delay);
      const r = s.r * 2;
      zoneBatch(color, 'ring', 'ring', 0.75).push(s.x, 0.1, s.z, r, 1, r, 0);
      zoneBatch(color, 'warn', 'disc', 0.28).push(s.x, 0.07, s.z, r * k, 1, r * k, 0);
    }
    // Hazard / boss zones.
    for (const z of run.zones) {
      const warming = z.warn > 0;
      const color = z.color;
      const r = z.r * 2;
      if (warming) {
        const k = 1 - z.warn / z.warnMax;
        zoneBatch(color, 'ring', 'ring', 0.75).push(z.x, 0.1, z.z, r, 1, r, 0);
        zoneBatch(color, 'warn', 'disc', 0.28).push(z.x, 0.07, z.z, r * k, 1, r * k, 0);
      } else {
        const pulse = 0.95 + Math.sin(t * 8) * 0.05;
        zoneBatch(color, 'area', 'disc', z.oneShot ? 0.45 : 0.3).push(z.x, 0.08, z.z, r * pulse, 1, r * pulse, 0);
        zoneBatch(color, 'ring', 'ring', 0.75).push(z.x, 0.1, z.z, r, 1, r, t);
      }
    }
    for (const p of this.zoneDisc.values()) p.end();
  }

  drawGems(run) {
    for (const p of this.gemPools) p.begin();
    const t = this.time;
    for (const g of run.gems) {
      const tier = Math.min(this.gemPools.length - 1, gemTier(g.v));
      const s = 0.38 + tier * 0.06 + Math.sin(t * 5 + g.id) * 0.04;
      this.gemPools[tier].push(g.x, 0.55 + Math.sin(t * 3 + g.id) * 0.08, g.z, s, s, s, t * 1.5 + g.id);
    }
    for (const p of this.gemPools) p.end();
  }

  /* ----------------------------------------------------------------- events */

  handleEvents(run) {
    const fx = this.effects;
    const ev = run.events;
    const L = this.opts.t;
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      const color = ELEMENT_COLORS[e.element] ?? ELEMENT_COLORS.neutral;
      switch (e.type) {
        case 'hit': {
          fx.burst(e.x, 0.9, e.z, { color, count: e.crit ? 5 : 2, speed: 3.5, size: 0.17, life: 0.35 });
          if (this.numbers && (!e.dot) && this.numberBudget(e)) this.numbers.add({
            text: String(Math.max(1, Math.round(e.amount))), x: e.x, y: 1.6, z: e.z, color: e.crit ? '#ffe45c' : color === '#ffffff' ? '#fff' : color,
            size: e.crit ? 24 : e.boss ? 20 : 17, crit: e.crit, life: e.crit ? 0.95 : 0.7,
          });
          break;
        }
        case 'kill': fx.burst(e.x, 0.8, e.z, { color: e.element ? color : '#d8c8ff', count: e.elite || e.boss ? 18 : 6, speed: 4.5, size: 0.24, life: 0.55, up: 3 }); break;
        case 'burst': {
          fx.ring(e.x, e.z, e.r, color, e.kind === 'nova' ? 0.5 : 0.4);
          fx.burst(e.x, 0.5, e.z, { color, count: Math.min(14, 4 + Math.round(e.r * 2)), speed: 2 + e.r, size: 0.26, life: 0.5, up: 3, spread: 1 });
          if (e.kind === 'meteor' || e.kind === 'enemy_explosion' || e.kind === 'hazard') this.addShake(0.18);
          break;
        }
        case 'arc': fx.arc(e.points, color, e.ttl); break;
        case 'cast': fx.burst(e.x, 1.2, e.z, { color, count: 2, speed: 2.4, size: 0.14, life: 0.3 }); break;
        case 'pickup': fx.burst(e.x, 0.6, e.z, { color: '#9fffe8', count: 2, speed: 1.4, size: 0.12, life: 0.3, up: 3 }); break;
        case 'levelup': fx.ring(run.player.x, run.player.z, 5, '#ffe45c', 0.7); fx.burst(run.player.x, 0.5, run.player.z, { color: '#ffe45c', count: 22, speed: 5, size: 0.24, life: 0.9, up: 7, gravity: 4 }); break;
        case 'evolve': fx.ring(run.player.x, run.player.z, 9, color, 0.9); fx.burst(run.player.x, 0.5, run.player.z, { color, count: 40, speed: 8, size: 0.3, life: 1.1, up: 8, gravity: 3 }); this.addShake(0.4); break;
        case 'hurt': this.addShake(0.3); fx.burst(e.x, 1, e.z, { color: '#ff4f6a', count: 6, speed: 4, size: 0.2, life: 0.4 }); break;
        case 'reaction': if (this.numbers && L) this.numbers.add({ text: L(`reaction.${e.kind}`), x: e.x, y: 2.4, z: e.z, color: '#fff', size: 15, life: 1.0, rise: 60 }); fx.ring(e.x, e.z, 2.2, '#ffffff', 0.4); break;
        case 'freeze': fx.burst(e.x, 0.8, e.z, { color: ELEMENT_COLORS.ice, count: 8, speed: 2.5, size: 0.2, life: 0.5 }); break;
        case 'healpulse': fx.ring(e.x, e.z, e.r, ELEMENT_COLORS.nature, 0.6); break;
        case 'summon': fx.ring(e.x, e.z, 2.5, '#c78cff', 0.5); fx.burst(e.x, 0.6, e.z, { color: '#c78cff', count: 10, speed: 3, size: 0.22, life: 0.6 }); break;
        case 'fuse': fx.burst(e.x, 1.2, e.z, { color: '#ffe04a', count: 3, speed: 2, size: 0.16, life: 0.3 }); break;
        case 'enemyShot': fx.burst(e.x, 1, e.z, { color: '#ff7ac8', count: 2, speed: 2, size: 0.12, life: 0.25 }); break;
        case 'bossSpawn': this.addShake(0.8); fx.ring(e.x, e.z, 12, '#ff4f6a', 1.1); fx.burst(e.x, 0.5, e.z, { color: '#ff4f6a', count: 40, speed: 9, size: 0.34, life: 1.1, up: 6 }); break;
        case 'bossEnrage': this.addShake(0.6); fx.ring(e.x, e.z, 10, '#ff3a3a', 0.9); break;
        case 'bossCast': fx.ring(e.x, e.z, 3, '#ff9ad0', 0.5); break;
        case 'bossKill': this.addShake(0.9); fx.ring(e.x, e.z, 14, '#ffe45c', 1.2); fx.burst(e.x, 0.8, e.z, { color: '#ffe45c', count: 60, speed: 10, size: 0.34, life: 1.3, up: 9, gravity: 4 }); break;
        case 'death': fx.burst(e.x, 1, e.z, { color: '#ff4f6a', count: 40, speed: 7, size: 0.3, life: 1.0, up: 6 }); break;
        default: break;
      }
    }
  }

  addShake(v) { this.shake = Math.min(0.6, Math.max(this.shake, v)); }

  /** Keep damage popups readable at 50+ simultaneous hits: at most a few per enemy per 80 ms. */
  numberBudget(e) {
    const now = this.time;
    const last = this.hitStamp.get(e.id) ?? -1;
    if (now - last < 0.08 && !e.crit) return false;
    this.hitStamp.set(e.id, now);
    if (this.hitStamp.size > 400) this.hitStamp.clear();
    return true;
  }

  dispose() {
    this.effects?.dispose();
    this.mapInst?.dispose?.();
    this.numbers?.canvas.remove();
    for (const m of this.bossModels.values()) this.scene.remove(m.root);
    this.scene.destroy();
  }
}

function zoneMaterialDark() { return zoneMaterial('#05030f', 0, 0.38); }
export { XP, ARENA };

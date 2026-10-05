// Public audio facade (§5.6). Scores remain data; only XYZ's OPM synthesizer produces sound.
import { loadTrack, trackIds } from '../data/audio/tracks/index.js';
import { voices } from '../data/audio/voices.js';
import { sfx as effects } from '../data/audio/sfx.js';
import { audioSettings as tuning } from '../data/audio/settings.js';
import { MAP_BY_ID } from '../data/maps.js';

export const audio = {
  game: null,
  init(game) {
    this.stopMusic();
    this.game = game;
    this.assets = new Map(); this.rotation = new Map(); this.lastSfx = new Map();
    this.activeSfx = []; this.music = []; this.wish = null; this.unlocked = false;
    this.serial = 0; this.unlocking = null; this.starting = null;
    this.lastGlobal = -Infinity; this.pickupAt = -Infinity; this.combo = 0;
    this.settings = { ...tuning.defaults };
  },
  async unlock() {
    if (!this.game?.audio) return;
    try {
      if (!this.unlocking) this.unlocking = this.game.audio.unlock();
      await this.unlocking;
      this.unlocked = true;
      if (this.wish && !this.current) await this.startMusic(this.wish, this.serial);
    } catch { this.unlocking = null; }
  },
  async asset(key, data) {
    if (!this.assets.has(key)) {
      const manager = this.game.audio;
      const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
      const pending = manager.load(url).finally(() => URL.revokeObjectURL(url));
      this.assets.set(key, pending);
      pending.catch(() => this.assets.delete(key));
    }
    return this.assets.get(key);
  },
  resolve(id) {
    if (id.startsWith('boss:')) return 'boss';
    if (id.startsWith('battle:')) {
      const map = id.slice('battle:'.length), list = MAP_BY_ID[map]?.music;
      if (!list) return null;
      const n = this.rotation.get(map) || 0;
      this.rotation.set(map, n + 1);
      return list[n % list.length];
    }
    return trackIds.includes(id) ? id : null;
  },
  playMusic(id) {
    if (!this.game?.audio || id === this.wish) return Promise.resolve();
    this.wish = id;
    const token = ++this.serial;
    if (!this.unlocked) return Promise.resolve();
    return this.startMusic(id, token);
  },
  async startMusic(id, token) {
    try {
      // Resolve once: concurrent unlock gestures must not rotate or duplicate a track.
      if (this.starting === token) return;
      this.starting = token;
      const trackId = this.resolve(id), score = trackId && await loadTrack(trackId);
      if (!score || token !== this.serial) return;
      const unit = 60 / score.bpm;
      const assets = await Promise.all(score.layers.map((layer, i) => {
        const patch = score.voices[layer.voice];
        const velocity = layer.notes.reduce((sum,n) => sum + (n[3] ?? 1), 0) / layer.notes.length;
        const voice = { ...patch, ops: patch.ops.map(op => ({ ...op, level: op.level * velocity })) };
        return this.asset(`music:${trackId}:${i}`, { channel: 'music', loop: true,
          duration: score.beats * unit, voice,
          notes: layer.notes.map(([t,n,d]) => ({ note:n, time:t*unit, duration:d*unit })) });
      }));
      if (token !== this.serial) return;
      const manager = this.game.audio, channel = manager.music;
      channel.cancelAutomation();
      // XYZ exposes one shared music bus, not per-playback gain. Fade through silence
      // instead of doubling full-level chords and starving its eight FM slots.
      if (this.music.length) {
        const end = manager.currentTime + tuning.fadeSeconds;
        channel.automate(0, manager.currentTime, tuning.fadeSeconds);
        while (manager.currentTime < end && token === this.serial) {
          await new Promise(resolve => setTimeout(resolve, tuning.fadeSeconds * 1000));
        }
      }
      if (token !== this.serial) return;
      for (const playback of this.music) playback.stop();
      channel.cancelAutomation(); channel.volume = 0;
      this.music = assets.map(asset => manager.play(asset, { channel:'music', persistent:true }));
      this.current = id;
      channel.automate(this.musicLevel(), manager.currentTime, tuning.fadeSeconds);
    } catch { /* Audio is optional on unsupported/blocked devices. */ }
    finally { if (this.starting === token) this.starting = null; }
  },
  stopMusic() {
    this.serial = (this.serial || 0) + 1;
    this.wish = null; this.current = null;
    try {
      this.game?.audio?.music.cancelAutomation();
      for (const playback of this.music || []) playback.stop();
    } catch { /* Already-destroyed engine. */ }
    this.music = [];
  },
  async sfx(name, event = {}) {
    if (!this.unlocked || !this.game?.audio || !this.settings.sfxOn || this.game.audio.paused) return;
    const manager = this.game.audio, now = manager.currentTime;
    const important = tuning.important.includes(name);
    if (now - (this.lastSfx.get(name) ?? -Infinity) < (tuning.throttle[name] ?? tuning.globalInterval)) return;
    if (!important && now - this.lastGlobal < tuning.globalInterval) return;
    const key = name === 'cast' || name === 'hit' ? `${name}:${event.element || 'arcane'}` : name;
    const def = effects[key];
    if (!def) return;
    this.lastSfx.set(name, now); this.lastGlobal = now;
    let pitch = 0;
    if (name === 'pickup') {
      this.combo = now - this.pickupAt <= tuning.pickupWindow ? (this.combo + 1) % tuning.pickupSteps.length : 0;
      this.pickupAt = now; pitch = tuning.pickupSteps[this.combo];
    }
    try {
      const asset = await this.asset(`sfx:${key}:${pitch}`, { channel:'sfx', loop:false,
        duration:def.duration, voice:voices[def.voice],
        notes:def.notes.map(([t,n,d]) => ({ note:n+pitch, time:t, duration:d })) });
      if (!this.settings.sfxOn || manager !== this.game.audio || manager.paused) return;
      this.activeSfx = this.activeSfx.filter(p => p.state === 'playing');
      if (this.activeSfx.length >= tuning.maxSfxVoices) {
        if (!important) return;
        this.activeSfx.shift().stop();
      }
      this.activeSfx.push(manager.play(asset, { channel:'sfx', persistent:true }));
    } catch { /* Keep combat working when audio is unavailable. */ }
  },
  musicLevel() {
    return this.settings.musicOn ? Math.max(0, Math.min(100, this.settings.musicVolume)) / 100 * tuning.musicGain : 0;
  },
  applySettings(settings) {
    this.settings = { ...tuning.defaults, ...this.settings, ...settings };
    try {
      const manager = this.game?.audio;
      if (!manager) return;
      manager.music.cancelAutomation(); manager.music.volume = this.musicLevel();
      manager.sfx.volume = this.settings.sfxOn ? Math.max(0, Math.min(100, this.settings.sfxVolume)) / 100 * tuning.sfxGain : 0;
    } catch { /* Settings remain stored even without a live audio device. */ }
  },
  pause() { try { this.game?.audio?.pause('game'); } catch {} },
  resume() { try { this.game?.audio?.resume('game'); } catch {} },
};

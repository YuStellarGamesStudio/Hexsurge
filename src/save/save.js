// Persistence only (§6); gameplay unlocks and scores belong to src/meta/.
import { INITIAL, META_RULES } from '../data/unlocks.js';
import { MAGE_BY_ID } from '../data/mages.js';
import { MAP_BY_ID } from '../data/maps.js';
import { SPELL_BY_ID } from '../data/spells/index.js';
import { ENEMY_BY_ID } from '../data/enemies.js';
import { BOSS_BY_ID } from '../data/bosses.js';
import { DIFFICULTY } from '../data/config.js';

export const SAVE_KEY = 'hexsurge.save.v1';
export const BACKUP_KEY = `${SAVE_KEY}.backup`;
export const SAVE_VERSION = 1;
const MAX_BYTES = 2 * 1024 * 1024;
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fail = (code) => { throw new Error(code); };
const number = (v, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail('shape');
  return v;
};
const ids = (v, registry) => {
  if (!Array.isArray(v) || v.some((id) => typeof id !== 'string')) fail('shape');
  return [...new Set(v.filter((id) => Object.hasOwn(registry, id)))];
};
export function defaultSave() {
  return {
    version: SAVE_VERSION, createdAt: Date.now(),
    settings: { lang: null, musicOn: true, sfxOn: true, musicVolume: 70, sfxVolume: 80, control: 'auto', reducedMotion: false },
    unlocks: { mages: [...INITIAL.mages], spells: [], maps: [...INITIAL.maps], difficulty: INITIAL.difficulty },
    codex: { mages: [], spells: [], evolutions: [], enemies: [], bosses: [] },
    stats: { runs: 0, kills: 0, bossKills: 0, bossKillsByMap: {}, evolutions: 0, wins: 0, bestTime: 0, maxLevel: 0, bestScore: 0, playSeconds: 0 },
    scores: {}, last: { mage: 'ignis', map: 'academy', difficulty: 1 },
  };
}

/** v1 is current. Future migrations must explicitly handle their source version. */
export function migrate(raw) {
  if (!object(raw)) fail('shape');
  if (raw.version !== SAVE_VERSION) fail('version');
  const d = defaultSave();
  if (raw.createdAt !== undefined) d.createdAt = number(raw.createdAt);
  if (raw.settings !== undefined) {
    if (!object(raw.settings)) fail('shape');
    d.settings = { ...d.settings, ...raw.settings };
    if (![null, 'en', 'zh', 'ja'].includes(d.settings.lang) || !['auto', 'joystick', 'keys'].includes(d.settings.control)) fail('shape');
    for (const k of ['musicOn', 'sfxOn', 'reducedMotion']) if (typeof d.settings[k] !== 'boolean') fail('shape');
    for (const k of ['musicVolume', 'sfxVolume']) number(d.settings[k], 0, 100);
  }
  if (raw.unlocks !== undefined) {
    if (!object(raw.unlocks)) fail('shape');
    for (const [k, registry] of Object.entries({ mages: MAGE_BY_ID, spells: SPELL_BY_ID, maps: MAP_BY_ID })) {
      if (raw.unlocks[k] !== undefined) d.unlocks[k] = ids(raw.unlocks[k], registry);
    }
    // Upgrade the original v1 prototype's per-mage object to the shared ladder.
    const difficulty = raw.unlocks.difficulty;
    if (difficulty !== undefined) d.unlocks.difficulty = object(difficulty)
      ? Math.max(INITIAL.difficulty, ...Object.values(difficulty).map((n) => number(n, 1, DIFFICULTY.length, true)))
      : number(difficulty, 1, DIFFICULTY.length, true);
    for (const k of ['mages', 'maps']) d.unlocks[k] = [...new Set([...INITIAL[k], ...d.unlocks[k]])];
  }
  if (raw.codex !== undefined) {
    if (!object(raw.codex)) fail('shape');
    for (const [k, registry] of Object.entries({ mages: MAGE_BY_ID, spells: SPELL_BY_ID, evolutions: SPELL_BY_ID, enemies: ENEMY_BY_ID, bosses: BOSS_BY_ID })) {
      if (raw.codex[k] !== undefined) d.codex[k] = ids(raw.codex[k], registry);
    }
  }
  if (raw.stats !== undefined) {
    if (!object(raw.stats)) fail('shape');
    for (const k of Object.keys(d.stats)) {
      if (k === 'bossKillsByMap' || raw.stats[k] === undefined) continue;
      d.stats[k] = number(raw.stats[k], 0, Number.MAX_SAFE_INTEGER, !['bestTime', 'playSeconds'].includes(k));
    }
    if (raw.stats.bossKillsByMap !== undefined) {
      if (!object(raw.stats.bossKillsByMap)) fail('shape');
      for (const [id, n] of Object.entries(raw.stats.bossKillsByMap)) {
        number(n, 0, Number.MAX_SAFE_INTEGER, true);
        if (Object.hasOwn(MAP_BY_ID, id)) d.stats.bossKillsByMap[id] = n;
      }
    }
  }
  if (raw.scores !== undefined) {
    if (!object(raw.scores)) fail('shape');
    for (const [key, board] of Object.entries(raw.scores)) {
      if (!Array.isArray(board)) fail('shape');
      const [mage, difficulty, extra] = key.split('|');
      if (!Object.hasOwn(MAGE_BY_ID, mage) || extra !== undefined || !DIFFICULTY.some((d) => String(d.id) === difficulty)) continue;
      d.scores[key] = board.map((e) => {
        if (!object(e) || !Object.hasOwn(MAP_BY_ID, e.map) || typeof e.won !== 'boolean' || typeof e.endless !== 'boolean') fail('shape');
        return { score: number(e.score, 0, Number.MAX_SAFE_INTEGER, true), time: number(e.time), kills: number(e.kills, 0, Number.MAX_SAFE_INTEGER, true), level: number(e.level, 1, Number.MAX_SAFE_INTEGER, true), map: e.map, won: e.won, endless: e.endless, date: number(e.date) };
      }).sort((a, b) => b.score - a.score || b.date - a.date).slice(0, META_RULES.leaderboardLimit);
    }
  }
  if (raw.last !== undefined) {
    if (!object(raw.last)) fail('shape');
    const { mage, map, difficulty } = raw.last;
    if (!Object.hasOwn(MAGE_BY_ID, mage) || !Object.hasOwn(MAP_BY_ID, map)) fail('shape');
    d.last = { mage, map, difficulty: number(difficulty, 1, DIFFICULTY.length, true) };
  }
  return d;
}
const summary = (d) => ({ version: d.version, mages: d.unlocks.mages.length, spells: new Set([...INITIAL.spells, ...d.unlocks.spells, ...d.unlocks.mages.map((id) => MAGE_BY_ID[id].startSpell)]).size, maps: d.unlocks.maps.length, maxDifficulty: d.unlocks.difficulty, bestScore: d.stats.bestScore, runs: d.stats.runs, createdAt: d.createdAt });
let state = null;
let persistenceSafe = true;
let wired = false;
const listeners = new Set();
const notify = () => {
  for (const fn of listeners) {
    try { fn(state); } catch (error) { console.error('Save change listener failed', error); }
  }
};

export const save = {
  load() {
    let raw = null, notice = null;
    persistenceSafe = true;
    try {
      raw = globalThis.localStorage.getItem(SAVE_KEY);
      if (raw === null) state = defaultSave();
      else {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { fail('corrupt'); }
        try { state = migrate(parsed); } catch { fail('migration'); }
      }
    } catch (e) {
      state = defaultSave();
      notice = raw === null ? 'corrupt' : e.message;
      if (raw !== null) {
        try {
          let key = `${SAVE_KEY}.rescue.${Date.now()}`;
          while (globalThis.localStorage.getItem(key) !== null) key += '.1';
          globalThis.localStorage.setItem(key, raw);
        } catch { persistenceSafe = false; }
      }
    }
    if (!wired && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => { if (document.hidden) save.flush(); });
      globalThis.addEventListener('pagehide', () => save.flush());
      wired = true;
    }
    return { ok: !notice, notice };
  },
  get data() { return state; },
  update(fn) { fn(state); this.flush(); notify(); },
  flush() {
    if (!state || !persistenceSafe) return false;
    try { globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch { return false; }
  },
  exportJson() { return JSON.stringify(state, null, 2); },
  exportCode() {
    const bytes = new TextEncoder().encode(this.exportJson());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  },
  downloadJson() {
    const url = URL.createObjectURL(new Blob([this.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `hexsurge-save-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  },
  previewImport(textOrCode) {
    if (typeof textOrCode !== 'string') return { ok: false, error: 'parse' };
    if (textOrCode.length > MAX_BYTES || new TextEncoder().encode(textOrCode).length > MAX_BYTES) return { ok: false, error: 'size' };
    let raw;
    try {
      const text = textOrCode.trim();
      let json = text;
      if (!text.startsWith('{') && !text.startsWith('[')) {
        const binary = atob(text);
        json = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
      }
      raw = JSON.parse(json);
    } catch { return { ok: false, error: 'parse' }; }
    try { const parsed = migrate(raw); return { ok: true, summary: summary(parsed), parsed }; }
    catch (e) { return { ok: false, error: e.message === 'version' ? 'version' : 'shape' }; }
  },
  applyImport(parsed) {
    if (!persistenceSafe) return { ok: false, error: 'storage' };
    let next;
    try { next = migrate(JSON.parse(JSON.stringify(parsed))); } catch (e) { return { ok: false, error: e.message === 'version' ? 'version' : 'shape' }; }
    try {
      const current = JSON.stringify(state), incoming = JSON.stringify(next);
      globalThis.localStorage.setItem(BACKUP_KEY, current);
      globalThis.localStorage.setItem(SAVE_KEY, incoming);
    } catch { return { ok: false, error: 'storage' }; }
    state = next; persistenceSafe = true; notify();
    return { ok: true };
  },
  hasBackup() { return this.backupSummary() !== null; },
  backupSummary() {
    try { const raw = globalThis.localStorage.getItem(BACKUP_KEY); return raw ? summary(migrate(JSON.parse(raw))) : null; } catch { return null; }
  },
  restoreBackup() {
    try { const raw = globalThis.localStorage.getItem(BACKUP_KEY); return raw ? this.applyImport(JSON.parse(raw)) : { ok: false }; } catch { return { ok: false }; }
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

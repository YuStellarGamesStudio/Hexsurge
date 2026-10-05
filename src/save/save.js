// Save system (§6). Key: hexsurge.save.v1. Schema carries `version`; see DEFAULT_SAVE for the shape.
// This module owns persistence only; unlock rules live in src/meta/unlocks.js, leaderboard rules in src/meta/leaderboard.js.
export const SAVE_KEY = 'hexsurge.save.v1';
export const BACKUP_KEY = 'hexsurge.save.v1.backup';
export const SAVE_VERSION = 1;

export function defaultSave() {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    settings: { lang: null, musicOn: true, sfxOn: true, musicVolume: 70, sfxVolume: 80, control: 'auto', reducedMotion: false },
    unlocks: { mages: ['ignis'], spells: [], maps: ['academy'], difficulty: { ignis: 1 } },
    codex: { mages: [], spells: [], evolutions: [], enemies: [], bosses: [] },
    stats: { runs: 0, kills: 0, bossKills: 0, evolutions: 0, wins: 0, bestTime: 0, maxLevel: 0, playSeconds: 0 },
    scores: {},
    last: { mage: 'ignis', map: 'academy', difficulty: 1 },
  };
}

let state = null;
const listeners = new Set();

export const save = {
  /** Loads (or creates) the save. Returns { ok, notice } — notice is set when migration/parse failed and the old data was preserved. */
  load() {
    let notice = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      state = raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave();
    } catch (e) {
      state = defaultSave();
      notice = 'corrupt';
    }
    return { ok: !notice, notice };
  },
  get data() { return state; },
  /** Mutate through fn(data) then persist immediately. */
  update(fn) { fn(state); this.flush(); for (const l of listeners) l(state); },
  flush() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked: play on without persistence */ } },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

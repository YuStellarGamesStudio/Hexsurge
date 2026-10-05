// Music composition helpers. A track file (src/data/audio/tracks/<id>.js) default-exports:
//   { id, bpm, beats (loop length in beats), voices: { name: OPMVoice }, layers: [ { voice: 'name', notes: [[startBeat, midi, beats, velocity?], ...] } ] }
// OPMVoice = { algorithm 0-7, feedback, ops:[4 x { ratio, level, detune, adsr:{a,d,s,r} }], lfo?, modIndex? } (see vendor/xyz/dist/packages/audio/src/opm-adapter.d.ts).
// src/audio/audio.js turns each layer into one looping OPM asset (blob JSON) and starts all layers together.
const NAMES = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** 'c4' | 'f#3' | 'bb2' -> MIDI note (c4 = 60). */
export function midi(name) {
  const m = /^([a-g])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
}

/**
 * Parse a melody string into note tuples. Tokens: 'c4' (default length), 'c4:2' (length in beats), 'r' / 'r:2' (rest), '|' ignored.
 * opts: { step = 0.5 default token length in beats, start = 0 first beat, vel = 1 }
 */
export function line(text, { step = 0.5, start = 0, vel = 1 } = {}) {
  const out = [];
  let t = start;
  for (const tok of text.trim().split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [n, len] = tok.split(':');
    const d = len ? Number(len) : step;
    if (n !== 'r') out.push([t, midi(n), d * 0.95, vel]);
    t += d;
  }
  return out;
}

/** Repeat notes `times` times, each copy `period` beats later. */
export function repeat(notes, times, period) {
  const out = [];
  for (let i = 0; i < times; i++) for (const [s, n, d, v] of notes) out.push([s + i * period, n, d, v]);
  return out;
}

/** Shift every note by semitones (and optionally time by beats). */
export const transpose = (notes, semis, beats = 0) => notes.map(([s, n, d, v]) => [s + beats, n + semis, d, v]);

/** Block chord at `start` lasting `beats`: chord('c3', 'major'|'minor'|'sus2'|'dim'|'7', ...). */
export function chord(root, quality, start, beats, vel = 0.7) {
  const base = midi(root);
  const shapes = { major: [0, 4, 7], minor: [0, 3, 7], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], add9: [0, 4, 7, 14] };
  return shapes[quality].map((i) => [start, base + i, beats * 0.97, vel]);
}

/** Convenience: build the loop from named layers. */
export function track(id, bpm, beats, voices, layers) { return { id, bpm, beats, voices, layers }; }

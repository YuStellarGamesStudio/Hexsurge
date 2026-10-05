#!/usr/bin/env node
// Standalone score validation; optional shell tracks are checked as soon as their modules exist.
import { access } from 'node:fs/promises';

const required = ['academy', 'forest', 'tundra', 'abyss', 'void'].flatMap(map => [`${map}-1`, `${map}-2`]);
const optional = ['title', 'menu', 'boss', 'results', 'endless'];
const rows = [], errors = [];
const finite = value => typeof value === 'number' && Number.isFinite(value);
function check(ok, message) { if (!ok) throw new Error(message); }
function voiceShape(voice, name) {
  check(voice && typeof voice === 'object', `${name}: missing voice`);
  check(Number.isInteger(voice.algorithm) && voice.algorithm >= 0 && voice.algorithm <= 7, `${name}: algorithm must be 0–7`);
  check(finite(voice.feedback) && voice.feedback >= 0 && voice.feedback <= 7, `${name}: invalid feedback`);
  check(Array.isArray(voice.ops) && voice.ops.length === 4, `${name}: exactly four operators required`);
  voice.ops.forEach((op, i) => {
    const at = `${name}.ops[${i}]`;
    check(op && finite(op.ratio) && op.ratio > 0, `${at}: invalid ratio`);
    check(finite(op.level) && op.level >= 0 && op.level <= 1, `${at}: invalid level`);
    check(finite(op.detune), `${at}: invalid detune`);
    check(op.adsr && ['a', 'd', 's', 'r'].every(k => finite(op.adsr[k]) && op.adsr[k] >= 0), `${at}: invalid ADSR`);
    check(op.adsr.s <= 1, `${at}: sustain exceeds 1`);
  });
  if (voice.lfo) check(['rate', 'amDepth', 'pmDepth'].every(k => finite(voice.lfo[k]) && voice.lfo[k] >= 0), `${name}: invalid LFO`);
  if (voice.modIndex !== undefined) check(finite(voice.modIndex) && voice.modIndex >= 0, `${name}: invalid modulation index`);
}
for (const id of [...required, ...optional]) {
  const url = new URL(`../src/data/audio/tracks/${id}.js`, import.meta.url);
  try { await access(url); } catch (error) {
    if (error.code === 'ENOENT' && optional.includes(id)) continue;
    errors.push(`${id}: ${error.message}`); continue;
  }
  try {
    const { default: track } = await import(url.href);
    check(track?.id === id, 'id must match module filename');
    check(finite(track.bpm) && track.bpm > 0, 'bpm must be positive');
    check(finite(track.beats) && track.beats > 0, 'beats must be positive');
    check(track.voices && typeof track.voices === 'object', 'voices must be an object');
    for (const [name, voice] of Object.entries(track.voices)) voiceShape(voice, name);
    check(Array.isArray(track.layers) && track.layers.length > 0, 'layers must be nonempty');
    let count = 0;
    for (const [i, layer] of track.layers.entries()) {
      check(Object.hasOwn(track.voices, layer.voice), `layer ${i}: unknown voice ${layer.voice}`);
      check(Array.isArray(layer.notes), `layer ${i}: notes must be an array`);
      for (const [j, note] of layer.notes.entries()) {
        const at = `layer ${i}, note ${j}`;
        check(Array.isArray(note) && (note.length === 3 || note.length === 4), `${at}: expected [start, midi, duration, velocity?]`);
        const [start, midi, duration, velocity = 1] = note;
        check(finite(start) && start >= 0 && start < track.beats, `${at}: start outside loop`);
        check(Number.isInteger(midi) && midi >= 21 && midi <= 108, `${at}: MIDI outside 21–108`);
        check(finite(duration) && duration > 0 && start + duration <= track.beats + 1e-8, `${at}: duration outside loop`);
        check(finite(velocity) && velocity >= 0 && velocity <= 1, `${at}: invalid velocity`);
        count++;
      }
    }
    if (required.includes(id)) {
      check(track.beats >= 32 && track.beats <= 64, 'map loops must be 32–64 beats');
      check(track.bpm >= 96 && track.bpm <= 152, 'map tempo must be 96–152 BPM');
      check(track.layers.length >= 3 && track.layers.length <= 5, 'map tracks need 3–5 layers');
      check(track.layers.every(layer => layer.notes.length <= 600), 'map layer exceeds 600 notes');
      for (const [name, voice] of Object.entries(track.voices)) check(voice.ops.reduce((sum, op) => sum + op.level, 0) <= 0.5 + 1e-8, `${name}: map voice exceeds SFX headroom`);
    }
    rows.push({ track: id, bpm: track.bpm, beats: track.beats, layers: track.layers.length, notes: count, seconds: Number((track.beats * 60 / track.bpm).toFixed(2)) });
  } catch (error) { errors.push(`${id}: ${error.message}`); }
}
console.table(rows);
if (errors.length) { errors.forEach(error => console.error(error)); process.exitCode = 1; }
else console.log(`Validated ${rows.length} looping FM tracks.`);

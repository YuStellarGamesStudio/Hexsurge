import test from 'node:test';
import assert from 'node:assert/strict';
import { save, defaultSave, migrate, SAVE_KEY, BACKUP_KEY } from '../src/save/save.js';
const storage = new Map();
globalThis.localStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
const reset = () => { storage.clear(); save.load(); };
test('UTF-8 JSON and standard Base64 round trips preserve future settings', () => {
  reset(); save.update(d => { d.settings.future = { label: '魔法 ✨' }; d.stats.runs = 7; });
  for (const text of [save.exportJson(), save.exportCode()]) {
    const preview = save.previewImport(text);
    assert.equal(preview.ok, true); assert.equal(preview.summary.runs, 7);
    assert.deepEqual(preview.parsed, save.data);
  }
  assert.match(save.exportCode(), /^[A-Za-z0-9+/]+=*$/);
});
test('invalid imports never mutate live state or storage', () => {
  reset(); const original = save.exportJson(), persisted = storage.get(SAVE_KEY);
  for (const text of ['{bad', 'not-base64!', JSON.stringify({ ...defaultSave(), version: 999 }), JSON.stringify({ ...defaultSave(), stats: { kills: -1 } })]) assert.equal(save.previewImport(text).ok, false);
  assert.equal(save.exportJson(), original); assert.equal(storage.get(SAVE_KEY), persisted);
  assert.equal(save.previewImport(JSON.stringify({ version: 2 })).error, 'version');
  assert.equal(save.previewImport('x'.repeat(2 * 1024 * 1024 + 1)).error, 'size');
});
test('import makes a reversible backup; previews do not write', () => {
  reset(); save.update(d => { d.stats.runs = 2; });
  const next = defaultSave(); next.stats.runs = 9;
  const preview = save.previewImport(JSON.stringify(next)); assert.equal(save.hasBackup(), false);
  assert.equal(save.applyImport(preview.parsed).ok, true);
  assert.equal(JSON.parse(storage.get(BACKUP_KEY)).stats.runs, 2);
  assert.equal(save.backupSummary().runs, 2);
  assert.equal(save.restoreBackup().ok, true); assert.equal(save.data.stats.runs, 2);
  assert.equal(save.restoreBackup().ok, true); assert.equal(save.data.stats.runs, 9);
});
test('corrupt and future saves are rescued before replacement', () => {
  for (const [raw, notice] of [['{broken', 'corrupt'], [JSON.stringify({ version: 500 }), 'migration']]) {
    storage.clear(); storage.set(SAVE_KEY, raw);
    assert.deepEqual(save.load(), { ok: false, notice });
    assert.equal(storage.get(SAVE_KEY), raw);
    assert.ok([...storage.entries()].some(([key, value]) => key.startsWith(`${SAVE_KEY}.rescue.`) && value === raw));
    save.flush(); assert.equal(JSON.parse(storage.get(SAVE_KEY)).version, 1);
  }
});
test('prototype v1 migration and strict validation', () => {
  const old = defaultSave(); old.unlocks.difficulty = { ignis: 2 }; delete old.stats.bestScore;
  assert.equal(migrate(old).unlocks.difficulty, 2); assert.equal(migrate(old).stats.bestScore, 0);
  const raw = defaultSave(); raw.unlocks.mages.push('unknown'); assert.deepEqual(migrate(raw).unlocks.mages, ['ignis']);
  raw.settings.musicVolume = '70'; assert.throws(() => migrate(raw), /shape/);
});
test('failed storage import leaves live state unchanged', () => {
  reset(); save.update(d => { d.stats.runs = 3; });
  const original = save.exportJson(), setItem = localStorage.setItem;
  localStorage.setItem = (key, value) => { if (key === SAVE_KEY) throw new Error('quota'); setItem(key, value); };
  const next = defaultSave(); next.stats.runs = 8;
  assert.equal(save.applyImport(next).ok, false); assert.equal(save.exportJson(), original);
  localStorage.setItem = setItem;
});
test('rescue failure prevents accidental destruction of unreadable original', () => {
  storage.clear(); storage.set(SAVE_KEY, '{unreadable');
  const setItem = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('blocked'); };
  assert.equal(save.load().notice, 'corrupt');
  localStorage.setItem = setItem;
  assert.equal(save.flush(), false);
  assert.equal(save.applyImport(defaultSave()).ok, false);
  assert.equal(storage.get(SAVE_KEY), '{unreadable');
  reset();
});

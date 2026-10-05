import test from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS } from '../src/i18n/strings.js';
import { MAGES } from '../src/data/mages.js';
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES } from '../src/data/bosses.js';
import { MAPS } from '../src/data/maps.js';
import { PASSIVES } from '../src/data/passives.js';
import { SPELLS } from '../src/data/spells/index.js';
const languages = ['en', 'zh', 'ja'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
test('all UI keys have nonempty English, Traditional Chinese, and Japanese translations', () => {
  const keys = new Set(languages.flatMap(lang => Object.keys(STRINGS[lang]))), errors = [];
  for (const key of keys) for (const lang of languages) if (!nonempty(STRINGS[lang][key])) errors.push(`STRINGS.${lang}.${key}`);
  assert.deepEqual(errors, [], `Missing/empty UI translations:\n${errors.join('\n')}`);
});
test('every content translation object has all three nonempty languages', () => {
  const errors = [];
  function visit(value, path) {
    if (!value || typeof value !== 'object') return;
    if (languages.some(lang => Object.hasOwn(value, lang))) {
      for (const lang of languages) if (!nonempty(value[lang])) errors.push(`${path}.${lang}`);
      return;
    }
    for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
  }
  for (const [kind, entries] of Object.entries({ mages: MAGES, enemies: ENEMIES, bosses: BOSSES, maps: MAPS, passives: PASSIVES, spells: SPELLS })) {
    for (const entry of entries) {
      for (const field of ['name', 'desc']) if (!entry[field]) errors.push(`${kind}.${entry.id}.${field} (missing translation object)`);
      visit(entry, `${kind}.${entry.id}`);
    }
  }
  assert.deepEqual(errors, [], `Missing/empty content translations:\n${errors.join('\n')}`);
});

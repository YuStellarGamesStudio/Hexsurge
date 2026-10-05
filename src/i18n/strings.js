// Merges every UI string module (each owned by one UI area) into STRINGS[lang][key].
// Key convention: '<area>.<name>'. Every key must exist in en, zh and ja.
import common from './ui/common.js';
import title from './ui/title.js';
import select from './ui/select.js';
import hud from './ui/hud.js';
import levelup from './ui/levelup.js';
import pause from './ui/pause.js';
import results from './ui/results.js';
import codex from './ui/codex.js';
import leaderboard from './ui/leaderboard.js';
import settings from './ui/settings.js';
import howto from './ui/howto.js';
import save from './ui/save.js';
import game from './ui/game.js';

const modules = [common, title, select, hud, levelup, pause, results, codex, leaderboard, settings, howto, save, game];
export const STRINGS = { en: {}, zh: {}, ja: {} };
for (const m of modules) for (const lang of Object.keys(STRINGS)) Object.assign(STRINGS[lang], m[lang]);

// Results present the recorded score ledger and final build without reconstructing rewards.
import { el, makeScreen } from './dom.js';
import { TIMELINE } from '../data/config.js';
import { SPELL_BY_ID } from '../data/spells/index.js';
import { PASSIVE_BY_ID } from '../data/passives.js';
import { MAGE_BY_ID } from '../data/mages.js';
import { MAP_BY_ID } from '../data/maps.js';
export function create(app) {
  if (!document.querySelector('link[data-results-css]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/results.css', 'data-results-css': '' }));
  const s = makeScreen('results', 'results-screen');
  let current = null, page = 0;
  const clock = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
  function illustration(folder, id, name) {
    const glyph = el('span', { class: 'result-icon-glyph', hidden: true }, '✦');
    const img = el('img', { src: `assets/illustrations/${folder}/${id}.svg`, alt: '', onError: () => { img.hidden = true; glyph.hidden = false; } });
    return el('span', { class: 'result-icon', title: name }, img, glyph);
  }
  function render() {
    const { result: r, summary = {} } = current;
    const mage = MAGE_BY_ID[r.mageId], map = MAP_BY_ID[r.mapId];
    s.el.classList.toggle('is-victory', r.won);
    const number = (v) => Math.round(v).toLocaleString();
    const header = el('header', { class: 'results-header' }, el('div', { class: 'results-crest' }, illustration('mages', r.mageId, app.L(mage.name))),
      el('div', {}, el('span', { class: 'results-eyebrow' }, app.t(r.won ? 'results.victoryEyebrow' : 'results.defeatEyebrow')), el('h1', {}, app.t(r.won ? 'results.victory' : 'results.defeat')), el('p', {}, `${app.L(mage.name)} · ${app.L(map.name)} · ${app.t(`diff.${r.difficulty}`)}`)));
    const stats = el('div', { class: 'results-stats' });
    for (const [key, value] of [['time', clock(r.time)], ['kills', number(r.kills)], ['level', r.level], ['bosses', r.bossKills], ['evolutions', r.evolutions]]) stats.append(el('div', {}, el('span', {}, app.t(`results.${key}`)), el('strong', {}, value)));
    const mult = r.scoreMultiplier;
    const breakdown = el('div', { class: 'score-breakdown' });
    for (const [key, part] of [['survivalScore', 'time'], ['killScore', 'kills'], ['eliteScore', 'elites'], ['bossScore', 'bosses'], ['levelScore', 'levels'], ['bonusScore', 'bonus']]) breakdown.append(el('div', {}, el('span', {}, app.t(`results.${key}`)), el('strong', {}, number(r.scoreParts[part]))));
    breakdown.append(el('div', { class: 'score-multiplier' }, el('span', {}, app.t('results.multiplier')), el('strong', {}, `×${mult}`)));
    const scorePanel = el('section', { class: 'results-score result-panel' }, el('h2', {}, app.t('results.score')), el('div', { class: 'results-score-number' }, number(r.score)), breakdown);
    if (summary.rank) {
      const [boardMage, boardDifficulty] = typeof summary.rank.board === 'string' ? summary.rank.board.split('|') : [r.mageId, r.difficulty];
      scorePanel.append(el('div', { class: 'results-rank' }, app.t('results.rank', { n: typeof summary.rank === 'number' ? summary.rank : summary.rank.rank }), el('small', {}, `${app.L((MAGE_BY_ID[boardMage] ?? mage).name)} · ${app.t(`diff.${Number(boardDifficulty) || r.difficulty}`)}`)));
    }
    const build = el('div', { class: 'results-build-grid' });
    for (const v of r.spells) {
      const def = SPELL_BY_ID[v.id];
      build.append(el('div', { class: `result-spell ${v.evolved ? 'evolved' : ''}`, title: app.L(def.name), 'data-element': def.element }, illustration('spells', v.id, app.L(def.name)), el('span', {}, app.L(def.name)), el('small', {}, app.t('card.level', { n: v.level }))));
    }
    const passives = el('div', { class: 'results-passives' });
    for (const [id, n] of Object.entries(r.passives)) passives.append(el('div', { title: app.L(PASSIVE_BY_ID[id].name) }, illustration('passives', id, app.L(PASSIVE_BY_ID[id].name)), el('small', {}, n)));
    const buildPanel = el('section', { class: 'results-build result-panel' }, el('h2', {}, app.t('results.build')), build, passives);
    const unlocks = summary.newUnlocks ?? [], unlockGrid = el('div', { class: 'results-unlock-grid' });
    const pageSize = 3, pages = Math.max(1, Math.ceil(unlocks.length / pageSize));
    page = Math.min(page, pages - 1);
    for (const u of unlocks.slice(page * pageSize, (page + 1) * pageSize)) {
      const def = u.type === 'mage' ? MAGE_BY_ID[u.id] : u.type === 'spell' ? SPELL_BY_ID[u.id] : u.type === 'map' ? MAP_BY_ID[u.id] : null;
      const name = def ? app.L(def.name) : app.t(`diff.${u.id}`);
      const folder = u.type === 'mage' ? 'mages' : u.type === 'spell' ? 'spells' : 'elements';
      const id = u.type === 'map' ? ({ academy: 'arcane', forest: 'nature', tundra: 'ice', abyss: 'fire', void: 'void' })[u.id] : u.type === 'difficulty' ? 'arcane' : u.id;
      unlockGrid.append(el('div', { class: 'result-unlock' }, illustration(folder, id, name), el('span', {}, name)));
    }
    const unlockPanel = el('section', { class: 'results-unlocks result-panel' }, el('h2', {}, app.t('results.unlocks')), unlocks.length ? unlockGrid : el('p', {}, app.t('results.noUnlocks')));
    if (pages > 1) unlockPanel.append(el('nav', { class: 'results-pagination' }, el('button', { onClick: () => { page = (page + pages - 1) % pages; render(); }, 'aria-label': app.t('common.prev') }, '‹'), el('span', {}, app.t('common.page', { n: page + 1, total: pages })), el('button', { onClick: () => { page = (page + 1) % pages; render(); }, 'aria-label': app.t('common.next') }, '›')));
    const actions = el('footer', { class: 'results-actions' });
    if (r.won && !r.endless) actions.append(el('button', { class: 'result-endless', onClick: () => app.continueEndless() }, app.t('results.endless', { mult: TIMELINE.endlessScoreMult })));
    for (const [key, fn] of [['retry', () => app.startRun(app.selection)], ['change', () => app.go('select')], ['title', () => app.showTitle()]]) actions.append(el('button', { onClick: fn }, app.t(`results.${key}`)));
    s.el.replaceChildren(el('div', { class: 'results-shell' }, header, stats, el('div', { class: 'results-content' }, scorePanel, el('div', { class: 'results-build-column' }, buildPanel, unlockPanel)), actions));
  }
  const show = s.show;
  s.show = (params) => { current = params; page = 0; render(); show(); };
  s.refresh = () => { if (current) render(); };
  return s;
}

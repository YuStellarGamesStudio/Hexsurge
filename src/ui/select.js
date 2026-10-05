// Setup UI uses the meta unlock API; selection never bypasses progression.
import { el, makeScreen } from './dom.js';
import { MAGES, MAGE_BY_ID } from '../data/mages.js';
import { MAPS, MAP_BY_ID } from '../data/maps.js';
import { BOSS_BY_ID } from '../data/bosses.js';
import { SPELL_BY_ID } from '../data/spells/index.js';
import { DIFFICULTY } from '../data/config.js';
import { isUnlocked, unlockProgress, maxDifficulty } from '../meta/unlocks.js';
export function create(app) {
  if (!document.querySelector('link[data-menu-css]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/menu.css', 'data-menu-css': '' }));
  const s = makeScreen('select', 'menu-screen setup-screen');
  let selected, tab = 'mage', magePage = 0, mapPage = 0;
  const unlocked = (kind, id) => isUnlocked(app.save.data, kind, id);
  function validate() {
    const last = selected ?? app.save.data.last;
    selected = { mage: MAGE_BY_ID[last.mage] && unlocked('mage', last.mage) ? last.mage : MAGES.find(m => unlocked('mage', m.id)).id, map: MAP_BY_ID[last.map] && unlocked('map', last.map) ? last.map : MAPS.find(m => unlocked('map', m.id)).id, difficulty: DIFFICULTY.some(d => d.id === last.difficulty) && unlocked('difficulty', last.difficulty) ? last.difficulty : 1 };
  }
  function hint(cond) {
    if (!cond) return '';
    const progress = unlockProgress(app.save.data, cond);
    return cond.map ? app.t('select.unlock.bossMap', { map: app.L(MAP_BY_ID[cond.map].name) }) : app.t(`select.unlock.${cond.kind}`, progress);
  }
  function choose(kind, id) { if (!unlocked(kind, id)) return; selected[kind] = id; app.save.update(d => { d.last = { ...selected }; }); refresh(); }
  const button = (text, onClick, attrs = {}) => el('button', { type: 'button', class: 'menu-button', onClick, ...attrs }, text);
  function pager(page, total, change) { return el('div', { class: 'menu-pager' }, button('‹', () => change(page - 1), { disabled: page === 0, 'aria-label': app.t('common.prev') }), el('span', {}, app.t('common.page', { n: page + 1, total })), button('›', () => change(page + 1), { disabled: page >= total - 1, 'aria-label': app.t('common.next') })); }
  function refresh() {
    validate();
    s.el.replaceChildren(el('header', { class: 'menu-header' }, button(app.t('common.back'), () => app.go('title')), el('h1', {}, app.t('select.heading'))));
    s.el.append(el('nav', { class: 'setup-tabs' }, ['mage', 'map', 'difficulty'].map(kind => button(app.t(`select.${kind}`), () => { tab = kind; refresh(); }, { 'aria-pressed': String(tab === kind) }))));
    const columns = el('div', { class: 'setup-columns', dataset: { tab } });
    const mage = el('section', { class: 'menu-panel setup-section', dataset: { kind: 'mage' } }, el('h2', {}, app.t('select.mage')));
    const grid = el('div', { class: 'mage-grid' });
    MAGES.slice(magePage * 2, magePage * 2 + 2).forEach(m => {
      const open = unlocked('mage', m.id);
      const portrait = el('img', { src: `assets/illustrations/mages/${m.id}.svg`, alt: '', onError: e => { e.currentTarget.hidden = true; } });
      grid.append(el('button', { type: 'button', class: `mage-card ${open ? '' : 'locked'}`, 'aria-pressed': String(selected.mage === m.id), 'aria-disabled': String(!open), onClick: () => choose('mage', m.id), style: `--mage-color:${m.colors.glow}` }, el('div', { class: 'mage-art' }, el('span', { class: 'portrait-fallback', 'aria-hidden': true }, '✧'), portrait), el('div', { class: 'mage-info' }, el('span', { class: 'element-badge' }, app.t(`element.${m.element}`)), el('h3', {}, app.L(m.name)), el('small', {}, app.L(m.title)), el('strong', {}, app.L(m.passiveName)), el('p', {}, app.L(m.passiveDesc)), el('p', { class: 'start-spell' }, `${app.t('select.spell')}: ${app.L(SPELL_BY_ID[m.startSpell].name)}`), !open ? el('p', { class: 'unlock-hint' }, `◇ ${hint(m.unlock)}`) : null)));
    });
    mage.append(grid, pager(magePage, Math.ceil(MAGES.length / 2), page => { magePage = page; refresh(); }));
    const map = el('section', { class: 'menu-panel setup-section', dataset: { kind: 'map' } }, el('h2', {}, app.t('select.map')));
    const m = MAPS[mapPage], open = unlocked('map', m.id);
    map.append(el('div', { class: 'map-art' }, el('img', { src: `assets/illustrations/maps/${m.id}.svg`, alt: '' })),
      button(app.L(m.name), () => choose('map', m.id), { class: `menu-button map-choice ${open ? '' : 'locked'}`, 'aria-pressed': String(selected.map === m.id), 'aria-disabled': String(!open) }),
      el('p', {}, app.L(m.desc)), el('p', { class: 'map-boss' }, `${app.t('select.boss')}: ${app.L(BOSS_BY_ID[m.boss].name)}`), ...(!open ? [el('p', { class: 'unlock-hint' }, hint(m.unlock))] : []),
      pager(mapPage, MAPS.length, page => { mapPage = page; refresh(); }));
    const difficulty = el('section', { class: 'menu-panel setup-section', dataset: { kind: 'difficulty' } }, el('h2', {}, app.t('select.difficulty')));
    DIFFICULTY.forEach(d => { const open = d.id <= maxDifficulty(app.save.data) && unlocked('difficulty', d.id); difficulty.append(button(`${String(d.id).padStart(2, '0')} · ${app.t(`diff.${d.id}`)}`, () => choose('difficulty', d.id), { class: `menu-button difficulty-choice ${open ? '' : 'locked'}`, 'aria-pressed': String(selected.difficulty === d.id), 'aria-disabled': String(!open) })); });
    const d = DIFFICULTY.find(d => d.id === selected.difficulty);
    difficulty.append(el('dl', { class: 'difficulty-stats' }, ['hp', 'speed', 'density'].map(key => el('div', {}, el('dt', {}, app.t(`select.${key}`)), el('dd', {}, `×${d[key]}`)))), el('p', { class: 'unlock-hint' }, maxDifficulty(app.save.data) < DIFFICULTY.length ? app.t('select.unlock.difficulty', { n: maxDifficulty(app.save.data) }) : ''));
    columns.append(mage, map, difficulty);
    s.el.append(columns, el('footer', { class: 'setup-footer' }, el('span', {}, `${app.L(MAGE_BY_ID[selected.mage].name)} · ${app.L(MAP_BY_ID[selected.map].name)} · ${app.t(`diff.${selected.difficulty}`)}`), button(app.t('select.deploy'), () => { validate(); app.audio.unlock(); app.startRun({ ...selected }); }, { class: 'menu-button primary' })));
  }
  return { ...s, show() { selected = null; validate(); magePage = Math.floor(MAGES.findIndex(m => m.id === selected.mage) / 2); mapPage = MAPS.findIndex(m => m.id === selected.map); refresh(); s.show(); }, refresh };
}

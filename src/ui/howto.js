// The handbook is paginated so touch and desktop never require scrolling.
import { el, makeScreen } from './dom.js';
import { TIMELINE } from '../data/config.js';
import { MAX_SPELL_LEVEL } from '../data/spells/index.js';
export function create(app) {
  if (!document.querySelector('link[data-menu-css]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/menu.css', 'data-menu-css': '' }));
  const s = makeScreen('howto', 'menu-screen handbook-screen');
  let page = 0;
  const keys = ['controls', 'rules', 'reactions', 'tips'];
  const time = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const button = (text, fn, attrs = {}) => el('button', { type: 'button', class: 'menu-button', onClick: fn, ...attrs }, text);
  function refresh() {
    const content = el('article', { class: 'menu-panel handbook-card' }, el('div', { class: 'handbook-symbol', 'aria-hidden': true }, ['✥', '✧', '⬡', '◇'][page]), el('h2', {}, app.t(`howto.${keys[page]}`)));
    if (page === 0) content.append(el('div', { class: 'keycaps', 'aria-hidden': true }, ['W', 'A', 'S', 'D', '↑', '←', '↓', '→'].map(k => el('kbd', {}, k))), el('p', {}, app.t('howto.keyboard')), el('p', {}, app.t('howto.touch')));
    if (page === 1) content.append(el('p', {}, app.t('howto.xp')), el('p', {}, app.t('howto.evolve', { level: MAX_SPELL_LEVEL })), el('p', {}, app.t('howto.bosses', { times: TIMELINE.bossTimes.map(time).join(' / '), mult: TIMELINE.endlessScoreMult })));
    if (page === 2) content.append(el('div', { class: 'reaction-table' }, ['melt', 'burnout', 'superconduct', 'erosion', 'attune'].map(id => el('div', {}, el('strong', {}, app.t(`reaction.${id}`)), el('p', {}, app.t(`reaction.${id}.desc`))))));
    if (page === 3) content.append(['tip1', 'tip2', 'tip3'].map((key, i) => el('p', { class: 'handbook-tip' }, el('strong', {}, `0${i + 1}`), app.t(`howto.${key}`))));
    s.el.replaceChildren(el('header', { class: 'menu-header' }, button(app.t('common.back'), () => app.go('title')), el('h1', {}, app.t('howto.heading'))), el('nav', { class: 'handbook-tabs' }, keys.map((key, i) => button(app.t(`howto.${key}`), () => { page = i; refresh(); }, { 'aria-pressed': String(page === i) }))), content, el('footer', { class: 'menu-pager' }, button('‹', () => { page--; refresh(); }, { disabled: page === 0, 'aria-label': app.t('common.prev') }), el('span', {}, app.t('common.page', { n: page + 1, total: keys.length })), button('›', () => { page++; refresh(); }, { disabled: page === keys.length - 1, 'aria-label': app.t('common.next') })));
  }
  return { ...s, show() { refresh(); s.show(); }, refresh };
}

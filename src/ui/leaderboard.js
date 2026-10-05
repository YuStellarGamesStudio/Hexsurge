// Local boards remain separate for each mage and difficulty; ten records per page.
import { el, makeScreen } from './dom.js';
import { getBoard } from '../meta/leaderboard.js';
import { MAGES } from '../data/mages.js';
import { MAP_BY_ID } from '../data/maps.js';
import { DIFFICULTY, SCORE } from '../data/config.js';
export function create(app) {
  if (!document.querySelector('link[data-menu-css]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/menu.css', 'data-menu-css': '' }));
  const s = makeScreen('leaderboard', 'menu-screen leaderboard-screen');
  let mage = MAGES[0].id, difficulty = 1, page = 0;
  const size = SCORE.leaderboardSize / 2;
  const button = (text, fn, attrs = {}) => el('button', { type: 'button', class: 'menu-button', onClick: fn, ...attrs }, text);
  function refresh() {
    const entries = getBoard(app.save.data, mage, difficulty);
    const pages = Math.max(1, Math.ceil(entries.length / size));
    page = Math.min(page, pages - 1);
    const mageSelect = el('select', { 'aria-label': app.t('select.mage'), onChange: e => { mage = e.target.value; page = 0; refresh(); } }, MAGES.map(m => el('option', { value: m.id, selected: mage === m.id }, app.L(m.name))));
    const diffSelect = el('select', { 'aria-label': app.t('select.difficulty'), onChange: e => { difficulty = Number(e.target.value); page = 0; refresh(); } }, DIFFICULTY.map(d => el('option', { value: d.id, selected: difficulty === d.id }, app.t(`diff.${d.id}`))));
    const columns = ['rank', 'score', 'time', 'kills', 'level', 'map', 'result', 'date'];
    const table = el('table', { class: 'board-table' }, el('thead', {}, el('tr', {}, columns.map(key => el('th', { scope: 'col', class: `board-${key}` }, app.t(`leaderboard.${key}`))))));
    const rows = el('tbody');
    entries.slice(page * size, (page + 1) * size).forEach((entry, i) => {
      const seconds = Math.floor(entry.time);
      const date = new Date(entry.date);
      const values = [String(page * size + i + 1).padStart(2, '0'), entry.score.toLocaleString(app.getLang()), `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, entry.kills, entry.level, app.L(MAP_BY_ID[entry.map]?.name), app.t(`leaderboard.${entry.endless ? 'endless' : entry.won ? 'won' : 'survived'}`), Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(app.getLang(), { year: '2-digit', month: '2-digit', day: '2-digit' })];
      rows.append(el('tr', {}, values.map((v, index) => {
        const detail = index === 1 ? `${app.t('leaderboard.kills')}: ${entry.kills}` : index === 2 ? `${app.t('leaderboard.level')}: ${entry.level}` : index === 5 ? values[7] : null;
        return el('td', { class: `board-${columns[index]} ${index === 6 ? (entry.won || entry.endless ? 'result-win' : '') : ''}` }, String(v), detail ? el('small', { class: 'board-mobile-detail' }, detail) : null);
      })));
    });
    table.append(rows);
    const panel = el('div', { class: 'menu-panel board-panel' }, entries.length ? table : el('div', { class: 'board-empty' }, el('span', { 'aria-hidden': true }, '♜'), el('p', {}, app.t('leaderboard.empty'))));
    s.el.replaceChildren(el('header', { class: 'menu-header' }, button(app.t('common.back'), () => app.go('title')), el('h1', {}, app.t('leaderboard.heading'))), el('div', { class: 'board-controls' }, el('label', {}, app.t('select.mage'), mageSelect), el('label', {}, app.t('select.difficulty'), diffSelect), el('p', {}, app.t('leaderboard.local', { n: SCORE.leaderboardSize }))), panel, el('footer', { class: 'menu-pager' }, button('‹', () => { page--; refresh(); }, { disabled: page === 0, 'aria-label': app.t('common.prev') }), el('span', {}, app.t('common.page', { n: page + 1, total: pages })), button('›', () => { page++; refresh(); }, { disabled: page === pages - 1, 'aria-label': app.t('common.next') })));
  }
  return { ...s, show() { refresh(); s.show(); }, refresh };
}

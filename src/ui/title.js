// Title overlay; the application owns the animated academy scene behind this screen.
import { el, makeScreen } from './dom.js';
import { createVolumePanel } from './volume-panel.js';
import { LANGS, LANG_LABELS } from '../i18n/i18n.js';
import { topPreview } from '../meta/leaderboard.js';
import { MAGE_BY_ID } from '../data/mages.js';
export function create(app) {
  if (!document.querySelector('link[data-menu-css]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/menu.css', 'data-menu-css': '' }));
  const s = makeScreen('title', 'menu-screen title-screen');
  const volume = createVolumePanel(app);
  const pop = el('div', { class: 'menu-volume', hidden: true }, volume.el);
  const gesture = (fn) => () => { app.audio.unlock(); fn(); };
  const button = (key, fn, cls = '') => el('button', { type: 'button', class: `menu-button ${cls}`, onClick: gesture(fn) }, app.t(key));
  function refresh() {
    volume.refresh();
    s.el.replaceChildren();
    const language = el('div', { class: 'language-chips', 'aria-label': app.t('common.language') }, LANGS.map(lang => el('button', { type: 'button', 'aria-pressed': String(app.getLang() === lang), onClick: gesture(() => { app.save.update(d => { d.settings.lang = lang; }); app.setLang(lang); }) }, LANG_LABELS[lang])));
    const sound = button('common.sound', () => { pop.hidden = !pop.hidden; sound.setAttribute('aria-expanded', String(!pop.hidden)); volume.refresh(); });
    sound.setAttribute('aria-expanded', String(!pop.hidden));
    s.el.append(el('header', { class: 'title-tools' }, language, el('div', { class: 'volume-anchor' }, sound, pop)));
    const logo = el('div', { class: 'hex-logo' }, el('span', { class: 'logo-rune', 'aria-hidden': true }, '✧'), el('h1', {}, 'HEXSURGE'), el('div', { class: 'logo-sub' }, '· 魔潮圍城 ·'));
    const menu = el('div', { class: 'title-main' }, logo, el('p', { class: 'title-tagline' }, app.t('title.tagline')), button('common.start', () => app.go('select'), 'primary title-start'), el('nav', { class: 'title-nav' }, button('title.codex', () => app.go('codex')), button('title.leaderboard', () => app.go('leaderboard')), button('title.settings', () => app.go('settings')), button('title.howto', () => app.go('howto'))));
    const entries = topPreview(app.save.data, 3);
    const preview = el('aside', { class: 'title-preview menu-panel' }, el('h2', {}, app.t('title.preview')));
    if (!entries.length) preview.append(el('p', { class: 'muted' }, app.t('title.empty')));
    entries.forEach((entry, i) => preview.append(el('div', { class: 'preview-row' }, el('span', { class: 'preview-rank' }, String(i + 1).padStart(2, '0')), el('span', {}, app.L(MAGE_BY_ID[entry.mageId]?.name), el('small', {}, app.t(`diff.${entry.difficulty}`))), el('strong', {}, entry.score.toLocaleString(app.getLang())))));
    s.el.append(menu, preview, el('footer', { class: 'title-footer' }, app.t('title.footer')));
  }
  return { ...s, show() { pop.hidden = true; refresh(); s.show(); }, hide() { pop.hidden = true; s.hide(); }, refresh };
}

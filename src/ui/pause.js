// Pause keeps the battle view frozen behind a compact, single-finger control panel.
import { el, makeScreen } from './dom.js';
import { createVolumePanel } from './volume-panel.js';
import { applyI18n } from '../i18n/i18n.js';
export function create(app) {
  const s = makeScreen('pause', 'battle-modal');
  const volume = createVolumePanel(app);
  const button = (key, fn, cls = '') => el('button', { class: `battle-action ${cls}`, 'data-i18n': key, onClick: fn });
  s.el.append(el('div', { class: 'pause-panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pause-title' },
    el('div', { class: 'modal-eyebrow', 'data-i18n': 'pause.eyebrow' }), el('h1', { id: 'pause-title', 'data-i18n': 'common.pause' }),
    button('common.resume', () => app.togglePause(false), 'primary'), button('pause.restart', () => { s.hide(); app.audio.resume(); app.startRun(app.selection); }),
    el('h2', { 'data-i18n': 'common.sound' }), volume.el, button('pause.quit', () => { app.audio.resume(); app.finishRun('quit'); }, 'quiet')));
  const show = s.show;
  s.show = () => { show(); applyI18n(s.el); volume.refresh(); s.el.querySelector('button')?.focus({ preventScroll: true }); };
  s.refresh = () => volume.refresh();
  return s;
}

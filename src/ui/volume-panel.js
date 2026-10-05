// Reusable audio panel: independent BGM / SFX switches + volume sliders (§5 conventions). Used by title, HUD, pause and settings.
import { el } from './dom.js';

export function createVolumePanel(app) {
  const root = el('div', { class: 'volume-panel' });
  const row = (kind, labelKey) => {
    const toggle = el('button', { class: 'vol-toggle', type: 'button', 'aria-pressed': 'true' });
    const slider = el('input', { class: 'vol-slider', type: 'range', min: 0, max: 100, step: 1, 'data-no-stick': '' });
    const label = el('span', { class: 'vol-label', 'data-i18n': labelKey });
    const apply = () => {
      const s = app.save.data.settings;
      toggle.setAttribute('aria-pressed', String(s[`${kind}On`]));
      toggle.textContent = app.t(s[`${kind}On`] ? 'common.on' : 'common.off');
      slider.value = s[`${kind}Volume`];
      slider.disabled = !s[`${kind}On`];
    };
    toggle.addEventListener('click', () => { app.save.update((d) => { d.settings[`${kind}On`] = !d.settings[`${kind}On`]; }); app.audio.applySettings(app.save.data.settings); apply(); app.audio.sfx('ui'); });
    slider.addEventListener('input', () => { app.save.data.settings[`${kind}Volume`] = Number(slider.value); app.audio.applySettings(app.save.data.settings); });
    slider.addEventListener('change', () => { app.save.flush(); if (kind === 'sfx') app.audio.sfx('ui'); });
    root.append(el('div', { class: 'vol-row' }, label, slider, toggle));
    return apply;
  };
  const refreshers = [row('music', 'common.music'), row('sfx', 'common.sfx')];
  return { el: root, refresh() { refreshers.forEach((f) => f()); } };
}

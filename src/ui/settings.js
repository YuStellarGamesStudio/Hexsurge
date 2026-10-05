// Full-screen preferences and protected save transfer. Save parsing/persistence belongs to save.js.
import { el, makeScreen } from './dom.js';
import { createVolumePanel } from './volume-panel.js';

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export function create(app) {
  if (!document.querySelector('link[data-settings-css]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/settings.css', 'data-settings-css': '' }));
  const screen = makeScreen('settings', 'settings-screen');
  let from = 'title', activeTab = 'preferences', pending = null, previousFocus = null, version = '—';
  const text = (tag, key, cls) => el(tag, { class: cls, 'data-i18n': key }, app.t(key));
  const button = (key, action, cls = '') => el('button', { type: 'button', class: `settings-button ${cls}`, 'data-i18n': key, onClick: action }, app.t(key));
  const status = el('p', { class: 'settings-status', role: 'status', 'aria-live': 'polite' });
  const report = (key, error = false) => { status.textContent = app.t(key); status.classList.toggle('is-error', error); };
  const tabs = el('nav', { class: 'settings-tabs', role: 'tablist', 'data-i18n-aria': 'settings.title' });
  const panels = {}, tabButtons = {};
  const selectTab = (id) => {
    activeTab = id;
    for (const key of Object.keys(panels)) { panels[key].hidden = key !== id; tabButtons[key].setAttribute('aria-selected', String(key === id)); tabButtons[key].tabIndex = key === id ? 0 : -1; }
    status.textContent = '';
  };
  const content = el('div', { class: 'settings-content' });
  for (const id of ['preferences', 'save', 'about']) {
    tabButtons[id] = button(`settings.${id}`, () => selectTab(id));
    tabButtons[id].id = `settings-tab-${id}`;
    tabButtons[id].setAttribute('role', 'tab'); tabButtons[id].setAttribute('aria-controls', `settings-panel-${id}`);
    tabButtons[id].addEventListener('keydown', (event) => {
      const ids = Object.keys(panels), index = ids.indexOf(activeTab);
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); const next = event.key === 'Home' ? ids[0] : event.key === 'End' ? ids[2] : ids[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
        selectTab(next); tabButtons[next].focus();
      }
    });
    panels[id] = el('div', { id: `settings-panel-${id}`, class: 'settings-panel', role: 'tabpanel', 'aria-labelledby': tabButtons[id].id });
    tabs.append(tabButtons[id]); content.append(panels[id]);
  }
  const card = (key, ...children) => el('article', { class: 'settings-card' }, text('h2', key), ...children);
  const volume = createVolumePanel(app);
  const choices = (values, onSelect) => {
    const group = el('div', { class: 'settings-choices' });
    const buttons = {};
    for (const [id, label] of values) { buttons[id] = button(label, () => onSelect(id)); group.append(buttons[id]); }
    return { el: group, buttons };
  };
  const languages = choices([['en', 'settings.en'], ['zh', 'settings.zh'], ['ja', 'settings.ja']], (lang) => {
    app.save.update(d => { d.settings.lang = lang; }); app.setLang(lang); refresh();
  });
  const controls = choices([['auto', 'settings.auto'], ['joystick', 'settings.joystick'], ['keys', 'settings.keys']], (mode) => {
    app.save.update(d => { d.settings.control = mode; }); if (app.run) app.input?.setMode(mode); refresh();
  });
  const motion = button('common.off', () => { app.save.update(d => { d.settings.reducedMotion = !d.settings.reducedMotion; }); refresh(); });
  motion.removeAttribute('data-i18n'); motion.setAttribute('data-i18n-aria', 'settings.reducedMotion');
  panels.preferences.append(card('common.sound', volume.el), card('common.language', languages.el), card('settings.controls', controls.el, text('p', 'settings.controlsHint')), card('settings.accessibility', el('div', { class: 'settings-motion' }, text('span', 'settings.reducedMotion'), motion), text('p', 'settings.motionHint')));

  const code = el('textarea', { class: 'settings-code', rows: 3, maxlength: MAX_IMPORT_BYTES, 'data-no-stick': '', 'data-i18n-placeholder': 'save.paste', 'data-i18n-aria': 'save.code', spellcheck: 'false' });
  const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
  const fallback = el('textarea', { class: 'settings-code', rows: 3, readonly: true, hidden: true, 'data-i18n-aria': 'save.code', 'data-no-stick': '' });
  const backupInfo = el('p', { class: 'settings-backup-info' });
  const restore = button('save.restore', () => {
    try { const summary = app.save.backupSummary(); if (summary) openPreview('restore', summary); else report('save.noBackup'); } catch { report('save.failed', true); }
  });
  const closePreview = () => { modal.hidden = true; pending = null; previousFocus?.focus(); };
  const summaryGrid = el('dl', { class: 'settings-summary' });
  const modalTitle = text('h2', 'save.preview'); modalTitle.id = 'settings-preview-title';
  const modalNote = el('p', { class: 'settings-modal-note' });
  const modalError = el('p', { class: 'settings-status is-error', role: 'alert' });
  const confirm = button('common.confirm', () => {
    if (!pending) return;
    try {
      const result = pending.kind === 'restore' ? app.save.restoreBackup() : app.save.applyImport(pending.parsed);
      if (!result.ok) { modalError.textContent = app.t('save.failed'); return; }
      const restored = pending.kind === 'restore'; closePreview();
      app.audio.applySettings(app.save.data.settings); app.input?.setMode(app.save.data.settings.control);
      if (app.save.data.settings.lang) app.setLang(app.save.data.settings.lang);
      refresh(); report(restored ? 'save.restored' : 'save.imported'); app.toast(app.t(restored ? 'save.restored' : 'save.imported'));
    } catch { modalError.textContent = app.t('save.failed'); }
  }, 'primary');
  const cancel = button('common.cancel', closePreview);
  const modal = el('div', { class: 'settings-modal', hidden: true, 'data-no-stick': '' }, el('section', { class: 'settings-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': modalTitle.id }, modalTitle, summaryGrid, modalNote, modalError, el('div', { class: 'settings-actions' }, cancel, confirm)));
  const renderSummary = (summary) => {
    summaryGrid.replaceChildren();
    for (const key of ['version', 'mages', 'spells', 'maps', 'maxDifficulty', 'bestScore', 'runs', 'createdAt']) {
      let value = summary[key];
      if (Array.isArray(value)) value = value.length;
      if (key === 'createdAt') { const date = new Date(value); value = Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(app.getLang() === 'zh' ? 'zh-TW' : app.getLang()); }
      if (key === 'maxDifficulty') value = `${value} · ${app.t(`diff.${value}`)}`;
      summaryGrid.append(text('dt', `save.${key}`), el('dd', {}, String(value ?? '—')));
    }
  };
  function openPreview(kind, summary, parsed) {
    previousFocus = document.activeElement; pending = { kind, summary, parsed }; renderSummary(summary);
    modalTitle.textContent = app.t(kind === 'restore' ? 'save.restore' : 'save.preview');
    modalNote.textContent = app.t(kind === 'restore' ? 'save.restoreWarning' : 'save.overwriteWarning'); modalError.textContent = ''; modal.hidden = false; cancel.focus();
  }
  const preview = (value) => {
    try {
      if (!value.trim()) { report('save.empty', true); return; }
      if (value.length > MAX_IMPORT_BYTES) { report('save.tooLarge', true); return; }
      const result = app.save.previewImport(value);
      if (!result.ok) { report('save.invalid', true); return; }
      openPreview('import', result.summary, result.parsed);
    } catch { report('save.invalid', true); }
  };
  file.addEventListener('change', async () => {
    const picked = file.files?.[0]; file.value = ''; if (!picked) return;
    if (picked.size > MAX_IMPORT_BYTES) { report('save.tooLarge', true); return; }
    try { preview(await picked.text()); } catch { report('save.readFailed', true); }
  });
  const copy = async () => {
    try {
      const value = app.save.exportCode();
      try { if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable'); await navigator.clipboard.writeText(value); fallback.hidden = true; report('save.copied'); }
      catch { fallback.value = value; fallback.hidden = false; fallback.focus(); fallback.select(); report('save.copyManual'); }
    } catch { report('save.failed', true); }
  };
  panels.save.append(card('save.transfer', text('p', 'save.localHint'), el('div', { class: 'settings-actions' }, button('save.download', () => { try { app.save.downloadJson(); report('save.downloaded'); } catch { report('save.failed', true); } }), button('save.copy', copy)), fallback), card('save.import', code, el('div', { class: 'settings-actions' }, button('save.pickFile', () => file.click()), button('save.preview', () => preview(code.value), 'primary')), file), card('save.backup', backupInfo, restore));
  const versionLabel = el('p', { class: 'settings-version' });
  panels.about.append(card('settings.about', text('p', 'settings.aboutText'), versionLabel, text('p', 'settings.licenses'), el('a', { class: 'settings-button settings-source', href: 'https://github.com/YuStellarGamesStudio/Hexsurge', target: '_blank', rel: 'noopener noreferrer', 'data-i18n': 'settings.source' }, app.t('settings.source'))));
  fetch(new URL('../../package.json', import.meta.url)).then(r => r.json()).then(pkg => { version = String(pkg.version); refresh(); }).catch(() => {});
  const back = () => {
    if (!modal.hidden) { closePreview(); return; }
    if (from === 'pause' || from === 'battle') { screen.hide(); app.screen = 'battle'; app.ui.pause.show(app.run); }
    else app.go(from);
  };
  screen.el.append(el('div', { class: 'settings-shell' }, el('header', { class: 'settings-header' }, el('div', {}, text('p', 'settings.eyebrow', 'settings-eyebrow'), text('h1', 'settings.title')), button('common.back', back)), tabs, content, status), modal);
  screen.el.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); back(); }
    if (!modal.hidden && event.key === 'Tab') {
      const focusable = [cancel, confirm]; const current = focusable.indexOf(document.activeElement);
      event.preventDefault(); focusable[(current + 1) % 2].focus();
    }
  });
  function refresh() {
    volume.refresh();
    for (const [id, node] of Object.entries(languages.buttons)) node.setAttribute('aria-pressed', String(app.getLang() === id));
    for (const [id, node] of Object.entries(controls.buttons)) node.setAttribute('aria-pressed', String(app.save.data.settings.control === id));
    const reduced = app.save.data.settings.reducedMotion;
    motion.textContent = app.t(reduced ? 'common.on' : 'common.off'); motion.setAttribute('aria-pressed', String(reduced));
    versionLabel.textContent = app.t('settings.version', { version });
    try { const summary = app.save.backupSummary(); restore.disabled = !app.save.hasBackup(); backupInfo.textContent = summary ? app.t('save.backupSummary', { runs: summary.runs, score: summary.bestScore }) : app.t('save.noBackup'); } catch { restore.disabled = true; backupInfo.textContent = app.t('save.noBackup'); }
    if (pending) {
      renderSummary(pending.summary);
      modalTitle.dataset.i18n = pending.kind === 'restore' ? 'save.restore' : 'save.preview';
      modalTitle.textContent = app.t(modalTitle.dataset.i18n);
      modalNote.textContent = app.t(pending.kind === 'restore' ? 'save.restoreWarning' : 'save.overwriteWarning');
    }
  }
  selectTab(activeTab);
  return { el: screen.el, show(params = {}) { from = params.from ?? 'title'; screen.show(); refresh(); status.textContent = ''; }, hide() { modal.hidden = true; pending = null; screen.hide(); }, refresh };
}

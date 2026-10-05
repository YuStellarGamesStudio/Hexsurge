// PWA glue (§8.3): service-worker registration, an in-game "Install app" chip, and an "update ready" banner.
// The service worker itself (sw.js) never touches localStorage, so updating cannot affect saves.
import { applyI18n, onLangChange } from './i18n/i18n.js';
import { el } from './ui/dom.js';

const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const canRegister = () => 'serviceWorker' in navigator && /^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href);

/** Mounts the install chip + update banner into `host` and registers the service worker. Returns { sync(screen) }. */
export function initPwa(host) {
  let deferred = null;
  let screen = null;

  const installBtn = el('button', { class: 'pwa-install', type: 'button', hidden: true, 'data-i18n': 'pwa.install' });
  const hint = el('div', { class: 'pwa-hint', role: 'dialog', hidden: true },
    el('p', { 'data-i18n': 'pwa.iosHint' }),
    el('button', { type: 'button', 'data-i18n': 'common.close', onClick: () => { hint.hidden = true; } }));
  const updateText = el('span', { 'data-i18n': 'pwa.updateReady' });
  const updateBtn = el('button', { type: 'button', 'data-i18n': 'pwa.update' });
  const later = el('button', { type: 'button', 'data-i18n': 'pwa.later', onClick: () => { banner.hidden = true; } });
  const banner = el('div', { class: 'pwa-update', role: 'status', hidden: true }, updateText, updateBtn, later);
  const root = el('div', { class: 'pwa-root' }, installBtn, hint, banner);
  host.appendChild(root);
  applyI18n(root);
  onLangChange(() => applyI18n(root));

  const refresh = () => {
    const onTitle = screen === 'title';
    installBtn.hidden = !onTitle || standalone() || !(deferred || isIos());
    if (!onTitle) hint.hidden = true;
  };

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; refresh(); });
  window.addEventListener('appinstalled', () => { deferred = null; refresh(); });
  installBtn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      refresh();
    } else hint.hidden = !hint.hidden; // iOS Safari has no install API: explain Share → Add to Home Screen
  });

  if (canRegister()) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      const offer = (worker) => {
        // First install has no controller yet: nothing to "update". Only prompt when a new release waits behind an active one.
        if (!navigator.serviceWorker.controller) return;
        banner.hidden = false;
        updateBtn.onclick = () => worker.postMessage({ type: 'ACTIVATE_UPDATE' });
      };
      if (reg.waiting) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') offer(worker); });
      });
      // Check for a new release when the player returns to the tab.
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch((e) => console.warn('SW registration failed', e));
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloading && banner.dataset.accepted !== undefined) { reloading = true; location.reload(); }
    });
    updateBtn.addEventListener('click', () => { banner.dataset.accepted = '1'; });
  }

  return { sync(name) { screen = name; refresh(); } };
}


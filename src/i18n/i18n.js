// i18n (§7): en (default) / zh / ja, switched in place via ?lang + History API; one language at a time; never blank.
// Content data carries {zh,en,ja} objects -> use L(field). UI strings live in src/i18n/ui/*.js -> use t(key, params).
import { STRINGS } from './strings.js';

export const LANGS = Object.freeze(['en', 'zh', 'ja']);
export const LANG_LABELS = Object.freeze({ en: 'English', zh: '繁體中文', ja: '日本語' });
const LS_KEY = 'hexsurge.lang';

let lang = 'en';
const listeners = new Set();
const warned = new Set();
const dev = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

const normalize = (v) => {
  if (!v) return null;
  const s = String(v).toLowerCase();
  if (s.startsWith('zh')) return 'zh';
  if (s.startsWith('ja')) return 'ja';
  if (s.startsWith('en')) return 'en';
  return null;
};

/** Detection priority (§7): URL ?lang > saved setting > navigator.language > en. */
export function detectLang(savedLang) {
  const url = typeof location !== 'undefined' ? normalize(new URLSearchParams(location.search).get('lang')) : null;
  return url ?? normalize(savedLang) ?? (typeof navigator !== 'undefined' ? normalize(navigator.language) : null) ?? 'en';
}

export function getLang() { return lang; }

/** Switch language in place: updates <html lang>, the URL (replaceState, no reload), data-i18n nodes and listeners. */
export function setLang(next, { updateUrl = true } = {}) {
  const l = normalize(next) ?? 'en';
  lang = l;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = l === 'zh' ? 'zh-Hant' : l;
    if (updateUrl && typeof history !== 'undefined') {
      const url = new URL(location.href);
      url.searchParams.set('lang', l);
      history.replaceState(history.state, '', url);
    }
    applyI18n(document);
  }
  for (const fn of listeners) fn(l);
  return l;
}

export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Localised UI string with {param} interpolation. Falls back to English; never returns a key name. */
export function t(key, params) {
  let s = STRINGS[lang]?.[key];
  if (s === undefined) {
    s = STRINGS.en[key];
    if (dev && !warned.has(`${lang}:${key}`)) { warned.add(`${lang}:${key}`); console.warn(`[i18n] missing ${lang}:${key}`); }
  }
  if (s === undefined) return '';
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] ?? m));
  return s;
}

/** Localised content field: { zh, en, ja } -> current language with English fallback. */
export function L(field) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.en ?? '';
}

/** Updates [data-i18n] (text), [data-i18n-title], [data-i18n-aria], [data-i18n-placeholder] inside root. */
export function applyI18n(root) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of root.querySelectorAll('[data-i18n-placeholder]')) el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
}

export { LS_KEY };

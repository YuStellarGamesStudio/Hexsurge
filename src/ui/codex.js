// Collection UI reads persistent discoveries; recipes remain public even before discovery.
import { el, makeScreen } from './dom.js';
import { MAGES } from '../data/mages.js';
import { ENEMIES } from '../data/enemies.js';
import { BOSSES } from '../data/bosses.js';
import { MAPS, MAP_BY_ID } from '../data/maps.js';
import { PASSIVE_BY_ID } from '../data/passives.js';
import { SPELLS, SPELL_BY_ID, spellStats, MAX_SPELL_LEVEL } from '../data/spells/index.js';
import { FAMILY_SCHEDULE } from '../data/spawns.js';
const colors = { fire: '#ff9961', ice: '#91dcff', thunder: '#ffe276', arcane: '#bda0ff', nature: '#82e7a2', void: '#e99cfa' };
const reactions = ['melt', 'burnout', 'superconduct', 'erosion', 'attune'].map((id, i) => ({ id, element: ['fire', 'nature', 'ice', 'void', 'arcane'][i] }));
const tables = { mages: MAGES, spells: SPELLS, enemies: ENEMIES, bosses: BOSSES, reactions };
const artPath = (kind, d) => `assets/illustrations/${kind === 'reactions' ? 'elements' : kind}/${kind === 'reactions' ? d.element : d.id}.svg`;
function emblem(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><radialGradient id="g"><stop stop-color="#fff"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="#241c46"/></radialGradient><linearGradient id="s" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#191d37"/></linearGradient></defs><g fill="none" stroke="${color}"><circle cx="256" cy="256" r="193" stroke-width="3"/><circle cx="256" cy="256" r="165" stroke-dasharray="5 18" stroke-width="5"/><path d="M256 45 439 362 73 362Z M256 467 73 150 439 150Z" opacity=".45" stroke-width="3"/></g><path d="M256 113 354 256 256 399 158 256Z" fill="url(#s)" stroke="${color}" stroke-width="5"/><path d="M256 143 320 256 256 369 192 256Z" fill="url(#g)"/><path d="m256 143 0 226-64-113Z" fill="#fff" opacity=".17"/><g fill="${color}"><circle cx="256" cy="45" r="8"/><circle cx="73" cy="362" r="8"/><circle cx="439" cy="362" r="8"/></g></svg>`;
}
const svgUrl = (text) => URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
export function create(app) {
  if (!document.querySelector('link[data-codex]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/codex.css', 'data-codex': true }));
  const s = makeScreen('codex', 'codex');
  let kind = 'mages', page = 0, selected = null, capacity = 12, active = false;
  const t = (key, params) => app.t(key, params), L = (value) => app.L(value);
  const name = (d, k = kind) => k === 'reactions' ? t(`reaction.${d.id}`) : L(d.name);
  const known = (d, k = kind) => k === 'reactions' || (app.save.data.codex?.[d.evolvedFrom ? 'evolutions' : k] || []).includes(d.id);
  const tint = (d) => colors[d.element] || d.accent || '#a9b9cb';
  function art(d, k = kind, silhouette = false) {
    const img = el('img', { src: artPath(k, d), alt: '', class: silhouette ? 'codex-silhouette' : '', draggable: false });
    img.onerror = () => { img.onerror = null; const url = svgUrl(emblem(tint(d))); img.onload = () => URL.revokeObjectURL(url); img.src = url; };
    return img;
  }
  function button(label, fn, attrs = {}) { return el('button', { type: 'button', onClick: fn, ...attrs }, label); }
  const header = el('header', { class: 'codex-header' });
  const tabs = el('nav', { class: 'codex-tabs', 'aria-label': 'Codex' });
  const body = el('div', { class: 'codex-body' });
  const footer = el('footer', { class: 'codex-footer' });
  s.el.append(header, tabs, body, footer);
  function hint(d) { return t(`codex.${kind === 'mages' ? 'mageHint' : kind === 'spells' ? 'spellHint' : 'hint'}`); }
  function recipe(d) {
    const base = d.evolvedFrom ? SPELL_BY_ID[d.evolvedFrom] : d;
    if (!base.evolution) return null;
    const r = base.evolution, item = PASSIVE_BY_ID[r.passive], evolved = SPELL_BY_ID[r.id];
    const achieved = known(evolved, 'spells');
    const text = `${L(base.name)} ${t('card.level', { n: MAX_SPELL_LEVEL })} + ${L(item.name)} ${t('card.level', { n: r.level })} → ${L(evolved.name)}`;
    return { text, item, status: t(`codex.${achieved ? 'evolved' : known(base, 'spells') ? 'seen' : 'unseen'}`), achieved };
  }
  function facts(d) {
    if (kind === 'mages') return [t(`element.${d.element}`), L(d.title), `${t('codex.passive')}: ${L(d.passiveName)} — ${L(d.passiveDesc)}`, `${t('codex.start')}: ${L(SPELL_BY_ID[d.startSpell].name)}`];
    if (kind === 'spells') return [t(`element.${d.element}`), t(`type.${d.type}`)];
    if (kind === 'bosses') return [L(MAP_BY_ID[d.map].name), `${t('codex.tiers')}: ${d.hp.join(' / ')}`, `${t('codex.patterns')}: ${d.patterns.map(p => t(`codex.${p}`)).join(' · ')}`];
    if (kind === 'enemies') {
      const schedule = FAMILY_SCHEDULE[d.family];
      const first = schedule.findIndex(([, weight]) => weight > 0);
      // The director interpolates between keyframes: a family first becomes eligible just after the preceding zero.
      const time = first > 0 ? schedule[first - 1][0] : schedule[first][0];
      const clock = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}+`;
      return [t(`codex.${d.family}`), `${t('codex.hp')} ${d.hp} · ${t('stat.speed')} ${d.speed} · ${t('stat.damage')} ${d.dmg} · ${t('codex.xp')} ${d.xp}`, `${t('codex.from')}: ${d.child ? t('codex.child') : clock}`, `${t('codex.maps')}: ${MAPS.filter(m => m.themeWeights[d.family] > 0).map(m => L(m.name)).join(' · ')}`];
    }
    return [];
  }
  function statRows(d) {
    const low = spellStats(d, 1), high = spellStats(d, MAX_SPELL_LEVEL);
    return ['damage', 'cooldown', 'count', 'radius', 'speed', 'duration', 'pierce', 'range', 'jumps', 'life', 'tick', 'explode'].filter(key => typeof low[key] === 'number').map(key => [t(`stat.${key}`), Number(low[key].toFixed(2)), Number(high[key].toFixed(2))]);
  }
  function render() {
    header.replaceChildren(el('div', {}, el('h1', {}, t('codex.title')), el('p', {}, t('codex.collection'))), button(t('common.back'), () => selected ? (selected = null, render()) : app.go('title')));
    tabs.replaceChildren(...Object.keys(tables).map(k => button(t(`codex.${k}`), () => { kind = k; page = 0; selected = null; render(); }, { role: 'tab', 'aria-selected': String(kind === k), class: kind === k ? 'active' : '' })));
    body.replaceChildren(); footer.replaceChildren();
    if (selected) {
      const d = selected, discovered = known(d), r = kind === 'spells' ? recipe(d) : null;
      const portrait = el('div', { class: 'codex-portrait', style: `--entry-color:${tint(d)}` }, art(d, kind, !discovered), el('span', { class: 'codex-seal' }, t(`codex.${kind}`)));
      const info = el('article', { class: 'codex-info' }, el('h2', {}, discovered ? name(d) : '???'), el('p', { class: 'codex-description' }, discovered ? kind === 'reactions' ? t(`reaction.${d.id}.desc`) : L(d.desc) : hint(d)));
      if (discovered) {
        info.append(el('div', { class: 'codex-facts' }, ...facts(d).map(text => el('p', {}, text))));
        if (kind === 'spells') {
          const table = el('table', { class: 'codex-stats' }, el('thead', {}, el('tr', {}, el('th', {}, ''), el('th', {}, t('card.level', { n: 1 })), el('th', {}, t('card.level', { n: MAX_SPELL_LEVEL })))));
          table.append(el('tbody', {}, ...statRows(d).map(row => el('tr', {}, ...row.map(value => el('td', {}, String(value)))))));
          info.append(table);
        }
      }
      if (r) info.append(el('section', { class: 'codex-recipe' }, el('h3', {}, t('codex.recipe')), el('div', { class: 'codex-recipe-line' }, art(r.item, 'passives'), el('p', {}, r.text)), el('p', { class: r.achieved ? 'codex-satisfied' : '' }, `${r.achieved ? '✓' : '◇'} ${r.status}`), el('small', {}, t('codex.passiveGuide'))));
      body.append(el('div', { class: 'codex-detail' }, portrait, info));
      footer.append(button(t('common.close'), () => { selected = null; render(); }), button(t('codex.download'), async (event) => {
        const b = event.currentTarget; b.disabled = true; b.textContent = t('codex.exporting');
        try { await download(d, discovered, r); } catch { app.toast(t('codex.failed')); } finally { b.disabled = false; b.textContent = t('codex.download'); }
      }, { class: 'codex-download' }));
    } else {
      const list = tables[kind], total = Math.max(1, Math.ceil(list.length / capacity)); page = Math.min(page, total - 1);
      body.append(el('div', { class: 'codex-grid' }, ...list.slice(page * capacity, (page + 1) * capacity).map(entry)));
      function entry(d) { return button('', () => { selected = d; render(); }, { class: 'codex-entry', style: `--entry-color:${tint(d)}`, 'data-entry': d.id }).appendChild(el('span', { class: 'codex-entry-inner' }, art(d, kind, !known(d)), el('strong', {}, known(d) ? name(d) : '???'), el('small', {}, known(d) ? d.element ? t(`element.${d.element}`) : t(`codex.${kind}`) : t('codex.unknown')))).parentElement; }
      footer.append(el('span', { class: 'codex-completion' }, `${list.filter(d => known(d)).length} / ${list.length}`), button('‹', () => { page--; render(); }, { disabled: page === 0, 'aria-label': t('common.prev') }), el('span', {}, t('common.page', { n: page + 1, total })), button('›', () => { page++; render(); }, { disabled: page === total - 1, 'aria-label': t('common.next') }));
    }
  }
  async function download(d, discovered, r) {
    let svg;
    try { const response = await fetch(artPath(kind, d)); if (!response.ok) throw new Error('missing'); svg = await response.text(); if (!svg.includes('<svg')) throw new Error('invalid'); } catch { svg = emblem(tint(d)); }
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const serialized = new XMLSerializer().serializeToString(parsed.documentElement);
    const url = svgUrl(serialized), image = new Image();
    try { image.src = url; await image.decode(); } finally { URL.revokeObjectURL(url); }
    const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 3200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0c1122'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const glow = ctx.createRadialGradient(900, 650, 0, 900, 650, 950); glow.addColorStop(0, `${tint(d)}80`); glow.addColorStop(1, '#0c1122'); ctx.fillStyle = glow; ctx.fillRect(0, 0, 1800, 1350);
    ctx.strokeStyle = tint(d); ctx.lineWidth = 4; ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);
    ctx.fillStyle = '#cbd4ea'; ctx.font = '32px sans-serif'; ctx.fillText(`HEXSURGE · ${t(`codex.${kind}`)}`, 110, 130);
    if (!discovered) { ctx.filter = 'brightness(0)'; } ctx.drawImage(image, 390, 210, 1020, 1020); ctx.filter = 'none';
    ctx.fillStyle = '#fff'; ctx.font = 'bold 64px sans-serif';
    let y = 1330;
    function wrap(text, size, color = '#d4def1') {
      ctx.font = `${size}px sans-serif`; ctx.fillStyle = color; let line = '';
      for (const char of text) { if (ctx.measureText(line + char).width > 1540) { ctx.fillText(line, 130, y); y += size * 1.5; line = ''; } line += char; }
      if (line) { ctx.fillText(line, 130, y); y += size * 1.5; } y += 14;
    }
    wrap(discovered ? name(d) : '???', 64, '#fff');
    wrap(discovered ? kind === 'reactions' ? t(`reaction.${d.id}.desc`) : L(d.desc) : hint(d), 38);
    if (discovered) { for (const text of facts(d)) wrap(text, 30); if (kind === 'spells') for (const row of statRows(d)) wrap(`${row[0]}: ${row[1]} → ${row[2]}`, 27); }
    if (r) { wrap(t('codex.recipe'), 34, tint(d)); wrap(r.text, 30); wrap(r.status, 27); }
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png'));
    const png = URL.createObjectURL(blob), a = el('a', { href: png, download: `hexsurge-${d.id}-${app.getLang()}.png` }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(png), 60000);
  }
  function resize() {
    if (!active) return;
    const box = body.getBoundingClientRect(), columns = Math.max(2, Math.min(6, Math.floor(box.width / 175))), rows = Math.max(1, Math.min(4, Math.floor(box.height / 180)));
    capacity = columns * rows; body.style.setProperty('--codex-columns', columns); body.style.setProperty('--codex-rows', rows); render();
  }
  new ResizeObserver(resize).observe(body);
  document.addEventListener('keydown', event => { if (!active) return; if (event.key === 'Escape') { selected = null; render(); } if (!selected && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); page = Math.max(0, Math.min(Math.ceil(tables[kind].length / capacity) - 1, page + (event.key === 'ArrowRight' ? 1 : -1))); render(); } });
  app.onLangChange?.(() => { if (active) render(); });
  return { el: s.el, show() { active = true; s.show(); render(); resize(); }, hide() { active = false; s.hide(); }, refresh() { if (active) render(); } };
}

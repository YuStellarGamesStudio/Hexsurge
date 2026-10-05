// Battle overlay: persistent nodes are updated in place; build slots only change when the build changes.
import { el, makeScreen } from './dom.js';
import { createVolumePanel } from './volume-panel.js';
import { PLAYER, TIMELINE } from '../data/config.js';
import { MAX_SPELL_LEVEL } from '../data/spells/index.js';
import { PASSIVE_BY_ID } from '../data/passives.js';
import { applyI18n } from '../i18n/i18n.js';

export function create(app) {
  if (!document.querySelector('link[data-battle-css]')) document.head.append(el('link', { rel: 'stylesheet', href: 'assets/css/battle.css', 'data-battle-css': '' }));
  const s = makeScreen('hud', 'battle-hud');
  const timer = el('strong', { class: 'hud-timer' });
  const countdown = el('span', { class: 'hud-countdown' });
  const volume = createVolumePanel(app), popover = el('div', { class: 'hud-volume', hidden: true }, volume.el);
  const sound = el('button', { class: 'hud-button', 'data-i18n-aria': 'common.sound', onClick: () => { popover.hidden = !popover.hidden; volume.refresh(); } }, '♫');
  const pause = el('button', { class: 'hud-button', 'data-i18n-aria': 'common.pause', onClick: () => app.togglePause() }, 'Ⅱ');
  const top = el('header', { class: 'hud-top' }, el('div', { class: 'hud-clock' }, timer, countdown), el('div', { class: 'hud-actions' }, sound, pause));
  const hearts = el('div', { class: 'hud-hearts' }), health = el('small');
  const miniHearts = el('div', { class: 'hud-hearts' });
  const miniHealth = el('div', { class: 'hud-mini-health', role: 'img' }, miniHearts);
  const shieldFill = el('i'), shield = el('div', { class: 'hud-shield' }, shieldFill);
  const kills = el('strong'), score = el('strong'), synergy = el('div', { class: 'hud-synergy' });
  const status = el('aside', { class: 'hud-status hud-panel' }, el('h2', { 'data-i18n': 'hud.status' }), hearts, health, shield,
    el('div', { class: 'hud-counters' }, el('div', {}, el('span', { 'data-i18n': 'hud.kills' }), kills), el('div', {}, el('span', { 'data-i18n': 'hud.score' }), score)), synergy);
  const spellSlots = el('div', { class: 'hud-spell-slots' }), passiveSlots = el('div', { class: 'hud-passive-slots' });
  const build = el('aside', { class: 'hud-build hud-panel' }, el('h2', { 'data-i18n': 'hud.spells' }), spellSlots, el('h2', { 'data-i18n': 'hud.passives' }), passiveSlots);
  const level = el('strong'), xpFill = el('i'), xp = el('footer', { class: 'hud-xp' }, level, el('div', { class: 'hud-xp-track' }, xpFill));
  const bossName = el('strong'), bossState = el('span'), bossFill = el('i'), bossHp = el('small');
  const bossBar = el('div', { class: 'hud-boss', hidden: true }, el('div', { class: 'hud-boss-label' }, bossName, bossState), el('div', { class: 'hud-boss-track' }, bossFill), bossHp);
  const warning = el('div', { class: 'hud-warning', role: 'status', hidden: true });
  const vignette = el('div', { class: 'hud-vignette' });
  const tabs = el('nav', { class: 'hud-tabs' });
  for (const name of ['status', 'spells']) tabs.append(el('button', { 'data-i18n': `hud.${name}`, 'aria-expanded': 'false', onClick: (e) => {
    const next = s.el.dataset.panel === name ? '' : name;
    s.el.dataset.panel = next;
    for (const b of tabs.children) b.setAttribute('aria-expanded', String(b === e.currentTarget && next !== ''));
  } }));
  s.el.append(vignette, top, miniHealth, status, build, bossBar, warning, popover, tabs, xp);
  let buildKey = '', heartKey = '', warningKey = '', warningTime = 0, hurtTime = 0, lastRun = null;
  const clock = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function icon(folder, id, element, name) {
    const fallback = el('span', { class: 'build-glyph', 'aria-hidden': 'true' }, '✦');
    const img = el('img', { src: `assets/illustrations/${folder}/${id}.svg`, alt: '', onError: () => { img.hidden = true; fallback.hidden = false; } });
    fallback.hidden = true;
    return el('span', { class: 'build-icon', 'data-element': element ?? 'arcane', title: name }, img, fallback);
  }
  s.update = (run, dt = 0) => {
    lastRun = run;
    timer.textContent = clock(run.t);
    const next = run.bossSchedule.next, times = TIMELINE.bossTimes;
    const due = times[next] ?? (run.endless ? times.at(-1) + 180 * (next - times.length + 1) : Infinity);
    const remaining = Math.max(0, due - run.t);
    countdown.hidden = !Number.isFinite(remaining) || remaining > TIMELINE.bossCountdownShow;
    countdown.textContent = app.t('hud.bossCountdown', { time: clock(remaining) });
    const p = run.player, maxHp = Number.isFinite(p.stats.maxHp) ? p.stats.maxHp : PLAYER.baseHp;
    const hp = Number.isFinite(p.hp) ? Math.max(0, Math.min(p.hp, maxHp)) : 0;
    const halfHearts = Math.ceil(hp / PLAYER.heartHp * 2), total = Math.ceil(maxHp / PLAYER.heartHp);
    const hk = `${total}:${halfHearts}`;
    if (hk !== heartKey) {
      heartKey = hk;
      hearts.replaceChildren(...Array.from({ length: total }, (_, i) => el('span', { class: `hud-heart ${halfHearts >= i * 2 + 2 ? 'full' : halfHearts > i * 2 ? 'half' : 'empty'}`, 'aria-hidden': 'true' }, '♥')));
      miniHearts.replaceChildren(...Array.from(hearts.children, (heart) => heart.cloneNode(true)));
    }
    health.textContent = `${Math.ceil(hp)} / ${Math.round(maxHp)}`;
    hearts.setAttribute('aria-label', app.t('hud.health', { hp: Math.ceil(hp), max: Math.round(maxHp) }));
    miniHealth.setAttribute('aria-label', app.t('hud.health', { hp: Math.ceil(hp), max: Math.round(maxHp) }));
    shield.hidden = !p.shieldMax;
    shieldFill.style.width = `${Math.min(100, p.shield / (p.shieldMax || 1) * 100)}%`;
    shield.title = app.t('hud.shield', { n: Math.ceil(p.shield) });
    s.el.classList.toggle('low-health', hp / maxHp <= .25);
    kills.textContent = run.stats.kills.toLocaleString(); score.textContent = Math.floor(run.score).toLocaleString();
    level.textContent = app.t('card.level', { n: p.level });
    xpFill.style.width = `${Math.min(100, p.xp / p.xpNext * 100)}%`;
    const key = `${app.getLang()}:${run.spells.map((v) => `${v.def.id}:${v.level}`).join(',')}:${Object.entries(run.passives).join(',')}`;
    if (key !== buildKey) {
      buildKey = key;
      spellSlots.replaceChildren(...run.spells.map((v) => el('div', { class: `hud-spell ${v.evolved ? 'evolved' : ''}`, 'data-element': v.def.element }, icon('spells', v.def.id, v.def.element, app.L(v.def.name)), el('div', { class: 'hud-spell-copy' }, el('span', {}, app.L(v.def.name)), el('small', {}, v.level >= MAX_SPELL_LEVEL ? app.t('card.max') : '●'.repeat(v.level) + '○'.repeat(MAX_SPELL_LEVEL - v.level))))));
      passiveSlots.replaceChildren(...Object.entries(run.passives).map(([id, n]) => el('div', { class: 'hud-passive' }, icon('passives', id, 'arcane', app.L(PASSIVE_BY_ID[id].name)), el('small', {}, n))));
      const lines = [];
      for (const [element, n] of Object.entries(run.elementCounts)) if (run.synergy[element] > 1) lines.push(el('p', {}, app.t('synergy.pure', { element: app.t(`element.${element}`), n, pct: Math.round((run.synergy[element] - 1) * 100) })));
      lines.push(el('p', {}, app.t('synergy.mixed', { n: run.distinctElements, pct: Math.round((run.reactionPower - 1) * 100) })));
      synergy.replaceChildren(...lines);
    }
    const b = run.boss;
    bossBar.hidden = !b || b.dead;
    if (b && !b.dead) {
      bossName.textContent = app.L(b.bossDef.name); bossState.textContent = b.enraged ? app.t('hud.enraged') : '';
      bossBar.classList.toggle('enraged', b.enraged); bossFill.style.width = `${Math.max(0, b.hp / b.maxHp * 100)}%`;
      bossHp.textContent = `${Math.ceil(b.hp).toLocaleString()} / ${Math.ceil(b.maxHp).toLocaleString()}`;
    }
    warningTime = Math.max(0, warningTime - dt); warning.hidden = warningTime === 0;
    hurtTime = Math.max(0, hurtTime - dt); vignette.classList.toggle('hurt', hurtTime > 0);
  };
  s.onEvent = (e) => {
    if (e.type === 'hurt') hurtTime = .35;
    if (e.type === 'bossWarning' || e.type === 'bossSpawn') { warningKey = e.type === 'bossSpawn' ? 'hud.bossArrived' : 'hud.bossIncoming'; warning.textContent = app.t(warningKey); warningTime = e.type === 'bossWarning' ? TIMELINE.bossWarning : 2.5; }
  };
  const show = s.show;
  s.show = (run) => { show(); applyI18n(s.el); buildKey = ''; heartKey = ''; warningTime = hurtTime = 0; popover.hidden = true; s.el.dataset.panel = ''; s.update(run); };
  s.refresh = () => { if (lastRun) { buildKey = ''; s.update(lastRun); } if (warningKey) warning.textContent = app.t(warningKey); volume.refresh(); };
  return s;
}

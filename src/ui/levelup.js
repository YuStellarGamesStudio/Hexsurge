// Upgrade cards read the same delta blocks as the simulation; choosing remains app-owned.
import { el, makeScreen } from './dom.js';
import { SPELL_BY_ID, MAX_SPELL_LEVEL } from '../data/spells/index.js';
import { PASSIVE_BY_ID } from '../data/passives.js';
import { applyI18n } from '../i18n/i18n.js';
export function create(app) {
  const s = makeScreen('levelup', 'battle-modal');
  const cards = el('div', { class: 'upgrade-cards' });
  const panel = el('div', { class: 'upgrade-panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'upgrade-title' }, el('div', { class: 'modal-eyebrow', 'data-i18n': 'levelup.eyebrow' }), el('h1', { id: 'upgrade-title', 'data-i18n': 'levelup.title' }), el('p', { class: 'upgrade-instruction', 'data-i18n': 'levelup.choose' }), cards);
  s.el.append(panel);
  let current = null;
  const format = (v) => Number(v.toFixed(2)).toString();
  function render(run) {
    current = run;
    cards.dataset.count = run.levelUp.choices.length;
    cards.replaceChildren(...run.levelUp.choices.map((c, i) => {
      const passive = c.kind.startsWith('passive'), fallback = c.kind === 'heal' || c.kind === 'score';
      const source = passive ? PASSIVE_BY_ID[c.id] : SPELL_BY_ID[c.id];
      const def = c.into ? SPELL_BY_ID[c.into] : source;
      const value = passive ? (Array.isArray(def.perLevel) ? def.perLevel[c.level - 1] : def.perLevel) : null;
      const name = fallback ? app.t(`card.${c.kind}`) : app.L(def.name);
      const img = fallback ? el('span', { class: 'upgrade-symbol' }, c.kind === 'heal' ? '♥' : '✦') : el('img', { class: 'upgrade-art', src: `assets/illustrations/${passive ? 'passives' : 'spells'}/${def.id}.svg`, alt: '', onError: (e) => { e.currentTarget.hidden = true; } });
      const effect = el('div', { class: 'upgrade-effects' });
      if (fallback) effect.append(el('p', {}, app.t(`card.${c.kind}.desc`)));
      else if (passive) {
        // Passive descriptions already supply localised stat names absent from shared game vocabulary.
        effect.append(el('p', {}, app.L(def.desc).replace('{v}', `${format(value * (def.fmt === 'pct' ? 100 : 1))}${def.fmt === 'pct' ? '%' : ''}`)));
      } else if (c.kind !== 'evolve') {
        const delta = c.kind === 'spell_new' ? def.base : def.perLevel[c.level - 2];
        for (const [stat, n] of Object.entries(delta ?? {})) {
          if (!['damage', 'cooldown', 'count', 'radius', 'speed', 'duration', 'pierce', 'range', 'jumps', 'life', 'tick', 'explode'].includes(stat)) continue;
          const label = app.t(`stat.${stat}`);
          if (!label || typeof n !== 'number' || n === 0) continue;
          effect.append(el('p', {}, `${label} ${c.kind === 'spell_new' ? '' : n > 0 ? '+' : ''}${format(n)}${['cooldown', 'duration', 'life', 'tick'].includes(stat) ? app.t('unit.sec') : ''}`));
          if (effect.children.length === 3) break;
        }
      }
      const card = el('button', { class: `upgrade-card ${c.kind === 'evolve' ? 'evolution-card' : ''}`, 'data-element': def?.element ?? 'arcane', onClick: () => app.pickUpgrade(i) },
        el('div', { class: 'upgrade-card-top' }, el('span', { class: 'upgrade-kind' }, app.t(`card.${c.kind}`)), el('kbd', {}, i + 1)), img, el('h2', {}, name));
      if (!fallback) card.append(el('div', { class: 'upgrade-level' }, c.kind === 'evolve' ? app.t('card.max') : `${app.t('card.level', { n: c.level - 1 })} → ${c.level}`));
      card.append(effect);
      if (!fallback && !passive) card.append(el('p', { class: 'upgrade-description' }, app.L(def.desc)));
      const owned = run.spells.find((v) => v.def.id === c.id);
      if (source?.evolution && (c.kind === 'evolve' || (owned?.level ?? c.level) >= MAX_SPELL_LEVEL - 2)) {
        const evo = source.evolution, item = PASSIVE_BY_ID[evo.passive];
        card.append(el('div', { class: 'upgrade-recipe' }, el('span', {}, app.t('card.requires', { passive: app.L(item.name), n: evo.level })), el('small', {}, app.t('levelup.recipe', { spell: MAX_SPELL_LEVEL, have: run.passives[evo.passive] ?? 0, need: evo.level }))));
      }
      return card;
    }));
  }
  const show = s.show;
  s.show = (run) => { render(run); applyI18n(s.el); show(); cards.querySelector('button')?.focus({ preventScroll: true }); };
  s.refresh = () => { if (current && !s.el.hidden) render(current); };
  window.addEventListener('keydown', (e) => {
    if (s.el.hidden || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    const i = Number(e.key) - 1;
    if (Number.isInteger(i) && i >= 0 && i < (current?.levelUp?.choices.length ?? 0)) { e.preventDefault(); e.stopPropagation(); app.pickUpgrade(i); }
  });
  return s;
}

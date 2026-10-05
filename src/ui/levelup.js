// PLACEHOLDER (replaced by the level-up pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('levelup');
  const row = el('div', { style: 'position:absolute;inset:30% 10%;display:flex;gap:12px' });
  s.el.append(row);
  const base = s.show;
  s.show = (run) => {
    base();
    row.replaceChildren(...run.levelUp.choices.map((c, i) => el('button', { style: 'flex:1', onClick: () => app.pickUpgrade(i) }, `${c.kind}: ${c.id} -> ${c.level}`)));
  };
  return s;
}

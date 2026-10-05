// PLACEHOLDER (replaced by the results pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('results');
  const info = el('pre');
  s.el.append(info, el('button', { onClick: () => app.showTitle() }, 'Title'));
  const base = s.show;
  s.show = (p) => { base(); info.textContent = JSON.stringify(p?.result, null, 1); };
  return s;
}

// PLACEHOLDER (replaced by the title/menu pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('title');
  s.el.append(el('h1', {}, 'HEXSURGE'), el('button', { onClick: () => app.go('select') }, 'Start'));
  return s;
}

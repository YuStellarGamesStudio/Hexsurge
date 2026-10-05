// PLACEHOLDER (replaced by the howto pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('howto');
  s.el.append(el('button', { onClick: () => app.go('title') }, 'Back'));
  return s;
}

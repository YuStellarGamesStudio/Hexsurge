// PLACEHOLDER (replaced by the title/menu pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('select');
  s.el.append(el('button', { onClick: () => app.startRun({ ...app.save.data.last }) }, 'Go'));
  return s;
}

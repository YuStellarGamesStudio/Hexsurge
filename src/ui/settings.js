// PLACEHOLDER (replaced by the settings pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('settings');
  s.el.append(el('button', { onClick: () => app.go('title') }, 'Back'));
  return s;
}

// PLACEHOLDER (replaced by the codex pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('codex');
  s.el.append(el('button', { onClick: () => app.go('title') }, 'Back'));
  return s;
}

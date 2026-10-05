// PLACEHOLDER (replaced by the pause pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('pause');
  s.el.append(el('button', { onClick: () => app.togglePause(false) }, 'Resume'), el('button', { onClick: () => app.finishRun('quit') }, 'Quit'));
  return s;
}

// PLACEHOLDER (replaced by the leaderboard pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('leaderboard');
  s.el.append(el('button', { onClick: () => app.go('title') }, 'Back'));
  return s;
}

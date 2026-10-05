// PLACEHOLDER (replaced by the HUD pass).
import { el, makeScreen } from './dom.js';
export function create(app) {
  const s = makeScreen('hud');
  const info = el('div', { style: 'position:absolute;left:8px;top:8px;font-size:14px' });
  s.el.append(info);
  s.update = (run) => {
    info.textContent = `${Math.floor(run.t / 60)}:${String(Math.floor(run.t % 60)).padStart(2, '0')}  HP ${Math.ceil(run.player.hp)}/${run.player.stats.maxHp}  Lv ${run.player.level}  K ${run.stats.kills}  E ${run.enemies.length}  ${run.status}`;
  };
  return s;
}

// Reproducible thirty-enemy composition with real battle rendering and collision terrain.
import { Game } from '../../vendor/xyz/dist/src/index.js';
import { createRun } from '../../src/sim/run.js';
import { spawnEnemy } from '../../src/sim/enemies.js';
import { ENEMY_BY_ID } from '../../src/data/enemies.js';
import { MAP_BY_ID } from '../../src/data/maps.js';
import { BattleView } from '../../src/render/battle-view.js';
const query = new URLSearchParams(location.search);
const map = MAP_BY_ID[query.get('map')] ? query.get('map') : 'academy';
const game = await Game.create({ canvas: '#game', renderer: query.get('renderer') ?? 'auto' });
const run = createRun({ mageId: 'ignis', mapId: map, seed: 20261005 });
run.player.god = true;
const types = ['imp', 'stone_brute', 'cult_archer'];
for (let i = 0; i < 30; i++) {
  const x = (i % 6 - 2.5) * 2.15, z = Math.floor(i / 6) * 2 - 4;
  const enemy = spawnEnemy(run, ENEMY_BY_ID[types[i % types.length]], x, z);
  // The lab freezes simulation, so bypass the battle's quarter-second spawn growth.
  enemy.age = 1;
}
const view = new BattleView(game, run);
await view.init();
let t = 0;
view.scene.onTick = (dt) => { t += dt; run.t = t; if (map === 'tundra') run.env.gust = Math.sin(t * 0.1) > 0.6 ? Math.PI * 0.25 : null; view.sync(run, dt); };
for (const a of document.querySelectorAll('nav a')) if (a.search === `?map=${map}`) a.setAttribute('aria-current', 'page');
window.hexsurge = { game, run, view };
window.addEventListener('resize', () => view.resize());
game.start();
window.ready = true;

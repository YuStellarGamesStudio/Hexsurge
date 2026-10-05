// Explicit lazy imports keep each score independently loadable, including map scores.
const loaders = {
  title: () => import('./title.js'), menu: () => import('./menu.js'),
  boss: () => import('./boss.js'), results: () => import('./results.js'),
  endless: () => import('./endless.js'),
  'academy-1': () => import('./academy-1.js'), 'academy-2': () => import('./academy-2.js'),
  'forest-1': () => import('./forest-1.js'), 'forest-2': () => import('./forest-2.js'),
  'tundra-1': () => import('./tundra-1.js'), 'tundra-2': () => import('./tundra-2.js'),
  'abyss-1': () => import('./abyss-1.js'), 'abyss-2': () => import('./abyss-2.js'),
  'void-1': () => import('./void-1.js'), 'void-2': () => import('./void-2.js'),
};
export const trackIds = Object.freeze(Object.keys(loaders));
export async function loadTrack(id) { return loaders[id] ? (await loaders[id]()).default : null; }

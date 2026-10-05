import { voices } from './voices.js';
// Notes use seconds rather than beats. Every event is a compact monophonic gesture.
const effect = (voice, notes) => ({ voice, notes, duration: Math.max(...notes.map(([t,,d]) => t+d)) + .25 });
const elements = {
  fire: ['brass', [55,62,67]], ice: ['bell',[84,91,88]],
  thunder: ['snare',[76,64,88]], arcane: ['pluck',[76,83,88]],
  nature: ['lead',[67,74,71]], void: ['bass',[55,48,43]],
};
export const sfx = {
  ui: effect('pluck', [[0,79,.045],[.05,86,.06]]),
  pickup: effect('bell', [[0,76,.055],[.065,83,.075]]),
  level: effect('bell', [[0,72,.12],[.13,76,.12],[.26,79,.12],[.39,84,.25]]),
  evolve: effect('brass', [[0,60,.12],[.13,67,.12],[.26,72,.14],[.41,76,.14],[.56,79,.14],[.71,84,.35]]),
  boss: effect('brass', [[0,43,.18],[.21,44,.18],[.42,43,.35],[.8,55,.3]]),
  hurt: effect('snare', [[0,55,.09],[.1,43,.1]]),
};
for (const [element,[voice,notes]] of Object.entries(elements)) {
  sfx[`cast:${element}`] = effect(voice, notes.map((n,i) => [i*.045,n,.05]));
  sfx[`hit:${element}`] = effect(element === 'ice' ? 'bell' : element === 'nature' ? 'pluck' : 'hat', [[0,notes[0],.025]]);
}
export { voices };
export default sfx;

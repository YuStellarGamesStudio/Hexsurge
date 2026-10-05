// Map scenery registry. Each map module exports:
//   look: { ambient, sun: { dir:[x,y,z], color:[r,g,b], intensity }, fog: { color:[r,g,b], near, far },
//           bloom: { strength, threshold }, exposure, background: { zenith, horizon, ground } }   (all colours display-sRGB 0..1)
//   build(ctx) -> { update(t, dt, run), dispose() }   adds ground + props + obstacle visuals to ctx.scene
//     ctx = { scene, run, map, palette, obstacles, rng, add(obj), matte, glow, MeshBuilder, InstancePool }
import * as fallback from './default.js';

const registry = {};
export function registerMap(id, mod) { registry[id] = mod; }
export function getMapModule(id) { return registry[id] ?? fallback; }

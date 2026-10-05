// Shared render resources: the 1x1 white texture and a cached material factory.
// Rules (§4 readability): enemies / scenery use matte() (roughness 1, no emissive); spells, pickups and
// telegraphs use glow() (emissive, bloom-friendly); transparent() for flat zones.
import { PBRMaterial, Texture } from '../../vendor/xyz/dist/src/index.js';
import { linear } from './geo.js';

let white = null;
export async function initMaterials() {
  if (white) return white;
  const c = new OffscreenCanvas(1, 1);
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(c);
  return white;
}
export function whiteTexture() {
  if (!white) throw new Error('initMaterials() must run before creating materials');
  return white;
}

const cache = new Map();
function get(key, make) {
  let m = cache.get(key);
  if (!m) { m = make(); cache.set(key, m); }
  return m;
}

/** Vertex-coloured matte material (tint multiplies the geometry colours; default white = unchanged). */
export function matte(tint = '#ffffff', roughness = 1) {
  return get(`m|${tint}|${roughness}`, () => new PBRMaterial({ texture: whiteTexture(), color: linear(tint), roughness, metallic: 0 }));
}

/** Emissive material in a single colour. `power` > 1 pushes it over the bloom threshold. */
export function glow(color, power = 1.5, opacity = 1) {
  return get(`g|${color}|${power}|${opacity}`, () => {
    const c = linear(color);
    return new PBRMaterial({
      texture: whiteTexture(), color: c.map((v) => v * 0.6), emissive: c.map((v) => v * power), roughness: 0.6, metallic: 0,
      opacity, transparent: opacity < 1,
    });
  });
}

/** Flat translucent material for ground zones (telegraphs, pools). */
export function zoneMaterial(color, power = 1.2, opacity = 0.4) {
  return get(`z|${color}|${power}|${opacity}`, () => {
    const c = linear(color);
    return new PBRMaterial({
      texture: whiteTexture(), color: c, emissive: c.map((v) => v * power), roughness: 1, metallic: 0, opacity, transparent: true, doubleSided: true,
    });
  });
}

export function disposeMaterials() { cache.clear(); white?.destroy(); white = null; }

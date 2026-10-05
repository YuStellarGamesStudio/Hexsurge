// Standalone character acceptance lab; uses the battle's academy light rig and post-processing.
import { Game, Scene, Mesh, Vector3, EnvironmentMap } from '../../vendor/xyz/dist/src/index.js';
import { MAGES } from '../../src/data/mages.js';
import { BOSSES } from '../../src/data/bosses.js';
import { createMageModel } from '../../src/render/models/mages.js';
import { createBossModel } from '../../src/render/models/bosses.js';
import { MeshBuilder } from '../../src/render/geo.js';
import { initMaterials, matte } from '../../src/render/materials.js';
import { look } from '../../src/render/maps/academy.js';
const copy = {
  en: { heading: 'Character atelier', subtitle: 'Low-poly silhouettes · Academy battle lighting', mages: 'Mages', bosses: 'Bosses', walk: 'Walking', cast: 'Casting', rage: 'Enraged', tier: 'Tier', status: 'MATTE BODIES / MAGIC ACCENTS · LIVE ANIMATION' },
  zh: { heading: '角色工坊', subtitle: '低多邊形剪影 · 學院戰場光照', mages: '法師', bosses: '首領', walk: '行走', cast: '施法', rage: '狂暴', tier: '階段', status: '啞光身軀 / 魔法光點 · 即時動畫' },
  ja: { heading: 'キャラクター工房', subtitle: 'ローポリのシルエット · 学院の戦場照明', mages: '魔法使い', bosses: 'ボス', walk: '歩行', cast: '詠唱', rage: '激昂', tier: '段階', status: 'マットな体 / 魔法の輝き · リアルタイムアニメーション' },
};
const q = new URLSearchParams(location.search);
let lang = ['en','zh','ja'].includes(q.get('lang')) ? q.get('lang') : 'en';
const $ = id => document.getElementById(id);
const game = await Game.create({ canvas: '#game', renderer: q.get('renderer') ?? 'auto' });
await initMaterials();
let mode = q.get('mode') === 'bosses' ? 'bosses' : 'mages', models = [];
const scene = new Scene();
scene.ambientLight = look.ambient;
scene.directionalLight.intensity = look.sun.intensity;
scene.directionalLight.color = look.sun.color;
scene.directionalLight.direction.set(...look.sun.dir).normalize();
scene.background = EnvironmentMap.gradient({ ...look.background, width: 64 });
scene.postProcessing.enabled = true;
scene.postProcessing.toneMapping = 'aces'; scene.postProcessing.exposure = look.exposure;
scene.postProcessing.bloomStrength = look.bloom.strength; scene.postProcessing.bloomThreshold = look.bloom.threshold; scene.postProcessing.bloomRadius = 6; scene.postProcessing.fxaa = true;
scene.camera3D.position.set(0, 9.5, 14.5); scene.camera3D.lookAt(new Vector3(0, 0.9, 0));
scene.camera3D.fov = 40 * Math.PI / 180;
scene.add(new Mesh({ geometry: new MeshBuilder().box(25, 0.2, 20, '#292b40', {pos:[0,-0.34,0]}, 0).build(), material: matte() }));
const stages = new MeshBuilder();
for (let i = 0; i < 6; i++) stages.cylinder(1.25, 0.2, 12, '#666077', {pos:[(i % 3 - 1) * 4.5,-0.2, Math.floor(i / 3) * 4.5 - 2.3]}, 0.08);
scene.add(new Mesh({ geometry: stages.build(), material: matte() }));
function localise() {
  const t = copy[lang]; document.documentElement.lang = lang; $('lang').value = lang;
  $('heading').textContent = t.heading; $('subtitle').textContent = t.subtitle;
  for (const id of ['mages','bosses']) $(id).textContent = t[id];
  for (const id of ['walk','cast','rage']) $(`${id}Text`).textContent = t[id];
  $('status').textContent = t.status; $('tier').setAttribute('aria-label',t.tier);
  const selected = $('tier').value || '0'; $('tier').replaceChildren(...[0,1,2].map(i => { const o = document.createElement('option'); o.value = i; o.textContent = `${t.tier} ${i + 1}`; return o; })); $('tier').value = selected;
  for (const m of models) { m.label.firstChild.textContent = m.def.name[lang]; m.label.lastChild.textContent = m.def.title?.[lang] ?? t.bosses; }
}
function populate() {
  for (const m of models) scene.remove(m.root);
  models = []; $('labels').replaceChildren();
  (mode === 'mages' ? MAGES : BOSSES).forEach((def,i) => {
    const model = mode === 'mages' ? createMageModel(def) : createBossModel(def);
    const scale = mode === 'mages' ? 1.12 : 1 / def.radius;
    model.root.scale.set(scale, scale, scale);
    const x = (i % 3 - 1) * 4.5, z = Math.floor(i / 3) * 4.5 - 2.3;
    model.root.position.set(x, 0, z); model.root.rotation.setFromEuler(0,-Math.PI / 3,0); scene.add(model.root);
    const label = document.createElement('div'); label.className = 'name'; label.append(document.createTextNode(''),document.createElement('span')); $('labels').append(label);
    models.push({ ...model, def, label, x, z });
  });
  $('mages').setAttribute('aria-pressed', mode === 'mages'); $('bosses').setAttribute('aria-pressed', mode === 'bosses');
  $('walk').disabled = mode !== 'mages'; $('cast').disabled = $('rage').disabled = $('tier').disabled = mode !== 'bosses';
  localise();
}
const player = { moving:false }, boss = { casting:0, enraged:false, tier:0 };
scene.update = dt => {
  player.moving = $('walk').checked; boss.casting = $('cast').checked ? 1 : 0; boss.enraged = $('rage').checked; boss.tier = Number($('tier').value);
  const w = game.width, h = game.height, e = scene.camera3D.updateMatrix(w / Math.max(1,h)).elements;
  for (const m of models) {
    m.update(dt, mode === 'mages' ? player : boss);
    const x=m.x,y=0.04,z=m.z+1.05;
    const cw=e[3]*x+e[7]*y+e[11]*z+e[15];
    m.label.style.left = `${((e[0]*x+e[4]*y+e[8]*z+e[12])/cw*.5+.5)*w}px`;
    m.label.style.top = `${(-((e[1]*x+e[5]*y+e[9]*z+e[13])/cw)*.5+.5)*h}px`;
  }
};
for (const id of ['mages','bosses']) $(id).onclick = () => { mode=id; populate(); };
$('lang').onchange = () => { lang=$('lang').value; localise(); };
document.addEventListener('contextmenu', e => e.preventDefault());
populate(); await game.setScene(scene); game.start();
window.characterLab = { game, scene, get models(){ return models; } }; window.ready = true;

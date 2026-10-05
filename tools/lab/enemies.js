// Visual acceptance lab: shares production enemy geometry, material and academy illumination.
import { Game, Scene, Mesh, Vector3 } from '../../vendor/xyz/dist/src/index.js';
import { ENEMIES } from '../../src/data/enemies.js';
import { MeshBuilder } from '../../src/render/geo.js';
import { buildEnemyGeometry } from '../../src/render/models/enemies.js';
import { initMaterials, matte } from '../../src/render/materials.js';
import { look } from '../../src/render/maps/academy.js';
const words={en:{title:'Enemy atelier',grid:'26 silhouettes',mixed:'30-enemy field',gridNote:'Production matte material · academy lighting · facing +X · equal radius display',mixedNote:'Readability acceptance · 30 mixed enemies · actual relative sizes · academy stone'},zh:{title:'魔潮造型工坊',grid:'26 種剪影',mixed:'30 敵同屏',gridNote:'正式啞光材質 · 學院光照 · 面向 +X · 等半徑展示',mixedNote:'可讀性驗收 · 30 隻混合敵人 · 真實相對尺寸 · 學院石地'},ja:{title:'魔潮の造形工房',grid:'26 種のシルエット',mixed:'敵30体の戦場',gridNote:'本番のマット素材 · 学院の照明 · +X方向 · 半径を揃えて展示',mixedNote:'視認性チェック · 敵30体の混成 · 実際のサイズ比 · 学院の石畳'}};
const query=new URLSearchParams(location.search);
let lang=words[query.get('lang')]?query.get('lang'):'en',mode=query.get('mode')==='mixed'?'mixed':'grid';
const game=await Game.create({canvas:'#game',renderer:query.get('renderer')??'auto'});
await initMaterials();
const geometries=ENEMIES.map(buildEnemyGeometry),labels=document.querySelector('#labels');
const stats=geometries.map((g,i)=>({id:ENEMIES[i].id,triangles:g.indices.length/3}));
class EnemyLab extends Scene {
  constructor(){super();this.entries=[];this.ambientLight=look.ambient;this.directionalLight.intensity=look.sun.intensity;this.directionalLight.color=look.sun.color;this.directionalLight.direction.set(...look.sun.dir).normalize();this.postProcessing.enabled=true;this.postProcessing.toneMapping='aces';this.postProcessing.exposure=look.exposure;this.postProcessing.bloomStrength=0;this.postProcessing.fxaa=true;this.camera3D.fov=46*Math.PI/180;this.camera3D.near=.1;this.camera3D.far=100;}
  update(){const aspect=game.width/Math.max(1,game.height);this.camera3D.position.set(0,20*Math.max(1,1.7/aspect),mode==='grid'?15:11.5);this.camera3D.lookAt(new Vector3(0,0,0));const e=this.camera3D.updateMatrix(aspect).elements;for(const item of this.entries){if(!item.label)continue;const {x,z}=item;const y=-.2,w=e[3]*x+e[7]*y+e[11]*z+e[15];item.label.style.left=`${((e[0]*x+e[4]*y+e[8]*z+e[12])/w*.5+.5)*game.width}px`;item.label.style.top=`${(-(e[1]*x+e[5]*y+e[9]*z+e[13])/w*.5+.5)*game.height+10}px`;}}
}
let scene;
async function show(){
  const previous=scene;scene=new EnemyLab();labels.replaceChildren();
  const ground=new MeshBuilder().box(40,.08,30,'#a09b8d',{pos:[0,-.08,0]});
  for(let x=-18;x<=18;x+=3)for(let z=-12;z<=12;z+=3)ground.box(2.96,.025,2.96,(x+z)%2?'#aaa497':'#a5a092',{pos:[x,-.027,z]},.015);
  scene.add(new Mesh({geometry:ground.build(),material:matte()}));scene.ground=ground;
  const count=mode==='grid'?ENEMIES.length:30;
  for(let i=0;i<count;i++){
    const index=mode==='grid'?i:(i*7)%ENEMIES.length,def=ENEMIES[index];
    const cols=mode==='grid'?7:6,spacing=mode==='grid'?3.35:2.7;
    const x=(i%cols-(cols-1)/2)*spacing,z=(Math.floor(i/cols)-(mode==='grid'?1.5:2))*spacing;
    const mesh=new Mesh({geometry:geometries[index],material:matte()});mesh.position.set(x,def.flying?1.5:0,z);const scale=mode==='grid'?.75/def.radius:1;mesh.scale.set(scale,scale,scale);mesh.rotation.y=mode==='grid'?-.55:(i%5)*1.1;scene.add(mesh);
    if(mode==='grid'){scene.add(new Mesh({geometry:new MeshBuilder().cylinder(1.13,.08,12,'#7f7c86',{pos:[x,-.025,z]}).build(),material:matte()}));const label=document.createElement('div');label.className='label';label.textContent=def.name[lang];const small=document.createElement('small');small.textContent=`${stats[index].triangles} △`;label.append(small);labels.append(label);scene.entries.push({x,z,label});}
  }
  for(const key of ['title','grid','mixed'])document.querySelector(`#${key}`).textContent=words[lang][key];document.querySelector('#note').textContent=words[lang][`${mode}Note`];for(const key of ['grid','mixed'])document.querySelector(`#${key}`).setAttribute('aria-pressed',String(mode===key));document.documentElement.lang=lang;
  scene.update();
  await game.setScene(scene);if(previous){for(const child of previous.objects)if(!geometries.includes(child.geometry))child.geometry?.destroy?.();previous.destroy();}window.enemyLab={game,scene,stats,mode};
}
for(const key of ['grid','mixed'])document.querySelector(`#${key}`).onclick=()=>{mode=key;show();};document.querySelector('#lang').value=lang;document.querySelector('#lang').onchange=e=>{lang=e.target.value;show();};document.addEventListener('contextmenu',e=>e.preventDefault());await show();game.start();window.ready=true;

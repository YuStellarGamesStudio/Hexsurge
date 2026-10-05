// Contract: one static, matte vertex-coloured geometry per definition, feet at zero, facing +X.
// Authored in radius units; the final fit includes props so collision silhouettes remain honest.
import { MeshBuilder } from '../geo.js';

export function buildEnemyGeometry(def) {
  const b = new MeshBuilder(), body = def.color, accent = def.accent;
  const dark = '#262332', bone = '#ded3b8', id = def.id;
  const ball = (x,y,z,sx,sy,sz,c=body,detail=0) => b.ico(1,detail,c,{pos:[x,y,z],scale:[sx,sy,sz]});
  const box = (x,y,z,w,h,d,c=body,rot=[0,0,0]) => b.box(w,h,d,c,{pos:[x,y,z],rot});
  const cone = (x,y,z,r,h,c=accent,rot=[0,0,0],top=0) => b.cone(r,h,5,c,{pos:[x,y,z],rot},.12,top);
  const cylinder = (x,y,z,r,h,segments,c,rot=[0,0,0]) => b.cylinder(r,h,segments,c,{pos:[x,y,z],rot});
  const eyes = (x,y,z=.2) => {
    for(const s of [-1,1]) { box(x,y,s*z,.07,.17,.17,dark); box(x+.045,y+.015,s*z,.04,.075,.09,accent); }
  };
  const feet = () => { for(const s of [-1,1]) box(.12,.16,s*.34,.46,.32,.3,dark); };
  const head = (y=1.65) => { ball(.12,y,0,.42,.42,.42); box(.46,y-.12,0,.27,.2,.44); eyes(.52,y+.03); };
  const horns = (y=1.9) => { for(const s of [-1,1]) cone(-.04,y,s*.3,.13,.42,bone,[s*.3,0,-.15]); };
  const humanoid = (armour=false) => {
    feet(); ball(-.06,.95,0,.45,.65,.48);
    for(const s of [-1,1]) { ball(0,1.05,s*.58,.23,.5,.23); if(armour) ball(-.03,1.38,s*.58,.3,.23,.28,accent); }
    head();
  };
  const robe = () => {
    cone(0,0,0,.65,1.4,body,[0,0,0],.3);
    ball(0,1.68,0,.46,.49,.44); box(.38,1.66,0,.1,.46,.48,dark); eyes(.45,1.72);
    for(const s of [-1,1]) cone(.1,.8,s*.51,.25,.55,body,[s*.35,0,-.25],.12);
    box(.57,1.05,0,.05,.9,.18,accent);
  };
  const staff = (z=.62) => { box(.15,1.05,z,.09,2.1,.09,bone); b.gem(.23,.3,.18,5,accent,{pos:[.15,2.05,z]}); };
  const wing = (s,feathers=false) => {
    // Closed tapered slabs (never mirrored negative scales, which reverse culling).
    for(let i=0;i<3;i++) {
      box(-.13-i*.12,.18-i*.07,s*(.4+i*.23),.6-i*.09,.09,.37, i===1?accent:body,[s*.18, s*.25,0]);
      if(feathers) cone(-.42-i*.12,.13-i*.08,s*(.4+i*.23),.12,.33,accent,[0,0,Math.PI/2]);
    }
  };
  switch(def.family) {
    case 'swarm':
      humanoid(id==='revenant');
      if(id==='imp') { horns(); cone(-.4,.6,0,.12,.55,body,[0,0,1.2]); }
      if(id==='ghoul') { box(.47,1.36,0,.25,.13,.48,dark); for(const s of [-1,1]) cone(.48,.7,s*.56,.09,.24,bone,[0,0,-1.2]); ball(-.3,1.18,0,.32,.26,.39,accent); }
      if(id==='revenant') { cone(0,1.92,0,.3,.35,accent); box(.39,1.7,0,.12,.09,.67,accent); box(.15,.85,-.73,.43,.95,.12,body); box(.38,1,.64,.1,1.08,.12,bone,[0,0,-.25]); }
      break;
    case 'fast':
      ball(-.2,.65,0,.6,.32,.33); ball(.42,.83,0,.36,.36,.32); box(.74,.73,0,.37,.22,.31); eyes(.79,.94,.19);
      for(const x of [-.48,.35]) for(const s of [-1,1]) box(x,.26,s*.26,.17,.52,.17,body,[0,0,x<0?-.25:.22]);
      for(const s of [-1,1]) { cone(.3,1.04,s*.21,.14,.35); cone(.82,.64,s*.12,.055,.17,bone,[0,0,Math.PI]); }
      cone(-.68,.7,0,.15,.55,body,[0,0,1.3]);
      if(id==='shade_stalker') for(let i=0;i<3;i++) cone(-.4+i*.23,.88,0,.16,.38,accent,[0,0,.35]);
      break;
    case 'tank':
      feet(); box(-.04,1.12,0,.9,1.36,1.05); head(2.05);
      for(const s of [-1,1]) { ball(0,1.7,s*.67,.38,.36,.34); box(.02,.98,s*.72,.4,.9,.4); box(.24,.56,s*.72,.47,.42,.45,accent); }
      box(.46,1.2,0,.09,.6,.66,accent);
      if(id!=='stone_brute') { horns(2.3); for(const s of [-1,1]) cone(0,1.94,s*.64,.2,.36,accent); box(.5,2.08,0,.1,.12,.68,dark); }
      if(id==='colossus') { for(const s of [-1,1]) cone(-.1,2,s*.85,.22,.62,body); b.gem(.22,.3,.3,5,accent,{pos:[.54,1.3,0],rot:[0,0,-Math.PI/2]}); cone(-.1,2.35,0,.24,.45,body); }
      break;
    case 'ranged':
      robe();
      if(id==='cult_archer') { for(const y of [.85,1.4]) box(.64,y,-.55,.1,.62,.1,bone,[0,0,y<1?-.5:.5]); box(.8,1.13,-.55,.04,1.08,.04,accent); box(.64,1.12,0,.65,.055,.055,bone); }
      if(id==='hex_caster') { staff(); cone(-.04,1.98,0,.43,.58,body,[0,0,.3]); }
      if(id==='arc_gunner') { box(.47,1.05,0,.9,.36,.48,dark); cylinder(.15,1.05,0,.24,.65,6,accent,[0,0,-Math.PI/2]); ball(-.3,1.1,0,.4,.5,.5,dark); for(const s of [-1,1]) cone(0,1.75,s*.42,.15,.35,accent); }
      break;
    case 'split':
      if(id==='slime'||id==='slime_bit') { ball(0,.58,0,.91,.63,.83,body,1); eyes(.79,.68,.29); ball(-.18,1.03,0,.22,id==='slime'?.35:.16,.23,accent); if(id==='slime') { ball(-.55,.17,.39,.34,.2,.32); ball(.4,.13,-.4,.31,.17,.32); } }
      else { for(let i=0;i<3;i++) ball(.47-i*.43,.45+i*.06,0,.44,.47+i*.05,.52, i===1?accent:body); eyes(.83,.57,.25); for(const s of [-1,1]) { cone(.39,.72,s*.24,.09,.36,accent,[s*.5,0,-.6]); for(let i=0;i<3;i++) box(.4-i*.4,.12,s*.53,.24,.19,.18,dark); } if(id==='brood_mother') for(let i=0;i<3;i++) cone(-.6+i*.4,.97,0,.18,.32,body); }
      break;
    case 'exploder':
      feet(); ball(0,.95,0,.69,.73,.65,body,1); eyes(.61,1.18,.26); box(.63,.88,0,.1,.13,.4,dark);
      cylinder(0,1.59,0,.19,.21,6,dark); box(.03,1.94,0,.09,.52,.09,bone,[0,0,-.2]); ball(.08,2.2,0,.13,.13,.13,accent);
      for(const s of [-1,1]) cone(.1,1.37,s*.5,.14,.33,bone,[s*.4,0,0]);
      if(id==='magma_bomber') { for(const s of [-1,1]) box(.44,.94,s*.37,.16,.8,.1,accent,[0,0,-.3]); ball(-.62,1,0,.28,.35,.4,dark); }
      break;
    case 'flyer':
      ball(0,.13,0,.31,.37,.27); wing(-1,id==='harpy'); wing(1,id==='harpy');
      ball(.22,.37,0,.3,.29,.28); eyes(.46,.43,.16);
      if(id==='gloom_bat') for(const s of [-1,1]) cone(.12,.56,s*.2,.13,.3,body);
      if(id==='harpy') { cone(.48,.3,0,.12,.27,accent,[0,0,-Math.PI/2]); for(const s of [-1,1]) box(.13,-.2,s*.16,.12,.45,.12,accent); }
      if(id==='wraith') { cone(0,-.5,0,.12,.96,body,[0,0,0],.38); for(const s of [-1,1]) cone(-.45,-.5,s*.45,.04,.58,body,[s*.35,0,0],.18); cone(-.09,.54,0,.28,.38,body); }
      break;
    case 'buffer':
      humanoid(true); horns();
      if(id==='war_drummer') { cylinder(.55,.66,0,.49,.62,8,body); cylinder(.55,1.28,0,.5,.06,8,bone); for(const s of [-1,1]) box(.56,1.48,s*.35,.08,.65,.08,accent,[s*.45,0,-.35]); }
      else { box(-.2,1.5,-.64,.09,3,.09,bone); box(-.4,2.61,-.64,.73,.71,.07,body); box(-.4,2.69,-.69,.12,.43,.025,accent); cone(-.2,3,-.64,.14,.27,accent); box(.42,1,.57,.17,.98,.61,body); }
      break;
    case 'healer':
      robe(); b.ring(.34,.43,10,accent,{pos:[0,2.25,0]},.05); staff(-.58);
      if(id==='mender') { box(.15,1.35,-.58,.32,.4,.32,bone); box(.33,1.35,-.58,.04,.22,.18,accent); }
      else { for(const s of [-1,1]) cone(-.18,1.32,s*.45,.19,.86,accent,[s*.5,0,.5]); b.ring(.2,.27,8,accent,{pos:[.18,2.1,-.58],rot:[Math.PI/2,0,0]}); }
      break;
    case 'summoner':
      if(id==='necromancer') { robe(); staff(); cone(-.13,1.97,0,.38,.55,body,[0,0,.3]); ball(.15,2.1,.62,.25,.25,.22,bone); box(.36,2.11,.62,.1,.1,.26,dark); box(.53,1,-.53,.34,.12,.48,bone,[0,0,-.25]); }
      else { ball(-.25,.88,0,.7,.82,.58,body,1); ball(.28,1.68,0,.36,.42,.35); eyes(.59,1.75); for(const s of [-1,1]) { for(let i=0;i<3;i++) box(-.4+i*.34,.37,s*.61,.14,.76,.14,accent,[s*.5,0,0]); cone(.16,1.94,s*.22,.12,.56,accent,[s*.28,0,0]); box(-.4,1.54,s*.45,.75,.1,.31,body,[0,s*.25,s*.4]); } cone(.22,2.02,0,.13,.66,accent); }
      break;
    default: throw new Error(`Unknown enemy family: ${def.family}`);
  }
  let extent=0,minY=Infinity,maxY=-Infinity;
  for(let i=0;i<b.positions.length;i+=3) { extent=Math.max(extent,Math.hypot(b.positions[i],b.positions[i+2])); minY=Math.min(minY,b.positions[i+1]); maxY=Math.max(maxY,b.positions[i+1]); }
  const horizontal=def.radius*1.1/extent;
  const height=def.radius*(def.family==='tank'?2.7:id==='banner_knight'?3:2.2);
  const vertical=height/(maxY-minY);
  for(let i=0;i<b.positions.length;i+=3) { b.positions[i]*=horizontal; b.positions[i+2]*=horizontal; b.positions[i+1]=def.flying?(b.positions[i+1]-(minY+maxY)/2)*vertical+.15:(b.positions[i+1]-minY)*vertical; }
  return b.build();
}

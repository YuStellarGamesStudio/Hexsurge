// Boss models: local dimensions are authored in radius units; feet at y=0, forward +X.
// Only internal groups animate: BattleView owns the world-space root transform.
import { Group, Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { MeshBuilder } from '../geo.js';
import { matte, glow } from '../materials.js';
const at = (x, y, z, scale, rot) => ({ pos: [x, y, z], scale, rot });
const mesh = (parent, b, material = matte()) => { const m = new Mesh({ geometry: b.build(), material }); parent.add(m); return m; };

export function createBossModel(def) {
  const root = new Group(), rig = new Group(), body = new Group(), orbit = new Group(), crown = new Group();
  rig.scale.set(def.radius, def.radius, def.radius); root.add(rig); rig.add(body); body.add(orbit); body.add(crown);
  const b = new MeshBuilder(), a = new MeshBuilder(), tier = new MeshBuilder(), limbs = [];
  const c = def.color, light = def.accent;
  if (def.id === 'fallen_archmage') {
    b.cone(0.68, 1.4, 9, c, at(0, 0.15, 0), 0.22, 0.3);
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      b.gem(0.2, 0.35, 0.25 + (i % 3) * 0.1, 4, '#34284f', at(Math.cos(angle) * 0.5, 0.35, Math.sin(angle) * 0.5, [0.6, 1, 1]));
    }
    b.ico(0.32, 1, '#c7bca9', at(0.1, 1.67, 0));
    b.ico(0.39, 1, '#30243c', at(-0.1, 1.71, 0, [0.75, 1.2, 1.1]));
    b.cone(0.43, 0.17, 7, c, at(0, 1.91, 0), 0.2, 0.1);
    for (const z of [-0.6, 0.6]) {
      const arm = new Group(); arm.position.set(0, 1.25, z); body.add(arm); limbs.push(arm);
      mesh(arm, new MeshBuilder().cone(0.23, 0.8, 6, c, at(0, 0, 0, undefined, [0, 0, -1.4])).ico(0.13, 0, '#c7bca9', at(0.8, 0.08, 0)));
    }
    for (const z of [-0.13, 0.13]) a.ico(0.047, 0, '#ffffff', at(0.38, 1.72, z));
    // A broken halo, deliberately leaving gaps rather than a full emissive ring.
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 9;
      a.box(0.22, 0.045, 0.065, '#ffffff', at(Math.cos(angle) * 0.53, 2.13, Math.sin(angle) * 0.53, undefined, [0, -angle + Math.PI / 2, 0]));
    }
    mesh(orbit, new MeshBuilder().box(0.5, 0.08, 0.65, '#2a172e', at(0, 0, 0)).box(0.44, 0.13, 0.58, '#c0a37e', at(0, 0.08, 0)).box(0.5, 0.045, 0.65, '#4b284c', at(0, 0.17, 0)));
    mesh(orbit, new MeshBuilder().gem(0.075, 0.1, 0.1, 4, '#ffffff', at(0, 0.24, 0)), glow(light, 1)); orbit.position.set(0.8, 1.25, -0.45);
    for (const z of [-0.42, 0.42]) tier.gem(0.2, 0.45, 0.1, 5, light, at(0, 1.65, z));
  } else if (def.id === 'rotwood_king') {
    b.cone(0.52, 1.55, 7, '#503d31', at(0, 0.45, 0), 0.3, 0.37);
    b.ico(0.48, 0, c, at(0, 1.83, 0, [0.85, 1.12, 1]));
    for (const z of [-0.38, 0.38]) {
      b.cone(0.24, 0.75, 5, '#403328', at(0.12, 0.05, z, undefined, [z * 0.4, 0, 0.18]), 0.2, 0.16);
      b.gem(0.17, 0.55, 0.15, 5, '#503d31', at(0.35, 0.19, z * 1.5, [1, 0.4, 1], [0, 0, -0.8]));
      b.cone(0.095, 0.85, 5, '#584536', at(-0.08, 2.02, z, undefined, [z * 0.9, 0, 0.3]));
      b.cone(0.065, 0.45, 4, '#584536', at(-0.27, 2.35, z * 1.3, undefined, [z, 0, -0.6]));
      b.cone(0.06, 0.38, 4, '#584536', at(-0.35, 2.3, z, undefined, [-z, 0, 0.65]));
      const arm = new Group(); arm.position.set(0, 1.55, z * 1.6); body.add(arm); limbs.push(arm);
      mesh(arm, new MeshBuilder().cone(0.2, 0.8, 5, '#503d31', at(0, 0, 0, undefined, [0, 0, 2.7]), 0.2, 0.12).ico(0.22, 0, '#403328', at(0.3, -0.7, z * 0.25)));
      for (let i = 0; i < 3; i++) b.ico(0.14, 0, c, at(-0.25, 1.25 + i * 0.18, z * 1.1, [0.5, 0.5, 1.6]));
      a.gem(0.085, 0.06, 0.06, 4, '#ffffff', at(0.42, 1.94, z * 0.45, [0.2, 1, 1]));
    }
    for (let i = 0; i < 5; i++) a.box(0.022, 0.23, 0.055, '#ffffff', at(0.47 - i * 0.018, 0.8 + i * 0.17, (i % 2) * 0.05, undefined, [0, 0, i % 2 ? 0.4 : -0.4]));
    b.box(0.07, 0.1, 0.3, '#201f1d', at(0.44, 1.66, 0));
    for (let i = 0; i < 5; i++) tier.gem(0.12, 0.45, 0.07, 5, light, at(-0.15 + i * 0.07, 2.2, (i - 2) * 0.15));
  } else if (def.id === 'rimewing') {
    b.ico(0.62, 1, c, at(-0.12, 0.94, 0, [1.12, 0.78, 0.65]));
    b.ico(0.35, 1, c, at(0.48, 1.38, 0, [0.65, 1.2, 0.85]));
    b.ico(0.33, 0, c, at(0.72, 1.65, 0, [1.2, 0.8, 0.75]));
    b.ico(0.23, 0, '#bce9f2', at(0.98, 1.52, 0, [1.2, 0.55, 0.8]));
    b.cone(0.23, 1, 6, c, at(-0.5, 0.8, 0, undefined, [0, 0, 1.8]));
    for (const z of [-0.3, 0.3]) {
      b.cone(0.14, 0.65, 5, '#6093bb', at(-0.1, 0.06, z));
      b.box(0.34, 0.13, 0.24, '#9bd8ec', at(0.02, 0.08, z));
      b.cone(0.075, 0.45, 5, light, at(0.63, 1.82, z * 0.65, undefined, [z, 0, 0.35]));
      a.ico(0.055, 0, '#ffffff', at(0.94, 1.7, z * 0.75));
      const wing = new Group(); wing.position.set(-0.15, 1.2, z); body.add(wing); limbs.push(wing);
      const w = new MeshBuilder();
      // Closed, faceted membrane volume gives both wing sides correct outward normals.
      w.gem(0.55, 0.1, 0.1, 3, '#6ca1c8', at(-0.28, 0.24, z * 1.45, [1.4, 1, 1.1], [0.2, z * 0.4, 0]));
      w.cone(0.055, 0.85, 5, '#c0eafa', at(0, 0, 0, undefined, [z > 0 ? 1.2 : -1.2, 0, 0]));
      w.gem(0.09, 0.25, 0.1, 4, '#d6f5ff', at(-0.4, 0.3, z * 2)); mesh(wing, w);
    }
    for (let i = 0; i < 5; i++) b.cone(0.1, 0.28, 4, '#e1f6ff', at(-0.55 + i * 0.2, 1.25 + i * 0.03, 0));
    for (const z of [-0.25, 0.25]) tier.gem(0.14, 0.42, 0.1, 5, light, at(0.23, 1.62, z));
  } else if (def.id === 'ignarok') {
    b.ico(0.67, 0, c, at(0, 1.28, 0, [0.75, 1.05, 1]));
    b.ico(0.34, 0, '#382b2a', at(0.03, 2, 0, [0.9, 0.8, 1]));
    for (const z of [-0.4, 0.4]) {
      b.box(0.48, 0.26, 0.48, '#29272a', at(0.06, 0.13, z));
      b.ico(0.32, 0, c, at(0, 0.58, z, [0.8, 1.5, 0.8]));
      b.ico(0.35, 0, '#29272a', at(0, 1.68, z * 1.55));
      const arm = new Group(); arm.position.set(0, 1.48, z * 1.65); body.add(arm); limbs.push(arm);
      mesh(arm, new MeshBuilder().ico(0.25, 0, c, at(0, -0.22, 0, [1, 1.8, 1])).ico(0.33, 0, '#29272a', at(0.1, -0.62, 0)));
      mesh(arm, new MeshBuilder().box(0.3, 0.035, 0.04, '#ffffff', at(0.3, -0.6, 0)), glow(light, 1));
      a.box(0.035, 0.3, 0.055, '#ffffff', at(0.22, 0.64, z, undefined, [0, 0, 0.3]));
      a.box(0.06, 0.045, 0.14, '#ffffff', at(0.32, 2.04, z * 0.32));
      tier.cone(0.18, 0.5, 5, '#6d4332', at(0, 1.84, z * 1.6, undefined, [z * 0.5, 0, 0]));
    }
    b.ico(0.29, 1, '#191b23', at(0.42, 1.37, 0, [0.3, 1, 1]));
    a.gem(0.21, 0.25, 0.25, 6, '#ffffff', at(0.5, 1.37, 0, [0.3, 1, 1]));
    for (let i = 0; i < 3; i++) a.box(0.025, 0.04, 0.4, '#ffffff', at(0.46, 1.03 + i * 0.2, 0));
  } else if (def.id === 'nullgaze') {
    b.ico(0.77, 1, c, at(0, 1.2, 0, [0.65, 1, 1]));
    b.ico(0.63, 1, '#d7cadc', at(0.3, 1.2, 0, [0.4, 1, 1]));
    b.ico(0.4, 1, '#773c92', at(0.52, 1.2, 0, [0.25, 1, 1]));
    b.ico(0.25, 1, '#110c22', at(0.6, 1.2, 0, [0.15, 1.5, 0.65]));
    a.ico(0.05, 1, '#ffffff', at(0.65, 1.4, -0.12));
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      const shard = new Group(); orbit.add(shard); shard.position.set(Math.cos(angle) * 0.88, 1.2 + Math.sin(angle) * 0.6, Math.sin(angle) * 0.6);
      mesh(shard, new MeshBuilder().gem(0.12, 0.3, 0.18, 5, '#483260', at(0, 0, 0, undefined, [0.3, angle, 0.4])));
      mesh(shard, new MeshBuilder().gem(0.035, 0.18, 0.1, 4, '#ffffff', at(0.11, 0, 0)), glow(light, 0.9));
    }
    for (let i = 0; i < 5; i++) tier.gem(0.09, 0.3, 0.06, 4, light, at(0, 1.95, (i - 2) * 0.2));
  }
  mesh(body, b); const accents = mesh(body, a, glow(light, 1.1)); mesh(crown, tier); crown.visible = false;
  let time = 0, castPose = 0;
  return { root, update(dt, boss) {
    time += dt;
    castPose += ((boss.casting > 0 ? 1 : 0) - castPose) * Math.min(1, dt * 9);
    const angry = boss.enraged ? 1 : 0;
    body.position.set(angry * Math.sin(time * 31) * 0.014, (Math.sin(time * 1.8) + 1) * 0.025 + castPose * 0.06, angry * Math.cos(time * 27) * 0.012);
    body.rotation.setFromEuler(0, 0, -castPose * 0.09);
    const pulse = 1 + Math.sin(time * (angry ? 13 : 3)) * 0.045 + castPose * 0.15 + angry * 0.06;
    accents.scale.set(pulse, pulse, pulse);
    crown.visible = boss.tier >= 2;
    for (let i = 0; i < limbs.length; i++) {
      const side = i === 0 ? -1 : 1;
      if (def.id === 'rimewing') limbs[i].rotation.setFromEuler(side * (Math.sin(time * 3) * 0.28 + castPose * 0.5), 0, 0);
      else limbs[i].rotation.setFromEuler(Math.sin(time * 2 + i) * 0.045, 0, -castPose * 0.9);
    }
    if (def.id === 'fallen_archmage') { orbit.position.y = 1.25 + Math.sin(time * 2.1) * 0.1 + castPose * 0.25; orbit.rotation.setFromEuler(0.15, Math.sin(time) * 0.15, -0.2); }
    else if (def.id === 'nullgaze') orbit.rotation.setFromEuler(0, time * (angry ? 1.4 : 0.5), Math.sin(time) * 0.1);
  } };
}

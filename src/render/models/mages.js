// Animated mage portraits: feet at y=0, forward +X. Root transforms belong to BattleView.
import { Group, Mesh } from '../../../vendor/xyz/dist/src/index.js';
import { MeshBuilder } from '../geo.js';
import { matte, glow } from '../materials.js';

const at = (x, y, z, scale, rot) => ({ pos: [x, y, z], scale, rot });
const part = (parent, builder, material = matte()) => {
  const mesh = new Mesh({ geometry: builder.build(), material }); parent.add(mesh); return mesh;
};

export function createMageModel(mage) {
  const c = mage.colors, id = mage.id;
  const root = new Group(), body = new Group(); root.add(body);
  const b = new MeshBuilder(), robe = new MeshBuilder(), magic = new MeshBuilder();
  // Two boots and a short, generous silhouette read at the battle camera's distance.
  for (const z of [-0.18, 0.18]) b.box(0.34, 0.18, 0.22, c.hat, at(0.08, 0.09, z));
  robe.cone(0.43, 0.87, 8, c.robe, at(-0.03, 0.17, 0), 0.18, 0.25);
  robe.cone(0.445, 0.09, 8, c.trim, at(-0.03, 0.19, 0), 0.1, 0.42);
  b.ico(0.3, 1, c.robe, at(0, 1.03, 0, [0.85, 1, 1.35]));
  b.cylinder(0.25, 0.075, 8, c.trim, at(0, 0.88, 0));
  b.ico(0.27, 1, c.skin, at(0.02, 1.36, 0, [1, 1.1, 1]));
  b.ico(0.065, 0, c.skin, at(0.285, 1.34, 0));
  for (const z of [-0.12, 0.12]) {
    b.box(0.04, 0.055, 0.047, '#201c35', at(0.262, 1.415, z));
    b.ico(0.15, 0, c.robe, at(0.12, 1.04, z * 3, [1, 1.2, 1]));
    b.ico(0.085, 1, c.skin, at(0.27, 0.96, z * 3));
  }
  const staff = new Group(); staff.position.set(0.32, 0, -0.42); body.add(staff);
  const wood = new MeshBuilder();
  if (!['arcanis', 'nox'].includes(id)) {
    wood.cylinder(0.038, 1.55, 6, id === 'sylva' ? '#735437' : c.trim, at(0, 0.08, 0));
    wood.cylinder(0.075, 0.12, 6, c.hat, at(0, 1.5, 0));
  }
  const orbit = new Group(); body.add(orbit);
  if (id === 'ignis') {
    b.cone(0.43, 0.075, 10, c.hat, at(0, 1.56, 0), 0.1, 0.43);
    b.cone(0.3, 0.41, 8, c.hat, at(-0.04, 1.61, 0), 0.12, 0.055);
    b.cone(0.305, 0.06, 8, c.trim, at(-0.04, 1.62, 0), 0.1, 0.27);
    b.gem(0.19, 0.08, 0.42, 5, '#eee1c6', at(0.22, 1.2, 0, [0.7, 1, 1]));
    for (const z of [-0.12, 0.12]) b.ico(0.1, 0, '#fff1d6', at(0.26, 1.31, z, [0.5, 0.55, 1]));
    magic.gem(0.12, 0.3, 0.08, 5, '#ffffff', at(0, 1.7, 0, undefined, [0, 0, -0.18]));
    magic.gem(0.06, 0.19, 0.04, 5, '#ffffff', at(0.1, 1.67, 0.025));
  } else if (id === 'glacia') {
    b.ico(0.31, 1, c.hat, at(-0.075, 1.4, 0, [0.85, 1.12, 1.1]));
    b.ico(0.245, 1, c.skin, at(0.105, 1.39, 0, [0.72, 0.95, 1]));
    b.cone(0.31, 0.09, 8, c.trim, at(0, 1.56, 0), 0.1, 0.3);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      b.gem(0.06, 0.21 + (i % 2) * 0.05, 0.025, 4, c.trim, at(Math.cos(a) * 0.26, 1.64, Math.sin(a) * 0.26));
    }
    magic.gem(0.13, 0.24, 0.18, 5, '#ffffff', at(0, 1.7, 0));
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7;
      part(orbit, new MeshBuilder().ico(0.025, 0, '#ffffff', at(Math.cos(a) * 0.65, 0.75 + i * 0.12, Math.sin(a) * 0.65)), glow(c.glow, 0.75));
    }
  } else if (id === 'voltra') {
    b.ico(0.26, 0, '#ebdba0', at(-0.045, 1.56, 0, [1, 0.6, 1.1]));
    for (let i = 0; i < 6; i++) b.cone(0.09, 0.3, 4, '#f0d37c', at(-0.15 + (i % 3) * 0.12, 1.58, (Math.floor(i / 3) - 0.5) * 0.3, undefined, [0.2, 0, 0.3]));
    for (const z of [-0.13, 0.13]) {
      b.ico(0.105, 1, '#44354f', at(0.25, 1.44, z, [0.35, 1, 1]));
      b.ico(0.078, 1, '#bce5e3', at(0.285, 1.44, z, [0.2, 1, 1]));
    }
    b.cylinder(0.28, 0.12, 8, c.hat, at(0, 1.12, 0));
    robe.box(0.12, 0.12, 0.65, c.hat, at(-0.25, 1.08, 0.31, undefined, [0.2, 0.5, 0]));
    wood.box(0.14, 0.27, 0.12, c.hat, at(0, 1.63, 0));
    magic.gem(0.07, 0.23, 0.12, 4, '#ffffff', at(0.07, 1.7, 0));
    magic.box(0.035, 0.19, 0.035, '#ffffff', at(-0.1, 1.7, 0, undefined, [0, 0, 0.45]));
  } else if (id === 'arcanis') {
    b.cone(0.37, 0.055, 8, c.hat, at(0, 1.57, 0), 0.1, 0.37);
    b.cone(0.27, 0.43, 7, c.hat, at(0, 1.6, 0), 0.12, 0.025);
    b.gem(0.08, 0.11, 0.11, 4, c.trim, at(0.18, 1.79, 0, [0.2, 1, 1]));
    const book = new MeshBuilder().box(0.34, 0.075, 0.45, c.hat, at(0, 0, 0)).box(0.3, 0.07, 0.4, '#fff1cf', at(0, 0.055, 0));
    for (const z of [-0.11, 0.11]) book.box(0.27, 0.016, 0.2, '#fff1cf', at(0, 0.1, z, undefined, [z * 2, 0, 0]));
    part(orbit, book); orbit.position.set(0.48, 1.13, -0.45);
    magic.gem(0.045, 0.1, 0.1, 4, '#ffffff', at(0, 0.25, 0));
  } else if (id === 'sylva') {
    b.ico(0.28, 1, '#584634', at(-0.09, 1.4, 0, [0.85, 1.2, 1.13]));
    for (const z of [-0.25, 0.25]) {
      b.cone(0.045, 0.4, 5, '#b79b64', at(-0.06, 1.57, z, undefined, [z, 0, 0.3]));
      b.cone(0.035, 0.22, 5, '#b79b64', at(-0.16, 1.74, z, undefined, [0, 0, 0.65]));
      b.gem(0.11, 0.14, 0.08, 4, c.trim, at(0.08, 1.66, z, [1, 0.5, 1], [0, 0, -0.5]));
    }
    wood.cone(0.045, 0.25, 5, '#735437', at(0, 1.49, 0, undefined, [0, 0, -0.6]));
    magic.gem(0.09, 0.16, 0.08, 4, '#ffffff', at(0.08, 1.76, 0, [1, 0.6, 1], [0, 0, -0.5]));
    magic.gem(0.075, 0.15, 0.06, 4, '#ffffff', at(-0.06, 1.72, 0, [1, 0.6, 1], [0, 0, 0.5]));
  } else if (id === 'nox') {
    b.ico(0.34, 1, c.hat, at(-0.06, 1.41, 0, [1, 1.25, 1]));
    b.ico(0.245, 1, '#09071a', at(0.19, 1.39, 0, [0.4, 1, 1]));
    for (const z of [-0.095, 0.095]) magic.box(0.025, 0.035, 0.055, '#ffffff', at(0.295, 1.44, z));
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3;
      part(orbit, new MeshBuilder().gem(0.08, 0.18, 0.15, 5, '#ffffff', at(Math.cos(a) * 0.61, 1.15, Math.sin(a) * 0.61)), glow(c.glow, 0.9));
    }
    b.gem(0.07, 0.12, 0.12, 4, c.trim, at(0.265, 0.91, 0, [0.2, 1, 1]));
  }
  part(body, b); const cloak = part(body, robe);
  if (wood.positions.length) part(staff, wood);
  const accent = part(id === 'arcanis' ? orbit : id === 'nox' ? body : staff, magic, glow(c.glow, 0.95));
  let time = 0;
  return { root, update(dt, player) {
    time += dt;
    const walking = player.moving, step = Math.sin(time * 12);
    body.position.y = walking ? Math.abs(step) * 0.075 : (Math.sin(time * 2.2) + 1) * 0.018;
    body.rotation.setFromEuler(walking ? step * 0.025 : 0, 0, walking ? step * 0.035 : 0);
    cloak.rotation.setFromEuler(walking ? step * 0.065 : Math.sin(time * 1.7) * 0.015, 0, 0);
    staff.rotation.setFromEuler(0, 0, Math.sin(time * (walking ? 12 : 2)) * (walking ? 0.065 : 0.018));
    const pulse = 1 + Math.sin(time * 3.1) * 0.065; accent.scale.set(pulse, pulse, pulse);
    if (id === 'arcanis') { orbit.position.y = 1.13 + Math.sin(time * 2) * 0.08; orbit.rotation.setFromEuler(0.12, Math.sin(time) * 0.1, -0.12); }
    else orbit.rotation.setFromEuler(0, time * (id === 'nox' ? 0.8 : 0.25), 0);
  } };
}

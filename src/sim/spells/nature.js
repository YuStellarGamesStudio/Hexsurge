// Nature handlers use the shared damage pipeline so burning targets can trigger burnout.
import { nearestN, spawnArea, spawnMinion, syncMinions, spawnProjectile, redirectToNearest } from '../entities.js';
import { emit, healPlayer } from '../combat.js';
import { TAU } from '../math.js';

function growPatch(run, area, dt) {
  area.data.age += dt;
  area.r = area.data.radius * Math.min(1, area.data.initial + Math.max(0, area.data.age) / area.data.growth);
}

function patch(ctx, x, z, delay = 0) {
  const { run, s, def } = ctx;
  spawnArea(run, {
    x, z, radius: ctx.area(s.radius) * s.initialRadius, duration: ctx.duration(s.duration) + delay,
    tick: s.tick, delay, damage: s.damage, slow: s.slow, element: def.element, spellId: def.id, vfx: def.vfx,
    data: { age: -delay, radius: ctx.area(s.radius), initial: s.initialRadius, growth: s.growth }, onUpdate: growPatch,
  });
}

function clearPack(ctx) {
  for (const m of ctx.run.minions) if (m.spellId === ctx.def.id) m.dead = true;
}

function upkeepPack(ctx) {
  const { run, s, def, player, spell } = ctx;
  syncMinions(run, spell, ctx.count, (i, count) => {
    const angle = i / count * TAU;
    spawnMinion(run, { x: player.x + Math.cos(angle) * s.spawnRadius, z: player.z + Math.sin(angle) * s.spawnRadius,
      ai: 'melee', speed: s.speed, damage: s.damage, radius: s.radius, life: ctx.duration(s.life), hitInterval: s.hitInterval,
      range: s.range, element: def.element, spellId: def.id, vfx: def.vfx });
  });
  const howling = (spell.howlUntil ?? 0) > run.t;
  for (const m of run.minions) {
    if (m.spellId !== def.id || m.dead) continue;
    const alpha = !!def.evolvedFrom && m.slot === 0;
    m.dmg = s.damage * (alpha ? s.alphaDamage : 1) * (howling ? s.howlDamage : 1);
    m.speed = s.speed * (howling ? s.howlSpeed : 1);
    m.r = s.radius * (alpha ? s.alphaSize : 1);
    // Reuse descriptors; an alpha remains recognizable even outside its howl.
    if (alpha) m.vfx = spell.alphaVfx ?? (spell.alphaVfx = { ...def.vfx, size: def.vfx.size * s.alphaSize });
  }
}

function spiralBlade(run, p, dt) {
  if (p.hits.size || p.data.released) return;
  if (p.age < p.data.duration) {
    p.angle += p.data.turn * dt;
  } else {
    p.data.released = true;
    redirectToNearest(run, p, p.data.range);
  }
}

export const NATURE_HANDLERS = {
  thorn_field: {
    cast(ctx) {
      const targets = nearestN(ctx.run, ctx.player.x, ctx.player.z, ctx.s.range, ctx.count);
      if (!targets.length) patch(ctx, ctx.player.x, ctx.player.z);
      else for (const target of targets) patch(ctx, target.x, target.z);
    },
  },
  world_roots: {
    cast(ctx) {
      const { player, s, spell, run } = ctx;
      const target = nearestN(run, player.x, player.z, s.range, 1)[0];
      const x = target?.x ?? player.x, z = target?.z ?? player.z;
      const angle = ctx.aim(s.range);
      spell.rootRing = !spell.rootRing;
      for (let i = 0; i < ctx.count; i++) {
        const a = spell.rootRing ? angle + i / ctx.count * TAU : angle;
        const d = spell.rootRing ? s.ringRadius : (i - (ctx.count - 1) / 2) * s.spacing;
        patch(ctx, x + Math.cos(a) * d, z + Math.sin(a) * d, i * s.delay);
      }
      if (target) healPlayer(run, s.heal);
    },
  },
  spirit_wolf: { init: upkeepPack, update: upkeepPack, dispose: clearPack },
  fenrir_pack: {
    init: upkeepPack, update: upkeepPack, dispose: clearPack,
    cast(ctx) {
      ctx.spell.howlUntil = ctx.run.t + ctx.duration(ctx.s.howlDuration);
      upkeepPack(ctx);
      const alpha = ctx.run.minions.find((m) => m.spellId === ctx.def.id && !m.dead && m.slot === 0);
      emit(ctx.run, { type: 'burst', x: alpha?.x ?? ctx.player.x, z: alpha?.z ?? ctx.player.z,
        radius: ctx.area(ctx.s.howlRadius), element: ctx.def.element, kind: 'howl' });
    },
  },
  razor_leaf: {
    cast(ctx) {
      const { run, s, def, player } = ctx, aim = ctx.aim();
      for (let i = 0; i < ctx.count; i++) spawnProjectile(run, {
        x: player.x, z: player.z, angle: aim + (i - (ctx.count - 1) / 2) * s.spread,
        speed: s.speed, radius: s.radius, damage: s.damage, life: ctx.duration(s.life), bounces: s.bounces,
        element: def.element, spellId: def.id, vfx: def.vfx,
      });
    },
  },
  blade_tempest: {
    cast(ctx) {
      const { run, s, def, player } = ctx, aim = ctx.aim();
      for (let i = 0; i < ctx.count; i++) spawnProjectile(run, {
        x: player.x, z: player.z, angle: aim + i / ctx.count * TAU,
        speed: s.speed, radius: s.radius, damage: s.damage, life: ctx.duration(s.life), bounces: s.bounces,
        element: def.element, spellId: def.id, vfx: def.vfx, onUpdate: spiralBlade,
        data: { duration: s.spiralDuration, turn: s.spiralSpeed, range: s.seekRange, released: false },
      });
    },
  },
};

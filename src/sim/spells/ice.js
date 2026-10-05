// Ice handlers use the shared damage pipeline so all hits chill and react normally.
import { clearOrbiters, spawnArea, spawnProjectile, spawnStrike, syncOrbiters } from '../entities.js';
import { damageEnemy, emit } from '../combat.js';
import { TAU } from '../math.js';
import { recomputeStats } from '../player.js';

function field(ctx) {
  const { run, player, spell, s, def } = ctx;
  // Replace rather than stack refreshes, including when cast-speed passives shorten cooldowns.
  if (spell.iceField) spell.iceField.dead = true;
  spell.iceField = spawnArea(run, { x: player.x, z: player.z, radius: ctx.area(s.radius), duration: ctx.duration(s.duration), tick: s.tick, damage: s.damage * s.fieldRatio, follow: true, element: 'ice', spellId: def.id, vfx: { ...def.vfx, shape: 'ring' } });
}
function wardCast(ctx) {
  field(ctx);
  if (ctx.player.spellShield[ctx.def.id] !== ctx.s.shield) {
    ctx.player.spellShield[ctx.def.id] = ctx.s.shield;
    recomputeStats(ctx.run);
  }
  ctx.player.shield = Math.min(ctx.player.shieldMax, ctx.player.shield + ctx.s.shield);
}
function wardUpdate(ctx, dt) {
  const { run, spell, s, def } = ctx;
  syncOrbiters(run, spell, { count: ctx.count, radius: ctx.area(s.orbitRadius), speed: s.spin, damage: s.damage, size: s.size, hitInterval: s.hitInterval, element: 'ice', vfx: def.vfx }, dt);
}
function dispose(ctx) {
  clearOrbiters(ctx.run, ctx.spell);
  if (ctx.spell.iceField) ctx.spell.iceField.dead = true;
  if (ctx.player.spellShield[ctx.def.id] !== undefined) {
    delete ctx.player.spellShield[ctx.def.id];
    recomputeStats(ctx.run);
  }
}

export const ICE_HANDLERS = {
  ice_lance: {
    cast(ctx) {
      const { run, player, s, def } = ctx;
      const angle = ctx.aim();
      for (let i = 0; i < ctx.count; i++) spawnProjectile(run, { x: player.x, z: player.z, angle: angle + (i - (ctx.count - 1) / 2) * s.spread, speed: s.speed, damage: s.damage, radius: s.radius, pierce: s.pierce, life: s.life, knock: s.knock, element: 'ice', spellId: def.id, vfx: def.vfx });
    },
  },
  polar_storm: {
    cast: field,
    update(ctx, dt) {
      const { run, spell, s, def } = ctx;
      const phase = (run.t % s.sweep) / s.sweep;
      syncOrbiters(run, spell, { count: ctx.count, radius: ctx.area(s.innerRadius + (s.radius - s.innerRadius) * phase), speed: s.spin, damage: s.damage, size: s.size, hitInterval: s.hitInterval, element: 'ice', vfx: def.vfx }, dt);
    },
    dispose,
  },
  frost_nova: {
    cast(ctx) {
      const { run, player, s, def } = ctx;
      const radius = ctx.area(s.radius), duration = ctx.duration(s.duration);
      const hit = new Set();
      spawnArea(run, { x: player.x, z: player.z, radius: 0, duration, tick: duration, damage: 0, element: 'ice', spellId: def.id, vfx: def.vfx,
        onUpdate(r, a) {
          a.r = radius * (1 - Math.max(0, a.life) / duration);
          r.grid.query(a.x, a.z, a.r, (e) => {
            if (hit.has(e.id)) return;
            hit.add(e.id);
            damageEnemy(r, e, s.damage, { element: 'ice', spellId: def.id, knock: s.knock, kx: a.x, kz: a.z });
          });
        },
      });
      emit(run, { type: 'burst', x: player.x, z: player.z, r: radius, element: 'ice', kind: 'nova' });
    },
  },
  absolute_zero: {
    cast(ctx) {
      const { run, player, s, def } = ctx;
      spawnStrike(run, { x: player.x, z: player.z, radius: ctx.area(s.radius), damage: s.damage, delay: s.delay, element: 'ice', spellId: def.id, vfx: def.vfx, kind: 'blizzard',
        onImpact(r, st, hits) {
          for (const e of hits) {
            const frozen = e.freezeT > 0;
            damageEnemy(r, e, st.dmg * (frozen ? s.shatter : 1), { element: 'ice', spellId: def.id, knock: s.knock, kx: st.x, kz: st.z });
            if (!e.dead && !e.boss) { e.freezeT = ctx.duration(s.freeze); emit(r, { type: 'freeze', x: e.x, z: e.z, id: e.id }); }
          }
        },
      });
    },
  },
  glacial_ward: { cast: wardCast, update: wardUpdate, dispose },
  frozen_bastion: {
    cast: wardCast,
    init(ctx) { ctx.spell.lastIceHurt = ctx.player.lastHurtT; },
    update(ctx, dt) {
      wardUpdate(ctx, dt);
      const { run, player, spell, s, def } = ctx;
      if (player.lastHurtT === spell.lastIceHurt) return;
      spell.lastIceHurt = player.lastHurtT;
      for (let i = 0; i < s.reflectCount; i++) spawnProjectile(run, { x: player.x, z: player.z, angle: i / s.reflectCount * TAU, speed: s.reflectSpeed, damage: s.reflectDamage, radius: s.reflectRadius, life: s.reflectLife, pierce: s.reflectPierce, element: 'ice', spellId: def.id, vfx: def.vfx });
    },
    dispose,
  },
};

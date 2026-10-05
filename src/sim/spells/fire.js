// Fire handlers. REFERENCE IMPLEMENTATION of the spell handler contract (see ./index.js).
import { burst, aimAngle, randomEnemy, spawnArea, spawnProjectile, spawnStrike } from '../entities.js';
import { damageEnemy } from '../combat.js';
import { TAU } from '../math.js';

export const FIRE_HANDLERS = {
  fireball: {
    cast(ctx) {
      const { run, s, def } = ctx;
      const p = run.player;
      const n = ctx.count;
      const base = aimAngle(run, p.x, p.z);
      const explode = (r, pr) => burst(r, { x: pr.x, z: pr.z, radius: ctx.area(s.explode), damage: s.damage * 0.55, element: 'fire', spellId: def.id, kind: 'explosion' });
      for (let i = 0; i < n; i++) {
        spawnProjectile(run, {
          x: p.x, z: p.z, angle: base + (i - (n - 1) / 2) * 0.17, speed: s.speed, damage: s.damage, radius: s.radius,
          life: s.life, element: 'fire', spellId: def.id, vfx: def.vfx, knock: 2,
          onHit: (r, pr) => explode(r, pr),
          onExpire: (r, pr) => explode(r, pr),
        });
      }
    },
  },

  meteor_rain: {
    cast(ctx) {
      const { run, s, def } = ctx;
      const p = run.player;
      for (let i = 0; i < ctx.count; i++) {
        const t = randomEnemy(run, p.x, p.z, s.range);
        const a = run.rng() * TAU, d = run.rng() * s.range * 0.6;
        const x = t ? t.x + (run.rng() - 0.5) * 1.5 : p.x + Math.cos(a) * d;
        const z = t ? t.z + (run.rng() - 0.5) * 1.5 : p.z + Math.sin(a) * d;
        spawnStrike(run, {
          x, z, radius: ctx.area(s.radius), damage: s.damage, delay: s.delay + i * 0.12, element: 'fire', spellId: def.id, vfx: def.vfx, knock: 6, kind: 'meteor',
          onImpact: (r, st, hits) => {
            for (const e of hits) damageEnemy(r, e, st.dmg, { element: 'fire', spellId: def.id, knock: st.knock, kx: st.x, kz: st.z });
            spawnArea(r, { x: st.x, z: st.z, radius: st.r * 0.8, duration: ctx.duration(s.fire), tick: 0.5, damage: s.damage * 0.12, element: 'fire', spellId: def.id,
              vfx: { shape: 'disc', color: '#ff5a1a', size: st.r * 0.8, glow: 1.2 } });
          },
        });
      }
    },
  },
};

// Thunder spell handlers. Damage always routes through the shared elemental combat system.
import { emitArc, nearestEnemy, nearestN, randomEnemy, spawnArea, spawnMinion, spawnStrike, syncMinions } from '../entities.js';
import { damageEnemy } from '../combat.js';

function chain(ctx, seed) {
  const { run, s, def, spell, player } = ctx;
  const visited = spell.data.visited ?? (spell.data.visited = new Set());
  const points = [[player.x, player.z]];
  visited.clear();
  let target = seed, last = null;
  for (let i = 0; target && i < s.jumps; i++) {
    visited.add(target.id);
    points.push([target.x, target.z]);
    damageEnemy(run, target, s.damage, { element: 'thunder', spellId: def.id });
    last = target;
    target = nearestEnemy(run, target.x, target.z, ctx.area(s.jumpRange), (e) => !visited.has(e.id));
  }
  if (!last) return;
  emitArc(run, points, 'thunder', s.arcLife);
  if (def.evolvedFrom) spawnArea(run, {
    x: last.x, z: last.z, radius: ctx.area(s.radius), duration: ctx.duration(s.duration), tick: s.tick,
    damage: s.fieldDamage, element: 'thunder', spellId: def.id,
    vfx: { ...def.vfx, shape: 'rune', size: s.radius },
    onTick(r, a, hits) {
      for (const enemy of hits) {
        damageEnemy(r, enemy, a.dmg, { element: 'thunder', spellId: a.spellId });
        emitArc(r, [[a.x, a.z], [enemy.x, enemy.z]], 'thunder', s.arcLife);
      }
    },
  });
}
function castChains(ctx) {
  const seeds = nearestN(ctx.run, ctx.player.x, ctx.player.z, ctx.s.range, ctx.count);
  for (const seed of seeds) chain(ctx, seed);
}

function strike(ctx, x, z, damage, radius, delay, aftershocks = false) {
  const { run, s, def } = ctx;
  spawnStrike(run, {
    x, z, damage, radius: ctx.area(radius), delay, element: 'thunder', spellId: def.id, vfx: def.vfx, kind: 'lightning',
    onImpact(r, column, hits) {
      emitArc(r, [[column.x, column.z - s.columnLength], [column.x, column.z]], 'thunder', s.arcLife);
      for (const e of hits) damageEnemy(r, e, column.dmg, { element: 'thunder', spellId: def.id });
      if (aftershocks) for (let i = 0; i < s.aftershocks; i++) {
        strike(ctx, column.x, column.z, s.aftershockDamage, s.radius, s.aftershockDelay * (i + 1));
      }
    },
  });
}
function castColumns(ctx) {
  const { run, player, s, def } = ctx;
  const selected = new Set();
  for (let i = 0; i < ctx.count; i++) {
    const t = randomEnemy(run, player.x, player.z, s.range, (e) => !selected.has(e.id));
    if (!t) break;
    selected.add(t.id);
    strike(ctx, t.x, t.z, s.damage, s.radius, s.delay, !!def.evolvedFrom);
  }
}

function flock(ctx) {
  const { run, spell, s, def, player } = ctx;
  syncMinions(run, spell, ctx.count, (slot, slots) => spawnMinion(run, {
    x: player.x, z: player.z, ai: 'flyer', speed: s.speed, damage: s.damage, radius: ctx.area(s.radius),
    life: s.life, element: 'thunder', spellId: def.id, vfx: def.vfx, hitInterval: s.hitInterval,
    range: s.range, fireInterval: s.cooldown, slot, slots, data: { boltT: slot * (s.boltInterval ?? 0) },
    onUpdate(r, m, dt) {
      // Reapply live level/passive stats to existing familiars without respawning them.
      const live = ctx.s;
      m.dmg = live.damage; m.r = ctx.area(live.radius);
      m.fireInterval = live.cooldown * (1 - player.stats.cooldown) / player.stats.castSpeed;
      if (m.phase === 1 && m.data.lastPhase !== 1) {
        emitArc(r, [[m.x, m.z], [m.data.tx, m.data.tz]], 'thunder', live.arcLife);
        if (def.evolvedFrom) {
          const dx = m.data.tx - m.x, dz = m.data.tz - m.z;
          const length2 = dx * dx + dz * dz;
          r.grid.query((m.x + m.data.tx) / 2, (m.z + m.data.tz) / 2, Math.sqrt(length2) / 2 + m.r, (e) => {
            const t = length2 ? Math.max(0, Math.min(1, ((e.x - m.x) * dx + (e.z - m.z) * dz) / length2)) : 0;
            if ((e.x - m.x - t * dx) ** 2 + (e.z - m.z - t * dz) ** 2 > m.r * m.r || m.hits.has(e.id)) return;
            m.hits.set(e.id, m.hitInterval);
            damageEnemy(r, e, m.dmg, { element: 'thunder', spellId: def.id });
          });
        }
      }
      m.data.lastPhase = m.phase;
      if (!def.evolvedFrom) return;
      m.data.boltT -= dt;
      if (m.data.boltT <= 0) {
        m.data.boltT += live.boltInterval;
        const target = nearestEnemy(r, m.x, m.z, live.range);
        if (target) strike(ctx, target.x, target.z, live.boltDamage, live.boltRadius, live.boltDelay);
      }
    },
  }));
}
function dismiss(ctx) {
  for (const m of ctx.run.minions) if (m.spellId === ctx.def.id) m.dead = true;
}
export const THUNDER_HANDLERS = {
  chain_lightning: { cast: castChains }, storm_wrath: { cast: castChains },
  thunderstrike: { cast: castColumns }, sky_judgement: { cast: castColumns },
  thunder_hawk: { update: flock, dispose: dismiss }, storm_roc: { update: flock, dispose: dismiss },
};

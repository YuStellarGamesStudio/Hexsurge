// Mage-unique passives (R18). Numbers come from data/mages.js; stat mods are applied in player.js.
import { damageEnemy, emit } from './combat.js';
import { dist2 } from './math.js';

const MAX_CHAIN_DEPTH = 3;

export function onEnemyKilled(run, e, src) {
  const cfg = run.mage.passive;
  switch (cfg.kind) {
    case 'ember_heart': {
      if (!(e.burnT > 0) || (run.chainDepth ?? 0) >= MAX_CHAIN_DEPTH) break;
      run.chainDepth = (run.chainDepth ?? 0) + 1;
      const r = cfg.radius * run.player.stats.area;
      emit(run, { type: 'burst', x: e.x, z: e.z, r, element: 'fire', kind: 'explosion' });
      run.grid.query(e.x, e.z, r, (n) => { if (n !== e) damageEnemy(run, n, cfg.damage, { element: 'fire', spellId: 'ember_heart', noReact: false }); });
      run.chainDepth--;
      break;
    }
    case 'hollow_hunger': {
      const h = run.player.hunger;
      h.stacks = Math.min(cfg.maxStacks, h.stacks + 1);
      h.t = cfg.decayAfter;
      run.player.dmgBuff = 1 + h.stacks * cfg.perKill;
      break;
    }
    default: break;
  }
}

export function tickMagePassive(run, dt) {
  const cfg = run.mage.passive, p = run.player;
  switch (cfg.kind) {
    case 'winter_aura': {
      p.passiveT += dt;
      if (p.passiveT < 0.25) break;
      p.passiveT = 0;
      const r = cfg.radius * p.stats.area;
      run.grid.query(p.x, p.z, r, (e) => { if (e.chillT < 0.7) e.chillT = 0.7; });
      break;
    }
    case 'static_charge': {
      p.passiveT += dt;
      if (p.passiveT < cfg.interval) break;
      const target = run.grid.nearest(p.x, p.z, cfg.range);
      if (!target) break;
      p.passiveT = 0;
      emit(run, { type: 'arc', points: [[p.x, p.z], [target.x, target.z]], element: 'thunder', ttl: 0.2 });
      damageEnemy(run, target, cfg.damage, { element: 'thunder', spellId: 'static_charge' });
      break;
    }
    case 'hollow_hunger': {
      const h = p.hunger;
      if (h.stacks > 0) {
        h.t -= dt;
        if (h.t <= 0) { h.stacks = 0; p.dmgBuff = 1; }
      }
      break;
    }
    default: break;
  }
}

export function onPlayerLevelUp(run) {
  const cfg = run.mage.passive, p = run.player;
  if (cfg.kind !== 'mana_flow') return;
  const r = cfg.radius * p.stats.area;
  emit(run, { type: 'burst', x: p.x, z: p.z, r, element: 'arcane', kind: 'nova' });
  run.grid.query(p.x, p.z, r, (e) => damageEnemy(run, e, cfg.damage, { element: 'arcane', spellId: 'mana_flow', knock: 5, kx: p.x, kz: p.z }));
}

export { dist2 };

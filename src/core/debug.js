// Developer hooks, loaded only when the URL has ?debug=<json>. Not part of the offline cache.
//   /?debug={"mage":"ignis","map":"academy","difficulty":1,"spells":["fireball"],"levels":{"fireball":8},"evolve":["fireball"],
//            "passives":{"power_sigil":3},"time":480,"ffwd":60,"boss":0,"god":true}
// spells: base spell ids to hold (the mage start spell is replaced when `spells` is given)
// levels: { spellId: 1..8 }   evolve: spell ids to evolve (forces level 8 + the recipe passive)
// passives: { id: level }     time: set run clock (s)   ffwd: simulate N seconds headless with the bot first
// boss: spawn boss tier index 0..2 now   god: player cannot die   enemies: { defId: count } spawn extras now
import { botMove, botPick } from '../../tools/bot.mjs';
import { SPELL_BY_ID, MAX_SPELL_LEVEL } from '../data/spells/index.js';
import { ENEMY_BY_ID } from '../data/enemies.js';
import { spawnBoss } from '../sim/boss.js';
import { spawnEnemy, ringPosition } from '../sim/enemies.js';
import { addSpell, chooseUpgrade, evolveSpell, recomputeSynergy, spellOwned } from '../sim/progression.js';
import { recomputeStats } from '../sim/player.js';
import { step } from '../sim/run.js';

export function applyDebug(run, o) {
  if (o.spells) {
    for (const s of run.spells) s.orbiters?.forEach((x) => { x.dead = true; });
    run.spells.length = 0;
    for (const id of o.spells) addSpell(run, id);
  }
  for (const [id, lv] of Object.entries(o.levels ?? {})) {
    const s = spellOwned(run, id) ?? addSpell(run, id);
    s.level = lv; s.sLevel = -1;
  }
  for (const [id, lv] of Object.entries(o.passives ?? {})) run.passives[id] = lv;
  for (const id of o.evolve ?? []) {
    const s = spellOwned(run, id) ?? addSpell(run, id);
    s.level = MAX_SPELL_LEVEL; s.sLevel = -1;
    const evo = s.def.evolution;
    run.passives[evo.passive] = Math.max(run.passives[evo.passive] ?? 0, evo.level);
    evolveSpell(run, s);
  }
  recomputeStats(run);
  recomputeSynergy(run);
  run.player.hp = run.player.stats.maxHp;
  if (o.god) run.player.god = true;
  if (o.ffwd) {
    const end = run.t + o.ffwd;
    while (run.t < end && run.status !== 'dead') {
      if (run.status === 'levelup') { chooseUpgrade(run, botPick(run, 'focus')); continue; }
      step(run, 1 / 60, botMove(run));
      run.events.length = 0;
    }
  }
  if (o.time) { run.t = o.time; const times = [480, 840, 1080]; run.bossSchedule.next = times.filter((t) => t <= o.time).length; }
  if (o.boss !== undefined && o.boss !== null) spawnBoss(run, o.boss);
  for (const [id, n] of Object.entries(o.enemies ?? {})) for (let i = 0; i < n; i++) { const p = ringPosition(run); spawnEnemy(run, ENEMY_BY_ID[id], p.x, p.z); }
  return run;
}
export { SPELL_BY_ID };

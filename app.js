// Hexsurge entry point: boots the engine, owns the screen state machine and drives the battle loop.
//
// UI modules (src/ui/<name>.js) export create(app) -> { el, show(params), hide(), update?(run, dt) } and are mounted into #ui.
// The `app` object is the only shared surface: UI never reaches into the engine or sim directly except through it.
import { Game } from './vendor/xyz/dist/src/index.js';
import { SIM } from './src/data/config.js';
import { BASE_SPELLS } from './src/data/spells/index.js';
import { Input } from './src/core/input.js';
import { audio } from './src/audio/audio.js';
import { applyI18n, detectLang, getLang, L, onLangChange, setLang, t } from './src/i18n/i18n.js';
import { recordRun, unlockedSpells } from './src/meta/unlocks.js';
import { BattleView } from './src/render/battle-view.js';
import { createTitleView } from './src/render/title-scene.js';
import { save } from './src/save/save.js';
import { chooseUpgrade, continueEndless, createRun, endRun, getResult, step } from './src/sim/run.js';
import * as title from './src/ui/title.js';
import * as select from './src/ui/select.js';
import * as hud from './src/ui/hud.js';
import * as levelup from './src/ui/levelup.js';
import * as pause from './src/ui/pause.js';
import * as results from './src/ui/results.js';
import * as codex from './src/ui/codex.js';
import * as leaderboard from './src/ui/leaderboard.js';
import * as settings from './src/ui/settings.js';
import * as howto from './src/ui/howto.js';
import * as toast from './src/ui/toast.js';
import { initPwa } from './src/pwa.js';

const $ = (id) => document.getElementById(id);

const app = {
  game: null, save, audio, t, L, getLang, setLang, onLangChange,
  run: null, view: null, titleView: null, input: null,
  screen: null, ui: {}, paused: false, selection: null, lastResult: null, summary: null,
  levelUpOpen: false,

  /** Shows one full screen ('title' | 'select' | 'codex' | 'leaderboard' | 'settings' | 'howto' | 'results'); hides the others. */
  go(name, params) {
    for (const key of ['title', 'select', 'codex', 'leaderboard', 'settings', 'howto', 'results']) if (key !== name) app.ui[key].hide();
    app.screen = name;
    app.pwa?.sync(name);
    app.ui[name].show(params);
    applyI18n(app.ui[name].el);
    if (name === 'title') app.audio.playMusic('title');
    else if (name === 'select') app.audio.playMusic('menu');
    app.audio.sfx('ui');
  },

  async showTitle() {
    app.endBattle();
    app.ui.hud.hide(); app.ui.pause.hide(); app.ui.levelup.hide();
    const motion = !!save.data.settings.reducedMotion;
    if (app.titleView && app.titleMotion !== motion) { app.titleView.dispose(); app.titleView = null; }
    if (!app.titleView) { app.titleView = createTitleView(app.game, { reducedMotion: motion }); app.titleMotion = motion; }
    await app.titleView.init();
    app.titleView.scene.onTick = (dt) => app.titleView.sync(dt);
    app.go('title');
  },

  /** sel: { mage, map, difficulty }. Builds a run + view and enters the battle. */
  async startRun(sel, debug) {
    app.selection = sel;
    save.update((d) => { d.last = { ...sel }; });
    for (const key of ['title', 'select', 'codex', 'leaderboard', 'settings', 'howto', 'results']) app.ui[key].hide();
    app.endBattle();
    const run = createRun({ mageId: sel.mage, mapId: sel.map, difficulty: sel.difficulty, unlockedSpells: unlockedSpells(save.data) });
    if (debug) (await import('./src/core/debug.js')).applyDebug(run, debug);
    const view = new BattleView(app.game, run, { overlayParent: $('stage'), t, reducedMotion: save.data.settings.reducedMotion });
    app.run = run; app.view = view; app.paused = false; app.levelUpOpen = false; app.deadTimer = 0; app.accum = 0;
    await view.init();
    // setScene destroyed the title scene; drop it so showTitle() builds a fresh one.
    if (app.titleView) { app.titleView.dispose(); app.titleView = null; }
    view.scene.onTick = (dt) => app.tickBattle(dt);
    app.ui.hud.show(run);
    app.input.setEnabled(true);
    app.input.setMode(save.data.settings.control === 'auto' ? 'auto' : save.data.settings.control);
    app.audio.playMusic(`battle:${run.map.id}`);
    app.screen = 'battle';
  },

  endBattle() {
    app.input?.setEnabled(false);
    if (app.view) { app.view.dispose(); app.view = null; }
    app.run = null;
  },

  tickBattle(dt) {
    const run = app.run, view = app.view;
    if (!run) return;
    dt = Math.min(dt, 0.1);
    if (!app.paused && run.status === 'running') {
      const move = app.input.vector();
      const n = Math.max(1, Math.ceil(dt / (SIM.step * 1.5)));
      for (let i = 0; i < n && run.status === 'running'; i++) step(run, dt / n, move);
    }
    app.dispatchEvents(run);
    view.sync(run, app.paused || run.status !== 'running' ? 0 : dt);
    run.events.length = 0;
    app.ui.hud.update?.(run, dt);

    if (run.status === 'levelup' && !app.levelUpOpen) { app.levelUpOpen = true; app.input.setEnabled(false); app.ui.levelup.show(run); }
    if (app.screen === 'battle' && (run.status === 'dead' || run.status === 'won')) {
      app.deadTimer += dt;
      if (app.deadTimer > (run.status === 'dead' ? 1.6 : 1.2)) app.finishRun();
    }
  },

  /** Level-up card picked (called by the levelup UI). */
  pickUpgrade(index) {
    const run = app.run;
    if (!run || !chooseUpgrade(run, index)) return;
    app.ui.levelup.hide();
    app.levelUpOpen = false;
    if (run.status === 'levelup') { app.levelUpOpen = true; app.ui.levelup.show(run); return; }
    app.input.setEnabled(true);
  },

  /** Route sim events to audio (and anything else interested). The view reads the same list afterwards. */
  dispatchEvents(run) {
    for (const e of run.events) {
      switch (e.type) {
        case 'cast': app.audio.sfx('cast', e); break;
        case 'hit': app.audio.sfx('hit', e); break;
        case 'pickup': app.audio.sfx('pickup', e); break;
        case 'levelup': app.audio.sfx('level', e); break;
        case 'evolve': app.audio.sfx('evolve', e); break;
        case 'bossSpawn': app.audio.sfx('boss', e); app.audio.playMusic(`boss:${run.map.id}`); break;
        case 'bossKill': app.audio.playMusic(run.won ? `battle:${run.map.id}` : `battle:${run.map.id}`); break;
        case 'hurt': app.audio.sfx('hurt', e); break;
        case 'victory': app.audio.playMusic('results'); break;
        default: break;
      }
      app.ui.hud.onEvent?.(e, run);
    }
  },

  togglePause(force) {
    const run = app.run;
    if (!run || run.status !== 'running') return;
    app.paused = force ?? !app.paused;
    app.input.setEnabled(!app.paused);
    if (app.paused) { app.ui.pause.show(run); app.audio.pause(); } else { app.ui.pause.hide(); app.audio.resume(); }
  },

  /** Finishes the current run: records progress and shows the results screen. */
  finishRun(reason) {
    const run = app.run;
    if (!run) return;
    if (reason) endRun(run, reason);
    const result = getResult(run);
    const summary = recordRun(save, run, result);
    app.lastResult = result; app.summary = summary;
    app.ui.hud.hide(); app.ui.pause.hide(); app.ui.levelup.hide();
    app.paused = false;
    app.input.setEnabled(false);
    app.go('results', { result, summary, run });
    app.audio.playMusic('results');
  },

  continueEndless() {
    const run = app.run;
    if (!run || !continueEndless(run)) return false;
    app.deadTimer = 0;
    app.ui.results.hide();
    app.ui.hud.show(run);
    app.input.setEnabled(true);
    app.screen = 'battle';
    app.audio.playMusic('endless');
    return true;
  },

  toast(msg) { app.ui.toast.show(msg); },
};

async function boot() {
  const stage = $('stage');
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  const loadInfo = save.load();
  setLang(detectLang(save.data.settings.lang), { updateUrl: true });

  app.game = await Game.create({ canvas: '#game', renderer: 'auto', pixelRatio: Math.min(window.devicePixelRatio || 1, 2), audioPause: { onPause: false, onHidden: false } });
  app.game.addEventListener('error', (ev) => console.error(ev.detail));
  if (!app.game.graphics.capabilities.threeD) throw new Error('3D is not supported by this browser');
  audio.init(app.game);
  audio.applySettings(save.data.settings);
  app.input = new Input($('stage'), $('stick'));

  const mods = { title, select, hud, levelup, pause, results, codex, leaderboard, settings, howto, toast };
  const ui = $('ui');
  for (const [name, mod] of Object.entries(mods)) {
    app.ui[name] = mod.create(app);
    app.ui[name].hide();
    ui.appendChild(app.ui[name].el);
  }
  onLangChange(() => {
    for (const m of Object.values(app.ui)) { applyI18n(m.el); m.refresh?.(); }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Escape' || e.code === 'KeyP') && app.run && app.screen === 'battle') { e.preventDefault(); app.togglePause(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (app.run && app.screen === 'battle' && app.run.status === 'running') app.togglePause(true); save.flush(); }
  });
  window.addEventListener('pagehide', () => save.flush());
  window.addEventListener('resize', () => app.view?.resize());

  app.game.start();
  await app.showTitle();
  const debug = new URLSearchParams(location.search).get('debug');
  if (debug) {
    const o = JSON.parse(debug);
    await app.startRun({ mage: o.mage ?? 'ignis', map: o.map ?? 'academy', difficulty: o.difficulty ?? 1 }, o);
  }
  if (loadInfo.notice) app.toast(t('save.loadFailed'));
  $('boot').classList.add('done');
  app.pwa = initPwa($('stage'));
  app.pwa.sync(app.screen);
}

window.hexsurge = app; // handy for the console and automated checks
boot().catch((e) => {
  console.error(e);
  document.querySelector('.boot-logo').textContent = e.message;
});

export { BASE_SPELLS };

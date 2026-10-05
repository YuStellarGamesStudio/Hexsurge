import test from 'node:test';
import assert from 'node:assert/strict';
import { trackIds, loadTrack } from '../src/data/audio/tracks/index.js';
import { voices } from '../src/data/audio/voices.js';
import { sfx } from '../src/data/audio/sfx.js';
import { audioSettings } from '../src/data/audio/settings.js';
import { OPMAdapter } from '../vendor/xyz/dist/packages/audio/src/opm-adapter.js';
import { audio } from '../src/audio/audio.js';

for (const [name,voice] of Object.entries(voices)) {
  test(`valid FM patch: ${name}`, async () => {
    assert.ok(Number.isInteger(voice.algorithm) && voice.algorithm >= 0 && voice.algorithm <= 7);
    assert.equal(voice.ops.length, 4);
    await OPMAdapter.validateVoice(voice);
  });
}
for (const id of trackIds) {
  test(`valid score and polyphony: ${id}`, async () => {
    const track = await loadTrack(id);
    assert.equal(track.id,id);
    assert.ok(track.bpm > 0 && track.beats > 0);
    assert.ok(track.layers.length >= 3 && track.layers.length <= 5);
    for (const layer of track.layers) {
      assert.ok(track.voices[layer.voice]);
      await OPMAdapter.validateVoice(track.voices[layer.voice]);
      assert.ok(layer.notes.length > 0);
      const boundaries = [];
      for (const [start,note,duration,velocity] of layer.notes) {
        assert.ok(Number.isFinite(start) && start >= 0 && start < track.beats);
        assert.ok(Number.isInteger(note) && note >= 21 && note <= 108);
        assert.ok(duration > 0 && start + duration <= track.beats);
        assert.ok(velocity === undefined || (velocity > 0 && velocity <= 1));
        boundaries.push([start,1],[start+duration,-1]);
      }
      boundaries.sort((a,b) => a[0]-b[0] || a[1]-b[1]);
      let active = 0;
      for (const [,delta] of boundaries) { active += delta; assert.ok(active <= 24); }
    }
  });
}
test('effect scores and event admission tuning are sane', () => {
  for (const [name,effect] of Object.entries(sfx)) {
    assert.ok(voices[effect.voice],name);
    assert.ok(effect.duration > 0 && effect.duration <= 2);
    for (const [start,note,duration] of effect.notes) {
      assert.ok(start >= 0 && duration > 0 && start+duration <= effect.duration);
      assert.ok(Number.isInteger(note) && note >= 21 && note <= 108);
    }
  }
  for (const element of ['fire','ice','thunder','arcane','nature','void']) {
    assert.ok(sfx[`cast:${element}`]); assert.ok(sfx[`hit:${element}`]);
  }
  assert.ok(audioSettings.maxSfxVoices <= 2);
  assert.ok(audioSettings.throttle.hit >= .1);
});
test('locked music queues, map music rotates, settings remain independent', async () => {
  const manager = { music:{volume:1,cancelAutomation(){}}, sfx:{volume:1}, pause(reason){this.reason=reason;},resume(reason){this.reason=null;} };
  audio.init({audio:manager});
  await audio.playMusic('title');
  assert.equal(audio.wish,'title'); assert.equal(audio.current,null);
  assert.equal(audio.resolve('battle:academy'),'academy-1');
  assert.equal(audio.resolve('battle:academy'),'academy-2');
  assert.equal(audio.resolve('boss:void'),'boss');
  audio.applySettings({musicOn:false,sfxOn:true,musicVolume:100,sfxVolume:100});
  assert.equal(manager.music.volume,0); assert.ok(manager.sfx.volume > 0);
  audio.applySettings({musicOn:true,sfxOn:false});
  assert.ok(manager.music.volume > 0); assert.equal(manager.sfx.volume,0);
  audio.pause(); assert.equal(manager.reason,'game'); audio.resume(); assert.equal(manager.reason,null);
  audio.stopMusic(); assert.equal(audio.wish,null);
});
test('gesture unlock starts queued layers once and synthesized assets are cached', async () => {
  const loaded = [], played = [], ramps = [];
  const origin = performance.now();
  const manager = {
    get currentTime() { return (performance.now() - origin) / 1000; },
    music:{volume:1,cancelAutomation(){},automate(...args){ramps.push(args);}},
    sfx:{volume:1}, async unlock(){},
    async load(url) { const score = await (await fetch(url)).json(); loaded.push(score); return score; },
    play(asset,opts) { const playback = {asset,opts,state:'playing',stop(){this.state='stopped';}}; played.push(playback); return playback; },
  };
  audio.init({audio:manager});
  await audio.playMusic('title');
  assert.equal(loaded.length,0);
  await Promise.all([audio.unlock(),audio.unlock()]);
  assert.equal(played.length,4);
  assert.ok(loaded.every(asset => asset.loop && asset.channel === 'music' && asset.duration > 30));
  assert.ok(loaded.every(asset => asset.notes.every(note => Number.isInteger(note.note) && note.duration > 0)));
  await audio.playMusic('title'); assert.equal(played.length,4);
  await audio.playMusic('menu');
  assert.ok(played.slice(0,4).every(p => p.state === 'stopped'));
  assert.ok(ramps.some(([gain]) => gain === 0));
  assert.equal(audio.current,'menu');
  audio.stopMusic();
  await audio.playMusic('title');
  assert.equal(loaded.length,8);
  audio.stopMusic();
  await audio.sfx('ui');
  assert.equal(played.at(-1).opts.channel,'sfx');
  assert.equal(loaded.at(-1).loop,false);
  const count = loaded.length;
  await audio.sfx('ui'); assert.equal(loaded.length,count);
});

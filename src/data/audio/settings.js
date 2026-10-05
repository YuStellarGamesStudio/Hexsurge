// Soundtrack headroom and event admission limits, in seconds / linear gain.
export const audioSettings = {
  musicGain: .62, sfxGain: .7, fadeSeconds: .32,
  defaults: { musicOn: true, sfxOn: true, musicVolume: 70, sfxVolume: 80 },
  globalInterval: .035, maxSfxVoices: 2, pickupWindow: .3,
  pickupSteps: [0,2,4,7,9,12],
  throttle: { ui:.08, cast:.14, hit:.16, pickup:.075, level:.7, evolve:1, boss:1.5, hurt:.3 },
  important: ['level','evolve','boss','hurt'],
};
export default audioSettings;

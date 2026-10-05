// Legacy-v1 OPM patches keep the soundtrack portable across the vendored engine.
const op = (ratio, level, a, d, s, r, detune = 0) => ({ ratio, level, detune, adsr: { a, d, s, r } });
const voice = (name, algorithm, feedback, ops, modIndex = 1) => ({ version: 1, name: name.replaceAll(' ', '_'), algorithm, feedback, ops, modIndex });
export const voices = {
  lead: voice('Astral reed', 4, 1, [op(2,.32,.012,.14,.35,.10),op(1,.23,.015,.13,.72,.12),op(3,.10,.01,.12,.2,.08),op(1,.10,.018,.15,.65,.12,2)], 1.4),
  pad: voice('Lantern choir', 7, 0, [op(1,.075,.22,.3,.72,.24,-3),op(1,.075,.24,.3,.72,.24,3),op(2,.035,.25,.4,.5,.22),op(3,.014,.3,.4,.4,.2)]),
  bass: voice('Round foundation', 4, 1, [op(1,.24,.003,.12,.16,.06),op(1,.22,.005,.15,.6,.08),op(2,.08,.003,.09,.1,.05),op(1,.05,.008,.15,.5,.07)], .8),
  bell: voice('Crystal bell', 4, 0, [op(3.5,.42,.002,.24,.02,.15),op(1,.22,.002,.36,.03,.16),op(7,.12,.002,.14,0,.08),op(2,.06,.002,.25,.01,.12)], 1.2),
  pluck: voice('Silver strings', 4, 1, [op(2,.3,.003,.09,.01,.08),op(1,.18,.003,.15,.06,.10),op(3,.1,.003,.07,0,.06),op(1,.06,.003,.14,.02,.08)], 1.1),
  brass: voice('Watchtower horns', 4, 2, [op(1,.38,.025,.18,.45,.10),op(1,.20,.03,.18,.7,.13),op(2,.18,.02,.15,.3,.10),op(1,.08,.03,.18,.6,.12)], 1.6),
  kick: voice('FM low drum', 0, 2, [op(.5,.7,.001,.045,0,.02),op(1,.6,.001,.05,0,.025),op(.5,.3,.001,.065,0,.03),op(1,.28,.001,.10,0,.035)], 2),
  snare: voice('FM wire drum', 0, 6, [op(7.13,.8,.001,.045,0,.025),op(3.71,.7,.001,.06,0,.03),op(1.41,.55,.001,.07,0,.03),op(1,.12,.001,.09,0,.04)], 3),
  hat: voice('FM glass shaker', 0, 5, [op(9.31,.65,.001,.025,0,.015),op(7.17,.55,.001,.025,0,.015),op(3.47,.45,.001,.03,0,.015),op(2,.05,.001,.04,0,.02)], 2.8),
};
export default voices;

// Audio facade over game.audio (OPM.js FM synthesis; no recordings, §4). Real implementation: audio pass.
export const audio = {
  game: null,
  init(game) { this.game = game; },
  async unlock() { await this.game?.audio.unlock(); },
  playMusic(id) {},
  stopMusic() {},
  sfx(name, opts) {},
  applySettings(settings) {},
  pause() {},
  resume() {},
};

// Presentation colours shared by vfx, UI and illustrations. Gameplay never reads these.
export const ELEMENT_COLORS = Object.freeze({
  fire: '#ff7a2a', ice: '#8fe3ff', thunder: '#ffe45c', arcane: '#c08bff', nature: '#7dff8a', void: '#ff7ad9', neutral: '#ffffff',
});
export const GEM_COLORS = Object.freeze(['#6ee7ff', '#7dff8a', '#ffe45c', '#ff9a4a', '#ff6ad9']);
export const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

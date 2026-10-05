import { el } from './dom.js';
export function create() {
  const root = el('div', { class: 'toast', hidden: true, style: 'position:absolute;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 14px;background:#000a;border-radius:8px' });
  let timer = 0;
  return { el: root, show(msg) { root.textContent = msg; root.hidden = false; clearTimeout(timer); timer = setTimeout(() => { root.hidden = true; }, 3200); }, hide() { root.hidden = true; } };
}

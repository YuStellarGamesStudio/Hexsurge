// Tiny DOM helpers shared by UI modules.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) node.append(c.nodeType ? c : document.createTextNode(c));
  return node;
}

/** Standard screen shell: show()/hide() toggle [hidden]. */
export function makeScreen(id, cls = '') {
  const root = el('section', { id: `screen-${id}`, class: `screen ${cls}`.trim() });
  return {
    el: root,
    show() { root.hidden = false; },
    hide() { root.hidden = true; },
  };
}

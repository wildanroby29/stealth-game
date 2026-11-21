// Keyboard + mouse input. Keys are read as a held set so the game loop can
// poll them every step; clicks are queued (and converted from screen pixels
// to game pixels) so a click is never lost between frames.
export function createInput(canvas) {
  const keys = new Set();
  const clicks = [];

  function keyName(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') return 'up';
    if (k === 'arrowdown' || k === 's') return 'down';
    if (k === 'arrowleft' || k === 'a') return 'left';
    if (k === 'arrowright' || k === 'd') return 'right';
    if (k === 'shift') return 'sneak';
    if (k === 'p' || k === 'escape') return 'pause';
    if (k === 'enter') return 'confirm';
    if (k === 'r') return 'restart';
    return null;
  }

  window.addEventListener('keydown', (e) => {
    const name = keyName(e);
    if (!name) return;
    if (['up', 'down', 'left', 'right'].includes(name)) e.preventDefault();
    keys.add(name);
  });
  window.addEventListener('keyup', (e) => {
    const name = keyName(e);
    if (name) keys.delete(name);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    clicks.push({ x, y });
  });

  return {
    get up() { return keys.has('up'); },
    get down() { return keys.has('down'); },
    get left() { return keys.has('left'); },
    get right() { return keys.has('right'); },
    get sneak() { return keys.has('sneak'); },
    // True once per key press, then consumed — for pause / confirm / restart.
    consume(name) {
      if (!keys.has(name)) return false;
      keys.delete(name);
      return true;
    },
    consumeClick() {
      return clicks.shift() ?? null;
    },
  };
}

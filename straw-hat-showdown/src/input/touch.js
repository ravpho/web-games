// On-screen touch controls: a floating movement pad on the left, Attack / Special / Guard / Super
// buttons on the right. Each pointer is tracked separately, so moving and pressing work together.
//
// sample() returns one InputState per simulation step: screen direction, up, Guard held, and
// whether Attack / Special / Super were pressed since the previous sample.

const DEAD_ZONE = 14; // px of drag before a direction counts
const KNOB_RANGE = 46;
const BUTTONS = ['attack', 'special', 'guard', 'super'];
const LABELS = { attack: 'Attack', special: 'Special', guard: 'Guard', super: 'Super' };

export function directionFromDrag(dx, dy) {
  const dist = Math.hypot(dx, dy);
  if (dist < DEAD_ZONE) return { x: 0, up: false };
  // Up when the drag points upward within about 60 degrees of straight up.
  const up = -dy > DEAD_ZONE * 0.8 && -dy > Math.abs(dx) * 0.55;
  // Sideways when the drag has a clear horizontal part (diagonals give both).
  const x = Math.abs(dx) > DEAD_ZONE * 0.8 && Math.abs(dx) > -dy * 0.4 ? Math.sign(dx) : 0;
  return { x, up };
}

export function createTouchControls(root) {
  root.innerHTML = `
    <div class="pad-zone"></div>
    <div class="pad" hidden><div class="pad-knob"></div></div>
    <div class="buttons">
      ${BUTTONS.map((b) => `<button type="button" class="btn btn-${b}" data-btn="${b}" aria-label="${LABELS[b]}"><span>${LABELS[b]}</span></button>`).join('')}
    </div>`;
  const zone = root.querySelector('.pad-zone');
  const pad = root.querySelector('.pad');
  const knob = root.querySelector('.pad-knob');
  const buttons = Object.fromEntries(BUTTONS.map((b) => [b, root.querySelector(`[data-btn="${b}"]`)]));

  const held = { attack: false, special: false, guard: false, super: false };
  const pressed = { attack: false, special: false, super: false };
  const buttonPointers = new Map(); // pointerId -> button name
  let padPointer = null;
  let origin = { x: 0, y: 0 };
  let dir = { x: 0, up: false };

  function resetPad() {
    padPointer = null;
    dir = { x: 0, up: false };
    pad.hidden = true;
    knob.style.transform = 'translate(-50%, -50%)';
  }

  zone.addEventListener('pointerdown', (e) => {
    if (padPointer !== null) return;
    e.preventDefault();
    padPointer = e.pointerId;
    zone.setPointerCapture?.(e.pointerId);
    origin = { x: e.clientX, y: e.clientY };
    pad.style.left = `${e.clientX}px`;
    pad.style.top = `${e.clientY}px`;
    pad.hidden = false;
    dir = { x: 0, up: false };
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== padPointer) return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    dir = directionFromDrag(dx, dy);
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, KNOB_RANGE / len);
    knob.style.transform = `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    zone.addEventListener(type, (e) => {
      if (e.pointerId === padPointer) resetPad();
    });
  }

  for (const [name, el] of Object.entries(buttons)) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      buttonPointers.set(e.pointerId, name);
      held[name] = true;
      if (name in pressed) pressed[name] = true;
      el.classList.add('down');
    });
    const release = (e) => {
      if (buttonPointers.get(e.pointerId) !== name) return;
      buttonPointers.delete(e.pointerId);
      if (![...buttonPointers.values()].includes(name)) {
        held[name] = false;
        el.classList.remove('down');
      }
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(type, release);
  }
  root.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    sample() {
      const input = {
        x: dir.x, up: dir.up, guard: held.guard,
        attack: pressed.attack, special: pressed.special, super: pressed.super,
      };
      pressed.attack = false;
      pressed.special = false;
      pressed.super = false;
      return input;
    },
    setSuperReady(ready) {
      buttons.super.classList.toggle('ready', ready);
    },
    show(visible) {
      root.hidden = !visible;
      if (!visible) {
        resetPad();
        for (const name of BUTTONS) {
          held[name] = false;
          buttons[name].classList.remove('down');
        }
        buttonPointers.clear();
      }
    },
    // Clears presses made while the fight was not taking input (menus, pauses).
    flush() {
      pressed.attack = false;
      pressed.special = false;
      pressed.super = false;
    },
  };
}

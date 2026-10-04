// Turns raw input into fighter-relative directions and remembers button presses for a few
// frames, so a press made just before a fighter can act is not lost.
import { INPUT_BUFFER_FRAMES } from '../config.js';

// One step of input for one fighter. x is the screen direction (-1 left, 0, 1 right).
// guard is held; attack, special and super are true only on the step they were pressed.
export const NEUTRAL_INPUT = Object.freeze({
  x: 0, up: false, guard: false, attack: false, special: false, super: false,
});

const BUTTONS = ['attack', 'special', 'super'];

// 1 = toward the opponent, -1 = away, 0 = neutral. `toward` is the screen direction of the opponent.
export function relativeDir(x, toward) {
  if (x === 0) return 0;
  return x === toward ? 1 : -1;
}

export function recordPresses(fighter, input, now, toward) {
  for (const btn of BUTTONS) {
    if (input[btn]) {
      fighter.buffer.push({ btn, at: now, forward: relativeDir(input.x, toward) > 0 });
    }
  }
  fighter.buffer = fighter.buffer.filter((p) => now - p.at <= INPUT_BUFFER_FRAMES);
}

// Removes and returns the most recent buffered press of the first button in `buttons`
// that has one, or null. Earlier entries in `buttons` take priority.
export function takePress(fighter, now, buttons) {
  for (const btn of buttons) {
    for (let i = fighter.buffer.length - 1; i >= 0; i--) {
      const press = fighter.buffer[i];
      if (press.btn === btn && now - press.at <= INPUT_BUFFER_FRAMES) {
        fighter.buffer.splice(i, 1);
        return press;
      }
    }
  }
  return null;
}

export function hasPress(fighter, now, btn) {
  return fighter.buffer.some((p) => p.btn === btn && now - p.at <= INPUT_BUFFER_FRAMES);
}

export function clearBuffer(fighter) {
  fighter.buffer = [];
}

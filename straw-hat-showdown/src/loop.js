// Fixed-step game loop: the fight always advances in whole 1/60 s steps, whatever the
// screen's refresh rate. Rendering happens once per animation frame with the latest state.
import { STEP_MS, MAX_STEPS_PER_FRAME } from './config.js';

const EPSILON = 1e-6;

export function createLoop(step, { stepMs = STEP_MS, maxSteps = MAX_STEPS_PER_FRAME } = {}) {
  return { step, stepMs, maxSteps, acc: 0, last: null, paused: false };
}

// Call once per animation frame with the current time in ms. Returns how many steps ran.
export function tick(loop, now) {
  if (loop.last === null) {
    loop.last = now;
    return 0;
  }
  const dt = now - loop.last;
  loop.last = now;
  if (loop.paused) {
    loop.acc = 0;
    return 0;
  }
  loop.acc += dt;
  let steps = 0;
  while (loop.acc + EPSILON >= loop.stepMs && steps < loop.maxSteps) {
    loop.step();
    loop.acc -= loop.stepMs;
    steps++;
  }
  // On a very slow device, drop the backlog instead of falling further and further behind.
  if (steps === loop.maxSteps && loop.acc >= loop.stepMs) loop.acc = 0;
  return steps;
}

export function resetClock(loop) {
  loop.last = null;
  loop.acc = 0;
}

// Shared test setup: a simple test fighter and helpers to drive a match.
import { registerFighter } from '../src/core/registry.js';
import { createMatch, step } from '../src/core/match.js';
import { NEUTRAL_INPUT } from '../src/core/input-buffer.js';
import { INTRO_FRAMES } from '../src/config.js';

export const TEST_FIGHTER = registerFighter({
  id: 'test',
  name: 'Test',
  walkSpeed: 3,
  jumpVx: 4,
  moves: {
    chain1: { type: 'chain', startup: 5, active: 3, recovery: 10, next: 'chain2', motion: [{ from: 0, to: 5, vx: 1 }],
      hits: [{ box: { x: 0, y: 30, w: 75, h: 50 }, damage: 40, hitstun: 18, push: 3 }] },
    chain2: { type: 'chain', startup: 6, active: 3, recovery: 12, next: 'chain3', motion: [{ from: 0, to: 6, vx: 1 }],
      hits: [{ box: { x: 0, y: 30, w: 75, h: 50 }, damage: 40, hitstun: 18, push: 3 }] },
    chain3: { type: 'chain', startup: 8, active: 4, recovery: 18, motion: [{ from: 0, to: 8, vx: 1 }],
      hits: [{ box: { x: 0, y: 30, w: 80, h: 60 }, damage: 70, hitstun: 24, push: 6, knockdown: true }] },
    jumpAttack: { type: 'jump', startup: 4, active: 12, recovery: 0,
      hits: [{ box: { x: 0, y: -30, w: 60, h: 70 }, damage: 50, hitstun: 16, push: 3 }] },
    special: { type: 'special', name: 'TEST BLAST!', startup: 10, active: 4, recovery: 20,
      projectile: { kind: 'travel', speed: 8, offset: { x: 40, y: 40 }, box: { w: 40, h: 40 },
        damage: 60, hitstun: 20, push: 5 } },
    forwardSpecial: { type: 'special', name: 'TEST RUSH!', startup: 8, active: 6, recovery: 18,
      motion: [{ from: 0, to: 14, vx: 5 }],
      hits: [{ box: { x: 0, y: 20, w: 70, h: 70 }, damage: 70, hitstun: 20, push: 6, knockdown: true }] },
    super: { type: 'super', name: 'TEST SUPER!', startup: 10, active: 8, recovery: 30, invulnerable: true,
      hits: [{ box: { x: 0, y: 0, w: 220, h: 130 }, damage: 250, hitstun: 30, push: 8, knockdown: true }] },
  },
});

export function input(partial = {}) {
  return { ...NEUTRAL_INPUT, ...partial };
}

export function newMatch(opts = {}) {
  return createMatch({ p1: 'test', p2: 'test', seed: 1, ...opts });
}

// A match already past the round intro, ready to fight.
export function fightingMatch(opts = {}) {
  const state = newMatch(opts);
  for (let i = 0; i < INTRO_FRAMES; i++) step(state);
  return state;
}

// Runs n steps with the same inputs (p1 input, p2 input), collecting events.
export function run(state, n, p1 = input(), p2 = input()) {
  const events = [];
  for (let i = 0; i < n; i++) {
    step(state, [p1, p2]);
    events.push(...state.events);
  }
  return events;
}

// Runs until predicate(state) is true or the limit is hit. Returns the number of steps taken.
export function runUntil(state, predicate, limit = 2000, p1 = input(), p2 = input()) {
  let n = 0;
  while (!predicate(state) && n < limit) {
    step(state, [p1, p2]);
    n++;
  }
  return n;
}

// Single step with presses for one or both sides.
export function press(state, p1 = input(), p2 = input()) {
  step(state, [p1, p2]);
  return state.events;
}

export function place(state, x0, x1) {
  const [a, b] = state.fighters;
  a.x = a.prevX = x0;
  b.x = b.prevX = x1;
  a.facing = Math.sign(x1 - x0) || 1;
  b.facing = -a.facing;
}

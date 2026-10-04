import test from 'node:test';
import assert from 'node:assert/strict';
import { step } from '../src/core/match.js';
import {
  STAGE_LEFT, PUSH_HALF_WIDTH, KNOCKDOWN_FRAMES, GETUP_FRAMES, MAX_HEALTH, METER_MAX,
  SUPER_FREEZE_FRAMES, ROUND_END_FRAMES, INTRO_FRAMES,
} from '../src/config.js';
import { fightingMatch, input, run, runUntil, press, place } from './helpers.js';

const IDLE = (side) => (s) => s.fighters[side].state === 'idle';

// --- 3.1 Facing, stage edges, spacing --------------------------------------------------------

test('fighters turn to face each other after one jumps over the other', () => {
  const state = fightingMatch();
  place(state, 400, 500);
  press(state, input({ up: true, x: 1 }));
  runUntil(state, IDLE(0), 120);
  const [a, b] = state.fighters;
  assert.ok(a.x > b.x, 'p1 ended on the far side');
  run(state, 1);
  assert.equal(a.facing, -1);
  assert.equal(b.facing, 1);
});

test('walking into a standing opponent stops at the opponent without overlapping', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  run(state, 40, input({ x: 1 }));
  const [a, b] = state.fighters;
  assert.equal(b.x, 470, 'opponent was not pushed');
  assert.ok(Math.abs(b.x - a.x) >= PUSH_HALF_WIDTH * 2 - 1e-9);
});

test('walking back stops at the stage edge', () => {
  const state = fightingMatch();
  run(state, 200, input({ x: -1 }));
  assert.equal(state.fighters[0].x, STAGE_LEFT);
});

// --- 3.2 Hits ---------------------------------------------------------------------------------

test('an attack that connects deals damage, stuns and pushes the opponent away', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  const events = [...press(state, input({ attack: true })), ...run(state, 15)];
  const [, b] = state.fighters;
  assert.ok(events.some((e) => e.type === 'hit' && e.damage === 40));
  assert.equal(b.health, MAX_HEALTH - 40);
  assert.equal(b.state, 'hitstun');
  assert.ok(b.x > 470, 'pushed away');
});

test('an attack that misses deals no damage', () => {
  const state = fightingMatch();
  place(state, 300, 700);
  press(state, input({ attack: true }));
  run(state, 30);
  assert.equal(state.fighters[1].health, MAX_HEALTH);
});

test('one hit of a move damages the opponent at most once', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  press(state, input({ attack: true }));
  run(state, 30);
  assert.equal(state.fighters[1].health, MAX_HEALTH - 40);
});

test('simultaneous hits both land (trade), and a double KO is a draw', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  state.fighters[0].health = 30;
  state.fighters[1].health = 30;
  const events = [...press(state, input({ attack: true }), input({ attack: true })), ...run(state, 10)];
  assert.equal(events.filter((e) => e.type === 'hit').length, 2);
  assert.ok(events.some((e) => e.type === 'draw'));
});

// --- 3.3 Knockdowns ---------------------------------------------------------------------------

function threeHitChain(state) {
  const events = [];
  for (let i = 0; i < 3; i++) {
    events.push(...press(state, input({ attack: true })));
    events.push(...run(state, 6));
  }
  return events;
}

test('the third chain hit knocks down, and a downed fighter cannot be hit', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  threeHitChain(state);
  runUntil(state, (s) => s.fighters[1].state === 'knockdown', 60);
  assert.equal(state.fighters[1].state, 'knockdown');
  runUntil(state, IDLE(0), 60);
  const healthDown = state.fighters[1].health;
  state.fighters[0].x = state.fighters[1].x - 60; // stand right next to the downed fighter
  state.fighters[0].prevX = state.fighters[0].x;
  press(state, input({ attack: true }));
  run(state, 10);
  assert.equal(state.fighters[1].health, healthDown);
});

test('a knocked-down fighter gets up after the knockdown time and can act', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  threeHitChain(state);
  runUntil(state, (s) => s.fighters[1].state === 'knockdown', 60);
  const n = runUntil(state, IDLE(1), 300);
  assert.ok(n >= KNOCKDOWN_FRAMES + GETUP_FRAMES, `got up after ${n} frames`);
  run(state, 1, input(), input({ x: -1 }));
  assert.equal(state.fighters[1].state, 'walk');
});

// --- 3.4 Guarding ----------------------------------------------------------------------------

test('guarding a chain hit takes no damage and pushes back slightly', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  const events = [...press(state, input({ attack: true }), input({ guard: true })), ...run(state, 15, input(), input({ guard: true }))];
  const b = state.fighters[1];
  assert.ok(events.some((e) => e.type === 'guard' && e.chip === 0));
  assert.equal(b.health, MAX_HEALTH);
  assert.ok(b.x > 470 && b.x < 490, `pushed back slightly to ${b.x}`);
});

test('a guarding fighter does not move or attack', () => {
  const state = fightingMatch();
  place(state, 300, 600);
  run(state, 20, input({ guard: true, x: 1, attack: true }));
  assert.equal(state.fighters[0].x, 300);
  assert.equal(state.fighters[0].state, 'guard');
});

test('holding Guard in the air does not guard', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  Object.assign(state.fighters[1], { state: 'air', y: 20, vy: 0 });
  press(state, input({ attack: true }), input({ guard: true }));
  run(state, 6, input(), input({ guard: true }));
  assert.equal(state.fighters[1].health, MAX_HEALTH - 40);
});

test('holding Guard while stunned does not guard', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  press(state, input({ attack: true }));
  run(state, 6);
  assert.equal(state.fighters[1].state, 'hitstun');
  press(state, input({ attack: true }), input({ guard: true }));
  run(state, 20, input(), input({ guard: true }));
  assert.equal(state.fighters[1].health, MAX_HEALTH - 80);
});

test('guarded special moves deal a small fraction of their damage', () => {
  const state = fightingMatch();
  place(state, 300, 600);
  press(state, input({ special: true }), input({ guard: true }));
  const events = run(state, 60, input(), input({ guard: true }));
  const guard = events.find((e) => e.type === 'guard');
  assert.equal(guard.chip, 12);
  assert.equal(state.fighters[1].health, MAX_HEALTH - 12);
});

test('chip damage cannot knock out', () => {
  const state = fightingMatch();
  place(state, 300, 600);
  state.fighters[1].health = 5;
  press(state, input({ special: true }), input({ guard: true }));
  run(state, 60, input(), input({ guard: true }));
  assert.equal(state.fighters[1].health, 1);
  assert.equal(state.phase, 'fight');
});

// --- 3.5 Chains, cancels, jumping -------------------------------------------------------------

test('three quick Attack presses perform the three chain hits in order', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  const seen = [];
  for (let i = 0; i < 40; i++) {
    step(state, [input({ attack: i % 6 === 0 && i < 18 }), input()]);
    const m = state.fighters[0].move;
    if (m && seen[seen.length - 1] !== m.id) seen.push(m.id);
  }
  assert.deepEqual(seen, ['chain1', 'chain2', 'chain3']);
});

test('the chain continues even when earlier hits miss', () => {
  const state = fightingMatch();
  place(state, 200, 700);
  const seen = [];
  for (let i = 0; i < 40; i++) {
    step(state, [input({ attack: i % 6 === 0 && i < 18 }), input()]);
    const m = state.fighters[0].move;
    if (m && seen[seen.length - 1] !== m.id) seen.push(m.id);
  }
  assert.deepEqual(seen, ['chain1', 'chain2', 'chain3']);
});

test('the chain starts over after the fighter goes idle', () => {
  const state = fightingMatch();
  place(state, 200, 700);
  press(state, input({ attack: true }));
  runUntil(state, IDLE(0), 60);
  press(state, input({ attack: true }));
  assert.equal(state.fighters[0].move.id, 'chain1');
});

test('a connected chain hit can be cancelled straight into a special', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  press(state, input({ attack: true }));
  runUntil(state, (s) => s.fighters[0].move?.connected && s.freeze === 0, 30);
  const t = state.fighters[0].move.t;
  assert.ok(t < 18, 'still inside chain1');
  const events = press(state, input({ special: true }));
  assert.equal(state.fighters[0].move.id, 'special');
  assert.ok(events.some((e) => e.type === 'moveStart' && e.moveId === 'special'));
});

test('a chain hit that missed cannot be cancelled into a special', () => {
  const state = fightingMatch();
  place(state, 200, 700);
  press(state, input({ attack: true }));
  run(state, 9);
  press(state, input({ special: true }));
  assert.equal(state.fighters[0].move.id, 'chain1');
});

test('one jumping attack per jump', () => {
  const state = fightingMatch();
  place(state, 300, 700);
  press(state, input({ up: true }));
  run(state, 3);
  press(state, input({ attack: true }));
  assert.equal(state.fighters[0].move.id, 'jumpAttack');
  run(state, 20);
  const t = state.fighters[0].move.t;
  press(state, input({ attack: true }));
  assert.equal(state.fighters[0].move.id, 'jumpAttack');
  assert.equal(state.fighters[0].move.t, t + 1, 'no new attack started');
});

test('Special does nothing in the air', () => {
  const state = fightingMatch();
  place(state, 300, 700);
  press(state, input({ up: true }));
  run(state, 2);
  press(state, input({ special: true }));
  run(state, 10);
  assert.equal(state.fighters[0].state, 'air');
  assert.equal(state.fighters[0].move, null);
  assert.equal(state.projectiles.length, 0);
});

// --- 3.6 Projectiles -------------------------------------------------------------------------

test('a projectile travels and hits the opponent once, then disappears', () => {
  const state = fightingMatch();
  place(state, 200, 700);
  press(state, input({ special: true }));
  const events = run(state, 120);
  assert.equal(events.filter((e) => e.type === 'hit').length, 1);
  assert.equal(state.fighters[1].health, MAX_HEALTH - 60);
  assert.equal(state.projectiles.length, 0);
});

test('a projectile that misses leaves the stage and disappears', () => {
  const state = fightingMatch();
  place(state, 700, 850);
  state.fighters[0].facing = -1; // fire away from the opponent
  press(state, input({ special: true }));
  run(state, 12);
  assert.equal(state.projectiles.length, 1);
  run(state, 120);
  assert.equal(state.projectiles.length, 0);
  assert.equal(state.fighters[1].health, MAX_HEALTH);
});

test('projectiles from both fighters cancel each other', () => {
  const state = fightingMatch();
  place(state, 200, 760);
  const events = [...press(state, input({ special: true }), input({ special: true })), ...run(state, 120)];
  assert.ok(events.some((e) => e.type === 'clash'));
  assert.equal(events.filter((e) => e.type === 'hit').length, 0);
  assert.equal(state.fighters[0].health, MAX_HEALTH);
  assert.equal(state.fighters[1].health, MAX_HEALTH);
});

test('only one projectile per fighter on screen at a time', () => {
  const state = fightingMatch();
  place(state, 100, 860);
  press(state, input({ special: true }));
  runUntil(state, IDLE(0), 60);
  assert.equal(state.projectiles.length, 1);
  const events = press(state, input({ special: true }));
  run(state, 15);
  assert.equal(state.projectiles.length, 1);
  assert.ok(!events.some((e) => e.type === 'moveStart'));
});

// --- 3.7 Super meter and super moves ----------------------------------------------------------

test('dealing damage fills the meter, taking damage fills it by half as much', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  press(state, input({ attack: true }));
  run(state, 8);
  assert.equal(state.fighters[0].meter, 40);
  assert.equal(state.fighters[1].meter, 20);
});

test('chip damage also fills the meter', () => {
  const state = fightingMatch();
  place(state, 300, 600);
  press(state, input({ special: true }), input({ guard: true }));
  run(state, 60, input(), input({ guard: true }));
  assert.equal(state.fighters[0].meter, 12);
});

test('the meter is capped at full', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  state.fighters[0].meter = METER_MAX - 10;
  press(state, input({ attack: true }));
  run(state, 15);
  assert.equal(state.fighters[0].meter, METER_MAX);
});

test('the meter carries over to the next round and starts empty in a new match', () => {
  const state = fightingMatch();
  assert.equal(state.fighters[0].meter, 0);
  state.fighters[0].meter = 500;
  state.fighters[1].health = 0;
  run(state, ROUND_END_FRAMES + 20 + INTRO_FRAMES);
  assert.equal(state.phase, 'fight');
  assert.equal(state.round, 2);
  assert.equal(state.fighters[0].meter, 500);
});

test('Super without a full meter does nothing', () => {
  const state = fightingMatch();
  state.fighters[0].meter = METER_MAX - 1;
  const events = press(state, input({ super: true }));
  run(state, 5);
  assert.ok(!events.some((e) => e.type === 'superStart'));
  assert.equal(state.fighters[0].meter, METER_MAX - 1);
  assert.notEqual(state.fighters[0].state, 'attack');
});

test('Super with a full meter freezes the action, empties the meter and plays the move', () => {
  const state = fightingMatch();
  place(state, 400, 520);
  state.fighters[0].meter = METER_MAX;
  const events = press(state, input({ super: true }));
  assert.ok(events.some((e) => e.type === 'superStart' && e.name === 'TEST SUPER!'));
  assert.equal(state.fighters[0].meter, 0);
  const timer = state.timer;
  run(state, SUPER_FREEZE_FRAMES - 1);
  assert.equal(state.fighters[0].move.t, 0, 'frozen');
  assert.equal(state.timer, timer, 'timer stops during the super freeze');
  const after = run(state, 20);
  assert.ok(after.some((e) => e.type === 'hit' && e.damage === 250));
});

test('a super cannot be interrupted by the opponent', () => {
  const state = fightingMatch();
  place(state, 400, 470);
  state.fighters[0].meter = METER_MAX;
  press(state, input({ super: true }));
  run(state, SUPER_FREEZE_FRAMES - 1);
  // The opponent's chain1 is live before the super's first hit.
  const events = [...press(state, input(), input({ attack: true })), ...run(state, 12)];
  assert.equal(state.fighters[0].health, MAX_HEALTH);
  assert.ok(events.some((e) => e.type === 'hit' && e.attacker === 0));
  assert.ok(!events.some((e) => e.type === 'hit' && e.attacker === 1));
});

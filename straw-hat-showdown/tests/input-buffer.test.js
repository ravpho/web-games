import test from 'node:test';
import assert from 'node:assert/strict';
import { relativeDir, recordPresses, takePress } from '../src/core/input-buffer.js';
import { fightingMatch, input, run, press, place } from './helpers.js';

test('screen direction becomes forward or back relative to the opponent', () => {
  assert.equal(relativeDir(1, 1), 1);
  assert.equal(relativeDir(-1, 1), -1);
  assert.equal(relativeDir(1, -1), -1);
  assert.equal(relativeDir(-1, -1), 1);
  assert.equal(relativeDir(0, 1), 0);
});

test('a press stays available for 8 frames and is dropped after', () => {
  const f = { buffer: [] };
  recordPresses(f, input({ special: true, x: 1 }), 100, 1);
  assert.deepEqual(takePress(f, 108, ['special']), { btn: 'special', at: 100, forward: true });
  recordPresses(f, input({ special: true }), 200, 1);
  assert.equal(takePress(f, 209, ['special']), null);
});

// The test fighter's chain1 lasts 18 frames. A Special press made k frames before it ends
// should still come out (k <= 8) or be dropped (k >= 9).
function specialPressedBeforeMoveEnds(k) {
  const state = fightingMatch();
  place(state, 300, 700);
  press(state, input({ attack: true }));
  const total = 18;
  run(state, total - 1 - k); // move is now k steps from ending
  press(state, input({ special: true }));
  run(state, k + 1);
  const f = state.fighters[0];
  return f.state === 'attack' && f.move.id === 'special';
}

test('a press 1-8 frames before the fighter can act is performed', () => {
  for (let k = 1; k <= 8; k++) assert.ok(specialPressedBeforeMoveEnds(k), `k=${k}`);
});

test('a press 9 or more frames early is dropped', () => {
  for (const k of [9, 12]) assert.ok(!specialPressedBeforeMoveEnds(k), `k=${k}`);
});

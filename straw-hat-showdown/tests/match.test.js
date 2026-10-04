import test from 'node:test';
import assert from 'node:assert/strict';
import { step, timerSeconds } from '../src/core/match.js';
import { createLoop, tick } from '../src/loop.js';
import { createRng, random } from '../src/core/rng.js';
import {
  INTRO_FRAMES, ROUND_END_FRAMES, ROUND_FRAMES, MAX_HEALTH, START_X, MATCH_END_FRAMES,
} from '../src/config.js';
import { newMatch, fightingMatch, input, run } from './helpers.js';

// --- Determinism and fixed steps -------------------------------------------------------------

function scriptedInputs(seed, n) {
  const r = createRng(seed);
  const pick = () => {
    const v = random(r);
    return input({
      x: v < 0.3 ? -1 : v < 0.6 ? 1 : 0,
      up: random(r) < 0.03,
      guard: random(r) < 0.1,
      attack: random(r) < 0.1,
      special: random(r) < 0.03,
      super: random(r) < 0.02,
    });
  };
  return Array.from({ length: n }, () => [pick(), pick()]);
}

test('same seed and inputs give identical states after 1000 steps', () => {
  const inputs = scriptedInputs(99, 1000);
  const a = newMatch({ seed: 5 });
  const b = newMatch({ seed: 5 });
  for (const i of inputs) {
    step(a, i);
    step(b, i);
  }
  assert.deepEqual(a, b);
  assert.ok(a.events !== undefined);
});

test('the loop runs one step per 1/60 s on 30, 60 and 120 Hz screens', () => {
  for (const hz of [30, 60, 120, 144]) {
    let steps = 0;
    const loop = createLoop(() => steps++);
    for (let i = 0; i <= hz; i++) tick(loop, (i * 1000) / hz);
    assert.ok(Math.abs(steps - 60) <= 1, `${hz} Hz ran ${steps} steps in one second`);
  }
});

test('a very slow frame runs at most 5 steps and drops the backlog', () => {
  let steps = 0;
  const loop = createLoop(() => steps++);
  tick(loop, 0);
  assert.equal(tick(loop, 1000), 5);
  assert.equal(tick(loop, 1000 + 1000 / 60), 1);
});

test('a paused loop does not step, so the timer stays put', () => {
  const state = fightingMatch();
  const loop = createLoop(() => step(state));
  tick(loop, 0);
  tick(loop, 1000);
  const before = timerSeconds(state);
  loop.paused = true;
  tick(loop, 21000);
  assert.equal(timerSeconds(state), before);
  loop.paused = false;
  tick(loop, 21000 + 1000 / 60);
  assert.equal(timerSeconds(state), before);
});

// --- Rounds and timer -------------------------------------------------------------------------

function knockOut(state, loser) {
  state.fighters[loser].health = 0;
  step(state);
}

test('winning two rounds ends the match', () => {
  const state = fightingMatch();
  knockOut(state, 1);
  assert.equal(state.phase, 'roundEnd');
  assert.deepEqual(state.wins, [1, 0]);
  run(state, ROUND_END_FRAMES + 20);
  assert.equal(state.phase, 'intro');
  assert.equal(state.round, 2);
  run(state, INTRO_FRAMES);
  knockOut(state, 1);
  run(state, ROUND_END_FRAMES + 20);
  assert.equal(state.phase, 'matchEnd');
  assert.equal(state.winner, 0);
  assert.equal(state.fighters[0].state, 'victory');
  run(state, MATCH_END_FRAMES);
  assert.equal(state.phase, 'done');
});

test('one round each leads to a deciding third round announced as final', () => {
  const state = fightingMatch();
  knockOut(state, 1);
  run(state, ROUND_END_FRAMES + 20);
  run(state, INTRO_FRAMES);
  knockOut(state, 0);
  const events = run(state, ROUND_END_FRAMES + 20);
  assert.deepEqual(state.wins, [1, 1]);
  assert.equal(state.round, 3);
  const start = events.find((e) => e.type === 'roundStart');
  assert.deepEqual([start.round, start.final], [3, true]);
});

test('the timer counts down in whole seconds during play', () => {
  const state = fightingMatch();
  assert.equal(timerSeconds(state), 60);
  run(state, 600);
  assert.equal(timerSeconds(state), 50);
});

test('the timer does not count during the round announcement', () => {
  const state = newMatch();
  run(state, INTRO_FRAMES - 1);
  assert.equal(state.timer, ROUND_FRAMES);
});

test('health reaching zero knocks out and the opponent wins the round', () => {
  const state = fightingMatch();
  state.fighters[0].health = 0;
  const events = run(state, 1);
  assert.ok(events.some((e) => e.type === 'ko' && e.winner === 1));
  assert.equal(state.roundResult.winner, 1);
});

test('health and positions reset each round', () => {
  const state = fightingMatch();
  state.fighters[0].x = 100;
  state.fighters[0].health = 400;
  knockOut(state, 1);
  run(state, ROUND_END_FRAMES + 20);
  for (const f of state.fighters) {
    assert.equal(f.health, MAX_HEALTH);
    assert.equal(f.x, START_X[f.side]);
  }
});

test('at time-out the fighter with more health wins', () => {
  const state = fightingMatch();
  state.fighters[0].health = 900;
  state.fighters[1].health = 800;
  state.timer = 1;
  const events = run(state, 1);
  assert.ok(events.some((e) => e.type === 'time'));
  assert.deepEqual(state.roundResult, { winner: 0, reason: 'time' });
  assert.deepEqual(state.wins, [1, 0]);
});

test('equal health at time-out is a draw and the round is replayed', () => {
  const state = fightingMatch();
  state.fighters[0].health = 500;
  state.fighters[1].health = 500;
  state.timer = 1;
  const events = run(state, ROUND_END_FRAMES + 20);
  assert.ok(events.some((e) => e.type === 'draw'));
  assert.deepEqual(state.wins, [0, 0]);
  assert.equal(state.round, 1);
  assert.equal(state.phase, 'intro');
});

test('a double knockout is a draw and the round is replayed', () => {
  const state = fightingMatch();
  state.fighters[0].health = 0;
  state.fighters[1].health = 0;
  const events = run(state, ROUND_END_FRAMES + 20);
  assert.ok(events.some((e) => e.type === 'draw'));
  assert.deepEqual(state.wins, [0, 0]);
  assert.equal(state.round, 1);
});

test('fighters ignore input during the round intro', () => {
  const state = newMatch();
  run(state, 30, input({ attack: true, x: 1 }));
  assert.equal(state.fighters[0].state, 'intro');
  assert.equal(state.fighters[0].x, START_X[0]);
});

test('presses made during the intro are not carried into the fight', () => {
  const state = newMatch();
  run(state, INTRO_FRAMES - 1, input({ attack: true }));
  run(state, 1);
  run(state, 1);
  assert.equal(state.phase, 'fight');
  assert.notEqual(state.fighters[0].state, 'attack');
});

test('fighters ignore input after a knockout', () => {
  const state = fightingMatch();
  knockOut(state, 1);
  run(state, 30, input({ attack: true, x: 1 }));
  assert.notEqual(state.fighters[0].state, 'attack');
  assert.notEqual(state.fighters[0].state, 'walk');
});

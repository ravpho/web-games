import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/fighters/index.js';
import { createCpu, LEVELS } from '../src/core/cpu.js';
import { createMatch, step } from '../src/core/match.js';
import { METER_MAX, INTRO_FRAMES } from '../src/config.js';
import { input, place } from './helpers.js';

const LEVEL_NAMES = ['easy', 'normal', 'hard'];

function fightWithCpu(difficulty, seed, p1 = 'luffy', p2 = 'luffy') {
  const state = createMatch({ p1, p2, seed });
  const cpu = createCpu({ side: 1, difficulty, seed: seed * 31 + 7 });
  const advance = (p1Input = input()) => step(state, [p1Input, cpu.think(state)]);
  for (let i = 0; i < INTRO_FRAMES; i++) advance();
  return { state, cpu, advance };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// The player keeps walking in and throwing the same chain. Count how often attacks that reach the
// computer while it is free to guard (standing or walking) are guarded.
function guardRate(difficulty) {
  let guarded = 0;
  let hit = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const { state, advance } = fightWithCpu(difficulty, seed);
    let prevState = 'idle';
    for (let i = 0; i < 1800 && state.phase === 'fight'; i++) {
      const [me, cpuF] = state.fighters;
      const dist = Math.abs(cpuF.x - me.x);
      const toward = Math.sign(cpuF.x - me.x);
      advance(dist > 95 ? input({ x: toward }) : input({ attack: i % 6 === 0 }));
      for (const e of state.events) {
        if (e.attacker !== 0) continue;
        if (e.type === 'guard') guarded++;
        if (e.type === 'hit' && (prevState === 'idle' || prevState === 'walk')) hit++;
      }
      prevState = cpuF.state;
      state.fighters[0].health = 1000; // keep the round going
      state.fighters[1].health = 1000;
    }
  }
  return { rate: guarded / Math.max(1, guarded + hit), guarded, hit };
}

test('harder levels guard more often, and Hard still lets attacks through', () => {
  const rates = Object.fromEntries(LEVEL_NAMES.map((d) => [d, guardRate(d)]));
  assert.ok(rates.hard.rate > rates.normal.rate, JSON.stringify(rates));
  assert.ok(rates.normal.rate > rates.easy.rate, JSON.stringify(rates));
  assert.ok(rates.hard.hit > 0, 'some attacks land on Hard');
});

// The player whiffs a long-recovery move; how long until the computer acts on it?
function responseTime(difficulty) {
  const times = [];
  for (let seed = 1; seed <= 60; seed++) {
    const { state, cpu, advance } = fightWithCpu(difficulty, seed);
    place(state, 300, 640); // far beyond Gum-Gum Pistol's reach
    cpu.plan = { input: {}, left: 10000 }; // the computer would otherwise just wait here
    for (let i = 0; i < 40; i++) advance();
    place(state, 300, 640);
    advance(input({ special: true }));
    const start = state.sim;
    for (let i = 0; i < 60; i++) {
      advance();
      const me = state.fighters[1];
      if (me.state === 'walk' || me.state === 'attack' || me.state === 'air') {
        times.push(state.sim - start);
        break;
      }
    }
  }
  return times;
}

test('harder levels react sooner, and never instantly', () => {
  const t = Object.fromEntries(LEVEL_NAMES.map((d) => [d, responseTime(d)]));
  for (const d of LEVEL_NAMES) assert.ok(t[d].length > 0, `${d} responded`);
  for (const d of LEVEL_NAMES) assert.ok(Math.min(...t[d]) >= LEVELS[d].reaction - 1, `${d} not faster than its reaction time`);
  assert.ok(mean(t.hard) < mean(t.normal), `${mean(t.hard)} < ${mean(t.normal)}`);
  assert.ok(mean(t.normal) < mean(t.easy), `${mean(t.normal)} < ${mean(t.easy)}`);
});

test('every level has a noticeable reaction time', () => {
  for (const d of LEVEL_NAMES) assert.ok(LEVELS[d].reaction >= 10, d);
});

function superDelay(difficulty) {
  const times = [];
  for (let seed = 1; seed <= 30; seed++) {
    const { state, advance } = fightWithCpu(difficulty, seed);
    place(state, 420, 560);
    state.fighters[1].meter = METER_MAX;
    for (let i = 0; i < 600; i++) {
      advance(input({ guard: true }));
      if (state.events.some((e) => e.type === 'superStart' && e.side === 1)) {
        times.push(i);
        break;
      }
      state.fighters[1].meter = Math.max(state.fighters[1].meter, state.fighters[1].state === 'attack' ? 0 : METER_MAX);
    }
  }
  return times;
}

test('with a full meter in range the computer uses its super, sooner on Hard than Easy', () => {
  const easy = superDelay('easy');
  const hard = superDelay('hard');
  assert.ok(easy.length >= 25 && hard.length >= 25, `${easy.length} ${hard.length}`);
  assert.ok(mean(hard) < mean(easy), `${mean(hard)} < ${mean(easy)}`);
});

test('the chosen level applies to the whole match', () => {
  const { cpu, state, advance } = fightWithCpu('hard', 3);
  state.fighters[0].health = 0;
  for (let i = 0; i < 400; i++) advance();
  assert.equal(state.round, 2);
  assert.equal(cpu.level, LEVELS.hard);
});

test('the computer gives no input during the round intro', () => {
  const state = createMatch({ p1: 'luffy', p2: 'luffy', seed: 1 });
  const cpu = createCpu({ difficulty: 'hard' });
  for (let i = 0; i < INTRO_FRAMES - 1; i++) {
    const out = cpu.think(state);
    assert.deepEqual(out, input());
    step(state, [input(), out]);
  }
});

test('the computer has no advantage: replaying its inputs by hand gives the same match', () => {
  const recorded = [];
  const a = createMatch({ p1: 'luffy', p2: 'luffy', seed: 9 });
  const cpu = createCpu({ difficulty: 'hard', seed: 5 });
  const p1Script = (i) => input({ x: i % 90 < 40 ? 1 : 0, attack: i % 23 === 0, special: i % 97 === 0, guard: i % 50 > 44 });
  for (let i = 0; i < 1500; i++) {
    const out = cpu.think(a);
    recorded.push(out);
    step(a, [p1Script(i), out]);
  }
  const b = createMatch({ p1: 'luffy', p2: 'luffy', seed: 9 });
  for (let i = 0; i < 1500; i++) step(b, [p1Script(i), recorded[i]]);
  assert.deepEqual(a, b);
  assert.ok(a.wins.some((w) => w > 0) || a.fighters.some((f) => f.health < 1000), 'the fight actually happened');
});

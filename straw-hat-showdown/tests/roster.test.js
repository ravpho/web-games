import test from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER } from '../src/fighters/index.js';
import { getFighter, registerFighter } from '../src/core/registry.js';
import { createMatch, step } from '../src/core/match.js';
import { createCpu } from '../src/core/cpu.js';
import { moveReach, MOVE_SLOTS } from '../src/core/moves.js';
import { MAX_HEALTH, INTRO_FRAMES, LIGHTNING_VS_RUBBER } from '../src/config.js';
import { fightingMatch, input, run, press, place } from './helpers.js';

const chainIds = ['chain1', 'chain2', 'chain3'];
const chainDamage = (id) => chainIds.reduce((sum, c) => sum + getFighter(id).moves[c].hits.reduce((s, h) => s + h.damage, 0), 0);
const chainReach = (id) => Math.max(...chainIds.map((c) => moveReach({ ...getFighter(id).moves[c], motion: [] })));

test('the roster is Luffy, Zoro, Sanji and Nami', () => {
  assert.deepEqual(ROSTER, ['luffy', 'zoro', 'sanji', 'nami']);
});

test('every fighter starts with the same health', () => {
  for (const id of ROSTER) {
    const state = createMatch({ p1: id, p2: 'luffy' });
    assert.equal(state.fighters[0].health, MAX_HEALTH, id);
  }
});

test('every fighter has every move type', () => {
  for (const id of ROSTER) {
    for (const slot of MOVE_SLOTS) assert.ok(getFighter(id).moves[slot], `${id} ${slot}`);
    assert.equal(getFighter(id).moves.super.type, 'super');
    assert.ok(getFighter(id).moves.special.name && getFighter(id).moves.forwardSpecial.name && getFighter(id).moves.super.name);
  }
});

test('Sanji walks fastest and Zoro slowest', () => {
  const distance = (id) => {
    const state = fightingMatch({ p1: id, p2: 'luffy' });
    place(state, 100, 880);
    const x0 = state.fighters[0].x;
    run(state, 60, input({ x: 1 }));
    return state.fighters[0].x - x0;
  };
  const d = Object.fromEntries(ROSTER.map((id) => [id, distance(id)]));
  const sorted = [...ROSTER].sort((a, b) => d[b] - d[a]);
  assert.equal(sorted[0], 'sanji', JSON.stringify(d));
  assert.equal(sorted[sorted.length - 1], 'zoro', JSON.stringify(d));
});

test("Zoro's full chain deals the most damage", () => {
  const landed = (id) => {
    const state = fightingMatch({ p1: id, p2: 'luffy' });
    place(state, 400, 470);
    for (let i = 0; i < 3; i++) {
      press(state, input({ attack: true }));
      run(state, 7);
    }
    run(state, 40);
    return MAX_HEALTH - state.fighters[1].health;
  };
  const dealt = Object.fromEntries(ROSTER.map((id) => [id, landed(id)]));
  for (const id of ROSTER) assert.equal(dealt[id], chainDamage(id), `${id} landed its whole chain`);
  const best = [...ROSTER].sort((a, b) => dealt[b] - dealt[a])[0];
  assert.equal(best, 'zoro', JSON.stringify(dealt));
});

test("Nami's chain has the shortest reach", () => {
  const reach = Object.fromEntries(ROSTER.map((id) => [id, chainReach(id)]));
  for (const id of ROSTER.filter((x) => x !== 'nami')) assert.ok(reach.nami < reach[id], JSON.stringify(reach));
});

test("Gum-Gum Pistol reaches farther than every fighter's chain", () => {
  const pistol = moveReach(getFighter('luffy').moves.special);
  for (const id of ROSTER) assert.ok(pistol > chainReach(id) + 100, id);
});

// --- Gags ----------------------------------------------------------------------------------

function thunderboltDamageOn(target) {
  const state = fightingMatch({ p1: 'nami', p2: target });
  place(state, 200, 600);
  press(state, input({ special: true }));
  const events = run(state, 80);
  return { damage: MAX_HEALTH - state.fighters[1].health, rubber: events.some((e) => e.type === 'rubber') };
}

test('Nami\'s lightning does less damage to rubber Luffy, with a "boing"', () => {
  const luffy = thunderboltDamageOn('luffy');
  const sanji = thunderboltDamageOn('sanji');
  assert.ok(luffy.damage < sanji.damage, `${luffy.damage} < ${sanji.damage}`);
  assert.equal(luffy.damage, Math.round(sanji.damage * LIGHTNING_VS_RUBBER));
  assert.ok(luffy.rubber && !sanji.rubber);
  assert.ok(luffy.damage >= sanji.damage * 0.5, 'still a real hit, so Nami can win the matchup');
});

test("Nami's other moves hurt Luffy normally", () => {
  const cyclone = (target) => {
    const state = fightingMatch({ p1: 'nami', p2: target });
    place(state, 300, 500);
    press(state, input({ x: 1, special: true }));
    run(state, 60);
    return MAX_HEALTH - state.fighters[1].health;
  };
  assert.equal(cyclone('luffy'), cyclone('sanji'));
});

test("Sanji's swooning over Nami does not change any gameplay", () => {
  // The same scripted fight against Nami and against an identical copy of Nami under another id
  // (so no Sanji-vs-Nami special case can apply) must play out exactly the same.
  registerFighter({ ...getFighter('nami'), id: 'nami-copy' });
  const script = (i) => input({ x: i % 60 < 30 ? 1 : 0, attack: i % 9 === 0, special: i % 71 === 0 });
  const play = (p2) => {
    const state = createMatch({ p1: 'sanji', p2, seed: 4 });
    const log = [];
    for (let i = 0; i < 900; i++) {
      step(state, [script(i), input({ guard: i % 40 > 30 })]);
      for (const e of state.events) {
        if (e.type === 'hit' || e.type === 'guard') log.push([e.type, e.attacker, e.damage ?? e.chip, e.moveId ?? null]);
      }
    }
    return log;
  };
  const vsNami = play('nami');
  assert.deepEqual(vsNami, play('nami-copy'));
  assert.ok(vsNami.length > 0, 'the fight happened');
});

test('in a mirror match the opponent uses the alternate colors', () => {
  for (const id of ROSTER) {
    const mirror = createMatch({ p1: id, p2: id });
    assert.deepEqual(mirror.fighters.map((f) => f.palette), [0, 1], id);
  }
  const normal = createMatch({ p1: 'luffy', p2: 'zoro' });
  assert.deepEqual(normal.fighters.map((f) => f.palette), [0, 0]);
});

// --- Computer styles --------------------------------------------------------------------------

function cpuWatch(cpuId, frames = 600) {
  let specials = 0;
  let distSum = 0;
  let n = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const state = createMatch({ p1: 'luffy', p2: cpuId, seed });
    const cpu = createCpu({ side: 1, difficulty: 'normal', seed: seed * 7 });
    for (let i = 0; i < INTRO_FRAMES; i++) step(state, [input(), cpu.think(state)]);
    place(state, 120, 560); // the player stands far away and does nothing
    for (let i = 0; i < frames; i++) {
      step(state, [input(), cpu.think(state)]);
      for (const e of state.events) if (e.type === 'moveStart' && e.side === 1 && e.moveType === 'special') specials++;
      distSum += Math.abs(state.fighters[1].x - state.fighters[0].x);
      n++;
      state.fighters[0].health = MAX_HEALTH; // keep the round going
      state.fighters[1].health = MAX_HEALTH;
    }
  }
  return { avgDistance: distSum / n, specials };
}

test('a computer Nami keeps her distance and uses her specials', () => {
  const nami = cpuWatch('nami');
  assert.ok(nami.avgDistance > 200, JSON.stringify(nami));
  assert.ok(nami.specials >= 8, JSON.stringify(nami));
});

test('a computer Sanji closes in on a faraway player', () => {
  const sanji = cpuWatch('sanji');
  const nami = cpuWatch('nami');
  assert.ok(sanji.avgDistance < 150, JSON.stringify(sanji));
  assert.ok(sanji.avgDistance < nami.avgDistance);
});

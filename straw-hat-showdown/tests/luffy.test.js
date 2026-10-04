import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/fighters/index.js';
import { getFighter } from '../src/core/registry.js';
import { METER_MAX, MAX_HEALTH, SUPER_FREEZE_FRAMES } from '../src/config.js';
import { fightingMatch, input, run, press, place } from './helpers.js';

const luffy = () => fightingMatch({ p1: 'luffy', p2: 'luffy' });

function moveReach(move) {
  return Math.max(...move.hits.map((h) => h.box.x + h.box.w));
}

test('Gum-Gum Pistol hits an opponent beyond the reach of every chain hit', () => {
  const def = getFighter('luffy');
  const chainReach = Math.max(...['chain1', 'chain2', 'chain3'].map((id) => moveReach(def.moves[id])));
  const distance = 250;
  assert.ok(distance - 24 > chainReach + 10, 'opponent is out of chain range');

  const chains = luffy();
  place(chains, 300, 300 + distance);
  for (let i = 0; i < 3; i++) {
    press(chains, input({ attack: true }));
    run(chains, 6);
  }
  run(chains, 40);
  assert.equal(chains.fighters[1].health, MAX_HEALTH, 'chain hits miss');

  const pistol = luffy();
  place(pistol, 300, 300 + distance);
  const events = [...press(pistol, input({ special: true })), ...run(pistol, 40)];
  assert.ok(events.some((e) => e.type === 'moveStart' && e.name === 'GUM-GUM PISTOL!'));
  assert.ok(events.some((e) => e.type === 'hit' && e.moveId === 'special'));
  assert.equal(pistol.fighters[1].health, MAX_HEALTH - 70);
});

test('Gum-Gum Gatling moves forward and lands several separate hits', () => {
  const state = luffy();
  place(state, 400, 480);
  const events = [...press(state, input({ x: 1, special: true })), ...run(state, 90)];
  const hits = events.filter((e) => e.type === 'hit' && e.moveId === 'forwardSpecial');
  assert.ok(hits.length >= 4, `landed ${hits.length} hits`);
  assert.ok(state.fighters[0].x > 420, 'moved forward');
});

test('Gear Third Giant Pistol deals heavy damage and knocks down', () => {
  const state = luffy();
  place(state, 300, 520);
  state.fighters[0].meter = METER_MAX;
  const events = [...press(state, input({ super: true })), ...run(state, SUPER_FREEZE_FRAMES + 40)];
  const hit = events.find((e) => e.type === 'hit' && e.moveId === 'super');
  assert.ok(hit, 'super hit');
  assert.ok(hit.damage >= 250);
  assert.ok(events.some((e) => e.type === 'knockdown' && e.side === 1));
});

test('Luffy has every move type', () => {
  const def = getFighter('luffy');
  for (const id of ['chain1', 'chain2', 'chain3', 'jumpAttack', 'special', 'forwardSpecial', 'super']) {
    assert.ok(def.moves[id], id);
  }
});

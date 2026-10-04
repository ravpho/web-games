import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/fighters/index.js';
import { METER_MAX, MAX_HEALTH, SUPER_FREEZE_FRAMES } from '../src/config.js';
import { fightingMatch, input, run, press, place, runUntil } from './helpers.js';

const vs = (p1, p2 = 'luffy') => fightingMatch({ p1, p2 });
const hitsBy = (events, moveId) => events.filter((e) => e.type === 'hit' && e.attacker === 0 && e.moveId === moveId);

// --- Zoro ---------------------------------------------------------------------------------

test('Zoro: 36 Pound Phoenix sends a slash projectile across the stage', () => {
  const state = vs('zoro');
  place(state, 200, 700);
  const events = [...press(state, input({ special: true })), ...run(state, 20)];
  assert.ok(events.some((e) => e.type === 'projectile' && e.kind === 'travel'));
  const x0 = state.projectiles[0].x;
  run(state, 10);
  assert.ok(state.projectiles[0].x > x0 + 50, 'travels forward');
  const more = run(state, 60);
  assert.equal(hitsBy(more, 'special').length, 1);
});

test('Zoro: Oni Giri passes through and knocks down', () => {
  const state = vs('zoro');
  place(state, 350, 480);
  const events = [...press(state, input({ x: 1, special: true })), ...run(state, 40)];
  assert.equal(hitsBy(events, 'forwardSpecial').length, 1);
  assert.ok(events.some((e) => e.type === 'knockdown' && e.side === 1));
  assert.ok(state.fighters[0].x > state.fighters[1].x, 'Zoro ends on the far side');
});

test('Zoro: Oni Giri still crosses when the opponent is in the corner', () => {
  const state = vs('zoro');
  place(state, 760, 900);
  press(state, input({ x: 1, special: true }));
  run(state, 40);
  assert.ok(state.fighters[0].x > state.fighters[1].x);
});

test('Zoro: Asura lands several heavy hits and knocks down', () => {
  const state = vs('zoro');
  place(state, 350, 470);
  state.fighters[0].meter = METER_MAX;
  const events = [...press(state, input({ super: true })), ...run(state, SUPER_FREEZE_FRAMES + 80)];
  const hits = hitsBy(events, 'super');
  assert.ok(hits.length >= 3, `${hits.length} hits`);
  assert.ok(hits.reduce((s, h) => s + h.damage, 0) >= 250);
  assert.ok(events.some((e) => e.type === 'knockdown' && e.side === 1));
});

// --- Sanji ---------------------------------------------------------------------------------

test('Sanji: Party Table Kick Course hits an opponent directly behind him', () => {
  const state = vs('sanji');
  place(state, 500, 440);
  state.fighters[0].facing = 1; // facing away from the opponent behind him
  const events = [...press(state, input({ special: true })), ...run(state, 60)];
  assert.ok(hitsBy(events, 'special').length >= 2);
});

test('Sanji: Mouton Shot lunges in from a distance and knocks down', () => {
  const state = vs('sanji');
  place(state, 300, 480);
  const events = [...press(state, input({ x: 1, special: true })), ...run(state, 40)];
  assert.equal(hitsBy(events, 'forwardSpecial').length, 1);
  assert.ok(events.some((e) => e.type === 'knockdown' && e.side === 1));
  assert.ok(state.fighters[0].x > 340, 'lunged forward');
});

test('Sanji: Diable Jambe lands several hits and knocks down', () => {
  const state = vs('sanji');
  place(state, 350, 450);
  state.fighters[0].meter = METER_MAX;
  const events = [...press(state, input({ super: true })), ...run(state, SUPER_FREEZE_FRAMES + 80)];
  assert.ok(hitsBy(events, 'super').length >= 3);
  assert.ok(events.some((e) => e.type === 'knockdown' && e.side === 1));
});

// --- Nami ----------------------------------------------------------------------------------

test('Nami: Thunderbolt Tempo misses if the opponent moves off the marked spot', () => {
  const state = vs('nami', 'sanji');
  place(state, 200, 600);
  press(state, input({ special: true }));
  runUntil(state, (s) => s.projectiles.length > 0, 30);
  const events = run(state, 60, input(), input({ x: 1 })); // opponent walks away
  assert.equal(hitsBy(events, 'special').length, 0);
  assert.equal(state.fighters[1].health, MAX_HEALTH);
});

test('Nami: Thunderbolt Tempo hits an opponent still on the marked spot', () => {
  const state = vs('nami', 'sanji');
  place(state, 200, 600);
  press(state, input({ special: true }));
  const events = run(state, 80);
  assert.equal(hitsBy(events, 'special').length, 1);
});

test('Nami: Cyclone Tempo pushes the opponent much farther than a normal hit', () => {
  const pushOf = (special) => {
    const state = vs('nami', 'sanji');
    place(state, 400, 470);
    const x0 = state.fighters[1].x;
    press(state, special ? input({ x: 1, special: true }) : input({ attack: true }));
    run(state, 70);
    return state.fighters[1].x - x0;
  };
  const cyclone = pushOf(true);
  const chain = pushOf(false);
  assert.ok(cyclone > chain * 3, `cyclone ${cyclone} vs chain ${chain}`);
});

test('Nami: Thunder Lance Tempo reaches an opponent anywhere in front of her', () => {
  const state = vs('nami', 'sanji');
  place(state, 80, 880);
  state.fighters[0].meter = METER_MAX;
  const events = [...press(state, input({ super: true })), ...run(state, SUPER_FREEZE_FRAMES + 40)];
  const hit = hitsBy(events, 'super')[0];
  assert.ok(hit && hit.damage >= 200, 'heavy hit across the stage');
});

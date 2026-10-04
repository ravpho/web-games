import test from 'node:test';
import assert from 'node:assert/strict';
import { announcementFor } from '../src/render/fx.js';
import { FIGHT_CALL_FRAME } from '../src/config.js';

const base = { phase: 'intro', phaseFrame: 0, round: 1, wins: [0, 0], roundResult: null, winner: null };

test('rounds are announced by number, then "Fight!"', () => {
  assert.equal(announcementFor({ ...base }).text, 'ROUND 1');
  assert.equal(announcementFor({ ...base, round: 2, wins: [1, 0] }).text, 'ROUND 2');
  assert.equal(announcementFor({ ...base, phaseFrame: FIGHT_CALL_FRAME }).text, 'FIGHT!');
});

test('the deciding round is announced as the final round', () => {
  assert.equal(announcementFor({ ...base, round: 3, wins: [1, 1] }).text, 'FINAL ROUND');
});

test('round endings are announced as K.O., Time or Draw', () => {
  const end = (reason) => announcementFor({ ...base, phase: 'roundEnd', roundResult: { winner: 0, reason } }).text;
  assert.equal(end('ko'), 'K.O.!');
  assert.equal(end('time'), 'TIME!');
  assert.equal(end('draw'), 'DRAW');
});

test('the match result reads You Win! or You Lose! for the player', () => {
  assert.equal(announcementFor({ ...base, phase: 'matchEnd', winner: 0 }, 0).text, 'YOU WIN!');
  assert.equal(announcementFor({ ...base, phase: 'matchEnd', winner: 1 }, 0).text, 'YOU LOSE!');
  assert.equal(announcementFor({ ...base, phase: 'fight' }), null);
});

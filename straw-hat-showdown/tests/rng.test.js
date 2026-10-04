import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, random, randInt } from '../src/core/rng.js';

const seq = (seed, n = 20) => {
  const r = createRng(seed);
  return Array.from({ length: n }, () => random(r));
};

test('same seed gives the same sequence', () => {
  assert.deepEqual(seq(42), seq(42));
});

test('different seeds give different sequences', () => {
  assert.notDeepEqual(seq(1), seq(2));
});

test('values stay in range', () => {
  const r = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const v = random(r);
    assert.ok(v >= 0 && v < 1);
    const k = randInt(r, 3, 5);
    assert.ok(k >= 3 && k <= 5 && Number.isInteger(k));
  }
});

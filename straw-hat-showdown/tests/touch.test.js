import test from 'node:test';
import assert from 'node:assert/strict';
import { directionFromDrag } from '../src/input/touch.js';

test('small drags are neutral', () => {
  assert.deepEqual(directionFromDrag(5, -6), { x: 0, up: false });
});

test('left and right drags walk', () => {
  assert.deepEqual(directionFromDrag(40, 3), { x: 1, up: false });
  assert.deepEqual(directionFromDrag(-40, 8), { x: -1, up: false });
});

test('up drags jump, diagonals jump in that direction', () => {
  assert.deepEqual(directionFromDrag(0, -40), { x: 0, up: true });
  assert.deepEqual(directionFromDrag(30, -30), { x: 1, up: true });
  assert.deepEqual(directionFromDrag(-30, -30), { x: -1, up: true });
});

test('downward drags only walk sideways', () => {
  assert.deepEqual(directionFromDrag(30, 30), { x: 1, up: false });
  assert.deepEqual(directionFromDrag(0, 40), { x: 0, up: false });
});

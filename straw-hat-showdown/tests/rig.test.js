import test from 'node:test';
import assert from 'node:assert/strict';
import { pose, poseAt, mixPose, solve, localToScreen, colorsFor, BASE_POSE } from '../src/render/rig.js';

const DIMS = { headR: 24, neck: 4, torso: 34, upperArm: 18, foreArm: 18, thigh: 20, shin: 20, shoulderOffset: 4 };
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('interpolating halfway between two poses gives the midpoint (linear easing)', () => {
  const p = poseAt([[0, { fua: 0, lean: 0 }], [10, { fua: 90, lean: 20 }]], 5, (t) => t);
  close(p.fua, 45);
  close(p.lean, 10);
  close(p.bth, BASE_POSE.bth, 1e-9);
});

test('poses hold their first and last keyframe outside the range', () => {
  const keys = [[2, { fua: 10 }], [8, { fua: 80 }]];
  close(poseAt(keys, 0).fua, 10);
  close(poseAt(keys, 50).fua, 80);
  close(mixPose(pose({ fua: 0 }), pose({ fua: 100 }), 0.25).fua, 25);
});

test('an arm pointing straight forward puts the hand at shoulder + upper arm + forearm', () => {
  const j = solve(pose({ lean: 0, fua: 90, ffa: 0 }), DIMS);
  close(j.fHand.y, j.fShoulder.y);
  close(j.fHand.x, j.fShoulder.x + DIMS.upperArm + DIMS.foreArm);
});

test('forearm length scale stretches the arm (Gum-Gum Pistol)', () => {
  const j = solve(pose({ lean: 0, fua: 90, ffa: 0, fstretch: 10 }), DIMS);
  close(j.fHand.x, j.fShoulder.x + DIMS.upperArm + DIMS.foreArm * 10);
});

test('straight legs put the feet on the floor and the head above the shoulders', () => {
  const j = solve(pose({ lean: 0, head: 0, fth: 0, fsh: 0, bth: 0, bsh: 0 }), DIMS);
  close(j.fFoot.y, 0);
  close(j.bFoot.y, 0);
  close(j.head.x, j.shoulder.x);
  close(j.head.y, j.shoulder.y - DIMS.neck - DIMS.headR);
});

test('facing left mirrors local points', () => {
  const pt = { x: 30, y: -50 };
  assert.deepEqual(localToScreen(pt, 400, 0, 470, 1), { x: 430, y: 420 });
  assert.deepEqual(localToScreen(pt, 400, 0, 470, -1), { x: 370, y: 420 });
});

test('the alternate palette overrides only the colors it lists', () => {
  const look = { colors: { shirt: 'red', skin: 'tan' }, altColors: { shirt: 'blue' } };
  assert.deepEqual(colorsFor(look, 0), { shirt: 'red', skin: 'tan' });
  assert.deepEqual(colorsFor(look, 1), { shirt: 'blue', skin: 'tan' });
});

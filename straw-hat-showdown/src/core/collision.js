// Boxes, overlap tests, spacing between fighters and stage edges.
import {
  BODY_HALF_WIDTH, BODY_HEIGHT, PUSH_HALF_WIDTH, STAGE_LEFT, STAGE_RIGHT, CROSS_OVER_HEIGHT,
} from '../config.js';

// World-space box for a move box relative to a fighter (or any object with x, y, facing).
export function worldBox(owner, box) {
  const left = owner.facing === 1 ? owner.x + box.x : owner.x - box.x - box.w;
  return { left, right: left + box.w, bottom: owner.y + box.y, top: owner.y + box.y + box.h };
}

export function bodyBox(f) {
  return {
    left: f.x - BODY_HALF_WIDTH,
    right: f.x + BODY_HALF_WIDTH,
    bottom: f.y,
    top: f.y + BODY_HEIGHT,
  };
}

export function overlaps(a, b) {
  return a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top;
}

// Center of the overlapping area, in world coordinates (y is height above the floor).
export function contactPoint(a, b) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const bottom = Math.max(a.bottom, b.bottom);
  const top = Math.min(a.top, b.top);
  return { x: (left + right) / 2, y: (bottom + top) / 2 };
}

export function clampToStage(f) {
  f.x = Math.min(STAGE_RIGHT, Math.max(STAGE_LEFT, f.x));
}

export function atWall(f) {
  return f.x <= STAGE_LEFT || f.x >= STAGE_RIGHT;
}

// Keeps fighters from overlapping. The fighter that moved into the other is the one moved back,
// so walking into a standing opponent stops instead of pushing them.
export function separate(a, b, passThrough) {
  clampToStage(a);
  clampToStage(b);
  if (passThrough) return;
  if (a.y >= CROSS_OVER_HEIGHT || b.y >= CROSS_OVER_HEIGHT) return;
  const minGap = PUSH_HALF_WIDTH * 2;
  const gap = Math.abs(b.x - a.x);
  if (gap >= minGap) return;
  const dir = Math.sign(b.x - a.x) || Math.sign(b.prevX - a.prevX) || a.facing; // a -> b
  const overlap = minGap - gap;
  const towardA = Math.max(0, (a.x - a.prevX) * dir);
  const towardB = Math.max(0, (b.prevX - b.x) * dir);
  const total = towardA + towardB;
  const shareA = total > 0 ? towardA / total : 0.5;
  a.x -= dir * overlap * shareA;
  b.x += dir * overlap * (1 - shareA);
  clampToStage(a);
  clampToStage(b);
  // If one fighter is pinned against a wall, the other gives way.
  const rest = minGap - Math.abs(b.x - a.x);
  if (rest > 0) {
    if (atWall(a)) b.x += dir * rest;
    else a.x -= dir * rest;
    clampToStage(a);
    clampToStage(b);
  }
}

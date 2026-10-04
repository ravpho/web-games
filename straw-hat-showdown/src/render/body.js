// Draws a posed fighter body in local rig coordinates. Each fighter's look supplies dimensions,
// colors and hooks for the parts that make them recognizable (hair, hats, props).
import { solve, segment, circle, ellipse, torsoShape, face } from './rig.js';

function hand(ctx, at, r, color) {
  circle(ctx, at.x, at.y, r, color);
}

function foot(ctx, at, color) {
  ellipse(ctx, at.x + 4, at.y - 3, 9, 5, 0, color);
}

function arm(ctx, shoulder, elbow, handAt, look, c, p, front) {
  const w = look.armWidth ?? 9;
  const thick = front ? Math.max(1, p.fist * 0.6) : 1;
  segment(ctx, shoulder, elbow, w * thick, c.upperArm ?? c.skin);
  segment(ctx, elbow, handAt, w * thick * 0.95, c.foreArm ?? c.skin);
  hand(ctx, handAt, (look.handR ?? 6.5) * (front ? p.fist : 1), c.hand ?? c.skin);
}

function leg(ctx, hip, knee, footAt, look, c) {
  const w = look.legWidth ?? 11;
  segment(ctx, hip, knee, w, c.thigh ?? c.pants);
  segment(ctx, knee, footAt, w * 0.85, c.shin ?? c.pants);
  foot(ctx, footAt, c.shoe);
}

// opts: { mood, t, move, f } — `move` is the current move id or null.
export function drawBody(ctx, p, look, c, opts) {
  const j = solve(p, look.dims);
  look.drawBehind?.(ctx, j, p, c, opts);
  leg(ctx, j.bHip, j.bKnee, j.bFoot, look, c);
  if (!look.hideBackArm?.(opts)) {
    if (look.drawBackArm) look.drawBackArm(ctx, j, p, c, opts);
    else arm(ctx, j.bShoulder, j.bElbow, j.bHand, look, c, p, false);
  }
  if (look.drawTorso) look.drawTorso(ctx, j, p, c, opts);
  else torsoShape(ctx, j, look.hipW ?? 26, look.shoulderW ?? 30, c.shirt);
  leg(ctx, j.fHip, j.fKnee, j.fFoot, look, c);
  look.drawTorsoFront?.(ctx, j, p, c, opts);
  drawHead(ctx, j, p, look, c, opts);
  if (look.drawFrontArm) look.drawFrontArm(ctx, j, p, c, opts);
  else arm(ctx, j.fShoulder, j.fElbow, j.fHand, look, c, p, true);
  look.drawFront?.(ctx, j, p, c, opts);
  return j;
}

function drawHead(ctx, j, p, look, c, opts) {
  const r = look.dims.headR;
  ctx.save();
  ctx.translate(j.head.x, j.head.y);
  ctx.rotate((j.headAngle * Math.PI) / 180);
  const h = { x: 0, y: 0 };
  look.drawHairBack?.(ctx, h, r, c, opts);
  circle(ctx, 0, 0, r, c.skin);
  face(ctx, h, r, opts.mood, look.faceOpts?.(opts));
  look.drawHairFront?.(ctx, h, r, c, opts);
  ctx.restore();
}

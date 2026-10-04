// A 2D jointed skeleton drawn from simple shapes.
//
// Local coordinates: origin at the fighter's feet, x forward (toward the facing direction),
// y down (canvas convention), so "up" is negative y.
//
// A pose is a set of numbers. Limb angles are in degrees measured from straight down,
// positive toward the front. Forearm and shin angles are relative to the upper limb.
//   bx, by     hip offset (forward, up)        rot   whole-body rotation around the feet
//   lean       torso tilt (+ forward)           head  extra head tilt
//   fua, ffa   front upper arm, forearm         bua, bfa  back arm
//   fth, fsh   front thigh, shin                bth, bsh  back leg
//   fstretch, bstretch  forearm length scale (Luffy)    fist  fist size scale
//   prop       a free angle used by props (swords, staff)
//   pivot      height above the feet that `rot` turns around

export const BASE_POSE = Object.freeze({
  bx: 0, by: 0, rot: 0, lean: 4, head: 0,
  fua: 20, ffa: 50, bua: -10, bfa: 50,
  fth: 12, fsh: -8, bth: -12, bsh: -8,
  fstretch: 1, bstretch: 1, fist: 1, prop: 0, pivot: 8,
});

const DEG = Math.PI / 180;

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

export function pose(partial = {}) {
  return { ...BASE_POSE, ...partial };
}

export function mixPose(a, b, t) {
  const out = {};
  for (const key of Object.keys(BASE_POSE)) out[key] = lerp(a[key] ?? BASE_POSE[key], b[key] ?? BASE_POSE[key], t);
  return out;
}

// keys: [[frame, partialPose], ...] sorted by frame. Holds the first and last pose outside the range.
export function poseAt(keys, frame, ease = easeInOut) {
  if (frame <= keys[0][0]) return pose(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    const [f1, p1] = keys[i];
    if (frame <= f1) {
      const [f0, p0] = keys[i - 1];
      const t = f1 === f0 ? 1 : (frame - f0) / (f1 - f0);
      return mixPose(pose(p0), pose(p1), ease(t));
    }
  }
  return pose(keys[keys.length - 1][1]);
}

function dir(angleDeg) {
  const a = angleDeg * DEG;
  return { x: Math.sin(a), y: Math.cos(a) };
}

function add(p, d, len) {
  return { x: p.x + d.x * len, y: p.y + d.y * len };
}

// Joint positions for a pose and a set of body dimensions.
export function solve(p, dims) {
  const hip = { x: p.bx, y: -(dims.thigh + dims.shin + p.by) };
  const up = dir(180 + p.lean); // pointing up, tilted forward by lean
  const shoulder = add(hip, up, dims.torso);
  const headUp = dir(180 + p.lean + p.head);
  const head = add(shoulder, headUp, dims.neck + dims.headR);
  const fShoulder = { x: shoulder.x + dims.shoulderOffset, y: shoulder.y + 4 };
  const bShoulder = { x: shoulder.x - dims.shoulderOffset, y: shoulder.y + 4 };
  const fElbow = add(fShoulder, dir(p.fua), dims.upperArm);
  const fHand = add(fElbow, dir(p.fua + p.ffa), dims.foreArm * p.fstretch);
  const bElbow = add(bShoulder, dir(p.bua), dims.upperArm);
  const bHand = add(bElbow, dir(p.bua + p.bfa), dims.foreArm * p.bstretch);
  const fHip = { x: hip.x + 4, y: hip.y };
  const bHip = { x: hip.x - 4, y: hip.y };
  const fKnee = add(fHip, dir(p.fth), dims.thigh);
  const fFoot = add(fKnee, dir(p.fth + p.fsh), dims.shin);
  const bKnee = add(bHip, dir(p.bth), dims.thigh);
  const bFoot = add(bKnee, dir(p.bth + p.bsh), dims.shin);
  return {
    hip, shoulder, head, headAngle: p.lean + p.head,
    fShoulder, fElbow, fHand, bShoulder, bElbow, bHand,
    fHip, fKnee, fFoot, bHip, bKnee, bFoot,
  };
}

// --- Drawing primitives --------------------------------------------------------------------

export const OUTLINE = '#1b1b1b';
const OUTLINE_W = 3;

export function segment(ctx, a, b, width, color) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width + OUTLINE_W * 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function limb(ctx, a, b, c, width, color, lowerColor = color, lowerWidth = width) {
  segment(ctx, a, b, width, color);
  segment(ctx, b, c, lowerWidth, lowerColor);
}

export function circle(ctx, x, y, r, fill, outline = true) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = OUTLINE_W;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

export function ellipse(ctx, x, y, rx, ry, rot, fill, outline = true) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = OUTLINE_W;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

export function poly(ctx, points, fill, outline = true) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = OUTLINE_W;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

// A torso drawn as a rounded trapezoid from hips to shoulders.
export function torsoShape(ctx, j, hipW, shoulderW, fill) {
  const dx = j.shoulder.x - j.hip.x;
  const dy = j.shoulder.y - j.hip.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  poly(ctx, [
    { x: j.hip.x + nx * hipW / 2, y: j.hip.y + ny * hipW / 2 + 4 },
    { x: j.shoulder.x + nx * shoulderW / 2, y: j.shoulder.y + ny * shoulderW / 2 },
    { x: j.shoulder.x - nx * shoulderW / 2, y: j.shoulder.y - ny * shoulderW / 2 },
    { x: j.hip.x - nx * hipW / 2, y: j.hip.y - ny * hipW / 2 + 4 },
  ], fill);
}

// Eyes and mouth on a round head facing forward. mood: 'normal' | 'hurt' | 'happy' | 'hearts' | 'fierce'
export function face(ctx, head, r, mood = 'normal', opts = {}) {
  const ex = head.x + r * 0.35;
  const ey = head.y - r * 0.05;
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = OUTLINE;
  if (mood === 'hurt') {
    ctx.lineWidth = 3;
    for (const x of [ex - 9, ex + 7]) {
      ctx.beginPath();
      ctx.moveTo(x - 4, ey - 4);
      ctx.lineTo(x + 4, ey + 4);
      ctx.moveTo(x + 4, ey - 4);
      ctx.lineTo(x - 4, ey + 4);
      ctx.stroke();
    }
  } else if (mood === 'hearts') {
    for (const x of [ex - 9, ex + 7]) heart(ctx, x, ey, 6, '#ff3b6b');
  } else if (mood === 'happy') {
    ctx.lineWidth = 3;
    for (const x of [ex - 9, ex + 7]) {
      ctx.beginPath();
      ctx.arc(x, ey + 2, 4, Math.PI, 0);
      ctx.stroke();
    }
  } else {
    for (const x of opts.oneEye ? [ex + 7] : [ex - 9, ex + 7]) {
      ctx.beginPath();
      ctx.ellipse(x, ey, 3, mood === 'fierce' ? 3.5 : 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (mood === 'fierce') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ex - 14, ey - 9);
      ctx.lineTo(ex - 4, ey - 5);
      ctx.moveTo(ex + 2, ey - 5);
      ctx.lineTo(ex + 12, ey - 9);
      ctx.stroke();
    }
  }
  // mouth
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (mood === 'happy' || mood === 'hearts') {
    ctx.arc(head.x + r * 0.42, head.y + r * 0.38, 7, 0.1, Math.PI - 0.1);
  } else if (mood === 'hurt') {
    ctx.ellipse(head.x + r * 0.42, head.y + r * 0.45, 4, 5, 0, 0, Math.PI * 2);
  } else if (mood === 'fierce') {
    ctx.moveTo(head.x + r * 0.2, head.y + r * 0.45);
    ctx.lineTo(head.x + r * 0.7, head.y + r * 0.4);
  } else {
    ctx.arc(head.x + r * 0.45, head.y + r * 0.32, 5, 0.2, Math.PI - 0.6);
  }
  ctx.stroke();
}

export function heart(ctx, x, y, s, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.3, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

// --- Shared animations ---------------------------------------------------------------------

export const SHARED = {
  idle: (sf) => pose({ by: Math.sin(sf * 0.12) * 1.5, fua: 25 + Math.sin(sf * 0.12) * 3, bua: -5 }),
  walk: (sf, dirSign) => {
    const s = Math.sin(sf * 0.3) * dirSign;
    return pose({ by: Math.abs(Math.cos(sf * 0.3)) * 2, fth: 10 + s * 28, bth: -10 - s * 28, fsh: -10, bsh: -10,
      fua: 20 - s * 18, bua: -10 + s * 18 });
  },
  air: (vy) => pose({ by: 6, fth: 60, fsh: -100, bth: 20, bsh: -90, fua: vy > 0 ? 150 : 70, ffa: 20, bua: vy > 0 ? -130 : -60, bfa: 20 }),
  guard: () => pose({ lean: -6, by: -4, fua: 75, ffa: 110, bua: 60, bfa: 110, fth: 20, fsh: -20, bth: -20, bsh: -10 }),
  hit: (sf) => pose({ lean: -22 + Math.min(sf, 6), head: -12, fua: -30, ffa: 30, bua: -60, bfa: 30, fth: 25, bth: -5 }),
  knockdown: (sf, downFrames) => {
    const t = Math.min(1, sf / 14);
    return mixPose(pose({ lean: -30, fua: -40, bua: -70, fth: 30 }),
      pose({ rot: -88, by: -36, lean: 0, fua: 160, ffa: 10, bua: 170, bfa: 10, fth: 20, fsh: -30, bth: -10, bsh: -20 }),
      easeInOut(t));
  },
  getup: (sf, total) => {
    const t = Math.min(1, sf / total);
    return mixPose(pose({ rot: -88, by: -36, fua: 160, bua: 170, fth: 20, fsh: -30 }),
      pose({ by: -6, fth: 40, fsh: -60, bth: -20, bsh: -30 }), easeInOut(t));
  },
};

// Local rig point -> screen point for a fighter standing at (x, height) and facing +1/-1.
export function localToScreen(pt, x, height, groundY, facing) {
  return { x: x + pt.x * facing, y: groundY - height + pt.y };
}

// Picks the color set for a fighter: palette 1 is the alternate colors used in mirror matches.
export function colorsFor(look, palette) {
  return { ...look.colors, ...(palette === 1 ? look.altColors : null) };
}

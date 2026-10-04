// Sanji, early series: blond hair over one eye, curly eyebrow, black suit and tie,
// hands in his pockets (he only ever kicks), and a flaming leg for Diable Jambe.
import { pose, poseAt, poly, segment, heart, OUTLINE } from '../rig.js';
import { arm } from '../body.js';

const dims = { headR: 24, neck: 4, torso: 34, upperArm: 18, foreArm: 16, thigh: 22, shin: 22, shoulderOffset: 4 };

// Arms come out of the pockets only for the handstand kicks and the victory wave.
function handsOut(o) {
  return o.move === 'special' || (o.f && (o.f.state === 'victory' || o.f.state === 'knockdown' || o.f.state === 'ko'
    || o.f.state === 'getup' || o.f.state === 'hitstun'));
}

function pocketArm(ctx, shoulder, hip, c, front) {
  const pocket = { x: hip.x + (front ? 9 : -9), y: hip.y + 2 };
  const elbow = { x: shoulder.x - 8, y: (shoulder.y + pocket.y) / 2 + 2 };
  segment(ctx, shoulder, elbow, 9, c.suit);
  segment(ctx, elbow, pocket, 8.5, c.suit);
}

const KICK = (fth) => ({ fth, fsh: 0, bth: -15, bsh: -10 });

const moves = {
  chain1: [[0, {}], [3, { ...KICK(30), lean: -4, fsh: -60 }], [4, { ...KICK(70), lean: -10 }], [7, { ...KICK(72), lean: -10 }], [16, {}]],
  chain2: [[0, {}], [4, { ...KICK(60), lean: -8, fsh: -80 }], [5, { ...KICK(98), lean: -18 }], [8, { ...KICK(100), lean: -18 }], [19, {}]],
  chain3: [[0, {}], [6, { ...KICK(80), fsh: -90, lean: -10, by: -4 }], [8, { ...KICK(145), lean: -34, by: -6 }],
    [12, { ...KICK(148), lean: -34, by: -6 }], [28, {}]],
  jumpAttack: [[0, { by: 6, fth: 60, fsh: -100, bth: 20, bsh: -90 }], [4, { by: 6, lean: -10, fth: 45, fsh: 0, bth: -30, bsh: -80 }],
    [16, { by: 6, lean: -10, fth: 45, fsh: 0, bth: -30, bsh: -80 }]],
  forwardSpecial: [[0, {}], [5, { lean: -20, by: 8, fth: 70, fsh: -100, bth: -30, bsh: -60 }],
    [9, { lean: -50, by: 24, fth: 100, fsh: 0, bth: 85, bsh: -10 }], [17, { lean: -50, by: 24, fth: 100, fsh: 0, bth: 85, bsh: -10 }],
    [26, { lean: -10, fth: 30, fsh: -30 }], [35, {}]],
};

// Party Table Kick Course: a spinning handstand with the legs split.
function partyTable(t) {
  const enter = Math.min(1, t / 8);
  const spin = t >= 8 && t < 32 ? Math.sin((t - 8) * 0.55) : 0;
  const up = pose({ rot: 180 * enter, pivot: 56, lean: 0, fua: 178, ffa: 0, bua: 182, bfa: 0,
    fth: 80 * spin + 85 * enter, fsh: 0, bth: -80 * spin - 85 * enter, bsh: 0 });
  if (t > 32) {
    const out = Math.min(1, (t - 32) / 14);
    return { ...up, rot: 180 * (1 - out), fth: 85 * (1 - out), bth: -85 * (1 - out) };
  }
  return up;
}

// Diable Jambe: fast flaming kicks.
function diableJambe(t) {
  if (t < 14) return poseAt([[0, { fth: 20, lean: 6 }], [14, { ...KICK(70), lean: -10 }]], t);
  if (t < 44) {
    const k = Math.abs(Math.sin((t - 14) * 0.52));
    return pose({ ...KICK(60 + k * 80), lean: -10 - k * 20, by: -4 });
  }
  return poseAt([[44, { ...KICK(120), lean: -26 }], [70, {}]], t);
}

function flames(ctx, from, to, t) {
  const n = 7;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const x = from.x + (to.x - from.x) * k;
    const y = from.y + (to.y - from.y) * k;
    const flick = Math.sin(t * 1.3 + i * 1.7) * 4;
    const h = 14 + ((i * 7 + t * 3) % 9);
    for (const [color, s] of [['#ff5a1f', 1], ['#ffc93c', 0.6]]) {
      ctx.beginPath();
      ctx.moveTo(x - 7 * s, y);
      ctx.quadraticCurveTo(x + flick, y - h * s, x + 2 + flick, y - h * 1.4 * s);
      ctx.quadraticCurveTo(x + 6 * s, y - h * 0.4 * s, x + 7 * s, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

function drawTorso(ctx, j, p, c) {
  const s = j.shoulder;
  const h = j.hip;
  poly(ctx, [{ x: h.x - 13, y: h.y + 4 }, { x: s.x - 15, y: s.y }, { x: s.x + 15, y: s.y }, { x: h.x + 13, y: h.y + 4 }], c.suit);
  // shirt and tie showing at the front of the jacket
  const mx = (s.x + h.x) / 2;
  const my = (s.y + h.y) / 2;
  poly(ctx, [{ x: s.x - 2, y: s.y + 1 }, { x: s.x + 15, y: s.y + 1 }, { x: mx + 13, y: my + 4 }], c.shirt);
  poly(ctx, [{ x: s.x + 7, y: s.y + 2 }, { x: s.x + 12, y: s.y + 2 }, { x: mx + 12, y: my + 8 }, { x: mx + 8, y: my + 4 }], c.tie);
}

function drawHairFront(ctx, h, r, c) {
  // blond hair swept over one eye
  poly(ctx, [
    { x: -r * 0.95, y: r * 0.2 }, { x: -r * 1.0, y: -r * 0.55 }, { x: -r * 0.4, y: -r * 1.02 }, { x: r * 0.5, y: -r * 0.95 },
    { x: r * 0.95, y: -r * 0.4 }, { x: r * 0.5, y: -r * 0.38 }, { x: r * 0.15, y: -r * 0.2 }, { x: -r * 0.05, y: r * 0.35 },
    { x: -r * 0.45, y: r * 0.05 },
  ], c.hair);
  // curly eyebrow over the visible eye
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(r * 0.82, -r * 0.3);
  ctx.lineTo(r * 0.36, -r * 0.3);
  ctx.arc(r * 0.4, -r * 0.22, r * 0.08, Math.PI * 1.5, Math.PI * 3.2, true);
  ctx.stroke();
}

function drawBackArm(ctx, j, p, c, o) {
  if (handsOut(o)) arm(ctx, j.bShoulder, j.bElbow, j.bHand, LOOK, c, p, false);
  else pocketArm(ctx, j.bShoulder, j.hip, c, false);
}

function drawFrontArm(ctx, j, p, c, o) {
  if (handsOut(o)) arm(ctx, j.fShoulder, j.fElbow, j.fHand, LOOK, c, p, true);
  else pocketArm(ctx, j.fShoulder, j.hip, c, true);
}

function drawFront(ctx, j, p, c, o) {
  if (o.move === 'super' && o.t >= 4 && o.t < 56) flames(ctx, j.fKnee, j.fFoot, o.t);
  if (o.f?.state === 'intro' && o.opponentId === 'nami') {
    // swooning: floating hearts
    for (let i = 0; i < 3; i++) {
      const k = (o.f.sf * 0.03 + i / 3) % 1;
      heart(ctx, j.head.x + 20 + i * 8, j.head.y - 30 - k * 50, 6 + i, '#ff3b6b');
    }
  }
}

const LOOK = {
  id: 'sanji',
  dims,
  armWidth: 9,
  legWidth: 11,
  colors: {
    skin: '#f3c9a0', hair: '#f6d34c', suit: '#22222c', shirt: '#3b7dd8', tie: '#111111', pants: '#22222c',
    shoe: '#141414', upperArm: '#22222c', foreArm: '#22222c',
  },
  altColors: { suit: '#6b2a2a', pants: '#6b2a2a', upperArm: '#6b2a2a', foreArm: '#6b2a2a', shirt: '#e9e9e9' },
  drawTorso,
  drawHairFront,
  drawBackArm,
  drawFrontArm,
  drawFront,
  faceOpts: () => ({ oneEye: true }),
  anims: {
    intro: (sf, opponentId) => (opponentId === 'nami'
      ? pose({ by: Math.abs(Math.sin(sf * 0.2)) * 8, lean: Math.sin(sf * 0.15) * 14, fth: 20 + Math.sin(sf * 0.3) * 20, bth: -20 })
      : SHARED_IDLE(sf)),
    victory: (sf, opponentId) => (opponentId === 'nami'
      ? pose({ lean: 38, head: 18, by: -2, fth: 4, bth: -4 }) // apologetic bow
      : pose({ fua: 165, ffa: 20, bua: -10, lean: -4, by: Math.sin(sf * 0.12) * 2 })),
  },
  moves: {
    ...Object.fromEntries(Object.entries(moves).map(([id, keys]) => [id, (t) => poseAt(keys, t)])),
    special: partyTable,
    super: diableJambe,
  },
};

function SHARED_IDLE(sf) {
  return pose({ by: Math.sin(sf * 0.12) * 1.5, fth: 14, bth: -10 });
}

export default LOOK;

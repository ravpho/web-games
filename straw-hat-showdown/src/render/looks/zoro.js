// Zoro, early series: short green hair, white shirt, green sash (haramaki), dark trousers,
// three swords: two in his hands, one in his mouth for the big moves.
import { pose, poseAt, poly, ellipse, segment, OUTLINE } from '../rig.js';

const dims = { headR: 24, neck: 3, torso: 35, upperArm: 18, foreArm: 17, thigh: 20, shin: 20, shoulderOffset: 5 };

const HANDLES = ['#f4f4f4', '#c8302b', '#1b1b1b']; // white, red and black hilts

function blade(ctx, hand, elbow, len, handle, swing = 0) {
  const dx = hand.x - elbow.x;
  const dy = hand.y - elbow.y;
  const a = Math.atan2(dy, dx) + swing;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const guard = { x: hand.x + ux * 7, y: hand.y + uy * 7 };
  const tip = { x: hand.x + ux * len, y: hand.y + uy * len };
  segment(ctx, { x: hand.x - ux * 8, y: hand.y - uy * 8 }, guard, 5, handle);
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.quadraticCurveTo(guard.x + ux * len * 0.5 - uy * 4, guard.y + uy * len * 0.5 + ux * 4, tip.x, tip.y);
  ctx.stroke();
  ctx.strokeStyle = '#e9f2ff';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ellipse(ctx, guard.x, guard.y, 4, 6, a, '#d9a925');
}

function swordsOut(o) {
  return o.f && (o.f.state === 'attack' || o.f.state === 'guard' || o.f.state === 'guardstun' || o.move === 'jumpAttack'
    || o.f.state === 'victory');
}

function mouthSword(o) {
  return o.move === 'special' || o.move === 'forwardSpecial' || o.move === 'super' || o.f?.state === 'victory';
}

const SLASH_UP = { fua: 160, ffa: 10, bua: 140, bfa: 20 };

const moves = {
  chain1: [[0, {}], [5, { fua: 150, ffa: 20, lean: -6 }], [7, { fua: 80, ffa: 10, lean: 14, fth: 24, bth: -28 }],
    [10, { fua: 70, ffa: 10, lean: 14, fth: 24, bth: -28 }], [21, {}]],
  chain2: [[0, {}], [6, { bua: 160, bfa: 10, fua: 40, lean: -6 }], [8, { bua: 70, bfa: 0, lean: 16, fth: 24, bth: -30 }],
    [11, { bua: 60, bfa: 0, lean: 16, fth: 24, bth: -30 }], [24, {}]],
  chain3: [[0, {}], [8, { ...SLASH_UP, lean: -10, by: 4 }], [11, { fua: 60, ffa: 0, bua: 70, bfa: 0, lean: 20, by: -8, fth: 40, fsh: -40, bth: -40 }],
    [15, { fua: 50, ffa: 0, bua: 60, bfa: 0, lean: 20, by: -8, fth: 40, fsh: -40, bth: -40 }], [35, {}]],
  jumpAttack: [[0, { by: 6, fth: 60, fsh: -100, bth: 20, bsh: -90, fua: 150, bua: 140 }],
    [5, { by: 6, lean: 20, fua: 50, ffa: 0, bua: 60, bfa: 0, fth: 60, fsh: -100, bth: 20, bsh: -90 }],
    [17, { by: 6, lean: 20, fua: 50, ffa: 0, bua: 60, bfa: 0, fth: 60, fsh: -100, bth: 20, bsh: -90 }]],
  special: [[0, {}], [10, { fua: 170, ffa: 10, bua: 160, bfa: 10, lean: -12 }],
    [14, { fua: 70, ffa: 0, bua: 80, bfa: 0, lean: 22, by: -6, fth: 30, bth: -36 }],
    [20, { fua: 60, ffa: 0, bua: 70, bfa: 0, lean: 22, by: -6, fth: 30, bth: -36 }], [42, {}]],
  forwardSpecial: [[0, {}], [4, { fua: 120, ffa: 60, bua: 130, bfa: 60, lean: 24, by: -14, fth: 60, fsh: -70, bth: -50 }],
    [18, { fua: -40, ffa: 0, bua: -30, bfa: 0, lean: 30, by: -14, fth: 70, fsh: -60, bth: -60 }],
    [26, { fua: -40, ffa: 0, bua: -30, bfa: 0, lean: 18, by: -10, fth: 50, fsh: -50, bth: -40 }], [40, {}]],
  super: [[0, { fua: 150, ffa: 30, bua: -150, bfa: 30, lean: -8 }], [16, { fua: 100, ffa: 0, bua: 80, bfa: 0, lean: 16, by: -6 }],
    [22, { fua: 40, ffa: 0, bua: 140, bfa: 0, lean: 16, by: -6 }], [28, { fua: 130, ffa: 0, bua: 60, bfa: 0, lean: 16, by: -6 }],
    [34, { fua: 60, ffa: 0, bua: 60, bfa: 0, lean: 22, by: -10, fth: 40, bth: -40 }],
    [46, { fua: 60, ffa: 0, bua: 60, bfa: 0, lean: 22, by: -10, fth: 40, bth: -40 }], [76, {}]],
};

function drawBehind(ctx, j, p, c, o) {
  // scabbards at the hip
  if (!swordsOut(o)) {
    for (let i = 0; i < 3; i++) {
      segment(ctx, { x: j.hip.x - 4 + i * 3, y: j.hip.y - 2 }, { x: j.hip.x - 44 + i * 6, y: j.hip.y + 18 - i * 6 }, 5, '#2b2b2b');
    }
  }
}

function drawTorso(ctx, j, p, c) {
  const s = j.shoulder;
  const h = j.hip;
  poly(ctx, [{ x: h.x - 14, y: h.y + 4 }, { x: s.x - 15, y: s.y }, { x: s.x + 15, y: s.y }, { x: h.x + 14, y: h.y + 4 }], c.shirt);
  // haramaki (belly band)
  const mx = (s.x + h.x) / 2;
  const my = (s.y + h.y) / 2;
  poly(ctx, [{ x: h.x - 15, y: h.y + 6 }, { x: mx - 15, y: my + 2 }, { x: mx + 16, y: my + 2 }, { x: h.x + 15, y: h.y + 6 }], c.haramaki);
}

function drawHairBack(ctx, h, r, c) {
  // earrings on the visible ear
  ctx.fillStyle = '#ffd34a';
  for (const dy of [0.25, 0.42, 0.59]) {
    ctx.beginPath();
    ctx.arc(-r * 0.1, r * dy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHairFront(ctx, h, r, c, o) {
  // short spiky green crop
  poly(ctx, [
    { x: -r * 0.95, y: -r * 0.1 }, { x: -r * 0.9, y: -r * 0.7 }, { x: -r * 0.55, y: -r * 0.9 }, { x: -r * 0.3, y: -r * 1.08 },
    { x: 0, y: -r * 0.95 }, { x: r * 0.3, y: -r * 1.06 }, { x: r * 0.55, y: -r * 0.86 }, { x: r * 0.95, y: -r * 0.55 },
    { x: r * 0.7, y: -r * 0.42 }, { x: r * 0.2, y: -r * 0.52 }, { x: -r * 0.4, y: -r * 0.4 }, { x: -r * 0.7, y: -r * 0.05 },
  ], c.hair);
  if (mouthSword(o)) {
    // third sword held in the teeth
    blade(ctx, { x: r * 0.5, y: r * 0.42 }, { x: r * 0.2, y: r * 0.5 }, 48, HANDLES[0], -0.15);
  }
}

function drawFront(ctx, j, p, c, o) {
  if (swordsOut(o)) {
    blade(ctx, j.fHand, j.fElbow, 56, HANDLES[2]);
    blade(ctx, j.bHand, j.bElbow, 52, HANDLES[1]);
  }
  // bandana tied on the upper arm
  segment(ctx, j.fShoulder, { x: (j.fShoulder.x + j.fElbow.x) / 2, y: (j.fShoulder.y + j.fElbow.y) / 2 }, 10, c.bandana);
  if (o.move === 'super' && o.t >= 16 && o.t < 46) {
    // Asura: ghostly extra arms and blades
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 4; i++) {
      const a = ((o.t * 9 + i * 90) % 360) * (Math.PI / 180);
      const from = { x: j.shoulder.x, y: j.shoulder.y + 6 };
      const hand = { x: from.x + Math.cos(a) * 34, y: from.y + Math.sin(a) * 30 };
      segment(ctx, from, hand, 7, c.skin);
      blade(ctx, hand, from, 46, HANDLES[i % 3]);
    }
    ctx.globalAlpha = 1;
  }
  if (o.move === 'forwardSpecial' && o.t >= 4 && o.t < 18) {
    // speed lines behind the dash
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const y = -110 + i * 22;
      ctx.beginPath();
      ctx.moveTo(-40 - i * 6, y);
      ctx.lineTo(-120 - i * 10, y);
      ctx.stroke();
    }
  }
}

// 36 Pound Phoenix: a crescent-shaped flying slash.
function phoenix(ctx, p) {
  const wob = Math.sin(p.t * 0.6) * 3;
  ctx.save();
  ctx.translate(0, -72);
  ctx.scale(1.5, 1.5);
  ctx.beginPath();
  ctx.moveTo(-10, -40 - wob);
  ctx.quadraticCurveTo(36, 0, -10, 40 + wob);
  ctx.quadraticCurveTo(14, 0, -10, -40 - wob);
  ctx.fillStyle = '#eaf6ff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2f6fc0';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90, 160, 235, 0.85)';
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-10 - i * 12, -30 + i * 4);
    ctx.quadraticCurveTo(20 - i * 12, 0, -10 - i * 12, 30 - i * 4);
    ctx.stroke();
  }
  ctx.restore();
}

export default {
  id: 'zoro',
  dims,
  armWidth: 9.5,
  legWidth: 12,
  colors: {
    skin: '#e8b88b', hair: '#3faf4c', shirt: '#f5f5f0', haramaki: '#2f8f3f', pants: '#2b2b2b', shoe: '#1d1d1d',
    bandana: '#1b1b1b',
  },
  altColors: { shirt: '#ffe1a0', haramaki: '#2a5bd7', pants: '#5a3b20', bandana: '#7a1f1f' },
  drawBehind,
  drawTorso,
  drawHairBack,
  drawHairFront,
  drawFront,
  faceOpts: () => ({}),
  anims: {
    intro: (sf) => poseAt([[0, { fua: 160, ffa: 140, head: -6 }], [50, { fua: 160, ffa: 140, head: -6 }], [80, {}]], sf),
    victory: (sf) => pose({ fua: 110, ffa: 40, bua: 100, bfa: 60, lean: -4, by: Math.sin(sf * 0.1) }),
  },
  moves: Object.fromEntries(Object.entries(moves).map(([id, keys]) => [id, (t) => poseAt(keys, t)])),
  projectiles: { special: phoenix },
};


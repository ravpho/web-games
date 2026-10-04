// Nami, early series: orange hair, striped top, blue skirt, Clima-Tact staff,
// thunder clouds, gusts and a lightning spear.
import { pose, poseAt, poly, segment, circle, ellipse, OUTLINE } from '../rig.js';

const dims = { headR: 24, neck: 3, torso: 31, upperArm: 16, foreArm: 15, thigh: 21, shin: 21, shoulderOffset: 4 };

function staffEnds(j) {
  const dx = j.fHand.x - j.fElbow.x;
  const dy = j.fHand.y - j.fElbow.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    back: { x: j.fHand.x - ux * 26, y: j.fHand.y - uy * 26 },
    tip: { x: j.fHand.x + ux * 46, y: j.fHand.y + uy * 46 },
  };
}

function climaTact(ctx, j, c) {
  const { back, tip } = staffEnds(j);
  segment(ctx, back, tip, 6, c.staff);
  circle(ctx, back.x, back.y, 4.5, c.staffKnob);
  circle(ctx, tip.x, tip.y, 5.5, c.staffKnob);
  return tip;
}

function zigzag(ctx, from, to, seed, amp, width, color) {
  const steps = Math.max(4, Math.round(Math.hypot(to.x - from.x, to.y - from.y) / 26));
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  for (let i = 1; i < steps; i++) {
    const k = i / steps;
    const off = Math.sin(seed * 12.9898 + i * 78.233) * amp;
    const nx = -(to.y - from.y);
    const ny = to.x - from.x;
    const nl = Math.hypot(nx, ny) || 1;
    ctx.lineTo(from.x + (to.x - from.x) * k + (nx / nl) * off, from.y + (to.y - from.y) * k + (ny / nl) * off);
  }
  ctx.lineTo(to.x, to.y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function bolt(ctx, from, to, seed) {
  zigzag(ctx, from, to, seed, 12, 18, 'rgba(255, 242, 122, 0.5)');
  zigzag(ctx, from, to, seed, 12, 9, '#ffe03a');
  zigzag(ctx, from, to, seed, 12, 3.5, '#ffffff');
}

const THRUST = { fua: 88, ffa: 0, lean: 12, fth: 22, bth: -26 };

const moves = {
  chain1: [[0, {}], [3, { fua: 40, ffa: 60 }], [5, THRUST], [8, THRUST], [18, {}]],
  chain2: [[0, {}], [4, { fua: 130, ffa: 40, lean: -4 }], [6, { ...THRUST, fua: 70 }], [9, { ...THRUST, fua: 70 }], [21, {}]],
  chain3: [[0, {}], [7, { fua: 175, ffa: 10, lean: -10 }], [9, { fua: 75, ffa: 10, lean: 18, by: -6, fth: 30, bth: -30 }],
    [13, { fua: 70, ffa: 10, lean: 18, by: -6, fth: 30, bth: -30 }], [31, {}]],
  jumpAttack: [[0, { by: 6, fth: 60, fsh: -100, bth: 20, bsh: -90 }], [4, { by: 6, lean: 16, fua: 40, ffa: 0, fth: 60, fsh: -100, bth: 20, bsh: -90 }],
    [16, { by: 6, lean: 16, fua: 40, ffa: 0, fth: 60, fsh: -100, bth: 20, bsh: -90 }]],
  special: [[0, {}], [10, { fua: 175, ffa: 0, bua: -150, bfa: 30, lean: -6, head: -10 }], [16, { fua: 175, ffa: 0, bua: -150, bfa: 30, lean: -6, head: -10 }], [38, {}]],
  forwardSpecial: [[0, {}], [8, { fua: 30, ffa: 90, lean: -6 }], [12, { ...THRUST, fua: 92 }], [18, { ...THRUST, fua: 92 }], [36, {}]],
  super: [[0, { fua: 175, ffa: 0, lean: -10, head: -8 }], [12, { fua: 175, ffa: 0, lean: -10, head: -8 }],
    [16, { ...THRUST, fua: 90, lean: 16, fth: 28, bth: -34 }], [26, { ...THRUST, fua: 90, lean: 16, fth: 28, bth: -34 }], [56, {}]],
};

function drawHairBack(ctx, h, r, c) {
  // orange hair falling to the shoulders behind the head
  poly(ctx, [
    { x: r * 0.3, y: -r * 0.9 }, { x: -r * 0.6, y: -r * 0.95 }, { x: -r * 1.2, y: -r * 0.2 }, { x: -r * 1.25, y: r * 0.9 },
    { x: -r * 0.85, y: r * 1.25 }, { x: -r * 0.4, y: r * 1.0 }, { x: -r * 0.1, y: r * 0.3 },
  ], c.hair);
}

function drawHairFront(ctx, h, r, c) {
  poly(ctx, [
    { x: -r * 0.85, y: -r * 0.2 }, { x: -r * 0.75, y: -r * 0.75 }, { x: 0, y: -r * 1.05 }, { x: r * 0.75, y: -r * 0.75 },
    { x: r * 0.98, y: -r * 0.15 }, { x: r * 0.75, y: -r * 0.35 }, { x: r * 0.55, y: -r * 0.22 }, { x: r * 0.35, y: -r * 0.45 },
    { x: 0, y: -r * 0.45 }, { x: -r * 0.4, y: -r * 0.45 },
  ], c.hair);
}

function drawTorso(ctx, j, p, c) {
  const s = j.shoulder;
  const h = j.hip;
  const pts = [{ x: h.x - 11, y: h.y + 2 }, { x: s.x - 13, y: s.y + 2 }, { x: s.x + 13, y: s.y + 2 }, { x: h.x + 11, y: h.y + 2 }];
  poly(ctx, pts, c.top);
  // stripes, clipped to the top
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = c.stripe;
  ctx.lineWidth = 3;
  for (let k = 0.2; k < 1; k += 0.22) {
    const y = h.y + (s.y - h.y) * k;
    ctx.beginPath();
    ctx.moveTo(Math.min(h.x, s.x) - 20, y);
    ctx.lineTo(Math.max(h.x, s.x) + 20, y);
    ctx.stroke();
  }
  ctx.restore();
  // flared skirt
  poly(ctx, [{ x: h.x - 13, y: h.y - 4 }, { x: h.x + 13, y: h.y - 4 }, { x: h.x + 20, y: h.y + 16 }, { x: h.x - 20, y: h.y + 16 }], c.skirt);
}

function drawFront(ctx, j, p, c, o) {
  // tattoo on the shoulder
  circle(ctx, j.fShoulder.x, j.fShoulder.y + 7, 3.5, '#3a7bd5', false);
  const tip = climaTact(ctx, j, c);
  if (o.move === 'super' && o.t >= 16 && o.t < 26) {
    // Thunder Lance Tempo: a lightning spear across the stage
    bolt(ctx, tip, { x: tip.x + 900, y: tip.y + 4 }, o.t);
  }
  if (o.move === 'special' && o.t >= 8 && o.t < 16) {
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 3; i++) circle(ctx, tip.x + Math.cos(o.t + i * 2) * 10, tip.y + Math.sin(o.t + i * 2) * 10, 4, '#cfe8ff', false);
    ctx.globalAlpha = 1;
  }
}

// Thunderbolt Tempo: a thundercloud marks the spot, then lightning strikes it.
function thunderbolt(ctx, p, def) {
  const delay = def.delay;
  const grow = Math.min(1, p.t / 12);
  const cloudY = -235;
  // warning ring on the floor so players can see where it will strike
  if (p.t < delay) {
    const pulse = 0.65 + 0.35 * Math.sin(p.t * 0.6);
    ctx.globalAlpha = pulse;
    ellipse(ctx, 0, -2, 32, 8, 0, 'rgba(255, 224, 58, 0.55)');
    ctx.strokeStyle = '#ffe03a';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, -200);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.translate(0, cloudY);
  ctx.scale(grow, grow);
  const dark = p.t >= delay - 10 ? '#4b5068' : '#7d8396';
  for (const [x, y, r] of [[-26, 6, 20], [0, -6, 26], [26, 6, 20], [0, 10, 22]]) circle(ctx, x, y, r, dark);
  for (const [x, y, r] of [[-26, 6, 18], [0, -6, 24], [26, 6, 18], [0, 10, 20]]) circle(ctx, x, y, r, dark, false);
  ctx.restore();
  if (p.t >= delay) bolt(ctx, { x: 0, y: cloudY + 20 }, { x: 0, y: 0 }, p.t);
  else if (p.t > delay - 10 && p.t % 4 < 2) bolt(ctx, { x: -20, y: cloudY + 22 }, { x: -6, y: cloudY + 55 }, p.t);
}

// Cyclone Tempo: a swirling gust.
function cyclone(ctx, p) {
  ctx.save();
  ctx.translate(0, -68);
  ctx.scale(1.35, 1.35);
  ellipse(ctx, 0, 0, 34, 40, 0, 'rgba(200, 235, 255, 0.35)', false);
  ctx.strokeStyle = '#eaf8ff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const r = 12 + i * 8;
    const a0 = p.t * 0.5 + i;
    ctx.beginPath();
    ctx.ellipse(0, (i - 1.5) * 12, r, r * 0.45, 0, a0, a0 + Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5aa7e6';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-30 - i * 10, -20 + i * 20);
    ctx.lineTo(-60 - i * 10, -20 + i * 20);
    ctx.stroke();
  }
  ctx.restore();
}

export default {
  id: 'nami',
  dims,
  armWidth: 8,
  legWidth: 9.5,
  colors: {
    skin: '#f7cba3', hair: '#ff8a1e', top: '#ffffff', stripe: '#3a7bd5', skirt: '#2f62b8', shoe: '#c0763a',
    thigh: '#f7cba3', shin: '#f7cba3', staff: '#3a7bd5', staffKnob: '#1f4f9a',
  },
  altColors: { top: '#ffe3f0', stripe: '#d6457a', skirt: '#7b3fa0', staff: '#d6457a', staffKnob: '#8a2a52' },
  drawHairBack,
  drawHairFront,
  drawTorso,
  drawFront,
  anims: {
    intro: (sf) => pose({ fua: 90 + Math.sin(sf * 0.3) * 80, ffa: 20, lean: -2 }),
    victory: (sf) => pose({ fua: 170, ffa: 0, bua: -30, bfa: 60, lean: -6, by: Math.abs(Math.sin(sf * 0.15)) * 6, head: -6 }),
  },
  moves: Object.fromEntries(Object.entries(moves).map(([id, keys]) => [id, (t) => poseAt(keys, t)])),
  projectiles: { special: thunderbolt, forwardSpecial: cyclone },
};

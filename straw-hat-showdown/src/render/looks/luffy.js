// Luffy, early series: straw hat, open red vest, blue shorts, sandals, scar under the left eye.
import { pose, poseAt, ellipse, poly, circle, OUTLINE } from '../rig.js';

const dims = { headR: 25, neck: 3, torso: 32, upperArm: 17, foreArm: 17, thigh: 19, shin: 19, shoulderOffset: 4 };

// Forearm scale that puts the fist at `reach` px in front of the body center.
const reachScale = (reach) => (reach - 6 - dims.upperArm - 7) / dims.foreArm;
const PISTOL = reachScale(300);
const GIANT = reachScale(330);

const PUNCH = { fua: 90, ffa: 0 };

const moves = {
  chain1: [[0, {}], [3, { fua: 55, ffa: 70, lean: 8 }], [5, { ...PUNCH, lean: 12, fth: 22, bth: -26 }],
    [8, { ...PUNCH, lean: 12, fth: 22, bth: -26 }], [18, {}]],
  chain2: [[0, {}], [4, { bua: -40, bfa: 90, lean: -4 }], [6, { bua: 90, bfa: 0, fua: -20, lean: 14, fth: 24, bth: -28 }],
    [9, { bua: 90, bfa: 0, fua: -20, lean: 14, fth: 24, bth: -28 }], [21, {}]],
  chain3: [[0, {}], [6, { fua: -40, ffa: 100, lean: -10 }],
    [9, { ...PUNCH, fstretch: 2.6, lean: 16, fth: 26, bth: -32 }],
    [13, { ...PUNCH, fstretch: 2.6, lean: 16, fth: 26, bth: -32 }], [20, { fua: 60, ffa: 30 }], [31, {}]],
  jumpAttack: [[0, { by: 6, fth: 60, fsh: -100, bth: 20, bsh: -90, fua: 70 }],
    [4, { by: 6, lean: 22, fua: 45, ffa: 0, fstretch: 1.6, fth: 60, fsh: -100, bth: 20, bsh: -90 }],
    [16, { by: 6, lean: 22, fua: 45, ffa: 0, fstretch: 1.6, fth: 60, fsh: -100, bth: 20, bsh: -90 }]],
  special: [[0, {}], [10, { fua: -70, ffa: 110, lean: -10, bua: 40, fth: 22, bth: -30 }],
    [12, { ...PUNCH, lean: 14, fstretch: 2, fth: 26, bth: -34 }],
    [14, { ...PUNCH, lean: 14, fstretch: PISTOL, fth: 26, bth: -34 }],
    [22, { ...PUNCH, lean: 14, fstretch: PISTOL, fth: 26, bth: -34 }],
    [30, { ...PUNCH, lean: 6, fstretch: 1 }], [48, {}]],
  super: [[0, { fua: 150, ffa: 120, head: 12, lean: -6 }], [12, { fua: -60, ffa: 100, lean: -14, fist: 2, bua: 30 }],
    [16, { ...PUNCH, fstretch: 4, fist: 5, lean: 12, fth: 26, bth: -34 }],
    [18, { ...PUNCH, fstretch: GIANT, fist: 6, lean: 16, fth: 28, bth: -36 }],
    [26, { ...PUNCH, fstretch: GIANT, fist: 6, lean: 16, fth: 28, bth: -36 }],
    [44, { ...PUNCH, fstretch: 1, fist: 1.5, lean: 4 }], [60, {}]],
};

function gatling(t) {
  if (t < 8 || t >= 38) return poseAt([[0, {}], [8, { fua: 70, ffa: 20, lean: 10 }], [38, { fua: 70, ffa: 20, lean: 10 }], [54, {}]], t);
  const a = Math.sin(t * 1.6);
  return pose({ fua: 88 + a * 8, ffa: 0, fstretch: 2.4 + a, bua: 88 - a * 8, bfa: 0, bstretch: 2.4 - a,
    lean: 14, fth: 26, bth: -32 });
}

function drawHairBack(ctx, h, r, c) {
  // spiky black hair poking out under the hat at the back
  poly(ctx, [
    { x: -r * 0.2, y: -r * 0.6 }, { x: -r * 1.15, y: -r * 0.2 }, { x: -r * 0.9, y: r * 0.05 },
    { x: -r * 1.2, y: r * 0.35 }, { x: -r * 0.7, y: r * 0.45 }, { x: -r * 0.3, y: 0 },
  ], c.hair);
}

function drawHairFront(ctx, h, r, c) {
  // fringe
  poly(ctx, [
    { x: -r * 0.6, y: -r * 0.75 }, { x: r * 0.95, y: -r * 0.45 }, { x: r * 0.75, y: -r * 0.2 },
    { x: r * 0.55, y: -r * 0.38 }, { x: r * 0.35, y: -r * 0.12 }, { x: r * 0.1, y: -r * 0.4 },
    { x: -r * 0.2, y: -r * 0.1 }, { x: -r * 0.45, y: -r * 0.3 },
  ], c.hair);
  // scar under the left eye
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.12, r * 0.18);
  ctx.quadraticCurveTo(r * 0.22, r * 0.3, r * 0.36, r * 0.22);
  ctx.moveTo(r * 0.18, r * 0.14);
  ctx.lineTo(r * 0.2, r * 0.3);
  ctx.moveTo(r * 0.27, r * 0.15);
  ctx.lineTo(r * 0.29, r * 0.3);
  ctx.stroke();
  drawStrawHat(ctx, r, c);
}

// The straw hat, in head-local coordinates for a head of radius r. Also used for the app icon.
export function drawStrawHat(ctx, r, c) {
  ellipse(ctx, r * 0.05, -r * 0.62, r * 1.45, r * 0.32, -0.08, c.hat); // brim
  const dome = () => {
    ctx.beginPath();
    ctx.ellipse(r * 0.02, -r * 0.66, r * 0.85, r * 0.66, -0.08, Math.PI, 0);
    ctx.closePath();
  };
  dome();
  ctx.fillStyle = c.hat;
  ctx.fill();
  // red band around the base of the crown
  ctx.save();
  dome();
  ctx.clip();
  ctx.translate(r * 0.02, -r * 0.66);
  ctx.rotate(-0.08);
  ctx.fillStyle = c.hatBand;
  ctx.fillRect(-r, -r * 0.3, r * 2, r * 0.3);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.3);
  ctx.lineTo(r, -r * 0.3);
  ctx.stroke();
  ctx.restore();
  dome();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function drawTorso(ctx, j, p, c) {
  // bare chest under an open vest: skin torso, red vest panels at the back and front edges
  const s = j.shoulder;
  const hp = j.hip;
  poly(ctx, [{ x: hp.x - 13, y: hp.y + 4 }, { x: s.x - 15, y: s.y }, { x: s.x + 15, y: s.y }, { x: hp.x + 13, y: hp.y + 4 }], c.skin);
  poly(ctx, [{ x: hp.x - 13, y: hp.y + 2 }, { x: s.x - 15, y: s.y }, { x: s.x + 7, y: s.y }, { x: hp.x + 4, y: hp.y + 2 }], c.vest);
  poly(ctx, [{ x: hp.x + 9, y: hp.y + 2 }, { x: s.x + 11, y: s.y + 2 }, { x: s.x + 15, y: s.y + 6 }, { x: hp.x + 13, y: hp.y + 2 }], c.vest);
  // shorts waistband and cuffs
  poly(ctx, [{ x: hp.x - 14, y: hp.y - 2 }, { x: hp.x + 14, y: hp.y - 2 }, { x: hp.x + 15, y: hp.y + 10 }, { x: hp.x - 15, y: hp.y + 10 }], c.shorts);
}

function drawFront(ctx, j, p, c, o) {
  if (o.move === 'super' && p.fist > 1.5) {
    // Gear Third: a giant inflated fist with knuckle lines
    const r = 6.5 * p.fist;
    circle(ctx, j.fHand.x, j.fHand.y, r, c.skin);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    for (const k of [-0.45, 0, 0.45]) {
      ctx.beginPath();
      ctx.arc(j.fHand.x + r * 0.55, j.fHand.y + k * r, r * 0.22, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  }
  if (o.move === 'forwardSpecial' && o.t >= 8 && o.t < 38) {
    // Gatling: a blur of extra stretching fists with speed lines
    for (let i = 0; i < 7; i++) {
      const phase = (o.t * 7 + i * 29) % 37;
      const x = 34 + phase * 2.2;
      const y = -96 + ((i * 17 + o.t * 11) % 46);
      ctx.strokeStyle = 'rgba(27,27,27,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 30, y);
      ctx.lineTo(x - 10, y);
      ctx.stroke();
      ctx.globalAlpha = 0.85;
      circle(ctx, x, y, 9, c.skin);
      ctx.globalAlpha = 1;
    }
  }
}

export default {
  id: 'luffy',
  dims,
  armWidth: 8.5,
  legWidth: 11,
  colors: {
    skin: '#f6c99a', hair: '#151515', hat: '#f2c94c', hatBand: '#c8302b', vest: '#d8262e',
    shorts: '#2f62b8', thigh: '#2f62b8', shin: '#f6c99a', shoe: '#9b6a3a',
  },
  altColors: { vest: '#2a9d8f', shorts: '#6b4aa6', thigh: '#6b4aa6', hatBand: '#2a3d9f' },
  drawHairBack,
  drawHairFront,
  drawTorso,
  drawFront,
  anims: {
    intro: (sf) => poseAt([[0, { fua: 170, ffa: 60, head: -8 }], [40, { fua: 170, ffa: 60, head: -8 }], [70, { fua: 30, ffa: 70 }]], sf),
    victory: (sf) => pose({ by: Math.abs(Math.sin(sf * 0.15)) * 10, fua: 165, ffa: 10, bua: -165, bfa: 10, lean: -4, head: -10 }),
  },
  moves: {
    ...Object.fromEntries(Object.entries(moves).map(([id, keys]) => [id, (t) => poseAt(keys, t)])),
    forwardSpecial: gatling,
  },
};

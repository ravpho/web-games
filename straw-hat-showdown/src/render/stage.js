// The Going Merry's deck, with sea and sky. Static parts are drawn once into a cached layer;
// waves and clouds move a little each frame.
import { SCREEN_W, SCREEN_H, GROUND_Y } from '../config.js';
import { OUTLINE } from './rig.js';

const HORIZON = 300;
let cache = null;

function makeLayer(scale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(SCREEN_W * scale);
  canvas.height = Math.round(SCREEN_H * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  return { canvas, ctx };
}

function drawSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#5fb4ff');
  sky.addColorStop(1, '#c9ecff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCREEN_W, HORIZON);
  // sun
  ctx.fillStyle = 'rgba(255, 244, 190, 0.9)';
  ctx.beginPath();
  ctx.arc(800, 70, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawSea(ctx) {
  const sea = ctx.createLinearGradient(0, HORIZON, 0, GROUND_Y);
  sea.addColorStop(0, '#2f8fd8');
  sea.addColorStop(1, '#1c5fa8');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, SCREEN_W, GROUND_Y - HORIZON);
}

function plankRect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawMast(ctx) {
  // mast and a plain sail (no emblem)
  plankRect(ctx, 150, 20, 22, 380, '#a0682f');
  ctx.beginPath();
  ctx.moveTo(60, 50);
  ctx.quadraticCurveTo(161, 30, 262, 50);
  ctx.lineTo(272, 230);
  ctx.quadraticCurveTo(161, 260, 50, 230);
  ctx.closePath();
  ctx.fillStyle = '#fbf6ea';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  plankRect(ctx, 46, 40, 230, 12, '#8a5626');
  // crow's nest
  plankRect(ctx, 128, 0, 66, 18, '#8a5626');
}

function drawTangerineTree(ctx, x) {
  // Nami's tangerine trees on the Merry's deck
  plankRect(ctx, x - 26, 372, 52, 26, '#7b4a20');
  ctx.fillStyle = '#6b3d16';
  ctx.fillRect(x - 4, 330, 8, 44);
  ctx.beginPath();
  ctx.arc(x, 318, 34, 0, Math.PI * 2);
  ctx.fillStyle = '#3f9b3a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  for (const [dx, dy] of [[-14, -8], [10, -16], [16, 8], [-6, 12], [0, -26]]) {
    ctx.beginPath();
    ctx.arc(x + dx, 318 + dy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff9a1f';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawRamHead(ctx) {
  // the Going Merry's sheep figurehead at the bow
  const x = 905;
  const y = 330;
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.ellipse(x, y, 40, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // curly horns
  ctx.fillStyle = '#e8d7b0';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * 30, y - 8, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + side * 30, y - 8, 7, 0, Math.PI * 1.5);
    ctx.stroke();
  }
  // face
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(x - 10, y + 2, 4, 0, Math.PI * 2);
  ctx.arc(x + 10, y + 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + 16, 7, 0.2, Math.PI - 0.2);
  ctx.stroke();
  plankRect(ctx, x - 10, y + 32, 20, 40, '#a0682f');
}

function drawRailing(ctx) {
  // back railing of the deck
  plankRect(ctx, 0, 372, SCREEN_W, 14, '#b77a3c');
  for (let x = 20; x < SCREEN_W; x += 60) plankRect(ctx, x, 386, 12, GROUND_Y - 386 - 20, '#a86d33');
  plankRect(ctx, 0, GROUND_Y - 22, SCREEN_W, 22, '#9a6430');
}

function drawDeck(ctx) {
  const deck = ctx.createLinearGradient(0, GROUND_Y, 0, SCREEN_H);
  deck.addColorStop(0, '#d29b5c');
  deck.addColorStop(1, '#a8733d');
  ctx.fillStyle = deck;
  ctx.fillRect(0, GROUND_Y, SCREEN_W, SCREEN_H - GROUND_Y);
  ctx.strokeStyle = 'rgba(27, 27, 27, 0.45)';
  ctx.lineWidth = 2;
  for (let y = GROUND_Y + 14; y < SCREEN_H; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCREEN_W, y);
    ctx.stroke();
  }
  for (let row = 0; row < 5; row++) {
    for (let x = (row % 2) * 70; x < SCREEN_W; x += 140) {
      const y = GROUND_Y + row * 16;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 14);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(SCREEN_W, GROUND_Y);
  ctx.stroke();
}

function buildCache(scale) {
  const back = makeLayer(scale);
  drawSky(back.ctx);
  const front = makeLayer(scale);
  drawMast(front.ctx);
  drawTangerineTree(front.ctx, 300);
  drawRailing(front.ctx);
  drawRamHead(front.ctx);
  drawDeck(front.ctx);
  return { scale, back: back.canvas, front: front.canvas };
}

function drawClouds(ctx, frame) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  for (const [x0, y, s] of [[120, 70, 1], [520, 110, 0.8], [880, 50, 0.7]]) {
    const x = ((x0 + frame * 0.15 * s) % (SCREEN_W + 200)) - 100;
    ctx.beginPath();
    ctx.ellipse(x, y, 52 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 30 * s, y - 14 * s, 34 * s, 22 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 28 * s, y - 8 * s, 28 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWaves(ctx, frame) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 3;
  for (let row = 0; row < 3; row++) {
    const y = HORIZON + 20 + row * 24;
    const shift = (frame * (0.4 + row * 0.2)) % 80;
    ctx.beginPath();
    for (let x = -80 + shift; x < SCREEN_W; x += 80) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 20, y - 8, x + 40, y);
    }
    ctx.stroke();
  }
}

// Draws the stage. `scale` is canvas pixels per logical pixel (cache is rebuilt when it changes).
export function drawStage(ctx, frame, scale) {
  if (!cache || cache.scale !== scale) cache = buildCache(scale);
  ctx.drawImage(cache.back, 0, 0, SCREEN_W, SCREEN_H);
  drawClouds(ctx, frame);
  drawSea(ctx);
  drawWaves(ctx, frame);
  ctx.drawImage(cache.front, 0, 0, SCREEN_W, SCREEN_H);
}

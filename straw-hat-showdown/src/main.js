import { SCREEN_W, SCREEN_H } from './config.js';
import { applyLayout } from './layout.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let layout = applyLayout(stage, canvas);

function relayout() {
  layout = applyLayout(stage, canvas);
}
window.addEventListener('resize', relayout);
window.visualViewport?.addEventListener('resize', relayout);

function draw() {
  ctx.setTransform(layout.pixelScale, 0, 0, layout.pixelScale, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  sky.addColorStop(0, '#7ec8ff');
  sky.addColorStop(1, '#d9f1ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.fillStyle = '#1b1b1b';
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Straw Hat Showdown', SCREEN_W / 2, SCREEN_H / 2);
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

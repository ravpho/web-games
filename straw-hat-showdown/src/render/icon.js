// The app icon: Luffy's straw hat over the sea, drawn with the same code as the game.
import { drawStrawHat } from './looks/luffy.js';
import { LOOKS } from './looks/index.js';

// maskable: keep the hat inside the central safe zone, since launchers may crop the corners.
export function drawIcon(canvas, { maskable = false } = {}) {
  const ctx = canvas.getContext('2d');
  const s = canvas.width;
  const sky = ctx.createLinearGradient(0, 0, 0, s);
  sky.addColorStop(0, '#5fb4ff');
  sky.addColorStop(0.62, '#c9ecff');
  sky.addColorStop(0.62, '#2f8fd8');
  sky.addColorStop(1, '#1c5fa8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = s * 0.018;
  for (let row = 0; row < 2; row++) {
    const y = s * (0.74 + row * 0.1);
    ctx.beginPath();
    for (let x = -s * 0.1; x < s; x += s * 0.2) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + s * 0.05, y - s * 0.03, x + s * 0.1, y);
    }
    ctx.stroke();
  }
  const r = s * (maskable ? 0.22 : 0.27);
  ctx.save();
  ctx.translate(s / 2, s * 0.5 + r * 0.55);
  ctx.rotate(-0.08);
  ctx.scale(r / 25, r / 25); // draw at game size so outlines scale with the hat
  drawStrawHat(ctx, 25, LOOKS.luffy.colors);
  ctx.restore();
}

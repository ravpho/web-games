// Text is drawn once into a small offscreen canvas and reused: redrawing outlined text every
// frame is one of the most expensive things a slow phone has to do.
import { OUTLINE } from './rig.js';

let pixelScale = 1;
const cache = new Map();
const measurer = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

// Call when the canvas resolution changes so cached text stays sharp.
export function setTextScale(scale) {
  if (scale !== pixelScale) {
    pixelScale = scale;
    cache.clear();
  }
}

function sprite(text, size, fill, weight, outline) {
  const key = `${text}|${size}|${fill}|${weight}|${outline}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const font = `${weight} ${size}px system-ui, -apple-system, sans-serif`;
  measurer.font = font;
  const m = measurer.measureText(text);
  const line = outline ? Math.max(4, size / 6) : 0;
  const pad = Math.ceil(line / 2 + 2);
  const ascent = Math.ceil(m.actualBoundingBoxAscent || size * 0.8);
  const descent = Math.ceil(m.actualBoundingBoxDescent || size * 0.25);
  const w = Math.ceil(m.width) + pad * 2;
  const h = ascent + descent + pad * 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w * pixelScale));
  canvas.height = Math.max(1, Math.ceil(h * pixelScale));
  const g = canvas.getContext('2d');
  g.scale(pixelScale, pixelScale);
  g.font = font;
  g.textBaseline = 'alphabetic';
  g.lineJoin = 'round';
  if (outline) {
    g.lineWidth = line;
    g.strokeStyle = OUTLINE;
    g.strokeText(text, pad, pad + ascent);
  }
  g.fillStyle = fill;
  g.fillText(text, pad, pad + ascent);
  const entry = { canvas, w, h, top: pad + ascent, pad };
  if (cache.size > 300) cache.clear();
  cache.set(key, entry);
  return entry;
}

// Draws text with its baseline at y. align: 'left' | 'center' | 'right'. scale enlarges the
// cached bitmap (for pop-in animations) without making a new one.
export function drawText(ctx, text, x, y, size, fill, align = 'center', { weight = 900, outline = true, scale = 1 } = {}) {
  const s = sprite(text, size, fill, weight, outline);
  const w = s.w * scale;
  let left;
  if (align === 'center') left = x - w / 2;
  else if (align === 'right') left = x - (s.w - s.pad) * scale;
  else left = x - s.pad * scale;
  ctx.drawImage(s.canvas, left, y - s.top * scale, w, s.h * scale);
}

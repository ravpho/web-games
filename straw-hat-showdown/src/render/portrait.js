// Character-select portraits: the fighter's bust drawn with the same rig code as in the fight.
import { GROUND_Y } from '../config.js';
import { drawFighter } from './fighters.js';
import { createFighter } from '../core/fighter.js';

export function drawPortrait(canvas, id, palette = 0) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const f = createFighter(id, 0, palette);
  f.x = 0;
  f.state = 'idle';
  f.sf = 0;
  const scale = h / 95;
  ctx.setTransform(scale, 0, 0, scale, w / 2 - 4 * scale, h * 1.12 - GROUND_Y * scale + 40 * scale);
  drawFighter(ctx, f, null);
}

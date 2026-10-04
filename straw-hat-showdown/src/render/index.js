// Draws one frame of a match: stage, fighters, projectiles, effects, fight information.
import { drawStage } from './stage.js';
import { drawFighter } from './fighters.js';
import { drawProjectiles } from './projectiles.js';
import { drawHud } from './hud.js';
import {
  drawWorldFx, drawScreenFx, drawSuperDim, drawAnnouncement, shakeOffset,
} from './fx.js';

// The fighter that is attacking (or doing their super) is drawn in front.
function drawOrder(state, fx) {
  const [a, b] = state.fighters;
  if (fx.superFlash) return fx.superFlash.side === 0 ? [b, a] : [a, b];
  if (a.state === 'attack' && b.state !== 'attack') return [b, a];
  return [a, b];
}

export function renderMatch(ctx, state, fx, hud, scale, playerSide = 0) {
  const shake = shakeOffset(fx, state.frame);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  drawStage(ctx, state.frame, scale);
  drawSuperDim(ctx, fx);
  const [back, front] = drawOrder(state, fx);
  drawFighter(ctx, back, state.fighters[1 - back.side].id);
  drawFighter(ctx, front, state.fighters[1 - front.side].id);
  drawProjectiles(ctx, state);
  drawWorldFx(ctx, fx);
  ctx.restore();
  drawHud(ctx, hud, state);
  drawScreenFx(ctx, fx);
  drawAnnouncement(ctx, state, playerSide);
}

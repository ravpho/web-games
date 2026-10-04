// Draws one frame of a match on the foreground canvas: fighters, projectiles, effects and fight
// information. The stage is drawn separately on the background canvas (see drawStage).
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

// Returns the screen-shake offset so the background layer can be moved to match.
export function renderMatch(ctx, state, fx, hud, playerSide = 0) {
  const shake = shakeOffset(fx, state.frame);
  drawSuperDim(ctx, fx);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  const [back, front] = drawOrder(state, fx);
  drawFighter(ctx, back, state.fighters[1 - back.side].id);
  drawFighter(ctx, front, state.fighters[1 - front.side].id);
  drawProjectiles(ctx, state);
  drawWorldFx(ctx, fx);
  ctx.restore();
  drawHud(ctx, hud, state);
  drawScreenFx(ctx, fx);
  drawAnnouncement(ctx, state, playerSide);
  return shake;
}

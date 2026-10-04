// Chooses each fighter's pose from its state and draws it on the stage.
import { GROUND_Y, GETUP_FRAMES } from '../config.js';
import { SHARED, colorsFor, ellipse } from './rig.js';
import { drawBody } from './body.js';
import { LOOKS } from './looks/index.js';

function moodFor(f, opponentId) {
  if (f.state === 'hitstun' || f.state === 'knockdown' || f.state === 'ko') return 'hurt';
  if (f.state === 'victory') return 'happy';
  if (f.state === 'intro' && f.id === 'sanji' && opponentId === 'nami') return 'hearts';
  if (f.state === 'attack' && f.move && (f.move.id === 'special' || f.move.id === 'forwardSpecial' || f.move.id === 'super')) return 'fierce';
  return 'normal';
}

export function poseFor(f, look, opponentId) {
  const anims = look.anims ?? {};
  switch (f.state) {
    case 'intro':
      return anims.intro ? anims.intro(f.sf, opponentId) : SHARED.idle(f.sf);
    case 'walk':
      return (anims.walk ?? SHARED.walk)(f.sf, f.walkDir * f.facing);
    case 'air':
      if (f.move) return look.moves.jumpAttack(f.move.t);
      return (anims.air ?? SHARED.air)(f.vy);
    case 'attack':
      return look.moves[f.move.id](f.move.t);
    case 'guard':
    case 'guardstun':
      return (anims.guard ?? SHARED.guard)(f.sf);
    case 'hitstun':
      return SHARED.hit(f.sf);
    case 'knockdown':
    case 'ko':
      return SHARED.knockdown(f.sf);
    case 'getup':
      return SHARED.getup(f.sf, GETUP_FRAMES);
    case 'victory':
      return anims.victory(f.sf, opponentId);
    default:
      return (anims.idle ?? SHARED.idle)(f.sf);
  }
}

export function drawFighter(ctx, f, opponentId) {
  const look = LOOKS[f.id];
  const p = poseFor(f, look, opponentId);
  const colors = colorsFor(look, f.palette);
  // shadow on the floor
  const shadow = Math.max(0.35, 1 - f.y / 250);
  ctx.save();
  ctx.globalAlpha = 0.25 * shadow;
  ellipse(ctx, f.x, GROUND_Y + 2, 34 * shadow, 7 * shadow, 0, '#000', false);
  ctx.restore();

  ctx.save();
  ctx.translate(f.x, GROUND_Y - f.y);
  ctx.scale(f.facing, 1);
  if (p.rot) {
    ctx.translate(0, -p.pivot);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.translate(0, p.pivot);
  }
  if (f.wobble > 0) {
    const w = Math.sin(f.wobble * 0.9) * (f.wobble / 40);
    ctx.scale(1 + w * 0.25, 1 - w * 0.2);
  }
  drawBody(ctx, p, look, colors, {
    mood: moodFor(f, opponentId), move: f.state === 'attack' || f.state === 'air' ? f.move?.id ?? null : null,
    t: f.move?.t ?? 0, f, opponentId,
  });
  ctx.restore();
}

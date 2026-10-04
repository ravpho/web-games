// Drawings for projectiles: each fighter's look can supply its own, keyed by move id.
import { GROUND_Y } from '../config.js';
import { projectileDef } from '../core/projectiles.js';
import { circle } from './rig.js';
import { LOOKS } from './looks/index.js';

export function drawProjectiles(ctx, state) {
  for (const p of state.projectiles) {
    const def = projectileDef(p);
    const draw = LOOKS[p.fighter]?.projectiles?.[p.moveId];
    ctx.save();
    if (draw) {
      ctx.translate(p.x, GROUND_Y - p.y);
      ctx.scale(p.facing, 1);
      draw(ctx, p, def, state);
    } else {
      circle(ctx, p.x, GROUND_Y - p.y - def.box.h / 2, def.box.h / 2, '#ffe066');
    }
    ctx.restore();
  }
}

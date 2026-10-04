// Projectiles: "travel" ones fly across the stage; "strike" ones mark a spot and hit it after a delay.
import { SCREEN_W } from '../config.js';
import { getFighter } from './registry.js';

const OFFSTAGE_MARGIN = 60;

export function spawnProjectiles(state) {
  for (const f of state.fighters) {
    if (!f.move || f.move.spawned) continue;
    const move = getFighter(f.id).moves[f.move.id];
    const p = move.projectile;
    if (!p || f.move.t !== p.at) continue;
    f.move.spawned = true;
    const opponent = state.fighters[1 - f.side];
    state.projectiles.push({
      id: state.nextProjectileId++,
      owner: f.side,
      fighter: f.id,
      moveId: move.id,
      moveType: move.type,
      kind: p.kind,
      x: p.kind === 'strike' ? opponent.x : f.x + f.facing * p.offset.x,
      y: p.kind === 'strike' ? 0 : p.offset.y,
      vx: p.kind === 'travel' ? f.facing * p.speed : 0,
      facing: f.facing,
      t: 0,
      hit: false,
    });
    state.events.push({ type: 'projectile', side: f.side, moveId: move.id, kind: p.kind });
  }
}

export function projectileDef(p) {
  return getFighter(p.fighter).moves[p.moveId].projectile;
}

// A strike projectile only hits during its active window; travel projectiles are always live.
export function projectileIsLive(p) {
  const def = projectileDef(p);
  if (p.kind === 'strike') return p.t >= def.delay && p.t < def.delay + def.len;
  return true;
}

export function projectileBox(p) {
  const { w, h } = projectileDef(p).box;
  return { left: p.x - w / 2, right: p.x + w / 2, bottom: p.y, top: p.y + h };
}

export function moveProjectiles(state) {
  for (const p of state.projectiles) {
    p.x += p.vx;
    p.t++;
  }
  state.projectiles = state.projectiles.filter((p) => {
    if (p.hit && p.kind === 'travel') return false;
    if (p.kind === 'strike') {
      const def = projectileDef(p);
      return p.t < def.delay + def.len;
    }
    return p.x > -OFFSTAGE_MARGIN && p.x < SCREEN_W + OFFSTAGE_MARGIN;
  });
}

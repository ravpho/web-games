// Move frame data: defaults, timing helpers and starting moves.
//
// A move has startup, active and recovery frames. Each hit lists when it is live (`at`, `len`,
// defaulting to the move's active window) and a box relative to the fighter's feet:
// x forward from the center, y up from the floor, w forward, h up. Boxes are mirrored by facing.

export const MOVE_SLOTS = ['chain1', 'chain2', 'chain3', 'jumpAttack', 'special', 'forwardSpecial', 'super'];

export function normalizeMove(id, move) {
  const m = { id, motion: [], hits: [], ...move };
  m.total = m.startup + m.active + m.recovery;
  m.hits = m.hits.map((h) => ({
    at: m.startup,
    len: m.active,
    knockdown: false,
    lightning: false,
    ...h,
  }));
  if (m.projectile) {
    m.projectile = { kind: 'travel', at: m.startup, knockdown: false, lightning: false, ...m.projectile };
  }
  m.firstHitAt = m.hits.length ? Math.min(...m.hits.map((h) => h.at)) : m.startup;
  return m;
}

export function normalizeFighter(def) {
  const moves = {};
  for (const [id, move] of Object.entries(def.moves)) moves[id] = normalizeMove(id, move);
  return { rubber: false, ...def, moves };
}

export function startMove(fighter, def, moveId) {
  fighter.move = { id: moveId, t: 0, hitsDone: [], connected: false, queued: false, spawned: false };
  return def.moves[moveId];
}

export function isRecovering(move, t) {
  return t >= move.startup + move.active;
}

export function hitIsLive(hit, t) {
  return t >= hit.at && t < hit.at + hit.len;
}

// Forward velocity (in the fighter's facing direction) for frame t of a move.
export function motionAt(move, t) {
  for (const seg of move.motion) {
    if (t >= seg.from && t < seg.to) return seg.vx;
  }
  return 0;
}

export function passesThrough(move, t) {
  return Boolean(move.passThrough) && motionAt(move, t) !== 0;
}

// How far in front of the fighter's center a move can connect, including any forward travel.
// Projectile moves count as long range.
export function moveReach(move) {
  if (move.projectile) return Infinity;
  const travel = move.motion.reduce((sum, seg) => sum + Math.max(0, seg.vx) * (seg.to - seg.from), 0);
  const box = move.hits.length ? Math.max(...move.hits.map((h) => h.box.x + h.box.w)) : 0;
  return box + travel;
}

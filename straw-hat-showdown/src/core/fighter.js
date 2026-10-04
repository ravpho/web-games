// Fighter state machine: turning input into actions, movement and timers.
//
// States: intro, idle, walk, guard, guardstun, attack, air, hitstun, knockdown, getup, ko, victory.
import {
  START_X, MAX_HEALTH, METER_MAX, GRAVITY, JUMP_VY, FRICTION, KNOCKDOWN_FRAMES, GETUP_FRAMES,
} from '../config.js';
import { getFighter } from './registry.js';
import { takePress } from './input-buffer.js';
import { startMove, isRecovering, motionAt } from './moves.js';

const FREE_STATES = new Set(['idle', 'walk', 'guard', 'air']);

export function createFighter(id, side, palette = 0) {
  return {
    id,
    side,
    palette,
    x: START_X[side],
    prevX: START_X[side],
    y: 0,
    vx: 0,
    vy: 0,
    slide: 0,
    facing: side === 0 ? 1 : -1,
    health: MAX_HEALTH,
    meter: 0,
    state: 'intro',
    sf: 0, // frames spent in the current state
    downFrames: 0,
    move: null,
    stun: 0,
    walkDir: 0,
    airAttackUsed: false,
    comboHits: 0, // hits taken in the current combo
    buffer: [],
    wobble: 0, // rubber "boing" frames left (cosmetic)
  };
}

export function resetFighterForRound(f) {
  Object.assign(f, {
    x: START_X[f.side],
    prevX: START_X[f.side],
    y: 0,
    vx: 0,
    vy: 0,
    slide: 0,
    facing: f.side === 0 ? 1 : -1,
    health: MAX_HEALTH,
    state: 'intro',
    sf: 0,
    downFrames: 0,
    move: null,
    stun: 0,
    walkDir: 0,
    airAttackUsed: false,
    comboHits: 0,
    buffer: [],
    wobble: 0,
  });
}

export function setState(f, state) {
  if (f.state === state) return;
  f.state = state;
  f.sf = 0;
  if (state !== 'attack' && state !== 'air') f.move = null;
  if (FREE_STATES.has(state)) f.comboHits = 0;
  if (state !== 'walk') f.walkDir = 0;
}

export function isGrounded(f) {
  return f.y <= 0 && f.vy <= 0;
}

export function moveDefOf(f) {
  return f.move ? getFighter(f.id).moves[f.move.id] : null;
}

export function hasLiveProjectile(state, side) {
  return state.projectiles.some((p) => p.owner === side);
}

function emitMoveStart(state, f, move) {
  state.events.push({
    type: 'moveStart', side: f.side, fighter: f.id, moveId: move.id, moveType: move.type,
    name: move.name || null, sfx: move.sfx || null,
  });
}

function beginMove(state, f, moveId) {
  const move = startMove(f, getFighter(f.id), moveId);
  if (f.state !== 'air') {
    f.state = 'attack';
    f.sf = 0;
    f.walkDir = 0;
  }
  emitMoveStart(state, f, move);
  return move;
}

function trySuper(state, f, now) {
  const press = takePress(f, now, ['super']);
  if (!press || f.meter < METER_MAX) return false; // a press without a full meter does nothing
  f.meter = 0;
  const move = beginMove(state, f, 'super');
  state.freeze = Math.max(state.freeze, state.superFreezeFrames);
  state.freezeKind = 'super';
  state.events.push({ type: 'superStart', side: f.side, fighter: f.id, name: move.name, subtitle: move.subtitle ?? null });
  return true;
}

function trySpecial(state, f, now) {
  const press = takePress(f, now, ['special']);
  if (!press) return false;
  const moveId = press.forward ? 'forwardSpecial' : 'special';
  const move = getFighter(f.id).moves[moveId];
  if (move.projectile && hasLiveProjectile(state, f.side)) return false; // one projectile at a time
  beginMove(state, f, moveId);
  return true;
}

function groundActions(state, f, input, now) {
  if (input.guard) {
    setState(f, 'guard');
    return;
  }
  if (trySuper(state, f, now)) return;
  if (trySpecial(state, f, now)) return;
  if (takePress(f, now, ['attack'])) {
    beginMove(state, f, 'chain1');
    return;
  }
  if (input.up) {
    setState(f, 'air');
    f.vy = JUMP_VY;
    f.vx = input.x * getFighter(f.id).jumpVx;
    f.airAttackUsed = false;
    state.events.push({ type: 'jump', side: f.side });
    return;
  }
  if (input.x !== 0) {
    setState(f, 'walk');
    f.walkDir = input.x;
  } else {
    setState(f, 'idle');
  }
}

function attackControl(state, f, now) {
  const def = getFighter(f.id);
  const move = def.moves[f.move.id];
  if (move.type !== 'chain') return;
  if (f.move.connected) {
    // A connected chain hit can be cancelled straight into a special or super.
    if (trySuper(state, f, now)) return;
    if (trySpecial(state, f, now)) return;
  }
  // A press is only used once the next hit is not yet queued; otherwise it waits in the buffer.
  if (move.next && !f.move.queued && takePress(f, now, ['attack'])) {
    if (isRecovering(move, f.move.t)) beginMove(state, f, move.next);
    else f.move.queued = true;
  }
}

// Reads this step's input and starts actions for one fighter. Presses are already buffered.
export function control(state, f, input) {
  const now = state.sim;
  switch (f.state) {
    case 'idle':
    case 'walk':
      groundActions(state, f, input, now);
      break;
    case 'guard':
      if (!input.guard) {
        setState(f, 'idle');
        groundActions(state, f, input, now);
      }
      break;
    case 'attack':
      attackControl(state, f, now);
      break;
    case 'air':
      if (!f.move && !f.airAttackUsed && takePress(f, now, ['attack'])) {
        f.airAttackUsed = true;
        beginMove(state, f, 'jumpAttack');
      }
      break;
    default:
      break; // stunned, knocked down, intro, victory: no control
  }
}

function land(state, f) {
  f.y = 0;
  f.vy = 0;
  f.vx = 0;
  state.events.push({ type: 'land', side: f.side });
}

// Moves one fighter for this step.
export function physics(state, f) {
  f.prevX = f.x;
  const def = getFighter(f.id);
  if (f.state === 'walk') f.x += f.walkDir * def.walkSpeed;
  if (f.state === 'attack' && f.move) f.x += motionAt(def.moves[f.move.id], f.move.t) * f.facing;
  if (!isGrounded(f) || f.vy > 0) {
    f.x += f.vx;
    f.y += f.vy;
    f.vy -= GRAVITY;
    if (f.y <= 0) {
      land(state, f);
      if (f.state === 'air') setState(f, 'idle');
    }
  }
  if (f.slide !== 0) {
    f.x += f.slide;
    f.slide *= FRICTION;
    if (Math.abs(f.slide) < 0.1) f.slide = 0;
  }
  if (f.wobble > 0) f.wobble--;
}

// Advances move frames and state timers after hits have been resolved for this step.
export function advance(state, f) {
  f.sf++;
  switch (f.state) {
    case 'attack': {
      const move = getFighter(f.id).moves[f.move.id];
      f.move.t++;
      if (move.next && f.move.queued && f.move.t === move.startup + move.active) {
        beginMove(state, f, move.next);
      } else if (f.move.t >= move.total) {
        setState(f, 'idle');
      }
      break;
    }
    case 'air':
      if (f.move) f.move.t++;
      break;
    case 'hitstun':
      f.stun--;
      if (f.stun <= 0 && isGrounded(f)) setState(f, 'idle');
      break;
    case 'guardstun':
      f.stun--;
      if (f.stun <= 0) setState(f, 'guard');
      break;
    case 'knockdown':
      if (isGrounded(f)) {
        f.downFrames++;
        if (f.downFrames >= KNOCKDOWN_FRAMES) setState(f, 'getup');
      }
      break;
    case 'getup':
      if (f.sf >= GETUP_FRAMES) setState(f, 'idle');
      break;
    default:
      break;
  }
}

export function canBeHit(f) {
  if (f.state === 'knockdown' || f.state === 'getup' || f.state === 'ko') return false;
  if (f.state === 'intro' || f.state === 'victory') return false;
  const move = moveDefOf(f);
  return !(move && move.invulnerable);
}

export function isGuarding(f) {
  return (f.state === 'guard' || f.state === 'guardstun') && isGrounded(f);
}

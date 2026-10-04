// A match: rounds, timer, hits and the order of everything that happens in one step.
//
// step(state, inputs) advances the match by one 1/60 s frame. It changes `state` in place
// (a plain data object) and returns it; `state.events` lists what happened during that step.
import {
  ROUND_FRAMES, INTRO_FRAMES, FIGHT_CALL_FRAME, ROUND_END_FRAMES, MATCH_END_FRAMES, ROUNDS_TO_WIN,
  METER_MAX, METER_GAIN_DEALT, METER_GAIN_TAKEN, CHIP_RATIO, GUARDSTUN_RATIO, GUARD_PUSH_RATIO,
  HITSTOP_LIGHT, HITSTOP_HEAVY, HEAVY_DAMAGE, KNOCKDOWN_LAUNCH_VY, LIGHTNING_VS_RUBBER,
  SUPER_FREEZE_FRAMES, STAGE_LEFT, STAGE_RIGHT, PUSH_HALF_WIDTH,
} from '../config.js';
import { createRng } from './rng.js';
import { getFighter } from './registry.js';
import { NEUTRAL_INPUT, recordPresses, clearBuffer } from './input-buffer.js';
import {
  createFighter, resetFighterForRound, setState, control, physics, advance, canBeHit, isGuarding,
  moveDefOf, isGrounded,
} from './fighter.js';
import { worldBox, bodyBox, overlaps, contactPoint, separate, atWall, clampToStage } from './collision.js';
import { hitIsLive, passesThrough } from './moves.js';
import {
  spawnProjectiles, moveProjectiles, projectileIsLive, projectileBox, projectileDef,
} from './projectiles.js';

export function createMatch({ p1, p2, difficulty = 'normal', seed = 1 }) {
  const state = {
    p1,
    p2,
    difficulty,
    seed,
    rng: createRng(seed),
    frame: 0, // every step
    sim: 0, // steps in which the fight moved (not frozen)
    phase: 'intro',
    phaseFrame: 0,
    round: 1,
    wins: [0, 0],
    timer: ROUND_FRAMES,
    freeze: 0,
    freezeKind: null,
    superFreezeFrames: SUPER_FREEZE_FRAMES,
    fighters: [createFighter(p1, 0, 0), createFighter(p2, 1, p1 === p2 ? 1 : 0)],
    projectiles: [],
    nextProjectileId: 1,
    roundResult: null,
    winner: null,
    events: [],
  };
  return state;
}

export function isFinalRound(state) {
  return state.wins[0] === ROUNDS_TO_WIN - 1 && state.wins[1] === ROUNDS_TO_WIN - 1;
}

// Seconds shown on the round timer.
export function timerSeconds(state) {
  return Math.ceil(state.timer / 60);
}

function emit(state, type, data = {}) {
  state.events.push({ type, ...data });
}

function startRound(state) {
  state.phase = 'intro';
  state.phaseFrame = 0;
  state.timer = ROUND_FRAMES;
  state.freeze = 0;
  state.freezeKind = null;
  state.projectiles = [];
  state.roundResult = null;
  for (const f of state.fighters) resetFighterForRound(f);
}

function towardOpponent(state, f) {
  const o = state.fighters[1 - f.side];
  return Math.sign(o.x - f.x) || f.facing;
}

function capMeter(f) {
  f.meter = Math.min(METER_MAX, f.meter);
}

function updateFacing(state) {
  for (const f of state.fighters) {
    if (f.state === 'idle' || f.state === 'walk' || f.state === 'guard') {
      f.facing = towardOpponent(state, f);
    }
  }
}

function applyHit(state, attacker, defender, hit, moveType, source) {
  if (source.crossUp) {
    // Oni Giri: the attacker finishes on the defender's far side.
    const gap = PUSH_HALF_WIDTH * 2 + 10;
    let target = defender.x + attacker.facing * gap;
    if (target < STAGE_LEFT || target > STAGE_RIGHT) {
      target = attacker.facing === 1 ? STAGE_RIGHT : STAGE_LEFT;
      defender.x = target - attacker.facing * gap;
    }
    attacker.x = target;
  }
  const dir = source.dir ?? (Math.sign(defender.x - attacker.x) || attacker.facing);
  const point = source.point;
  let damage = hit.damage;
  if (hit.lightning && getFighter(defender.id).rubber) {
    damage = Math.round(damage * LIGHTNING_VS_RUBBER);
    defender.wobble = 40;
    emit(state, 'rubber', { side: defender.side, x: defender.x, y: defender.y });
  }

  if (isGuarding(defender)) {
    let chip = 0;
    if (moveType === 'special' || moveType === 'super') {
      chip = Math.max(0, Math.min(Math.round(damage * CHIP_RATIO), defender.health - 1));
    }
    defender.health -= chip;
    attacker.meter += chip * METER_GAIN_DEALT;
    defender.meter += chip * METER_GAIN_TAKEN;
    capMeter(attacker);
    capMeter(defender);
    setState(defender, 'guardstun');
    defender.stun = Math.round(hit.hitstun * GUARDSTUN_RATIO);
    defender.slide = dir * hit.push * GUARD_PUSH_RATIO;
    emit(state, 'guard', { attacker: attacker.side, defender: defender.side, x: point.x, y: point.y, chip });
    return HITSTOP_LIGHT;
  }

  defender.health = Math.max(0, defender.health - damage);
  attacker.meter += damage * METER_GAIN_DEALT;
  defender.meter += damage * METER_GAIN_TAKEN;
  capMeter(attacker);
  capMeter(defender);
  defender.comboHits++;
  const heavy = hit.knockdown || damage >= HEAVY_DAMAGE;
  emit(state, 'hit', {
    attacker: attacker.side, defender: defender.side, x: point.x, y: point.y, damage, heavy,
    knockdown: hit.knockdown, combo: defender.comboHits, moveId: source.moveId, lightning: hit.lightning,
  });

  if (defender.health === 0) {
    setState(defender, 'ko');
    defender.vy = KNOCKDOWN_LAUNCH_VY + 2;
    defender.vx = dir * 4;
    defender.slide = 0;
  } else if (hit.knockdown) {
    setState(defender, 'knockdown');
    defender.downFrames = 0;
    defender.vy = KNOCKDOWN_LAUNCH_VY;
    defender.vx = dir * Math.max(3, hit.push * 0.6);
    defender.slide = 0;
    emit(state, 'knockdown', { side: defender.side });
  } else {
    setState(defender, 'hitstun');
    defender.stun = hit.hitstun;
    if (!isGrounded(defender)) {
      defender.vx = dir * 2;
      defender.vy = Math.max(defender.vy, 3);
    } else {
      defender.slide = dir * hit.push;
    }
  }
  // Against a wall, the attacker is pushed back instead.
  if (!source.projectile && atWall(defender) && Math.sign(dir) === Math.sign(defender.x - attacker.x)) {
    attacker.slide = -dir * hit.push * 0.5;
  }
  return heavy ? HITSTOP_HEAVY : HITSTOP_LIGHT;
}

function resolveHits(state) {
  const pending = [];
  for (const attacker of state.fighters) {
    const move = moveDefOf(attacker);
    if (!move) continue;
    const defender = state.fighters[1 - attacker.side];
    if (!canBeHit(defender)) continue;
    const body = bodyBox(defender);
    for (let k = 0; k < move.hits.length; k++) {
      const hit = move.hits[k];
      if (attacker.move.hitsDone.includes(k) || !hitIsLive(hit, attacker.move.t)) continue;
      const box = worldBox(attacker, hit.box);
      if (!overlaps(box, body)) continue;
      const live = attacker.move; // kept: a trade may interrupt the attacker before done() runs
      pending.push({
        attacker, defender, hit, moveType: move.type,
        source: { moveId: move.id, crossUp: move.crossUp, point: contactPoint(box, body) },
        done: () => {
          live.hitsDone.push(k);
          live.connected = true;
        },
      });
      break; // at most one hit of a move lands per step
    }
  }

  // Projectiles of opposite owners cancel each other.
  const travel = state.projectiles.filter((p) => p.kind === 'travel' && !p.hit);
  for (const a of travel) {
    for (const b of travel) {
      if (a.owner === 0 && b.owner === 1 && !a.hit && !b.hit && overlaps(projectileBox(a), projectileBox(b))) {
        a.hit = true;
        b.hit = true;
        emit(state, 'clash', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      }
    }
  }

  for (const p of state.projectiles) {
    if (p.hit || !projectileIsLive(p)) continue;
    const defender = state.fighters[1 - p.owner];
    if (!canBeHit(defender)) continue;
    const box = projectileBox(p);
    const body = bodyBox(defender);
    if (!overlaps(box, body)) continue;
    pending.push({
      attacker: state.fighters[p.owner], defender, hit: projectileDef(p), moveType: p.moveType,
      source: { moveId: p.moveId, projectile: true, dir: Math.sign(p.vx) || p.facing, point: contactPoint(box, body) },
      done: () => {
        p.hit = true;
      },
    });
  }

  let hitstop = 0;
  for (const h of pending) {
    // Both sides of a trade land; each still requires the defender to be hittable at the start.
    hitstop = Math.max(hitstop, applyHit(state, h.attacker, h.defender, h.hit, h.moveType, h.source));
    h.done();
  }
  if (hitstop > 0) {
    state.freeze = Math.max(state.freeze, hitstop);
    state.freezeKind = state.freezeKind === 'super' ? 'super' : 'hit';
  }
}

function endRound(state, winner, reason) {
  state.roundResult = { winner, reason };
  if (winner !== null) state.wins[winner]++;
  state.phase = 'roundEnd';
  state.phaseFrame = 0;
  state.projectiles = [];
  emit(state, reason === 'ko' ? 'ko' : reason === 'time' ? 'time' : 'draw', { winner });
  emit(state, 'roundEnd', { winner, reason });
}

function checkRoundEnd(state) {
  const [a, b] = state.fighters;
  if (a.health <= 0 || b.health <= 0) {
    if (a.health <= 0 && b.health <= 0) endRound(state, null, 'draw');
    else endRound(state, a.health <= 0 ? 1 : 0, 'ko');
  } else if (state.timer <= 0) {
    if (a.health === b.health) endRound(state, null, 'draw');
    else endRound(state, a.health > b.health ? 0 : 1, 'time');
  }
}

// Movement, timers and spacing shared by the fight and the end-of-round wind-down.
function simulate(state, withHits) {
  state.sim++;
  const [a, b] = state.fighters;
  for (const f of state.fighters) physics(state, f);
  spawnProjectiles(state);
  moveProjectiles(state);
  const through = [a, b].some((f) => f.state === 'attack' && f.move && passesThrough(moveDefOf(f), f.move.t));
  separate(a, b, through);
  updateFacing(state);
  if (withHits) resolveHits(state);
  for (const f of state.fighters) advance(state, f);
}

function fightStep(state, inputs) {
  for (const f of state.fighters) {
    recordPresses(f, inputs[f.side], state.sim, towardOpponent(state, f));
  }
  if (state.freeze > 0) {
    state.freeze--;
    if (state.freeze === 0) state.freezeKind = null;
    return;
  }
  for (const f of state.fighters) control(state, f, inputs[f.side]);
  if (state.freeze > 0) return; // a super just started: freeze before it plays out
  simulate(state, true);
  state.timer--;
  checkRoundEnd(state);
}

const NEUTRAL = [NEUTRAL_INPUT, NEUTRAL_INPUT];

export function step(state, inputs = NEUTRAL) {
  state.events = [];
  state.frame++;
  switch (state.phase) {
    case 'intro':
      if (state.phaseFrame === 0) emit(state, 'roundStart', { round: state.round, final: isFinalRound(state) });
      if (state.phaseFrame === FIGHT_CALL_FRAME) emit(state, 'fight');
      state.phaseFrame++;
      for (const f of state.fighters) f.sf++;
      if (state.phaseFrame >= INTRO_FRAMES) {
        state.phase = 'fight';
        state.phaseFrame = 0;
        for (const f of state.fighters) {
          setState(f, 'idle');
          clearBuffer(f);
        }
      }
      break;
    case 'fight':
      fightStep(state, inputs);
      break;
    case 'roundEnd':
      if (state.freeze > 0) {
        state.freeze--;
        break;
      }
      for (const f of state.fighters) {
        if (f.state === 'walk' || f.state === 'guard') setState(f, 'idle');
      }
      simulate(state, false);
      state.phaseFrame++;
      if (state.phaseFrame >= ROUND_END_FRAMES) {
        const winner = state.wins.findIndex((w) => w >= ROUNDS_TO_WIN);
        if (winner >= 0) {
          state.phase = 'matchEnd';
          state.phaseFrame = 0;
          state.winner = winner;
          const champ = state.fighters[winner];
          clampToStage(champ);
          setState(champ, 'victory');
          const loser = state.fighters[1 - winner];
          if (loser.state !== 'ko') setState(loser, 'idle');
          emit(state, 'matchEnd', { winner });
        } else {
          if (state.roundResult.winner !== null) state.round++;
          startRound(state);
        }
      }
      break;
    case 'matchEnd':
      state.phaseFrame++;
      for (const f of state.fighters) f.sf++;
      if (state.phaseFrame >= MATCH_END_FRAMES) state.phase = 'done';
      break;
    default:
      break;
  }
  return state;
}

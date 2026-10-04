// The computer opponent. It plays through the same InputState the touch controls produce, so it
// follows exactly the same rules as the player.
//
// It perceives the match with a delay (its reaction time), decides every few frames using its
// fighter's style and the difficulty level, and keeps its own seeded random numbers.
import { METER_MAX, BODY_HALF_WIDTH } from '../config.js';
import { getFighter } from './registry.js';
import { createRng, random, chance, randInt } from './rng.js';
import { NEUTRAL_INPUT } from './input-buffer.js';
import { moveReach } from './moves.js';

export const LEVELS = {
  easy: {
    reaction: 30, guard: 0.15, chain: 0.3, punish: 0.2, superDelay: [180, 300], thinkEvery: 12,
    aggression: 0.45, specialRate: 0.2, guardHold: 16,
  },
  normal: {
    reaction: 18, guard: 0.4, chain: 0.65, punish: 0.5, superDelay: [90, 180], thinkEvery: 8,
    aggression: 0.7, specialRate: 0.35, guardHold: 18,
  },
  hard: {
    reaction: 11, guard: 0.65, chain: 0.9, punish: 0.85, superDelay: [18, 60], thinkEvery: 5,
    aggression: 0.85, specialRate: 0.45, guardHold: 20,
  },
};

const ATTACKING = new Set(['attack']);

function snapshot(state, side) {
  const me = state.fighters[side];
  const opp = state.fighters[1 - side];
  const oppMove = opp.move ? getFighter(opp.id).moves[opp.move.id] : null;
  return {
    phase: state.phase,
    frozen: state.freeze > 0,
    opp: {
      x: opp.x, y: opp.y, state: opp.state, moveId: opp.move?.id ?? null, moveT: opp.move?.t ?? 0,
      startedAt: opp.move ? state.sim - opp.move.t : -1,
      startup: oppMove?.startup ?? 0, activeEnd: oppMove ? oppMove.startup + oppMove.active : 0,
      total: oppMove?.total ?? 0,
    },
    threats: state.projectiles
      .filter((p) => p.owner !== side)
      .map((p) => ({ id: p.id, x: p.x, vx: p.vx, kind: p.kind })),
    meX: me.x,
  };
}

function reachesOf(def) {
  const m = def.moves;
  return {
    chain: moveReach(m.chain1),
    special: moveReach(m.special),
    forwardSpecial: moveReach(m.forwardSpecial),
    super: def.moves.super.range ?? moveReach(m.super),
    melee: Math.max(moveReach(m.chain3), m.special.projectile ? 0 : moveReach(m.special), moveReach(m.forwardSpecial)),
  };
}

export function createCpu({ side = 1, difficulty = 'normal', seed = 7 } = {}) {
  return {
    side,
    difficulty,
    level: LEVELS[difficulty],
    rng: createRng(seed),
    history: [],
    plan: null, // { input, left }
    guardLeft: 0,
    superAt: null,
    nextThink: 0,
    seenAttacks: new Set(),
    chainDecisions: new Map(),
    think(state) {
      return think(this, state);
    },
  };
}

function press(input, extra) {
  return { ...NEUTRAL_INPUT, ...input, ...extra };
}

function think(cpu, state) {
  const lv = cpu.level;
  const me = state.fighters[cpu.side];
  const def = getFighter(me.id);
  const style = def.style;
  cpu.history.push(snapshot(state, cpu.side));
  if (cpu.history.length > lv.reaction + 1) cpu.history.shift();
  const seen = cpu.history[0];

  if (state.phase !== 'fight') {
    cpu.plan = null;
    cpu.guardLeft = 0;
    cpu.superAt = null;
    return NEUTRAL_INPUT;
  }
  if (state.freeze > 0) return NEUTRAL_INPUT;

  const now = state.sim;
  const toward = Math.sign(seen.opp.x - me.x) || me.facing;
  const dist = Math.abs(seen.opp.x - me.x);
  const gap = dist - BODY_HALF_WIDTH; // distance from my center to the opponent's body edge
  const reach = reachesOf(def);
  const oppDef = getFighter(state.fighters[1 - cpu.side].id);
  const oppThreat = reachesOf(oppDef).melee + BODY_HALF_WIDTH + 20;
  const canAct = me.state === 'idle' || me.state === 'walk' || me.state === 'guard';

  // 1. Keep guarding while a guard decision lasts.
  if (cpu.guardLeft > 0) {
    cpu.guardLeft--;
    return press({ guard: true });
  }

  // 2. Continue or cancel an attack chain (it knows its own state immediately).
  if (me.state === 'attack' && me.move) {
    const move = def.moves[me.move.id];
    const key = `${now - me.move.t}:${me.move.id}`;
    if (move.type === 'chain' && !cpu.chainDecisions.has(key)) {
      cpu.chainDecisions.set(key, chance(cpu.rng, lv.chain));
      if (cpu.chainDecisions.size > 32) cpu.chainDecisions.delete(cpu.chainDecisions.keys().next().value);
    }
    if (move.type === 'chain' && cpu.chainDecisions.get(key)) {
      if (me.move.connected && me.move.id === 'chain2' && chance(cpu.rng, lv.specialRate * 0.5)) {
        return press({ special: true, x: chance(cpu.rng, 0.5) ? toward : 0 });
      }
      if (me.move.t >= 2) return press({ attack: true });
    }
    return NEUTRAL_INPUT;
  }
  if (!canAct) return NEUTRAL_INPUT;

  // 3. Super: once the meter is full, wait a moment (shorter on harder levels), then use it in range.
  if (me.meter >= METER_MAX) {
    if (cpu.superAt === null) cpu.superAt = now + randInt(cpu.rng, ...lv.superDelay);
    if (now >= cpu.superAt && gap <= reach.super) {
      cpu.superAt = null;
      return press({ super: true });
    }
  } else {
    cpu.superAt = null;
  }

  // 4. React to what it saw: guard against attacks and projectiles, punish long recovery.
  const oppAttacking = ATTACKING.has(seen.opp.state) || (seen.opp.state === 'air' && seen.opp.moveId);
  const attackKey = `${seen.opp.startedAt}:${seen.opp.moveId}`;
  if (oppAttacking) {
    // One guard decision while the attack is still coming, one punish decision once it recovers.
    const stillComing = seen.opp.moveT < seen.opp.activeEnd;
    const recovering = !stillComing && seen.opp.total - seen.opp.moveT > 10;
    const key = `${attackKey}:${stillComing ? 'g' : recovering ? 'p' : '-'}`;
    if (!cpu.seenAttacks.has(key) && (stillComing || recovering)) {
      cpu.seenAttacks.add(key);
      if (cpu.seenAttacks.size > 32) cpu.seenAttacks.delete(cpu.seenAttacks.values().next().value);
      if (stillComing && dist <= oppThreat && chance(cpu.rng, lv.guard)) {
        cpu.guardLeft = lv.guardHold;
        return press({ guard: true });
      }
      if (recovering && chance(cpu.rng, lv.punish)) {
        if (gap <= reach.chain + 6) return press({ attack: true });
        if (gap <= reach.forwardSpecial) return press({ special: true, x: toward });
        cpu.plan = { input: { x: toward }, left: 10 };
      }
    }
  }
  const incoming = seen.threats.find((p) => (p.kind === 'strike' ? Math.abs(p.x - me.x) < 70
    : Math.sign(me.x - p.x) === Math.sign(p.vx) && Math.abs(me.x - p.x) < 220));
  if (incoming && !cpu.seenAttacks.has(`p:${incoming.id}`)) {
    cpu.seenAttacks.add(`p:${incoming.id}`);
    if (chance(cpu.rng, lv.guard)) {
      cpu.guardLeft = lv.guardHold;
      return press({ guard: true });
    }
    if (incoming.kind === 'strike' && chance(cpu.rng, lv.guard)) cpu.plan = { input: { x: -toward }, left: 14 };
  }

  // 5. Follow the current plan for a few frames.
  if (cpu.plan && cpu.plan.left > 0) {
    cpu.plan.left--;
    return press(cpu.plan.input);
  }

  // 6. Make a new plan every few frames, in the fighter's style.
  if (now < cpu.nextThink) return NEUTRAL_INPUT;
  cpu.nextThink = now + lv.thinkEvery;
  const r = random(cpu.rng);
  const inMelee = gap <= reach.chain + 4;

  // Opponent close and dangerous: sometimes raise guard in advance.
  if (dist <= oppThreat && seen.opp.state !== 'hitstun' && seen.opp.state !== 'knockdown' && chance(cpu.rng, lv.guard * 0.5)) {
    cpu.guardLeft = lv.guardHold;
    return press({ guard: true });
  }

  if (style.keepAway) {
    if (dist < style.idealDistance - 50) {
      if (inMelee && r < lv.aggression * 0.5) return press({ attack: true });
      if (r < 0.15) return press({ up: true, x: -toward });
      cpu.plan = { input: { x: -toward }, left: randInt(cpu.rng, 6, 14) };
      return press(cpu.plan.input);
    }
    if (r < lv.specialRate + 0.25) return press({ special: true, x: chance(cpu.rng, 0.35) ? toward : 0 });
    cpu.plan = { input: { x: dist > style.idealDistance + 80 ? toward : 0 }, left: randInt(cpu.rng, 6, 12) };
    return press(cpu.plan.input);
  }

  if (inMelee) {
    if (r < lv.aggression) return press({ attack: true });
    if (r < lv.aggression + lv.specialRate * 0.3) return press({ special: true, x: toward });
    cpu.plan = { input: { x: chance(cpu.rng, 0.5) ? -toward : 0 }, left: randInt(cpu.rng, 4, 10) };
    return press(cpu.plan.input);
  }
  if (gap <= reach.forwardSpecial && r < lv.specialRate * 0.6) return press({ special: true, x: toward });
  if (gap <= reach.special && reach.special < Infinity && r < lv.specialRate) return press({ special: true });
  if (reach.special === Infinity && dist > 220 && r < lv.specialRate * 0.7) return press({ special: true });
  if (dist > 150 && dist < 260 && r < style.jumpIn) return press({ up: true, x: toward });
  if (r < lv.aggression + 0.1) {
    cpu.plan = { input: { x: toward }, left: randInt(cpu.rng, 6, 16) };
    return press(cpu.plan.input);
  }
  cpu.plan = { input: { x: chance(cpu.rng, 0.4) ? -toward : 0 }, left: randInt(cpu.rng, 6, 14) };
  return press(cpu.plan.input);
}

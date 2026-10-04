import test from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER } from '../src/fighters/index.js';
import { getFighter } from '../src/core/registry.js';
import { createMatch, step } from '../src/core/match.js';
import { createCpu } from '../src/core/cpu.js';
import { NEUTRAL_INPUT } from '../src/core/input-buffer.js';
import { soundsForEvent, SOUND_NAMES, SILENT_EVENTS } from '../src/audio/sfx.js';

// Every event type the core emits, collected by playing computer-vs-computer matches.
function coreEventTypes() {
  const types = new Set();
  for (const p1 of ROSTER) {
    for (const p2 of ROSTER) {
      const state = createMatch({ p1, p2, seed: 11 });
      const a = createCpu({ side: 0, difficulty: 'hard', seed: 1 });
      const b = createCpu({ side: 1, difficulty: 'hard', seed: 2 });
      for (let i = 0; i < 6000 && state.phase !== 'done'; i++) {
        step(state, [a.think(state), b.think(state)]);
        for (const e of state.events) types.add(e.type);
      }
    }
  }
  // A scripted fighter that jumps and attacks, so movement events are always covered.
  const scripted = createMatch({ p1: 'luffy', p2: 'nami', seed: 3 });
  for (let i = 0; i < 400; i++) {
    step(scripted, [{ x: 0, up: i % 50 === 0, guard: false, attack: i % 7 === 0, special: false, super: false }, NEUTRAL_INPUT]);
    for (const e of scripted.events) types.add(e.type);
  }
  // Rounds that end on time or in a draw are rarer than knockouts; they are core events too.
  return [...new Set([...types, 'time', 'draw'])];
}

test('every core event type plays a defined sound or is deliberately silent', () => {
  const types = coreEventTypes();
  for (const t of ['moveStart', 'superStart', 'hit', 'guard', 'knockdown', 'ko', 'roundStart', 'fight', 'jump', 'land', 'projectile']) {
    assert.ok(types.includes(t), `saw ${t} among ${types.join()}`);
  }
  for (const type of types) {
    const sounds = soundsForEvent({ type, sfx: null, winner: 0 });
    if (SILENT_EVENTS.includes(type)) continue;
    assert.ok(sounds.length > 0, `${type} has a sound`);
    for (const s of sounds) assert.ok(SOUND_NAMES.includes(s), `${type} -> ${s} is defined`);
  }
});

test('every move sound named in the fighter data exists', () => {
  for (const id of ROSTER) {
    for (const move of Object.values(getFighter(id).moves)) {
      if (move.sfx) assert.ok(SOUND_NAMES.includes(move.sfx), `${id} ${move.id} ${move.sfx}`);
    }
  }
});

test('hits and guarded hits sound different; lightning has its own sound', () => {
  assert.notDeepEqual(soundsForEvent({ type: 'hit' }), soundsForEvent({ type: 'guard' }));
  assert.deepEqual(soundsForEvent({ type: 'hit', lightning: true }), ['lightning']);
  assert.deepEqual(soundsForEvent({ type: 'hit', heavy: true }), ['hitHeavy']);
});

test('there is no music', () => {
  assert.ok(!SOUND_NAMES.some((n) => /music|theme|bgm/i.test(n)));
});

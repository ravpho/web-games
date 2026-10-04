// Dev-only balance check: every pair of fighters plays computer vs computer on Normal over many
// seeds (each fighter on both sides of the screen). Reports each matchup's win rate and flags any
// outside 35-65% for retuning. Usage: node tools/balance.mjs [matchesPerSide]
import { ROSTER } from '../straw-hat-showdown/src/fighters/index.js';
import { createMatch, step } from '../straw-hat-showdown/src/core/match.js';
import { createCpu } from '../straw-hat-showdown/src/core/cpu.js';

const PER_SIDE = Number(process.argv[2] ?? 40);
const LIMIT = 60 * 60 * 6; // frames; a match that runs longer counts as a draw

function play(p1, p2, seed) {
  const state = createMatch({ p1, p2, seed });
  const a = createCpu({ side: 0, difficulty: 'normal', seed: seed * 2 + 1 });
  const b = createCpu({ side: 1, difficulty: 'normal', seed: seed * 2 + 2 });
  for (let i = 0; i < LIMIT && state.phase !== 'done'; i++) step(state, [a.think(state), b.think(state)]);
  return state.phase === 'done' ? state.winner : null;
}

let worst = 0;
const rows = [];
for (let i = 0; i < ROSTER.length; i++) {
  for (let j = i + 1; j < ROSTER.length; j++) {
    const [x, y] = [ROSTER[i], ROSTER[j]];
    let xWins = 0;
    let games = 0;
    for (let s = 1; s <= PER_SIDE; s++) {
      const w1 = play(x, y, s * 7919);
      const w2 = play(y, x, s * 104729);
      if (w1 !== null) { games++; if (w1 === 0) xWins++; }
      if (w2 !== null) { games++; if (w2 === 1) xWins++; }
    }
    const rate = xWins / games;
    worst = Math.max(worst, Math.abs(rate - 0.5));
    rows.push(`${x.padEnd(6)} vs ${y.padEnd(6)} ${(rate * 100).toFixed(0).padStart(3)}%  (${games} matches)${rate < 0.35 || rate > 0.65 ? '  <-- retune' : ''}`);
  }
}
console.log(rows.join('\n'));
console.log(worst <= 0.15 ? 'All matchups within 35-65%.' : 'Some matchups are outside 35-65%.');

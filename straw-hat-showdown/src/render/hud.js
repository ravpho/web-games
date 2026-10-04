// Fight information: names, health bars (player on the left), timer, round wins, super meters.
import { SCREEN_W, MAX_HEALTH, METER_MAX, ROUNDS_TO_WIN } from '../config.js';
import { timerSeconds } from '../core/match.js';
import { getFighter } from '../core/registry.js';
import { OUTLINE } from './rig.js';

const BAR_W = 360;
const BAR_H = 22;
const BAR_Y = 20;
const MARGIN = 36;
const METER_W = 220;

export function createHud() {
  return { trail: [MAX_HEALTH, MAX_HEALTH], lastRound: 0 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// x0: outer edge of the bar; dir: +1 grows to the right (player 1), -1 to the left (player 2).
function bar(ctx, x0, dir, health, trail) {
  const left = dir === 1 ? x0 : x0 - BAR_W;
  roundRect(ctx, left - 3, BAR_Y - 3, BAR_W + 6, BAR_H + 6, 8);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  ctx.fillStyle = '#4a1414';
  ctx.fillRect(left, BAR_Y, BAR_W, BAR_H);
  const wTrail = (BAR_W * trail) / MAX_HEALTH;
  const wHealth = (BAR_W * health) / MAX_HEALTH;
  ctx.fillStyle = '#ff5b4a';
  ctx.fillRect(dir === 1 ? x0 : x0 - wTrail, BAR_Y, wTrail, BAR_H);
  const g = ctx.createLinearGradient(0, BAR_Y, 0, BAR_Y + BAR_H);
  g.addColorStop(0, '#fff27a');
  g.addColorStop(1, '#f5b700');
  ctx.fillStyle = g;
  ctx.fillRect(dir === 1 ? x0 : x0 - wHealth, BAR_Y, wHealth, BAR_H);
}

function meter(ctx, x0, dir, value, frame) {
  const full = value >= METER_MAX;
  const y = BAR_Y + BAR_H + 34;
  const left = dir === 1 ? x0 : x0 - METER_W;
  roundRect(ctx, left - 2, y - 2, METER_W + 4, 14, 6);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  ctx.fillStyle = '#1d2a4a';
  ctx.fillRect(left, y, METER_W, 10);
  const w = (METER_W * value) / METER_MAX;
  if (full) {
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.25);
    ctx.fillStyle = `hsl(${(frame * 6) % 360}, 95%, ${55 + pulse * 15}%)`;
    ctx.shadowColor = '#fff27a';
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#3fb6ff';
  }
  ctx.fillRect(dir === 1 ? x0 : x0 - w, y, w, 10);
  if (full) {
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.textAlign = dir === 1 ? 'left' : 'right';
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUTLINE;
    const tx = dir === 1 ? x0 + METER_W + 8 : x0 - METER_W - 8;
    ctx.strokeText('SUPER!', tx, y + 10);
    ctx.fillStyle = '#fff27a';
    ctx.fillText('SUPER!', tx, y + 10);
  }
}

function label(ctx, text, x, y, align) {
  ctx.font = '900 18px system-ui, sans-serif';
  ctx.textAlign = align;
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
}

function roundMarkers(ctx, x0, dir, wins) {
  for (let i = 0; i < ROUNDS_TO_WIN; i++) {
    const x = x0 - dir * (12 + i * 24);
    ctx.beginPath();
    ctx.arc(x, BAR_Y + BAR_H + 16, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < wins ? '#ffc93c' : 'rgba(255,255,255,0.35)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function timer(ctx, state) {
  const x = SCREEN_W / 2;
  const y = BAR_Y + BAR_H / 2 + 4;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#fff8e7';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  const secs = timerSeconds(state);
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = secs <= 10 ? '#e8322b' : OUTLINE;
  ctx.fillText(String(Math.max(0, secs)), x, y + 2);
  ctx.textBaseline = 'alphabetic';
}

// Called once per simulation step so the red damage trail catches up at a steady speed.
export function hudStep(hud, state) {
  state.fighters.forEach((f, i) => {
    if (hud.trail[i] < f.health || f.state === 'intro') hud.trail[i] = f.health;
    else if (f.state !== 'hitstun' && f.state !== 'knockdown') hud.trail[i] = Math.max(f.health, hud.trail[i] - 6);
  });
}

export function drawHud(ctx, hud, state) {
  const [a, b] = state.fighters;
  bar(ctx, MARGIN, 1, a.health, hud.trail[0]);
  bar(ctx, SCREEN_W - MARGIN, -1, b.health, hud.trail[1]);
  label(ctx, getFighter(a.id).name.toUpperCase(), MARGIN, BAR_Y + BAR_H + 22, 'left');
  label(ctx, getFighter(b.id).name.toUpperCase(), SCREEN_W - MARGIN, BAR_Y + BAR_H + 22, 'right');
  roundMarkers(ctx, MARGIN + BAR_W, 1, state.wins[0]);
  roundMarkers(ctx, SCREEN_W - MARGIN - BAR_W, -1, state.wins[1]);
  meter(ctx, MARGIN, 1, a.meter, state.frame);
  meter(ctx, SCREEN_W - MARGIN, -1, b.meter, state.frame);
  timer(ctx, state);
}

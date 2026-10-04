// Visual effects driven by match events: sparks, screen shake, hit counters, move-name banners,
// pop-ups, the super flash and round announcements.
import { SCREEN_W, SCREEN_H, GROUND_Y, SUPER_FREEZE_FRAMES, FIGHT_CALL_FRAME } from '../config.js';
import { drawText } from './text.js';

export function createFx() {
  return { particles: [], rings: [], banners: [], popups: [], combo: [null, null], shake: 0, superFlash: null, seed: 1 };
}

function rand(fx) {
  fx.seed = (fx.seed * 16807) % 2147483647;
  return fx.seed / 2147483647;
}

function burst(fx, x, y, n, colors, speed, life) {
  for (let i = 0; i < n; i++) {
    const a = rand(fx) * Math.PI * 2;
    const v = speed * (0.4 + rand(fx) * 0.8);
    fx.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life, max: life,
      size: 3 + rand(fx) * 4, color: colors[i % colors.length] });
  }
}

// Called once per simulation step (also during freezes) with that step's events.
export function fxStep(fx, state) {
  for (const e of state.events) {
    const sy = GROUND_Y - (e.y ?? 0);
    switch (e.type) {
      case 'hit':
        burst(fx, e.x, sy, e.heavy ? 16 : 9, ['#fff27a', '#ffffff', '#ff9a1f'], e.heavy ? 7 : 5, 18);
        fx.rings.push({ x: e.x, y: sy, r: 6, grow: e.heavy ? 4 : 2.6, life: 12, max: 12, color: '#ffffff' });
        if (e.heavy || e.knockdown) fx.shake = Math.max(fx.shake, 9);
        if (e.combo >= 2) fx.combo[e.attacker] = { n: e.combo, life: 70 };
        break;
      case 'guard':
        burst(fx, e.x, sy, 6, ['#9fe0ff', '#ffffff'], 4, 14);
        fx.rings.push({ x: e.x, y: sy, r: 10, grow: 1.5, life: 12, max: 12, color: '#6fd3ff' });
        break;
      case 'knockdown':
        fx.shake = Math.max(fx.shake, 8);
        break;
      case 'clash':
        burst(fx, e.x, sy, 12, ['#ffffff', '#c8f0ff'], 6, 16);
        break;
      case 'rubber':
        fx.popups.push({ text: 'RUBBER!', x: e.x, y: GROUND_Y - e.y - 150, life: 60, max: 60, color: '#ffc93c' });
        break;
      case 'moveStart':
        if (e.name && e.moveType === 'special') fx.banners.push({ side: e.side, text: e.name, life: 55, max: 55 });
        break;
      case 'superStart':
        fx.superFlash = { side: e.side, fighter: e.fighter, name: e.name, subtitle: e.subtitle,
          life: SUPER_FREEZE_FRAMES, max: SUPER_FREEZE_FRAMES };
        break;
      case 'ko':
        fx.shake = Math.max(fx.shake, 12);
        break;
      default:
        break;
    }
  }
  for (const p of fx.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.life--;
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
  for (const r of fx.rings) {
    r.r += r.grow;
    r.life--;
  }
  fx.rings = fx.rings.filter((r) => r.life > 0);
  for (const list of [fx.banners, fx.popups]) for (const b of list) b.life--;
  fx.banners = fx.banners.filter((b) => b.life > 0);
  fx.popups = fx.popups.filter((b) => b.life > 0);
  for (let i = 0; i < 2; i++) {
    const c = fx.combo[i];
    if (c && --c.life <= 0) fx.combo[i] = null;
  }
  // The counter ends when the opponent gets free.
  state.fighters.forEach((f, i) => {
    if (f.comboHits === 0 && fx.combo[1 - i] && fx.combo[1 - i].life > 40) fx.combo[1 - i].life = 40;
  });
  if (fx.superFlash && --fx.superFlash.life <= 0) fx.superFlash = null;
  fx.shake = Math.max(0, fx.shake - 0.8);
}

export function shakeOffset(fx, frame) {
  if (fx.shake <= 0) return { x: 0, y: 0 };
  return { x: Math.sin(frame * 2.1) * fx.shake, y: Math.cos(frame * 2.7) * fx.shake * 0.6 };
}

// Darkens everything behind the fighters while a super starts.
export function drawSuperDim(ctx, fx) {
  if (!fx.superFlash) return;
  const t = fx.superFlash.life / fx.superFlash.max;
  ctx.fillStyle = `rgba(10, 10, 40, ${0.6 * Math.min(1, t * 3)})`;
  ctx.fillRect(-20, -20, SCREEN_W + 40, SCREEN_H + 40);
}

export function drawWorldFx(ctx, fx) {
  for (const r of fx.rings) {
    ctx.globalAlpha = r.life / r.max;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const p of fx.popups) {
    const rise = (1 - p.life / p.max) * 30;
    outlinedText(ctx, p.text, p.x, p.y - rise, 30, p.color, 'center');
  }
}

export function outlinedText(ctx, text, x, y, size, fill, align = 'center', weight = 900) {
  drawText(ctx, text, x, y, size, fill, align, { weight });
}

export function drawScreenFx(ctx, fx) {
  // move-name banners, on the user's side
  for (const b of fx.banners) {
    const t = 1 - b.life / b.max;
    const slide = Math.min(1, t * 6);
    const x = b.side === 0 ? -200 + slide * 236 : SCREEN_W + 200 - slide * 236;
    ctx.globalAlpha = Math.min(1, b.life / 12);
    outlinedText(ctx, b.text, x, 140, 30, '#ffffff', b.side === 0 ? 'left' : 'right');
    ctx.globalAlpha = 1;
  }
  // hit counters
  fx.combo.forEach((c, side) => {
    if (!c) return;
    ctx.globalAlpha = Math.min(1, c.life / 15);
    const x = side === 0 ? 40 : SCREEN_W - 40;
    outlinedText(ctx, `${c.n} HITS!`, x, 200, 34, '#ffc93c', side === 0 ? 'left' : 'right');
    ctx.globalAlpha = 1;
  });
  // super close-up
  if (fx.superFlash) {
    const s = fx.superFlash;
    const t = 1 - s.life / s.max;
    const slide = Math.min(1, t * 5);
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.life / 8);
    ctx.fillStyle = 'rgba(255, 201, 60, 0.95)';
    const y = 250;
    ctx.beginPath();
    ctx.moveTo(0, y - 40 + (1 - slide) * 40);
    ctx.lineTo(SCREEN_W, y - 60 + (1 - slide) * 40);
    ctx.lineTo(SCREEN_W, y + 30);
    ctx.lineTo(0, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1b1b1b';
    ctx.stroke();
    const x = s.side === 0 ? 60 + (1 - slide) * -300 : SCREEN_W - 60 + (1 - slide) * 300;
    if (s.subtitle) outlinedText(ctx, s.subtitle, x, y - 28, 22, '#ffc93c', s.side === 0 ? 'left' : 'right');
    outlinedText(ctx, s.name, x, y + 14, 40, '#ffffff', s.side === 0 ? 'left' : 'right');
    ctx.restore();
  }
}

// Big centered announcements, derived from the match state.
export function announcementFor(state, playerSide = 0) {
  if (state.phase === 'intro') {
    if (state.phaseFrame < FIGHT_CALL_FRAME) {
      const final = state.wins.every((w) => w === 1);
      return { text: final ? 'FINAL ROUND' : `ROUND ${state.round}`, t: state.phaseFrame };
    }
    return { text: 'FIGHT!', t: state.phaseFrame - FIGHT_CALL_FRAME };
  }
  if (state.phase === 'roundEnd' && state.roundResult) {
    const { reason } = state.roundResult;
    return { text: reason === 'ko' ? 'K.O.!' : reason === 'time' ? 'TIME!' : 'DRAW', t: state.phaseFrame };
  }
  if (state.phase === 'matchEnd' || state.phase === 'done') {
    return { text: state.winner === playerSide ? 'YOU WIN!' : 'YOU LOSE!', t: state.phaseFrame, sticky: true };
  }
  return null;
}

export function drawAnnouncement(ctx, state, playerSide = 0) {
  const a = announcementFor(state, playerSide);
  if (!a || state.phase === 'done') return; // the results screen takes over
  if (state.phase === 'roundEnd' && a.t > 100) return;
  const pop = Math.min(1, a.t / 8);
  const fill = a.text === 'FIGHT!' || a.text === 'YOU WIN!' ? '#ffc93c' : a.text === 'K.O.!' || a.text === 'YOU LOSE!' ? '#ff5b4a' : '#ffffff';
  drawText(ctx, a.text, SCREEN_W / 2, SCREEN_H / 2 - 10, 76, fill, 'center', { scale: 0.6 + 0.4 * pop });
}

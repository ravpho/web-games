// A play session: owns the current match, the fixed-step loop, effects and drawing.
//
// Two canvases: the stage on the background (repainted 15 times a second for the moving clouds
// and waves) and everything that moves on the foreground (repainted every frame).
import { METER_MAX } from './config.js';
import { createMatch, step } from './core/match.js';
import { NEUTRAL_INPUT } from './core/input-buffer.js';
import { createLoop, tick, resetClock } from './loop.js';
import { renderMatch } from './render/index.js';
import { drawStage, ANIMATED_BAND_COUNT } from './render/stage.js';
import { createFx, fxStep } from './render/fx.js';
import { createHud, hudStep } from './render/hud.js';
import { setTextScale } from './render/text.js';

const BACKGROUND_EVERY = 4; // animation frames between repaints of one moving background strip
const SLOW_FRAME_MS = 18.5; // average frame time that triggers a lower resolution
const SPEED_SAMPLE = 90; // frames per speed check

// opts: ctx and bgCtx (canvas 2D contexts), getLayout() -> { pixelScale, scale }, touch, sound,
// onEvents(events, state), onMatchDone(state), lowerResolution() -> true if it lowered it.
export function createGame(opts) {
  const { ctx, bgCtx, getLayout, touch } = opts;
  let session = null;
  let visualFrame = 0;
  let bgDirty = true;
  let bgAnimated = true;
  let lastShake = '';
  const speed = { last: null, sum: 0, n: 0 };

  function stepOnce() {
    if (!session) return;
    const { state } = session;
    const p1 = touch.sample();
    const p2 = session.cpu ? session.cpu.think(state) : NEUTRAL_INPUT;
    step(state, [p1, p2]);
    fxStep(session.fx, state);
    hudStep(session.hud, state);
    opts.sound?.playEvents(state.events, 0);
    opts.onEvents?.(state.events, state);
    if (state.phase === 'done' && !session.doneSent) {
      session.doneSent = true;
      opts.onMatchDone?.(state);
    }
  }

  const loop = createLoop(stepOnce);

  function draw() {
    const { pixelScale, scale } = getLayout();
    setTextScale(pixelScale);
    visualFrame++;
    if (bgDirty || (bgAnimated && visualFrame % BACKGROUND_EVERY === 0)) {
      // Clouds and waves are repainted one strip at a time, on different frames.
      const band = bgDirty ? null : (visualFrame / BACKGROUND_EVERY) % ANIMATED_BAND_COUNT;
      bgCtx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
      drawStage(bgCtx, visualFrame, pixelScale, band);
      bgDirty = false;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    let shake = { x: 0, y: 0 };
    if (session) {
      shake = renderMatch(ctx, session.state, session.fx, session.hud, 0);
      const me = session.state.fighters[0];
      touch.setSuperReady(me.meter >= METER_MAX && session.state.phase === 'fight');
    }
    // The background layer shakes with the action, moved by the compositor.
    const t = shake.x || shake.y ? `translate(${(shake.x * scale).toFixed(1)}px, ${(shake.y * scale).toFixed(1)}px)` : '';
    if (t !== lastShake) {
      bgCtx.canvas.style.transform = t;
      lastShake = t;
    }
  }

  // On a device that cannot keep up, lower the canvas resolution (checked every 90 frames);
  // at the lowest resolution, stop animating the clouds and waves.
  function watchSpeed(now) {
    if (speed.last !== null && !loop.paused && !document.hidden) {
      const dt = now - speed.last;
      if (dt < 250) {
        speed.sum += dt;
        speed.n++;
      }
    }
    speed.last = now;
    if (speed.n >= SPEED_SAMPLE) {
      const avg = speed.sum / speed.n;
      speed.sum = 0;
      speed.n = 0;
      if (avg > SLOW_FRAME_MS) {
        if (opts.lowerResolution?.()) bgDirty = true;
        else bgAnimated = false;
      }
    }
  }

  function frame(now) {
    tick(loop, now);
    draw();
    watchSpeed(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    start({ p1, p2, difficulty = 'normal', seed = Date.now() % 2147483647, cpu = null }) {
      session = { state: createMatch({ p1, p2, difficulty, seed }), fx: createFx(), hud: createHud(), cpu, doneSent: false };
      touch.flush();
      loop.paused = false;
      resetClock(loop);
    },
    stop() {
      session = null;
      loop.paused = false;
      resetClock(loop);
    },
    pause() {
      loop.paused = true;
    },
    resume() {
      touch.flush();
      loop.paused = false;
      resetClock(loop);
    },
    // Call after the canvas size changes.
    invalidate() {
      bgDirty = true;
    },
    get paused() {
      return loop.paused;
    },
    get state() {
      return session?.state ?? null;
    },
  };
}

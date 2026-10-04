// A play session: owns the current match, the fixed-step loop, effects and drawing.
import { METER_MAX } from './config.js';
import { createMatch, step } from './core/match.js';
import { NEUTRAL_INPUT } from './core/input-buffer.js';
import { createLoop, tick, resetClock } from './loop.js';
import { renderMatch } from './render/index.js';
import { createFx, fxStep } from './render/fx.js';
import { createHud, hudStep } from './render/hud.js';

// opts: ctx (canvas 2D), getLayout() -> { pixelScale }, touch, onEvents(events, state),
// onMatchDone(state), drawIdle(ctx, frame) for when no match is running.
export function createGame(opts) {
  const { ctx, getLayout, touch } = opts;
  let session = null;
  let idleFrame = 0;

  function stepOnce() {
    if (!session) {
      idleFrame++;
      return;
    }
    const { state } = session;
    const p1 = touch.sample();
    const p2 = session.cpu ? session.cpu.think(state) : NEUTRAL_INPUT;
    step(state, [p1, p2]);
    fxStep(session.fx, state);
    hudStep(session.hud, state);
    opts.onEvents?.(state.events, state);
    if (state.phase === 'done' && !session.doneSent) {
      session.doneSent = true;
      opts.onMatchDone?.(state);
    }
  }

  const loop = createLoop(stepOnce);

  function draw() {
    const { pixelScale } = getLayout();
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    if (session) {
      renderMatch(ctx, session.state, session.fx, session.hud, pixelScale, 0);
      const me = session.state.fighters[0];
      touch.setSuperReady(me.meter >= METER_MAX && session.state.phase === 'fight');
    } else {
      opts.drawIdle?.(ctx, idleFrame, pixelScale);
    }
  }

  function frame(now) {
    tick(loop, now);
    draw();
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
    get paused() {
      return loop.paused;
    },
    get state() {
      return session?.state ?? null;
    },
  };
}

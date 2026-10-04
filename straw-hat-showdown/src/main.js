import './fighters/index.js';
import { applyLayout } from './layout.js';
import { createTouchControls } from './input/touch.js';
import { createGame } from './game.js';
import { createApp } from './app.js';
import { drawStage } from './render/stage.js';
import { createSfx } from './audio/sfx.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let layout = applyLayout(stage, canvas);

function relayout() {
  layout = applyLayout(stage, canvas);
}
window.addEventListener('resize', relayout);
window.visualViewport?.addEventListener('resize', relayout);

const testMode = new URLSearchParams(location.search).has('test');
const touch = createTouchControls(document.getElementById('controls'));
const sfx = createSfx({ log: testMode ? [] : null });
let app = null;

const game = createGame({
  ctx,
  touch,
  sound: sfx,
  getLayout: () => layout,
  drawIdle: (c, frame, scale) => drawStage(c, frame, scale),
  onMatchDone: (state) => app.matchDone(state),
});

const platform = {
  onFirstTap() {
    sfx.unlock();
  },
};

app = createApp({ ui: document.getElementById('ui'), game, touch, sound: sfx, platform });
app.title();

// Pause automatically when the game is hidden or the phone is turned upright.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) app.pause();
});
const portrait = window.matchMedia('(orientation: portrait)');
portrait.addEventListener('change', (e) => {
  if (e.matches) app.pause();
});

if (testMode) window.__game = { game, app, sfx };

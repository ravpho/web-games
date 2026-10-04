import './fighters/index.js';
import { applyLayout, lowerPixelRatioCap } from './layout.js';
import { createTouchControls } from './input/touch.js';
import { createGame } from './game.js';
import { createApp } from './app.js';
import { createSfx } from './audio/sfx.js';
import { enterFullscreen, shouldShowHomeScreenHint } from './platform.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const bgCanvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
const bgCtx = bgCanvas.getContext('2d', { alpha: false });
let layout = applyLayout(stage, [bgCanvas, canvas]);
let game = null;

function relayout() {
  layout = applyLayout(stage, [bgCanvas, canvas]);
  game?.invalidate();
}
window.addEventListener('resize', relayout);
window.visualViewport?.addEventListener('resize', relayout);

const testMode = new URLSearchParams(location.search).has('test');
const touch = createTouchControls(document.getElementById('controls'));
const sfx = createSfx({ log: testMode ? [] : null });
let app = null;

game = createGame({
  ctx,
  bgCtx,
  touch,
  sound: sfx,
  getLayout: () => layout,
  onMatchDone: (state) => app.matchDone(state),
  lowerResolution: () => {
    if (!lowerPixelRatioCap()) return false;
    relayout();
    return true;
  },
});

const platform = {
  showHomeScreenHint: shouldShowHomeScreenHint(),
  onFirstTap() {
    sfx.unlock();
    enterFullscreen();
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

if (testMode) window.__game = { game, app, sfx, touch };

// Offline support. Not used on this computer's own address during development (fresh files
// always), unless ?sw is in the address for testing.
const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if ('serviceWorker' in navigator && (!localHost || new URLSearchParams(location.search).has('sw'))) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

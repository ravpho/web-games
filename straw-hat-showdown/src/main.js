import './fighters/index.js';
import { applyLayout } from './layout.js';
import { createTouchControls } from './input/touch.js';
import { createGame } from './game.js';
import { drawStage } from './render/stage.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let layout = applyLayout(stage, canvas);

function relayout() {
  layout = applyLayout(stage, canvas);
}
window.addEventListener('resize', relayout);
window.visualViewport?.addEventListener('resize', relayout);

const touch = createTouchControls(document.getElementById('controls'));

const game = createGame({
  ctx,
  touch,
  getLayout: () => layout,
  drawIdle: (c, frame, scale) => drawStage(c, frame, scale),
});

// Until the menu screens exist: Luffy against a standing dummy.
touch.show(true);
game.start({ p1: 'luffy', p2: 'luffy' });

if (new URLSearchParams(location.search).has('test')) window.__game = game;

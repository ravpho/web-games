// Menu screens built as HTML over the game canvas: title, character select, difficulty, pause, results.
import { getFighter } from '../core/registry.js';
import { ROSTER } from '../fighters/index.js';
import { drawPortrait } from '../render/portrait.js';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function soundLabel(on) {
  return on ? 'Sound: On' : 'Sound: Off';
}

export function titleScreen({ soundOn, showHomeScreenHint, onToggleSound, onStart }) {
  const node = el(`
    <section class="screen title-screen" data-screen="title">
      <button type="button" class="chip sound-toggle" data-action="sound">${soundLabel(soundOn)}</button>
      <div class="title-block">
        <h1 class="game-title"><span>Straw Hat</span><span>Showdown</span></h1>
        <p class="tap-to-start">Tap to start</p>
      </div>
      ${showHomeScreenHint ? '<p class="hint">For fullscreen on iPhone: tap Share, then "Add to Home Screen".</p>' : ''}
      <p class="fan-note">Unofficial fan game. Not affiliated with or endorsed by Eiichiro Oda, Shueisha or Toei Animation, the owners of <i>One Piece</i>.</p>
    </section>`);
  const toggle = node.querySelector('[data-action="sound"]');
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle.textContent = soundLabel(onToggleSound());
  });
  node.addEventListener('click', () => onStart());
  return node;
}

export function selectScreen({ step, picked, onPick, onBack }) {
  const node = el(`
    <section class="screen select-screen" data-screen="select" data-step="${step}">
      <button type="button" class="chip back" data-action="back">Back</button>
      <h2>${step === 'player' ? 'Choose your fighter' : 'Choose your opponent'}</h2>
      <div class="cards">
        ${ROSTER.map((id) => `
          <button type="button" class="card${picked === id ? ' picked' : ''}" data-fighter="${id}">
            <canvas width="200" height="200"></canvas>
            <span>${getFighter(id).name}</span>
          </button>`).join('')}
      </div>
    </section>`);
  for (const card of node.querySelectorAll('.card')) {
    const id = card.dataset.fighter;
    drawPortrait(card.querySelector('canvas'), id, step === 'opponent' && picked === id ? 1 : 0);
    card.addEventListener('click', () => onPick(id));
  }
  node.querySelector('[data-action="back"]').addEventListener('click', onBack);
  return node;
}

export function difficultyScreen({ selected = 'normal', onPick, onBack }) {
  const levels = [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']];
  const node = el(`
    <section class="screen difficulty-screen" data-screen="difficulty">
      <button type="button" class="chip back" data-action="back">Back</button>
      <h2>Choose difficulty</h2>
      <div class="levels">
        ${levels.map(([id, label]) => `<button type="button" class="big-btn${id === selected ? ' selected' : ''}" data-level="${id}">${label}</button>`).join('')}
      </div>
    </section>`);
  for (const b of node.querySelectorAll('[data-level]')) b.addEventListener('click', () => onPick(b.dataset.level));
  node.querySelector('[data-action="back"]').addEventListener('click', onBack);
  return node;
}

export function pauseButton({ onPause }) {
  const node = el('<button type="button" class="pause-btn" aria-label="Pause" data-action="pause"><span></span><span></span></button>');
  node.addEventListener('click', onPause);
  return node;
}

export function pauseMenu({ soundOn, onResume, onToggleSound, onQuit }) {
  const node = el(`
    <section class="screen overlay pause-menu" data-screen="pause">
      <h2>Paused</h2>
      <div class="menu">
        <button type="button" class="big-btn selected" data-action="resume">Resume</button>
        <button type="button" class="big-btn" data-action="sound">${soundLabel(soundOn)}</button>
        <button type="button" class="big-btn" data-action="quit">Quit to Title</button>
      </div>
    </section>`);
  node.querySelector('[data-action="resume"]').addEventListener('click', onResume);
  const sound = node.querySelector('[data-action="sound"]');
  sound.addEventListener('click', () => {
    sound.textContent = soundLabel(onToggleSound());
  });
  node.querySelector('[data-action="quit"]').addEventListener('click', onQuit);
  return node;
}

export function resultsScreen({ playerWon, onRematch, onChange, onTitle }) {
  const node = el(`
    <section class="screen overlay results-screen" data-screen="results">
      <h2 class="${playerWon ? 'win' : 'lose'}">${playerWon ? 'You Win!' : 'You Lose!'}</h2>
      <div class="menu">
        <button type="button" class="big-btn selected" data-action="rematch">Rematch</button>
        <button type="button" class="big-btn" data-action="change">Change Fighters</button>
        <button type="button" class="big-btn" data-action="title">Title</button>
      </div>
    </section>`);
  node.querySelector('[data-action="rematch"]').addEventListener('click', onRematch);
  node.querySelector('[data-action="change"]').addEventListener('click', onChange);
  node.querySelector('[data-action="title"]').addEventListener('click', onTitle);
  return node;
}

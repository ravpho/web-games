// Screen flow: title -> character select -> difficulty -> match -> results, plus pausing.
// Nothing is saved between visits: every visit starts with sound on and Normal highlighted.
import { createCpu } from './core/cpu.js';
import {
  titleScreen, selectScreen, difficultyScreen, pauseButton, pauseMenu, resultsScreen,
} from './ui/screens.js';

export function createApp({ ui, game, touch, sound = null, platform = {} }) {
  const settings = { soundOn: true };
  let picks = { p1: null, p2: null, difficulty: 'normal' };
  let screen = null;
  let overlay = null;
  let pauseBtn = null;

  function clear() {
    ui.replaceChildren();
    screen = null;
    overlay = null;
    pauseBtn = null;
  }

  function show(name, node) {
    clear();
    screen = name;
    ui.append(node);
  }

  function toggleSound() {
    settings.soundOn = !settings.soundOn;
    sound?.setMuted(!settings.soundOn);
    return settings.soundOn;
  }

  function menuTap() {
    sound?.play('menu');
  }

  function title() {
    game.stop();
    touch.show(false);
    show('title', titleScreen({
      soundOn: settings.soundOn,
      showHomeScreenHint: Boolean(platform.showHomeScreenHint),
      onToggleSound: toggleSound,
      onStart: () => {
        platform.onFirstTap?.();
        menuTap();
        selectPlayer();
      },
    }));
  }

  function selectPlayer() {
    show('select', selectScreen({
      step: 'player',
      picked: picks.p1,
      onPick: (id) => {
        menuTap();
        picks.p1 = id;
        selectOpponent();
      },
      onBack: () => {
        menuTap();
        title();
      },
    }));
  }

  function selectOpponent() {
    show('select', selectScreen({
      step: 'opponent',
      picked: picks.p1,
      onPick: (id) => {
        menuTap();
        picks.p2 = id;
        chooseDifficulty();
      },
      onBack: () => {
        menuTap();
        selectPlayer();
      },
    }));
  }

  function chooseDifficulty() {
    show('difficulty', difficultyScreen({
      selected: 'normal',
      onPick: (level) => {
        menuTap();
        picks.difficulty = level;
        startMatch();
      },
      onBack: () => {
        menuTap();
        selectOpponent();
      },
    }));
  }

  function startMatch() {
    clear();
    screen = 'match';
    pauseBtn = pauseButton({ onPause: () => pause() });
    ui.append(pauseBtn);
    const seed = (Date.now() ^ (Math.random() * 2 ** 31)) >>> 0;
    game.start({
      p1: picks.p1, p2: picks.p2, difficulty: picks.difficulty, seed,
      cpu: createCpu({ side: 1, difficulty: picks.difficulty, seed: seed ^ 0x5bd1e995 }),
    });
    touch.show(true);
  }

  function pause() {
    if (screen !== 'match' || overlay || game.state?.phase === 'done') return;
    game.pause();
    touch.show(false);
    sound?.play('menu');
    overlay = pauseMenu({
      soundOn: settings.soundOn,
      onToggleSound: toggleSound,
      onResume: () => {
        menuTap();
        overlay.remove();
        overlay = null;
        touch.show(true);
        game.resume();
      },
      onQuit: () => {
        menuTap();
        title();
      },
    });
    ui.append(overlay);
  }

  function matchDone(state) {
    if (screen !== 'match') return;
    touch.show(false);
    pauseBtn?.remove();
    overlay = resultsScreen({
      playerWon: state.winner === 0,
      onRematch: () => {
        menuTap();
        startMatch();
      },
      onChange: () => {
        menuTap();
        game.stop();
        picks = { p1: null, p2: null, difficulty: 'normal' };
        selectPlayer();
      },
      onTitle: () => {
        menuTap();
        title();
      },
    });
    ui.append(overlay);
  }

  return {
    title,
    pause,
    matchDone,
    get screen() {
      return overlay?.dataset.screen ?? screen;
    },
    get settings() {
      return { ...settings };
    },
  };
}

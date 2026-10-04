// Sound effects synthesized with the Web Audio API: no audio files, no music.
// Audio starts on the first tap (required by phone browsers) and one master gain handles mute.

// Which sounds a core event plays. Events listed in SILENT_EVENTS deliberately play nothing.
export const SILENT_EVENTS = ['projectile', 'roundEnd'];

export function soundsForEvent(e, playerSide = 0) {
  switch (e.type) {
    case 'moveStart': return [e.sfx || 'swing'];
    case 'superStart': return ['superStart'];
    case 'hit': return [e.lightning ? 'lightning' : e.heavy ? 'hitHeavy' : 'hit'];
    case 'guard': return ['guard'];
    case 'knockdown': return ['knockdown'];
    case 'ko': return ['ko'];
    case 'time': return ['bell'];
    case 'draw': return ['bell'];
    case 'roundStart': return ['roundStart'];
    case 'fight': return ['fight'];
    case 'clash': return ['clash'];
    case 'rubber': return ['rubber'];
    case 'jump': return ['jump'];
    case 'land': return ['land'];
    case 'matchEnd': return [e.winner === playerSide ? 'win' : 'lose'];
    default: return [];
  }
}

// --- Synthesis helpers -----------------------------------------------------------------------

function envelope(ctx, gainNode, t0, peak, dur, attack = 0.005) {
  const g = gainNode.gain;
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + attack);
  g.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function tone(a, { from, to = from, dur = 0.15, type = 'sine', gain = 0.3, delay = 0 }) {
  const t0 = a.ctx.currentTime + delay;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  envelope(a.ctx, g, t0, gain, dur);
  osc.connect(g).connect(a.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(a, { dur = 0.15, filter = 'lowpass', from = 1200, to = from, q = 0.8, gain = 0.3, delay = 0 }) {
  const t0 = a.ctx.currentTime + delay;
  const src = a.ctx.createBufferSource();
  src.buffer = a.noise;
  const f = a.ctx.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t0);
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = a.ctx.createGain();
  envelope(a.ctx, g, t0, gain, dur);
  src.connect(f).connect(g).connect(a.master);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.05);
}

const RECIPES = {
  swing: (a) => noise(a, { dur: 0.12, filter: 'bandpass', from: 700, to: 2600, q: 1.2, gain: 0.25 }),
  hit: (a) => { noise(a, { dur: 0.08, from: 1600, gain: 0.45 }); tone(a, { from: 180, to: 60, dur: 0.1, gain: 0.5 }); },
  hitHeavy: (a) => { noise(a, { dur: 0.16, from: 1000, gain: 0.6 }); tone(a, { from: 140, to: 40, dur: 0.24, gain: 0.7 }); },
  guard: (a) => { tone(a, { from: 950, to: 760, dur: 0.07, type: 'square', gain: 0.12 }); tone(a, { from: 1500, dur: 0.05, type: 'square', gain: 0.08, delay: 0.01 }); },
  stretch: (a) => tone(a, { from: 220, to: 880, dur: 0.22, type: 'triangle', gain: 0.3 }),
  slash: (a) => { noise(a, { dur: 0.16, filter: 'highpass', from: 2500, to: 6000, gain: 0.3 }); tone(a, { from: 2200, to: 900, dur: 0.1, gain: 0.08 }); },
  slashWave: (a) => { noise(a, { dur: 0.32, filter: 'bandpass', from: 4000, to: 900, q: 1.5, gain: 0.35 }); },
  dash: (a) => noise(a, { dur: 0.25, filter: 'bandpass', from: 400, to: 1800, q: 1.2, gain: 0.35 }),
  kick: (a) => { noise(a, { dur: 0.1, from: 1200, gain: 0.3 }); tone(a, { from: 230, to: 90, dur: 0.1, gain: 0.3 }); },
  kickHeavy: (a) => { noise(a, { dur: 0.2, filter: 'bandpass', from: 500, to: 2000, gain: 0.4 }); tone(a, { from: 200, to: 60, dur: 0.2, gain: 0.4 }); },
  spin: (a) => { for (let i = 0; i < 3; i++) noise(a, { dur: 0.1, filter: 'bandpass', from: 900, to: 2400, q: 1.4, gain: 0.25, delay: i * 0.13 }); },
  gatling: (a) => { for (let i = 0; i < 5; i++) noise(a, { dur: 0.06, from: 1800, gain: 0.3, delay: i * 0.09 }); },
  giant: (a) => { tone(a, { from: 90, to: 40, dur: 0.5, type: 'sawtooth', gain: 0.25 }); noise(a, { dur: 0.4, from: 600, gain: 0.4 }); },
  asura: (a) => { tone(a, { from: 220, dur: 0.6, type: 'sawtooth', gain: 0.1 }); tone(a, { from: 233, dur: 0.6, type: 'sawtooth', gain: 0.1 }); for (let i = 0; i < 4; i++) noise(a, { dur: 0.12, filter: 'highpass', from: 3000, to: 6000, gain: 0.25, delay: i * 0.1 }); },
  fire: (a) => { noise(a, { dur: 0.5, from: 900, to: 400, gain: 0.4 }); for (let i = 0; i < 5; i++) noise(a, { dur: 0.03, filter: 'highpass', from: 4000, gain: 0.2, delay: 0.05 + i * 0.08 }); },
  lightning: (a) => { noise(a, { dur: 0.35, filter: 'highpass', from: 900, to: 3000, gain: 0.5 }); tone(a, { from: 70, dur: 0.3, type: 'square', gain: 0.18 }); },
  cloud: (a) => tone(a, { from: 95, to: 65, dur: 0.6, type: 'triangle', gain: 0.35 }),
  wind: (a) => noise(a, { dur: 0.5, filter: 'bandpass', from: 500, to: 1500, q: 2, gain: 0.35 }),
  superStart: (a) => { tone(a, { from: 300, to: 1200, dur: 0.35, type: 'square', gain: 0.12 }); tone(a, { from: 600, to: 2400, dur: 0.35, type: 'triangle', gain: 0.1, delay: 0.05 }); },
  knockdown: (a) => { tone(a, { from: 120, to: 50, dur: 0.25, gain: 0.5 }); noise(a, { dur: 0.15, from: 500, gain: 0.35 }); },
  ko: (a) => { tone(a, { from: 420, to: 90, dur: 0.6, type: 'sawtooth', gain: 0.18 }); noise(a, { dur: 0.25, from: 900, gain: 0.5 }); },
  bell: (a) => { tone(a, { from: 880, dur: 0.7, gain: 0.25 }); tone(a, { from: 1320, dur: 0.6, gain: 0.12 }); },
  roundStart: (a) => { tone(a, { from: 523, dur: 0.14, type: 'square', gain: 0.1 }); tone(a, { from: 659, dur: 0.2, type: 'square', gain: 0.1, delay: 0.15 }); },
  fight: (a) => { for (const f of [523, 659, 784]) tone(a, { from: f, dur: 0.35, type: 'square', gain: 0.08 }); },
  menu: (a) => tone(a, { from: 880, to: 1100, dur: 0.06, type: 'triangle', gain: 0.2 }),
  jump: (a) => tone(a, { from: 300, to: 620, dur: 0.1, type: 'triangle', gain: 0.12 }),
  land: (a) => noise(a, { dur: 0.05, from: 400, gain: 0.15 }),
  clash: (a) => { tone(a, { from: 1500, dur: 0.1, type: 'square', gain: 0.12 }); noise(a, { dur: 0.12, filter: 'highpass', from: 2500, gain: 0.3 }); },
  rubber: (a) => { tone(a, { from: 150, to: 460, dur: 0.18, type: 'triangle', gain: 0.35 }); tone(a, { from: 460, to: 140, dur: 0.25, type: 'triangle', gain: 0.3, delay: 0.18 }); },
  win: (a) => { [523, 659, 784, 1046].forEach((f, i) => tone(a, { from: f, dur: 0.25, type: 'triangle', gain: 0.25, delay: i * 0.12 })); },
  lose: (a) => { [392, 330, 262].forEach((f, i) => tone(a, { from: f, dur: 0.35, type: 'triangle', gain: 0.25, delay: i * 0.18 })); },
};

export const SOUND_NAMES = Object.keys(RECIPES);

const VOLUME = 0.7;

export function createSfx({ log = null } = {}) {
  const audio = { ctx: null, master: null, noise: null };
  let muted = false;

  function ensure() {
    if (audio.ctx) return audio.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = muted ? 0 : VOLUME;
    audio.master.connect(audio.ctx.destination);
    const len = audio.ctx.sampleRate;
    audio.noise = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = audio.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return audio.ctx;
  }

  return {
    // Call from a tap: creates or resumes the audio system.
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    },
    setMuted(value) {
      muted = value;
      if (audio.master) audio.master.gain.setValueAtTime(muted ? 0 : VOLUME, audio.ctx.currentTime);
    },
    get muted() {
      return muted;
    },
    get state() {
      return audio.ctx ? audio.ctx.state : 'none';
    },
    get log() {
      return log;
    },
    play(name) {
      if (muted || !audio.ctx || audio.ctx.state !== 'running') return;
      const recipe = RECIPES[name];
      if (!recipe) return;
      recipe(audio);
      log?.push(name);
    },
    playEvents(events, playerSide = 0) {
      for (const e of events) for (const name of soundsForEvent(e, playerSide)) this.play(name);
    },
  };
}

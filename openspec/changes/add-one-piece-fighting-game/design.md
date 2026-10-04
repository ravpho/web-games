# Design

## Context

The repository is effectively empty: a README ("Simple games for kids"), the OpenSpec setup, and a Claude Code session-start hook that installs the OpenSpec CLI. There is no existing code, framework, build or hosting to fit into. See `proposal.md` for the motivation and the specs for the required behavior.

Constraints that shape the approach:

- **Target**: phones held sideways, in Safari on iPhone and Chrome on Android, played with touch only.
- **Hosting**: GitHub Pages, a static host with no server code.
- **Content**: no image, audio or font files taken from *One Piece* media. Characters, the stage and sounds have to be made by the game's own code.
- **Repo**: the repo will hold more kids' games later, so this game should live in its own folder.
- **Dev environment**: Node 22 is available. The cloud container also has Chromium and a global Playwright install for in-browser checks; a WebKit browser is not available.

## Goals / Non-Goals

**Goals:**

- Keep the fight logic pure, deterministic and unit-testable in Node, separate from drawing, DOM and sound.
- Have no runtime dependencies and no build step: the files in the repo are the files that are served.
- Make each fighter mostly data (move frame data, style profile, rig and pose definitions) plugged into one shared engine, so the four characters don't each need their own engine code.
- Keep all gameplay tuning numbers in one obvious place per fighter, so balance can be adjusted after playtesting.

**Non-Goals:**

- Keyboard or gamepad controls, 2-player play, online play, arcade or story modes, unlocks, saved progress and music. All are out of scope for this version; the engine's input layer leaves room for them.
- A camera that scrolls or zooms: the stage is exactly one screen wide.
- Crouching, high/low attacks, throws and air specials: not needed by the specs, and they keep controls simple for kids.
- Automated tests of iPhone-specific behavior: there is no WebKit in the dev environment, so this is checked by hand on a real phone (see Risks).

## Decisions

### D1. Plain Canvas 2D and JavaScript modules, with no game library and no build step

The game is plain HTML, CSS and ES modules, drawn with the Canvas 2D API and served exactly as committed.

- **Why**: the art is drawn by code from shapes, so a sprite-oriented engine adds little. The phone-specific work (multi-touch, scaling, starting audio on a tap) is a few dozen lines with standard browser features. With no build step, GitHub Pages can serve the source directly, and the repo stays easy to read.
- **Alternatives**:
  - Phaser: a large download, built around sprites and texture atlases, and its scene system duplicates the simple screen flow here.
  - Kaplay: friendly, but its own game-object model fights the pure-logic separation in D3.
  - PixiJS or three.js: GPU rendering and 3D are not needed for two chibi fighters on a flat stage.

### D2. Repository layout

```
index.html                      games index (site root), links to each game
package.json                    {"type":"module"}, test script, no dependencies
.github/workflows/pages.yml     run tests, assemble the site, deploy to Pages
tools/make-icons.mjs            dev-only: renders the PNG icons with Playwright
straw-hat-showdown/             the game (working title; served as-is)
  index.html  style.css  manifest.webmanifest  sw.js  icons/
  src/
    main.js                     boot, fixed-step loop, screen manager
    config.js                   global constants (resolution, timings, meter)
    core/                       PURE: no DOM, no canvas, no audio
      match.js                  rounds, timer, KO/time-out/draw, freezes
      fighter.js                fighter state machine
      moves.js                  move execution from frame data
      collision.js              boxes, hits, guard, push-apart, stage edges
      projectiles.js
      input-buffer.js           press buffering, direction to forward/back
      cpu.js                    computer opponent (D8)
      rng.js                    seeded random numbers
    fighters/                   one module per fighter: stats + moves + style
      luffy.js  zoro.js  sanji.js  nami.js
    render/
      rig.js                    skeleton, poses, keyframe playback (D6)
      looks/                    per-fighter drawing: luffy.js, zoro.js, ...
      stage.js  hud.js  fx.js   Going Merry; health/timer/meters; sparks, shake, banners
    audio/sfx.js                synthesized sound effects (D9)
    ui/                         DOM screens: title, select, difficulty, pause, results
    input/touch.js              pointer events to InputState (D7)
  tests/                        node:test suites for core/ and fighters/
```

- **Why**: one self-contained folder per game keeps future games independent. `core/` holds only pure logic so it can run in Node, and everything outside it is presentation.
- **Working title**: "Straw Hat Showdown". It is only the folder name and the title-screen text, so it is easy to rename.

### D3. Pure, deterministic fight core

`core/` is a set of functions that advance a plain-data `MatchState` by one step from two `InputState`s (player and CPU): `step(state, p1Input, p2Input) -> state`. Randomness comes only from a seeded RNG stored in the state. Rendering, sound and UI read the state, and also read an `events` list the step produces (hit, guard, ko, special-start, super-start, round-start, etc.) to trigger effects and sounds.

- **Why**: every rule in `fight-rules` and `fighter-roster` becomes a fast Node unit test with exact frame counts, with no browser needed. The same step function also drives headless CPU-vs-CPU simulations for balance checks (see Risks).
- **Alternative**: game objects that update and draw themselves (the usual engine pattern). It is simpler at first but mixes rules with drawing, and makes the rules hard to test.

### D4. Fixed 60 Hz simulation, decoupled from rendering

All timings are counted in frames at 60 frames per second: a round is 3600 frames, and moves have startup, active and recovery frames. `main.js` runs a time accumulator on `requestAnimationFrame`. It advances the core in whole 1/60-second steps, with at most 5 steps per animation frame so a slow device can't fall further and further behind. It then draws the latest state.

Hit-stop, super freezes and announcements are frames in which the fighters and timer don't advance, so the timer naturally excludes them.

- **Why**: this gives the same speed on 60 Hz and 120 Hz screens (`fight-rules` "Same speed on every device"), and exact, reproducible frame counts for tests.
- **Alternative**: variable time steps, which make collisions and frame data nondeterministic and tests flaky.

### D5. Fighter state machine and moves as frame data

```
          +--------+   walk input   +------+
   +----->|  IDLE  |<-------------->| WALK |
   |      +--------+                +------+
   |        |  |  |  \__ up _______________________
   |  Guard |  |  | Attack/Special/Super           \
   |        v  |  v                                 v
   |   +-------+ | +--------------------+       +-------+  Attack  +------------+
   |   | GUARD | | | ATTACK(move, frame) |       |  AIR  |--------->| AIR ATTACK |
   |   +-------+ | |startup>active>recov|       +-------+          +------------+
   |       |     | +--------------------+           |  lands             |
   |  guarded    |    | chain/cancel window         v                    v
   |       v     |    +--> next chain hit / special / super        (back to IDLE)
   |  +-----------+
   |  | GUARDSTUN |      hit while not guarding
   |  +-----------+   +---------+  knockdown hit  +-----------+   +-------+
   +------------------| HITSTUN |---------------->| KNOCKDOWN |-->| GETUP |--> IDLE
                      +---------+                 +-----------+   +-------+
                         health 0 -------------> KO     (INTRO / VICTORY at round edges)
```

Each move is plain data in its fighter module, for example:

```js
pistol: {
  name: 'GUM-GUM PISTOL!', type: 'special',
  startup: 14, active: 8, recovery: 26,
  hits: [{ at: 14, box: { x: 30, y: -70, w: 300, h: 22 }, damage: 70,
           hitstun: 22, push: 7, knockdown: false, chip: 0.2 }],
  stretch: { limb: 'frontArm', reach: 300 },     // render hint
  sfx: 'stretch',
}
```

Boxes are relative to the fighter's feet and mirrored by facing. Each fighter has one body box for being hit (adjusted for jumping and knockdown) and one push box for spacing. Chain hits list which moves they can be cancelled into (`special`, `super`) when they connect.

Tuning values after the balance pass in task 15.1 (still expected to change in playtesting; the specs only require the relative orderings):

| | Luffy | Zoro | Sanji | Nami |
|---|---|---|---|---|
| Max health | 1000 | 1000 | 1000 | 1000 |
| Walk speed (px/frame) | 3.6 | 3.0 | 4.2 | 3.2 |
| Chain damage | 43 / 43 / 74 | 52 / 58 / 92 | 40 / 40 / 70 | 35 / 35 / 65 |
| Chain reach (px) | 72 | 85 | 74 | 64 |
| Neutral special | Pistol, 300 px reach | Phoenix projectile | Party Table, both sides | Thunderbolt, 50-frame delay |
| Forward special | Gatling, 5 hits | Oni Giri, passes through | Mouton Shot, lunge | Cyclone, big push |
| Super damage | 260 | 280 (multi-hit) | 250 (multi-hit) | 240 |

Global constants:
- **Chip damage**: 20% of normal damage, and it never takes health below 1.
- **Lightning against Luffy**: 80% damage (raised from 70% in the balance pass, which found the gag made Luffy too strong against Nami).
- **Input buffer**: 8 frames.
- **Hit-stop**: 5 frames for normal hits and 9 frames for heavy hits.
- **Knockdown**: 45 frames down, then 20 frames getting up while invulnerable.
- **Super meter**: 0 to 1000. A fighter gains as much meter as the damage they deal, and half as much as the damage they take, so a super is ready about once per round.

### D6. Code-drawn fighters with a jointed skeleton

Each fighter is a 2D skeleton of segments: hips, torso, head, upper and lower arms, upper and lower legs, plus props (hat, swords, staff). Each segment has an angle and a length scale.

- **Animations** are keyframed poses keyed to the same frame numbers as the move data, so drawings line up with the hit timing.
- **Drawing**: each fighter's look module draws capsules, circles and paths in chibi proportions (head about a third of the height) in a fixed order: back limbs, torso, head, front limbs, props. Facing left is a horizontal flip of the canvas.
- **Luffy's stretch** is just the forearm's length scale animating up to the move's reach.
- **Mirror matches** swap in an alternate color set.
- **Portraits** on character select reuse the same code to draw a bust onto a small canvas.

```
        _[==]_          hat (prop on head)
         (o_o)          head (big, chibi)
      ----+----         upper/lower arm: angle + length scale
          |               Pistol: front forearm length x6, then snaps back
         / \            legs
```

- **Why**: there are no image files, no copyright exposure, and every animation comes from about 20 poses per fighter rather than hundreds of drawn frames. Stretch, fire and lightning effects are easy to add in code.
- **Alternative**: hand-drawn sprite sheets. They look better, but would take tens of hand-drawn frames per move per fighter.

### D7. Screens and controls in HTML, the fight on the canvas

The menu screens (title, character select, difficulty, pause, results) and the touch controls are HTML elements layered over the canvas. The fight, its on-screen info and effects are drawn on the canvas.

- **Logical resolution**: 960x540. The canvas backing store uses the device pixel ratio, capped at 2, and is letterboxed to keep the 16:9 shape.
- **Controls** sit in a layer covering the full screen, not just the letterboxed game area, so the pad and buttons reach the real screen edges. On today's wide phones they mostly sit over the side bars rather than the action. The `env(safe-area-inset-*)` CSS values keep them clear of notches and the home indicator.
- **Touch input** uses Pointer Events tracked per touch: the pad follows its own touch and each button follows the touch on it. This handles multi-touch on iOS and Android. Each fixed step samples an `InputState` (horizontal direction, up, buttons held, buttons newly pressed) for the player.
- **Why**: HTML gives crisp text, easy tap targets and CSS press states for the menus and controls. The canvas keeps the fight in sync with the simulation.

### D8. Computer opponent: delayed perception and style profiles

The CPU produces the same `InputState` the touch layer does, so it can't break the rules (`cpu-opponent` "Same rules as the player").

- **Delayed view**: it decides from a snapshot of the match that is `reactionFrames` old, which gives human-like lag.
- **Decisions**: every few frames it picks an action, weighted by the fighter's style profile (preferred distance, whether to keep away or rush in, how often to jump in) and the difficulty settings below, which also set how aggressive it is. Its randomness comes from its own seeded RNG, so a match with a computer opponent is still reproducible.
- **Guarding in advance**: the fastest attacks land in 5 frames, sooner than any reaction delay, so a purely delayed computer could never guard them. When the opponent is within reach, it also sometimes raises its guard in advance, with a chance set by the level. Delayed reactions still decide guarding slow attacks and projectiles, and punishing long recovery.

| | Easy | Normal | Hard |
|---|---|---|---|
| Reaction delay | 30 frames (0.5 s) | 18 frames | 11 frames (never 0) |
| Chance to guard a seen attack | 15% | 40% | 65% |
| Chance to continue a chain | 30% | 65% | 90% |
| Punishes long recovery | rarely | sometimes | usually |
| Super after meter fills | 3-5 s | 1.5-3 s | 0.3-1 s |

- **Why**: delayed perception makes it beatable on every level and feels fair. Seeded randomness lets tests check "Hard guards more than Normal" statistically over many simulated attempts.
- **Alternative**: a search-based or learning AI. That is overkill and its behavior is hard to tune for kids.

### D9. Synthesized sound effects

All sound effects are made at runtime with the Web Audio API: oscillators and noise buffers shaped by volume envelopes and filters. Examples are a thump plus noise for hits, a filtered noise sweep for swings, a short metallic blip for guards, crackle for lightning, a roar for fire, and rising stingers for supers and announcements.

- One master volume control handles mute.
- The audio system is created or resumed on the first tap on the title screen, as iPhone Safari requires.
- **Why**: there are no audio files to license or download, and it works offline for free.
- **Alternative**: free sound libraries such as CC0 packs. They sound better, but add file weight and license tracking. They could be swapped in later behind the same `sfx.play(name)` interface.

### D10. Mobile web app shell

- **No browser gestures**: the page uses `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`, `overscroll-behavior: none` and a fixed-position body, with a `viewport-fit=cover` viewport.
- **Orientation**: a CSS `(orientation: portrait)` media query shows the rotate prompt. A `matchMedia` listener tells the game to auto-pause, as does a `visibilitychange` listener when the app is hidden.
- **Fullscreen**: the title-screen tap calls `requestFullscreen()` and tries `screen.orientation.lock('landscape')`; both are allowed to fail. On iPhone in a normal browser tab (not launched from the home screen), the title screen shows the "Add to Home Screen" hint.
- **Install**: the manifest sets `display: fullscreen` and `orientation: landscape`, with 192 and 512 px icons (any and maskable), plus a 180 px `apple-touch-icon` and the `apple-mobile-web-app-*` meta tags.
- **Icons**: a straw-hat icon drawn by the same rig code, rendered to PNG once by `tools/make-icons.mjs` with the dev container's Playwright, and committed.
- **Offline (`sw.js`)**:
  - On install, the service worker saves every game file under a cache name that includes the version, then switches to the new version straight away.
  - On activation it deletes old caches.
  - For the game's own requests it serves from the cache first.
  - Every module is loaded at startup and nothing loads later, so switching versions immediately can't mix versions inside a running session. The next opening runs the new version, which satisfies the spec's "at the latest on the next visit" requirement.
  - It is not registered on `localhost`, so development always sees fresh files.
- **Privacy**: no third-party scripts, fonts or links. Fonts are system fonts.

### D11. Deployment through GitHub Actions to Pages

`pages.yml` runs on every push to `main`:

1. Run `node --test`.
2. Assemble `_site/`: the root `index.html` plus `straw-hat-showdown/` without `tests/`.
3. Fill in `sw.js`: the commit SHA as the cache version, and the generated list of files to save for offline play.
4. Upload and deploy with `actions/upload-pages-artifact` and `actions/deploy-pages`.

- **Why**: CI is the one place that knows the exact file list and version, so the offline cache can't go stale through a forgotten manual version bump. Tests also gate every deploy.
- **Alternative**: "Deploy from branch". It needs no workflow, but then the version and file list must be kept by hand, there are no test gates, and `openspec/` and `.claude/` would be published.

### D12. Testing strategy

- **Unit tests** (`node --test`, no dependencies, run in CI):
  - every `fight-rules` scenario: rounds, timer, KO, time-out, draws, edges, push-apart, hits, knockdown invulnerability, guard, chip floor, chain timing, cancels, jumping, projectiles, meter, super invulnerability, input lockout, steps independent of frame rate;
  - `fighter-roster` properties: walk speed and chain damage ordering, Pistol reach beating every chain, Oni Giri ending on the far side, Party Table hitting behind, Thunderbolt dodgeable, lightning against Luffy, mirror palette;
  - the input buffer and turning a direction into forward or back;
  - `cpu-opponent` statistics over many seeded trials.
- **Balance check**: a headless CPU-vs-CPU round-robin, all pairs on Normal over many seeds. It is reported rather than asserted, and it flags any matchup outside a 35-65% win rate for retuning.
- **In-browser checks** during implementation, using the container's Chromium and Playwright with phone emulation (landscape, touch):
  - screen flow and screenshots of each fighter and move;
  - multi-touch through simulated touches;
  - no page zoom or scroll;
  - letterboxing on 16:9 and 19.5:9 screens;
  - frame time under 4x CPU slowdown;
  - offline reload after the service worker installs;
  - every network request going to the game's own site.

  These are dev-time checks, not CI, so the repo stays dependency-free.
- **Real-device playtest**: the owner plays the deployed Pages build on a real phone to judge touch feel, iPhone specifics and balance.

### Screen flow

```
 +-------+  tap   +------------------+ pick x2 +------------+ level +-----------------+
 | TITLE |------->| CHARACTER SELECT |-------->| DIFFICULTY |------>|      MATCH      |
 +-------+        +------------------+         +------------+       | intro > fight > |
     ^                 ^       ^  Back <----------'                  | KO/Time/Draw    |
     |                 |       |                                     | (repeat rounds) |
     |                 |       |          +---------+                +-----------------+
     |                 |       +----------| RESULTS |<--- match decided ---|   ^  |
     +-----------------)------------------| Rematch |------ rematch -------|---'  |
     |                 +-- Change Fighters+---------+                      |      |
     |                                                       pause / hidden /     |
     |                     +-------+ <------------------------- turned upright ---+
     +----- Quit ----------| PAUSE |---- Resume ----------------------------------+
                           +-------+
```

## Risks / Trade-offs

- **[Touch feel can't be fully judged in emulation]** → All timing and size constants live in `config.js` and the fighter modules. The owner playtests the deployed build on a real phone, and the tasks include a tuning pass.
- **[iPhone-specific behavior is untested in the dev environment]** (no WebKit) → Use only documented, long-supported features (Pointer Events, Web Audio started from a tap, safe-area insets, standalone display mode). The real-device playtest includes an iPhone checklist when one is available.
- **[Code-drawn art may look too simple]** → Chibi proportions, bold outlines and signature props carry recognizability. The shared rig keeps each extra pose cheap, so polish can continue after launch.
- **[Balance across four fighters at once]** → The CPU-vs-CPU round-robin flags lopsided matchups, and the tuning numbers are all in one place per fighter. Gags only cut lightning damage to Luffy by 20%.
- **[Larger first version (all four fighters)]** → Build order: engine and Luffy first, end to end, then Zoro, Sanji and Nami as data, poses and drawing on the same engine.
- **[Service worker serving stale files]** → The cache version is stamped by CI from the commit SHA, old caches are deleted on activation, and the service worker is not registered on localhost.
- **[GitHub Pages availability]** → Pages must be turned on with the "GitHub Actions" source. A private repo needs a paid plan, so the owner may need to make the repo public.
- **[Intellectual property]** → No copied assets, a non-commercial fan game with an "unofficial" note on the title screen. If the rights holders object, the game can be renamed or unpublished.
- **[Older or low-end phones]** → Device pixel ratio capped at 2, no canvas shadow blur, and a small number of particles. The 5-step cap keeps the game playable, though slower, on very slow devices.

## Migration Plan

This is a new game with no existing users or data, so there is nothing to migrate.

**Deploy**: merge to `main`, and the workflow tests and publishes the site. One-time owner step: Settings, then Pages, then Source: "GitHub Actions".

**Rollback**: revert the commit on `main`. The workflow redeploys the previous version, and the new cache version makes players' devices pick it up.

## Open Questions

- Final game title, if not "Straw Hat Showdown". It only affects the folder name and title text.
- Exact tuning numbers. They will be settled during playtesting within the orderings the specs require.

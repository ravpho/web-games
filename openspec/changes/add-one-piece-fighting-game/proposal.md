# Proposal

## Why

`web-games` is meant to hold simple browser games for kids, but it has no games yet. The first one is a one-on-one fighting game for 9-12 year olds, played on a phone held sideways. It is a fan game starring four early (pre-time-skip) Straw Hat pirates from *One Piece*. Each character fights in a way that reflects their powers from the series.

## What Changes

- Add the repo's first game: a 2D side-view, Tekken-spirited fighting game (one-on-one, best of 3 rounds with a timer, health bars, a super move) that runs in a mobile browser with no install or build step.
- Four playable characters, all available in the first version: **Luffy** (all-rounder with long stretching reach), **Zoro** (slow, heavy sword hits), **Sanji** (fast kicks only) and **Nami** (keeps her distance and attacks with weather). Each has a short 3-hit attack chain, 2 special moves and 1 super move named after their early-series techniques.
- Kid-friendly touch controls on a phone held sideways: a movement pad on the left, and Attack, Special, Guard and Super buttons on the right. Holding forward while pressing Special picks the second special. There are no joystick-motion inputs and no long combo strings.
- A computer opponent with Easy, Normal and Hard difficulty. There is no 2-player or online mode in this version.
- One mode, Quick fight: pick your fighter, pick the opponent, pick the difficulty, fight, then rematch or change characters.
- Characters, the stage (the Going Merry's deck) and effects are drawn by code in a chibi style, with no image files. Sound effects are synthesized in code, with no music.
- Two story gags with no real effect on balance: Nami's lightning makes rubber Luffy go "boing" and do less damage, and Sanji swoons over Nami in his intro and bows instead of celebrating when he beats her.
- The game is published on GitHub Pages and can be installed to the home screen for fullscreen play, which is the only way to get fullscreen on iPhone. It keeps working offline after the first visit and saves nothing between visits.

## Capabilities

### New Capabilities

- `fight-rules`: Rules of a match: rounds, timer, health, hits and hit reactions, guarding, attack chains, the super meter, knockouts, and how a round and match are won.
- `fighter-roster`: The four fighters: their play-style stats, attack chains, special and super moves, and their character-specific gags.
- `touch-controls`: The on-screen controls and how touches turn into fighter actions, including holding several buttons at once.
- `cpu-opponent`: The computer-controlled fighter, its three difficulty levels, and how each character's style shapes its behavior.
- `game-flow`: The screens and how the player moves between them: title, character select, difficulty, the fight with its round announcements and pause, and the results screen.
- `fight-presentation`: What the player sees and hears during a fight: health bars and other on-screen info, the code-drawn characters and stage, hit and super effects, move-name banners, and sound effects.
- `mobile-web-app`: Running as a mobile web app: sideways play and the "rotate your phone" prompt, scaling to any screen, blocking unwanted browser gestures, home-screen install, and offline play.

### Modified Capabilities

None. The repo has no existing specs.

## Impact

- **New code**: a self-contained game folder (plain HTML, CSS and JavaScript modules) and a small games index page at the repo root. No runtime dependencies and no build step.
- **Tooling**: a root `package.json` with no dependencies, only so `node --test` can run the fight-logic unit tests. The existing session-start hook is unaffected.
- **Hosting**: a GitHub Actions workflow publishes the site to GitHub Pages. **Owner action needed**: in the repo settings, turn on Pages with "GitHub Actions" as the source. GitHub Pages on a private repo needs a paid GitHub plan.
- **IP**: *One Piece* belongs to Eiichiro Oda, Shueisha and Toei. This is a non-commercial fan game: it uses no copied sprites, music, logos or official artwork, and the page states that it is an unofficial fan project.

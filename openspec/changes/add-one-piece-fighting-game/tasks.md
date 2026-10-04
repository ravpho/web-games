# Tasks

## 1. Scaffolding

- [x] 1.1 Create root `package.json` (`"type": "module"`, `"test": "node --test"`, no dependencies) and the `straw-hat-showdown/` folder layout from design D2; verify `npm test` runs cleanly and the folders exist
- [x] 1.2 Add the game's `index.html`, `style.css` and a `src/main.js` stub with the mobile page basics from D10 (`viewport-fit=cover`, `touch-action: none`, no text selection or long-press menu, no overscroll, fixed body) and a 960x540 canvas letterboxed at 16:9 (device pixel ratio capped at 2); verify with Playwright phone emulation (landscape 844x390 and 640x360) that the canvas is fully visible, undistorted and centered, and that double-tap and drag don't zoom or scroll the page
- [x] 1.3 Add `src/config.js` (global constants from D5) and `src/core/rng.js` (seeded RNG); verify with a unit test that the same seed gives the same sequence and different seeds differ
- [x] 1.4 Add the root games index `index.html` linking to `straw-hat-showdown/`, and a README section on running the game locally (`npx serve .`) and running tests; verify the link opens the game from a local server and the README commands work as written

## 2. Match core

- [ ] 2.1 Implement `core` `step(state, p1Input, p2Input)` returning the new state plus an events list, and the fixed 60 Hz accumulator loop in `main.js` (at most 5 steps per animation frame); verify with unit tests that the same seed and inputs give identical states after 1000 steps, and that one step always means 1/60 s whatever the frame rate (spec: Same speed on every device)
- [ ] 2.2 Implement `match.js`: best of three, 3600-frame round timer, freeze frames not counted, round intro and end lockout, KO, time-out decision, drawn and double-KO rounds replayed, health and positions reset each round; verify with unit tests for every scenario in fight-rules "Best of three rounds", "Round time limit", "Knockout ends the round", "Time-out decision", "Drawn rounds are replayed" and "No control outside of play"
- [ ] 2.3 Implement `input-buffer.js`: turn the screen direction into forward/back from facing, and remember button presses for 8 frames; verify with unit tests that a press 1-8 frames before a fighter can act is performed, and that a press 9 or more frames early is dropped

## 3. Fighter and combat core

- [ ] 3.1 Implement the `fighter.js` state machine (idle, walk, air, guard, guardstun, hitstun, knockdown, getup, ko, intro, victory) with automatic turning, stage edges and push-apart; verify with unit tests for fight-rules "Fighters face each other" and "Stage boundaries and spacing"
- [ ] 3.2 Implement frame-data move execution (`moves.js`) and hit detection (`collision.js`): attack boxes against body boxes, each hit landing once, damage, hitstun, push and hit-stop events; verify with unit tests for fight-rules "Landing a hit", using a minimal test fighter
- [ ] 3.3 Implement knockdowns (45 frames down, 20 frames getting up while invulnerable); verify with unit tests for fight-rules "Knockdowns"
- [ ] 3.4 Implement guarding: guardstun, pushback, 20% chip damage on specials and supers with a floor of 1 health, and no guarding in the air or while stunned; verify with unit tests for fight-rules "Guarding" and "Chip damage"
- [ ] 3.5 Implement attack chains (continue on press within the window, reset when idle, third hit knocks down), cancelling into special or super when a hit connects, one jumping attack per jump, and no specials in the air; verify with unit tests for fight-rules "Attack chain", "Special after a chain hit" and "Jumping"
- [ ] 3.6 Implement `projectiles.js`: travel, hitting, leaving the stage, cancelling each other, and one per fighter at a time; verify with unit tests for fight-rules "Projectiles"
- [ ] 3.7 Implement the super meter (gain = damage dealt, including chip; half of damage taken; capped at 1000; kept between rounds; reset each match) and super moves (need a full meter, empty it, can't be interrupted); verify with unit tests for fight-rules "Super meter" and "Using a super move"

## 4. Luffy (first playable fighter)

- [ ] 4.1 Add `fighters/luffy.js`: stats, three-hit punch chain, jumping attack, Gum-Gum Pistol (about 300 px reach, long recovery), Gum-Gum Gatling (forward flurry of several hits), Gear Third Giant Pistol super (heavy damage, knockdown) and style profile; verify with unit tests for the Luffy scenarios in fighter-roster "Luffy's moves"

## 5. Rendering

- [ ] 5.1 Implement `render/rig.js`: skeleton segments with angle and length scale, keyframed poses tied to move frames, mirroring for facing, and an alternate color set; verify with a unit test that pose interpolation and length scale give the expected joint positions
- [ ] 5.2 Draw Luffy (`render/looks/luffy.js`) in chibi style with straw hat and red vest, with poses for idle, walk, jump, guard, hit, knockdown, getup, victory and every move, and Gum-Gum Pistol visibly stretching out and snapping back; verify with Playwright screenshots of each pose and of the Pistol at full reach
- [ ] 5.3 Draw the Going Merry deck stage with sea and sky (`render/stage.js`); verify with a Playwright screenshot of a fight in progress
- [ ] 5.4 Draw the fight information (`render/hud.js`): names and health bars with the player on the left, timer, round-win markers, and super meters that glow when full; verify with screenshots after a scripted hit, a round win and a full meter (fight-presentation "Fight information on screen" and "Full super meter stands out")
- [ ] 5.5 Implement effects from core events (`render/fx.js`): hit and guard sparks, hit-stop, screen shake on heavy hits and knockdowns, hit counter, move-name banners and the super flash; verify with screenshots of a guarded hit, a chain ending in a knockdown, a 3+ hit counter and a super start (fight-presentation "Hit effects", "Hit counter", "Move-name banners", "Super move flash")

## 6. Touch controls

- [ ] 6.1 Implement `input/touch.js` with Pointer Events: a floating movement pad in the left area, Attack, Special, Guard and Super buttons on the right (each at least 48 CSS px, clear of safe-area insets), press feedback, and a dimmed or highlighted Super state; it produces the player's `InputState` each step; verify with Playwright touch emulation for every scenario in touch-controls, including pad + Special together for the forward special and pad + Guard together
- [ ] 6.2 Connect touch input to the match so Luffy vs a standing dummy is playable in the browser; verify by playing through walk, jump, the chain, both specials, guard and super with emulated touches and checking the resulting events

## 7. Computer opponent

- [ ] 7.1 Implement `core/cpu.js`: decisions from a delayed snapshot of the match, Easy/Normal/Hard settings from design D8, a style profile per fighter, super use when in range, and output as an `InputState`; verify with seeded unit tests that guard rate and reaction time rank Hard > Normal > Easy, that Hard still lets attacks through, and that the computer does nothing during intros or pauses (cpu-opponent "Difficulty changes reactions" and "Beatable on Hard")
- [ ] 7.2 Verify that the computer has no advantage: a unit test checks that its moves produce exactly the same damage, speed and meter results as the same moves by the player (cpu-opponent "Same rules as the player")

## 8. Screens and game flow

- [ ] 8.1 Build the title screen (game name, unofficial fan game note, sound toggle, tap to start) and the character select screen (four portraits drawn by the rig, pick your fighter then the opponent, Back); verify with Playwright walking through game-flow "Title screen" and "Character select"
- [ ] 8.2 Build the difficulty screen (Easy/Normal/Hard, Normal highlighted, Back) and start the match with the computer at that level; verify game-flow "Difficulty select" in Playwright
- [ ] 8.3 Show round announcements (Round N / Final Round, Fight!, K.O.!, Time!, Draw), the victory pose with You Win!/You Lose!, and the results screen (Rematch, Change Fighters, Title); verify with Playwright through a scripted match for game-flow "Round announcements", "Match result" and "Results screen"
- [ ] 8.4 Add the pause button and menu (Resume, sound toggle, Quit to Title), and auto-pause on `visibilitychange` and when the phone is turned upright; verify game-flow "Pause" and "Automatic pause" in Playwright, including that the timer does not move while paused
- [ ] 8.5 Confirm nothing is saved between visits (no localStorage, cookies or IndexedDB use); verify by reloading after changing sound and difficulty and checking the defaults, and by searching the source for storage APIs
- [ ] 8.6 Milestone check: play Luffy vs a computer Luffy from title to results in phone emulation on each difficulty; verify the full flow completes with no console errors

## 9. Zoro, Sanji and Nami

- [ ] 9.1 Add `fighters/zoro.js` (sword chain, 36 Pound Phoenix projectile, Oni Giri passing through with knockdown, Asura multi-hit knockdown super, style profile); verify with unit tests for fighter-roster "Zoro's moves"
- [ ] 9.2 Draw Zoro (green hair, three swords, green sash) with all poses; verify with Playwright screenshots of each pose and move
- [ ] 9.3 Add `fighters/sanji.js` (kick-only chain, Party Table Kick Course hitting both sides, Mouton Shot lunge with knockdown, Diable Jambe multi-hit knockdown super, style profile); verify with unit tests for fighter-roster "Sanji's moves"
- [ ] 9.4 Draw Sanji (blond hair over one eye, curly eyebrow, black suit, hands in pockets, flaming leg during Diable Jambe) with all poses; verify with Playwright screenshots of each pose and move
- [ ] 9.5 Add `fighters/nami.js` (staff chain with the shortest reach, Thunderbolt Tempo cloud marking a spot then delayed lightning, Cyclone Tempo big push, Thunder Lance Tempo full-stage super, keep-away style profile); verify with unit tests for fighter-roster "Nami's moves"
- [ ] 9.6 Draw Nami (orange hair, Clima-Tact staff, cloud and lightning effects) with all poses; verify with Playwright screenshots of each pose and move

## 10. Roster-wide rules and gags

- [ ] 10.1 Verify the roster-wide properties with unit tests across all four fighters: equal max health, walk speed (Sanji fastest, Zoro slowest), chain damage (Zoro highest), Nami's chain reach shortest, Pistol reach beyond every chain, and every fighter having every move type (fighter-roster "Four playable fighters", "Shared move set structure", "Distinct play styles")
- [ ] 10.2 Implement rubber versus lightning (Nami's lightning does 70% damage to Luffy, with a `rubber` event, boing wobble and "RUBBER!" pop-up); verify with a unit test comparing damage to Luffy and to Sanji, and a screenshot of the reaction
- [ ] 10.3 Implement Sanji's heart-eyes intro and apologetic-bow victory when facing Nami, with no effect on gameplay; verify with a unit test that the match state matches a Sanji-vs-Zoro control apart from the cosmetic flags, and screenshots of both moments
- [ ] 10.4 Implement mirror matches with the alternate color set for the opponent; verify with a screenshot of Luffy vs Luffy showing different colors (fighter-roster "Mirror matches")
- [ ] 10.5 Add CPU style profiles for Zoro, Sanji and Nami; verify with seeded unit tests that a computer Nami mostly stays at range and uses specials when the player is far away, and that a computer Sanji closes in (cpu-opponent "Character-style behavior")

## 11. Sound

- [ ] 11.1 Implement `audio/sfx.js` with Web Audio synthesized sounds (swing, hit, guard, stretch, slash, fire, lightning, wind, super start, knockdown, KO, announcements, menu tap), a master volume control for mute, and audio started on the title-screen tap; verify with a unit test that every core event type maps to a defined sound, and in Playwright that the audio is running after the tap and silent when muted
- [ ] 11.2 Connect sounds to core events and menu taps, and the sound toggles on the title and pause screens; verify in Playwright that hit and guard events trigger different sounds and that turning sound off stops all playback (fight-presentation "Sound effects", "Sound toggle")

## 12. Mobile web app shell

- [ ] 12.1 Add the rotate prompt for upright phones and keep the controls and fight information clear of safe-area insets; verify in Playwright portrait and landscape emulation, and with a notch-sized safe-area inset, for mobile-web-app "Played sideways" and "Clear of notches and rounded corners"
- [ ] 12.2 Request fullscreen and attempt the landscape orientation lock on the title tap (both allowed to fail), and show the "Add to Home Screen" hint only on iPhone Safari outside home-screen mode; verify in Playwright that Chromium enters fullscreen, and with an iPhone user agent that the hint is shown
- [ ] 12.3 Add `tools/make-icons.mjs` (renders the straw-hat icon with the rig code via Playwright to 180, 192 and 512 px PNGs, plus a maskable version), `manifest.webmanifest` (fullscreen, landscape, icons) and the Apple meta tags; verify that Chromium reports no installability errors through the DevTools protocol `Page.getInstallabilityErrors`

## 13. Offline play and updates

- [ ] 13.1 Implement `sw.js`: save the listed game files under a versioned cache, switch to the new version immediately on install, delete old caches on activation, and serve the game's own requests from the cache first; register it outside localhost, or on localhost with `?sw=1` for testing; verify in Playwright that after one online load the game reloads and plays a match with the network offline (mobile-web-app "Works offline")
- [ ] 13.2 Verify updates: serve version A, load it, switch the server to version B, and open the game twice; check that the second opening runs version B (mobile-web-app "Picks up new versions")

## 14. Publishing

- [ ] 14.1 Add `tools/build-site.mjs`, which assembles `_site/` (root index plus the game without `tests/`) and writes the cache version and file list into `sw.js`; verify by running it locally and checking that `_site/` contents match and that `sw.js` lists exactly the game's files
- [ ] 14.2 Add `.github/workflows/pages.yml` (on push to `main`: `npm test`, `node tools/build-site.mjs` with the commit SHA, upload-pages-artifact, deploy-pages); verify by reading the workflow against D11, then push to a branch and check the test job passes
- [ ] 14.3 Document in the README how to play, run tests, build the site and deploy, including the one-time "Settings > Pages > Source: GitHub Actions" step and the private-repo note; verify the documented commands run as written

## 15. Integration checks and tuning

- [ ] 15.1 Run the CPU-vs-CPU round-robin (all pairs, Normal, many seeds) and retune `fighters/*.js` until every matchup is within a 35-65% win rate; verify the final report is within range and all unit tests still pass
- [ ] 15.2 Run the full in-browser check in phone emulation: a full match for each fighter, multi-touch, no zoom or scroll, letterboxing on 16:9 and 19.5:9, average frame time within the 60 fps budget under 4x CPU slowdown, and every network request going to the game's own site; verify with mobile-web-app "Smooth on mid-range phones" and "No data collection or outside requests", with no console errors
- [ ] 15.3 After the first deploy, the owner playtests on a real phone (iPhone and/or Android): touch feel, readability, fun on each difficulty, home-screen install, offline play and sound; record findings and retune the constants; verify the playtest checklist is completed and any fixes are merged

# mobile-web-app Specification

## Purpose

Defines how the game runs as a mobile web app: in phone browsers, held sideways, fitted to any screen, with browser gestures blocked, installable to the home screen for fullscreen play, working offline, and published at a public address without collecting any data.

## Requirements

### Requirement: Runs in phone browsers
The game SHALL run from its web address in current Safari on iPhone and current Chrome on Android, with no app store, account, plugin or download step.

#### Scenario: Opening the link
- **WHEN** a player opens the game's address in Safari on iPhone or Chrome on Android
- **THEN** the title screen loads and the game can be played

### Requirement: Played sideways
The game SHALL be played with the phone held sideways. When the phone is upright, a "Rotate your phone" prompt SHALL cover the game until the phone is turned sideways again.

#### Scenario: Phone held upright
- **WHEN** the game is open and the phone is held upright
- **THEN** the "Rotate your phone" prompt covers the game

#### Scenario: Turning sideways
- **WHEN** the phone is turned sideways while the prompt is shown
- **THEN** the prompt disappears and the game is shown

### Requirement: Fits any screen
The game view SHALL keep a 16:9 shape, scaled as large as fits the screen without cropping or stretching. Any leftover space SHALL show as plain bars.

#### Scenario: Wide phone screen
- **WHEN** the game runs on a screen wider than 16:9
- **THEN** the whole game view is visible and undistorted, with plain bars at the sides

### Requirement: Clear of notches and rounded corners
Controls and fight information SHALL stay clear of the screen's notch, camera cut-out, rounded corners and home indicator.

#### Scenario: Phone with a notch
- **WHEN** the game runs sideways on a phone with a notch
- **THEN** no control or health bar is hidden under the notch

### Requirement: No browser gestures
Touches on the game SHALL NOT scroll or zoom the page, select text, open long-press menus or trigger pull-to-refresh.

#### Scenario: Double tap
- **WHEN** the player rapidly double-taps the Attack button
- **THEN** the page does not zoom and the fighter attacks twice

#### Scenario: Long press
- **WHEN** the player holds a finger on a button
- **THEN** no text selection or long-press menu appears

### Requirement: Fullscreen where the browser allows it
On browsers that allow web pages to go fullscreen, starting from the title screen SHALL switch the game to fullscreen. Where that is not possible, as in Safari on iPhone, the title screen SHALL show a short hint about adding the game to the home screen for fullscreen play.

#### Scenario: Chrome on Android
- **WHEN** the player taps to start on the title screen in Chrome on Android
- **THEN** the game switches to fullscreen

#### Scenario: Safari on iPhone
- **WHEN** the game is opened in Safari on iPhone, not from the home screen
- **THEN** the title screen shows a hint about adding the game to the home screen

### Requirement: Installable to the home screen
The game SHALL be installable to the home screen with its own name and icon. When opened from the home screen, it SHALL run fullscreen without browser bars.

#### Scenario: Opening from the home screen
- **WHEN** a player who added the game to their home screen opens it from there
- **THEN** the game opens fullscreen without the browser's address bar

### Requirement: Works offline
After the game has been opened once with a connection, it SHALL open and be fully playable without a network connection, both in the browser and from the home screen.

#### Scenario: Airplane mode
- **WHEN** a player who has opened the game before turns on airplane mode and opens it again
- **THEN** the game loads and a full match can be played

### Requirement: Picks up new versions
When a new version is published, players SHALL get it without clearing any browser data: at the latest on the next visit after the new version has been downloaded in the background.

#### Scenario: New version published
- **WHEN** a new version is published and the player opens the game twice with a connection
- **THEN** the second opening runs the new version

### Requirement: Smooth on mid-range phones
Fights SHALL run smoothly, at up to 60 frames per second, on mid-range phones from the last few years.

#### Scenario: Slower phone
- **WHEN** a full round is played in a phone-sized browser with the CPU slowed to a quarter of desktop speed
- **THEN** the average frame time stays within a 60 frames-per-second budget

### Requirement: No data collection or outside requests
The game SHALL NOT include ads, analytics, tracking, accounts or links to outside sites. Apart from loading its own files, it SHALL make no network requests.

#### Scenario: Network activity
- **WHEN** a full match is played with the browser's network log open
- **THEN** every request goes to the game's own site

### Requirement: Published as a public website
The game SHALL be published at a public address on the repository's GitHub Pages site. The site's front page SHALL list the games in the repository and link to this one.

#### Scenario: Visiting the site
- **WHEN** someone visits the repository's GitHub Pages address
- **THEN** a page listing the games is shown, with a link that opens the fighting game

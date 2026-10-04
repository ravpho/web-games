# Spec Delta

## Purpose

Defines the screens of the game and how the player moves between them in Quick fight mode: title, character select, difficulty, the fight with its announcements and pause, and the results screen.

## ADDED Requirements

### Requirement: Title screen
Opening the game SHALL show a title screen with the game's name, a note that it is an unofficial fan game not affiliated with the *One Piece* rights holders, a sound on/off toggle, and a prompt to tap to start.

#### Scenario: Opening the game
- **WHEN** the player opens the game
- **THEN** the title screen shows the game name, the unofficial fan game note, a sound toggle and a tap-to-start prompt

#### Scenario: Starting
- **WHEN** the player taps the title screen outside the sound toggle
- **THEN** the character select screen opens

### Requirement: Character select
The character select screen SHALL show all four fighters with their names and portraits. The player SHALL first pick their own fighter and then the opponent's fighter, and a Back button SHALL return to the previous step.

#### Scenario: Picking both fighters
- **WHEN** the player taps Zoro and then taps Nami
- **THEN** Zoro is the player's fighter, Nami is the opponent, and the difficulty screen opens

#### Scenario: Going back
- **WHEN** the player has picked their own fighter and taps Back
- **THEN** the player can pick their own fighter again

### Requirement: Difficulty select
The difficulty screen SHALL offer Easy, Normal and Hard, with Normal highlighted by default. Choosing a level SHALL start the match, and a Back button SHALL return to character select.

#### Scenario: Choosing a difficulty
- **WHEN** the player taps Easy
- **THEN** the match starts against a computer opponent on Easy

### Requirement: Round announcements
Each round SHALL begin with an announcement ("Round 1", "Round 2", or "Final Round" when the round decides the match) followed by "Fight!", after which the fighters can act. Each round SHALL end with "K.O.!" for a knockout, "Time!" for a time-out, or "Draw" for a drawn round.

#### Scenario: Deciding round
- **WHEN** a round begins with both fighters on one round win each
- **THEN** it is announced as "Final Round"

#### Scenario: Knockout announcement
- **WHEN** a fighter is knocked out
- **THEN** "K.O.!" is announced before the next round or the end of the match

### Requirement: Match result
When the match is decided, the winning fighter SHALL do their victory pose with the message "You Win!" if the player won or "You Lose!" if the computer won, and the results screen SHALL follow.

#### Scenario: Player wins the match
- **WHEN** the player wins their second round
- **THEN** the player's fighter does a victory pose, "You Win!" is shown, and then the results screen opens

### Requirement: Results screen
The results screen SHALL offer Rematch (same fighters and difficulty), Change Fighters (back to character select) and Title.

#### Scenario: Rematch
- **WHEN** the player taps Rematch
- **THEN** a new match starts with the same fighters and difficulty, both meters empty and no rounds won

### Requirement: Pause
During a match a pause button SHALL stop the fight, including the timer, and show a menu with Resume, a sound on/off toggle and Quit to Title.

#### Scenario: Pausing
- **WHEN** the player taps the pause button during a round
- **THEN** the fight and timer stop and the pause menu is shown

#### Scenario: Quitting
- **WHEN** the player taps Quit to Title in the pause menu
- **THEN** the match is abandoned and the title screen is shown

### Requirement: Automatic pause
The game SHALL pause a match automatically when the game is hidden (the player switches apps, locks the phone or changes tab) or when the phone is turned upright.

#### Scenario: Switching apps
- **WHEN** the player switches to another app during a round and then comes back
- **THEN** the match is paused with the pause menu shown

### Requirement: Nothing saved between visits
The game SHALL NOT keep anything between visits. Every visit SHALL start on the title screen with sound on and Normal difficulty highlighted.

#### Scenario: Reopening the game
- **WHEN** the player turns sound off, plays a match on Hard, then closes and reopens the game
- **THEN** the title screen is shown with sound on and Normal highlighted on the difficulty screen

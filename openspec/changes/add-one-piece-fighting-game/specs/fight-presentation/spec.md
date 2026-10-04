# Spec Delta

## Purpose

Defines what the player sees and hears: the on-screen fight information, the code-drawn fighters and stage, hit and super effects, move-name banners and sound effects, so that fights are easy to read and fun to watch.

## ADDED Requirements

### Requirement: Fight information on screen
During a fight the screen SHALL show each fighter's name and health bar along the top, with the player on the left; the round timer between them; round wins under each health bar; and each fighter's super meter.

#### Scenario: Taking damage
- **WHEN** a fighter is hit
- **THEN** their health bar shrinks by the damage taken

#### Scenario: Winning a round
- **WHEN** a fighter wins a round
- **THEN** a round-win marker appears under their health bar

### Requirement: Full super meter stands out
A full super meter SHALL be visibly highlighted (for example, glowing) so the player knows the super move is ready.

#### Scenario: Meter fills up
- **WHEN** a fighter's super meter becomes full
- **THEN** the meter is shown highlighted until the super is used

### Requirement: Recognizable code-drawn fighters
Fighters SHALL be drawn by the game itself in a chibi style, without image files or official artwork. Each SHALL show their signature early-series look: Luffy's straw hat and red vest, Zoro's green hair, three swords and green sash, Sanji's blond hair over one eye, curly eyebrow and black suit, and Nami's orange hair and Clima-Tact staff.

#### Scenario: Fighters are recognizable
- **WHEN** a fight shows any of the four fighters
- **THEN** the fighter is drawn with their signature features listed above

### Requirement: Animated moves
Every move SHALL have its own animation, along with idle, walk, jump, guard, hit, knockdown, getting up and victory animations. Luffy's stretching attacks SHALL visibly stretch his arm out and back.

#### Scenario: Gum-Gum Pistol animation
- **WHEN** Luffy uses Gum-Gum Pistol
- **THEN** his arm visibly stretches out to the punch's full reach and snaps back

### Requirement: Stage
Fights SHALL take place on the deck of the Going Merry, drawn by the game, with sea and sky behind it.

#### Scenario: Fight background
- **WHEN** a match starts
- **THEN** the fight is shown on the Going Merry's deck with sea and sky in the background

### Requirement: Hit effects
A landed hit SHALL show a hit spark where it connects and a very short freeze of both fighters. Knockdowns, the final hit of a chain and super hits SHALL also shake the screen. A guarded hit SHALL show a different guard spark.

#### Scenario: Heavy hit
- **WHEN** the third hit of an attack chain lands
- **THEN** a hit spark appears, both fighters freeze briefly and the screen shakes

#### Scenario: Guarded hit
- **WHEN** an attack is guarded
- **THEN** a guard spark is shown instead of a hit spark

### Requirement: Hit counter
When two or more hits land in a row without the opponent getting free, the game SHALL show a counter such as "3 HITS!" on the attacker's side.

#### Scenario: Chain into special
- **WHEN** a three-hit chain followed by a special lands without the opponent getting free
- **THEN** the counter shows the total number of hits

### Requirement: Move-name banners
Starting a special or super move SHALL show the move's name in a banner on the user's side, for example "GUM-GUM PISTOL!".

#### Scenario: Special move name
- **WHEN** Zoro uses Oni Giri
- **THEN** a banner reading "ONI GIRI!" appears

### Requirement: Super move flash
Starting a super move SHALL briefly freeze the action, darken the background and show a close-up banner with the fighter and the super's name before the move plays out.

#### Scenario: Super starts
- **WHEN** Nami starts Thunder Lance Tempo
- **THEN** the action freezes briefly with a darkened background and a "THUNDER LANCE TEMPO!" close-up banner, then the move continues

### Requirement: Sound effects
The game SHALL play sound effects for attack swings, hits, guarded hits, specials, super starts, knockdowns, round announcements and menu taps. It SHALL NOT play music. It SHALL NOT use sound recordings taken from the anime or official games.

#### Scenario: Hit sound
- **WHEN** an attack lands with sound on
- **THEN** a hit sound plays

#### Scenario: Guard sound
- **WHEN** an attack is guarded with sound on
- **THEN** a guard sound plays that is different from the hit sound

### Requirement: Sound toggle
Turning sound off from the title screen or pause menu SHALL silence all sound until it is turned back on.

#### Scenario: Muted
- **WHEN** sound is turned off and an attack lands
- **THEN** no sound plays

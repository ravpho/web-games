# Spec Delta

## Purpose

Defines the four playable fighters (Luffy, Zoro, Sanji and Nami as they were before the time-skip), how their play styles differ, their moves named after techniques from the series, and their character-specific gags.

## ADDED Requirements

### Requirement: Four playable fighters
The game SHALL offer exactly four fighters (Luffy, Zoro, Sanji and Nami), all selectable from the first visit with nothing to unlock.

#### Scenario: All fighters available
- **WHEN** the player opens character select for the first time
- **THEN** Luffy, Zoro, Sanji and Nami can all be chosen as the player's fighter and as the opponent

### Requirement: Shared move set structure
Every fighter SHALL have a three-hit attack chain, a jumping attack, a neutral special (Special alone), a forward special (forward + Special) and a super move.

#### Scenario: Each fighter has every move type
- **WHEN** any fighter is played
- **THEN** Attack, jumping Attack, Special, forward + Special and Super each produce that fighter's own distinct move

### Requirement: Distinct play styles
All fighters SHALL have the same maximum health. They SHALL differ in speed, power and reach: Sanji walks fastest and Zoro slowest, Zoro's attack chain deals the most damage, and Nami's chain has the shortest reach.

#### Scenario: Walking speed
- **WHEN** each fighter walks forward for the same length of time
- **THEN** Sanji covers the most distance and Zoro the least

#### Scenario: Chain damage
- **WHEN** each fighter lands a full three-hit chain on the same unguarded opponent
- **THEN** Zoro's chain deals the most total damage

### Requirement: Luffy's moves
Luffy SHALL fight with rubber punches. Neutral special **Gum-Gum Pistol**: a stretching punch that reaches farther than any fighter's chain, with long recovery. Forward special **Gum-Gum Gatling**: a forward-moving flurry of several hits. Super **Gear Third: Gum-Gum Giant Pistol**: a giant inflated fist that deals heavy damage and knocks down.

#### Scenario: Gum-Gum Pistol reach
- **WHEN** Luffy uses Gum-Gum Pistol on an opponent standing beyond the reach of every fighter's attack chain but within the Pistol's reach
- **THEN** the punch stretches out and hits the opponent

#### Scenario: Gum-Gum Gatling
- **WHEN** Luffy uses Gum-Gum Gatling next to an unguarded opponent
- **THEN** Luffy moves forward and lands several separate hits

#### Scenario: Giant Pistol
- **WHEN** Luffy's Giant Pistol hits the opponent
- **THEN** the opponent takes heavy damage and is knocked down

### Requirement: Zoro's moves
Zoro SHALL fight with three-sword-style slashes. Neutral special **36 Pound Phoenix**: a flying slash projectile. Forward special **Oni Giri**: a fast dash that slashes through the opponent to their other side and knocks down. Super **Asura**: a nine-sword illusion attack with several heavy hits that knocks down.

#### Scenario: 36 Pound Phoenix
- **WHEN** Zoro uses 36 Pound Phoenix
- **THEN** a slash projectile travels forward across the stage

#### Scenario: Oni Giri passes through
- **WHEN** Zoro's Oni Giri hits the opponent
- **THEN** Zoro ends up on the opponent's other side and the opponent is knocked down

#### Scenario: Asura
- **WHEN** Zoro's Asura hits the opponent
- **THEN** the opponent takes several heavy hits and is knocked down

### Requirement: Sanji's moves
All of Sanji's attacks SHALL be kicks. Neutral special **Party Table Kick Course**: spinning handstand kicks that hit on both sides of Sanji. Forward special **Mouton Shot**: a lunging kick that covers distance and knocks down. Super **Diable Jambe**: Sanji's leg catches fire for a flaming kick barrage that knocks down.

#### Scenario: Party Table Kick Course hits both sides
- **WHEN** the opponent is directly behind Sanji as he uses Party Table Kick Course
- **THEN** the kicks still hit the opponent

#### Scenario: Mouton Shot
- **WHEN** Sanji uses Mouton Shot from a short distance away from the opponent
- **THEN** he lunges forward and his kick hits and knocks the opponent down

#### Scenario: Diable Jambe
- **WHEN** Sanji's Diable Jambe hits the opponent
- **THEN** his leg is shown on fire, the opponent takes several hits, and is knocked down

### Requirement: Nami's moves
Nami SHALL fight with her Clima-Tact staff. Neutral special **Thunderbolt Tempo**: a small cloud appears above where the opponent stood, and lightning strikes that spot after a short delay. Forward special **Cyclone Tempo**: a gust projectile that pushes the opponent far back. Super **Thunder Lance Tempo**: a fast lightning spear across the stage that deals heavy damage.

#### Scenario: Thunderbolt Tempo can be dodged
- **WHEN** Nami uses Thunderbolt Tempo and the opponent moves away from the marked spot before the lightning strikes
- **THEN** the lightning misses

#### Scenario: Thunderbolt Tempo hits
- **WHEN** the opponent is still on the marked spot when the lightning strikes
- **THEN** the opponent is hit

#### Scenario: Cyclone Tempo pushes back
- **WHEN** Nami's Cyclone Tempo hits the opponent
- **THEN** the opponent is pushed back much farther than by a normal hit

#### Scenario: Thunder Lance Tempo
- **WHEN** Nami uses Thunder Lance Tempo and the opponent is anywhere in front of her on the ground and not guarding
- **THEN** the lightning spear reaches and hits the opponent for heavy damage

### Requirement: Rubber versus lightning gag
Nami's lightning moves (Thunderbolt Tempo and Thunder Lance Tempo) SHALL deal reduced damage to Luffy, who reacts with a rubbery "boing" wobble and a "RUBBER!" pop-up. The reduction SHALL stay small enough that the matchup remains winnable for Nami.

#### Scenario: Lightning hits Luffy
- **WHEN** Nami's Thunderbolt Tempo hits Luffy
- **THEN** Luffy takes less damage than another fighter would take from the same hit, and the boing reaction and "RUBBER!" pop-up are shown

### Requirement: Sanji swoons over Nami
When Sanji faces Nami, Sanji's round intro SHALL show him swooning with heart eyes, and if he wins the match he SHALL bow apologetically instead of his normal victory pose. These gags SHALL NOT change any gameplay.

#### Scenario: Round intro against Nami
- **WHEN** a round starts with Sanji facing Nami
- **THEN** Sanji's intro shows heart eyes

#### Scenario: Sanji beats Nami
- **WHEN** Sanji wins a match against Nami
- **THEN** Sanji bows apologetically instead of doing his normal victory pose

### Requirement: Mirror matches
Both sides SHALL be able to pick the same fighter. The opponent's copy SHALL use an alternate color scheme so the two can be told apart.

#### Scenario: Luffy versus Luffy
- **WHEN** the player picks Luffy and also picks Luffy as the opponent
- **THEN** the match starts and the opponent's Luffy wears different colors

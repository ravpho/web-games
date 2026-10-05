# fight-rules Specification

## Purpose

Defines the rules of a one-on-one match (rounds, timer, health, hits, guarding, attack chains and the super meter) that every fighter, whether player- or computer-controlled, plays by.

## Requirements

### Requirement: Best of three rounds
A match SHALL be won by the first fighter to win two rounds.

#### Scenario: Winning two rounds ends the match
- **WHEN** a fighter wins their second round
- **THEN** the match ends and that fighter is declared the match winner

#### Scenario: One round each leads to a deciding round
- **WHEN** each fighter has won one round
- **THEN** a third round is played

### Requirement: Round time limit
Each round SHALL have a 60-second time limit, counted down in whole seconds while the fight is running. The timer SHALL NOT count down during round announcements, super-move freezes or pauses.

#### Scenario: Timer counts down during play
- **WHEN** a round has been running for 10 seconds of uninterrupted play
- **THEN** the timer shows 50

#### Scenario: Timer stops while paused
- **WHEN** the game is paused for 20 seconds and then resumed
- **THEN** the timer shows the same value it had when the pause began

### Requirement: Knockout ends the round
Each fighter SHALL start every round with full health. When a fighter's health reaches zero, they are knocked out and the other fighter SHALL win the round. Health SHALL never go below zero.

#### Scenario: Health reaches zero
- **WHEN** a hit reduces a fighter's health to zero
- **THEN** that fighter is knocked out and the opponent wins the round

#### Scenario: Health resets each round
- **WHEN** a new round starts
- **THEN** both fighters have full health and stand at their starting positions

### Requirement: Time-out decision
When the timer reaches zero, the fighter with more health remaining SHALL win the round.

#### Scenario: More health wins at time-out
- **WHEN** the timer reaches zero and the player has more health than the opponent
- **THEN** the player wins the round

### Requirement: Drawn rounds are replayed
If the round ends with both fighters on equal health at time-out, or both are knocked out at the same moment, the round SHALL be a draw: neither fighter scores, and the round is replayed.

#### Scenario: Equal health at time-out
- **WHEN** the timer reaches zero with both fighters on exactly equal health
- **THEN** no round win is awarded and the same round number is played again

#### Scenario: Double knockout
- **WHEN** both fighters' health reaches zero at the same moment
- **THEN** no round win is awarded and the same round number is played again

### Requirement: Fighters face each other
Fighters SHALL always face each other, turning automatically when one moves past the other. "Forward" SHALL always mean toward the opponent and "back" away from the opponent.

#### Scenario: Turning after crossing sides
- **WHEN** a fighter ends a move on the other side of their opponent
- **THEN** both fighters turn to face each other once they are free to act

### Requirement: Stage boundaries and spacing
Fighters SHALL stay within the left and right edges of the stage, and standing fighters SHALL NOT overlap each other. Walking into the opponent SHALL stop at the opponent rather than pass through, except during moves that explicitly travel through the opponent.

#### Scenario: Walking into the opponent
- **WHEN** a fighter walks forward into a standing opponent
- **THEN** the fighter stops at the opponent and the two do not overlap

#### Scenario: Stage edge
- **WHEN** a fighter walks back to the edge of the stage
- **THEN** the fighter stops at the edge and goes no farther

### Requirement: Landing a hit
An attack SHALL hit when its striking area overlaps the opponent's body during the attack's active moment. Each hit SHALL deal damage, briefly stun the opponent so they cannot act, and push them away. A single hit of a move SHALL damage a given opponent at most once.

#### Scenario: Attack connects
- **WHEN** a fighter's attack overlaps the unguarded opponent during its active moment
- **THEN** the opponent loses health, is briefly unable to act, and is pushed away

#### Scenario: Attack misses
- **WHEN** an attack's active moment ends without overlapping the opponent
- **THEN** the opponent takes no damage

### Requirement: Knockdowns
The final hit of an attack chain, and the moves marked as knockdown moves in the roster, SHALL knock the opponent down. A knocked-down fighter SHALL NOT be hit again until they are back on their feet.

#### Scenario: Knocked-down fighter cannot be hit
- **WHEN** a fighter is knocked down and the opponent attacks them before they stand up
- **THEN** the attack deals no damage

#### Scenario: Getting up
- **WHEN** a knocked-down fighter has stayed down for the knockdown duration
- **THEN** they stand up and can act again

### Requirement: Guarding
A fighter on the ground who is holding Guard and is not stunned SHALL guard against attacks from either side. A guarding fighter SHALL NOT move or attack, and guarded attacks SHALL push them back slightly.

#### Scenario: Guarding a normal attack
- **WHEN** a guarding fighter is struck by an attack chain hit
- **THEN** they take no damage and are pushed back slightly

#### Scenario: Cannot guard in the air or while stunned
- **WHEN** a fighter holds Guard while in the air or while stunned by a hit
- **THEN** incoming attacks hit them as if they were not guarding

### Requirement: Chip damage
Guarded special and super moves SHALL deal a small fraction of their normal damage. Chip damage SHALL NOT knock a fighter out: it leaves them with at least a sliver of health.

#### Scenario: Guarding a special move
- **WHEN** a guarding fighter is struck by a special move
- **THEN** they take a small fraction of the move's normal damage

#### Scenario: Chip damage cannot knock out
- **WHEN** a guarding fighter with very little health is struck by a special move whose chip damage would reduce their health to zero
- **THEN** they are left with a sliver of health and are not knocked out

### Requirement: Attack chain
Pressing Attack on the ground SHALL start an attack chain of up to three hits. Pressing Attack again before the current hit finishes SHALL continue to the next hit, whether or not earlier hits connected. If Attack is not pressed in time, the chain SHALL end and the next press starts a new chain.

#### Scenario: Three-hit chain
- **WHEN** the player presses Attack three times in quick succession while on the ground
- **THEN** the fighter performs three different chain hits in order, and the third can knock down

#### Scenario: Chain resets after a pause
- **WHEN** the player presses Attack once, waits until the fighter is idle, then presses Attack again
- **THEN** the fighter performs the first chain hit again

### Requirement: Special after a chain hit
A special or super move SHALL be able to start immediately after a chain hit that connected (hit or guarded), without waiting for that hit's recovery to finish.

#### Scenario: Chain into special
- **WHEN** a chain hit connects and the player presses Special before its recovery ends
- **THEN** the special move starts right away

### Requirement: Jumping
A fighter SHALL be able to jump straight up, forward or back, and SHALL perform one jumping attack per jump when Attack is pressed in the air. Special and super moves SHALL NOT be started in the air.

#### Scenario: Jumping attack
- **WHEN** a fighter jumps and the player presses Attack in the air
- **THEN** the fighter performs a jumping attack, and further Attack presses during the same jump do nothing

#### Scenario: No specials in the air
- **WHEN** the player presses Special while their fighter is in the air
- **THEN** no special move starts

### Requirement: Projectiles
Projectile moves SHALL travel across the stage and disappear when they hit a fighter, leave the stage, or meet an opposing projectile, in which case both disappear. Each fighter SHALL have at most one projectile on screen at a time.

#### Scenario: Projectiles cancel each other
- **WHEN** projectiles from both fighters meet
- **THEN** both projectiles disappear without hitting anyone

#### Scenario: One projectile at a time
- **WHEN** a fighter's projectile is still on screen and the player tries that projectile special again
- **THEN** no new projectile is created

### Requirement: Super meter
Each fighter SHALL have a super meter that fills when they deal damage (including chip damage) and fills by a smaller amount when they take damage. The meter SHALL carry over between rounds of a match and start empty at the beginning of each match.

#### Scenario: Meter fills from attacking
- **WHEN** a fighter lands hits on the opponent
- **THEN** their super meter increases

#### Scenario: Meter carries over between rounds
- **WHEN** a round ends with a fighter's meter half full
- **THEN** that fighter starts the next round with a half-full meter

### Requirement: Using a super move
A fighter SHALL only start their super move when their super meter is full, and doing so SHALL empty the meter. Once started, a super move SHALL NOT be interrupted by the opponent's attacks.

#### Scenario: Meter not full
- **WHEN** the player presses Super while the meter is not full
- **THEN** no super move starts and the meter is unchanged

#### Scenario: Super cannot be interrupted
- **WHEN** the opponent's attack overlaps a fighter who has just started their super move
- **THEN** the super move continues and the attack has no effect on it

### Requirement: No control outside of play
Fighters SHALL NOT respond to input during round announcements, after a knockout or time-out until the next round starts, or while the game is paused.

#### Scenario: Input during the round intro
- **WHEN** the player presses Attack while "Round 1" is being announced
- **THEN** the fighter does not attack

### Requirement: Same speed on every device
The game SHALL run the fight at the same speed on every device, whatever the screen's refresh rate, so a 60-second round and every move take the same real time everywhere.

#### Scenario: High refresh rate screen
- **WHEN** the game runs on a 120 Hz display
- **THEN** fighters move and the timer counts down at the same real-time speed as on a 60 Hz display

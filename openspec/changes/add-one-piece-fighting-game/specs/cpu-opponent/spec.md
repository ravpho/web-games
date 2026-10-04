# Spec Delta

## Purpose

Defines the computer-controlled opponent, the only opponent in this version: what it may and may not do, its Easy, Normal and Hard levels, and how each character's style shapes its behavior.

## ADDED Requirements

### Requirement: Same rules as the player
The computer opponent SHALL control its fighter only through the same actions available to the player (move, jump, Attack, Special, forward Special, Guard, Super), with the same damage, speed and meter rules.

#### Scenario: No special advantages
- **WHEN** the computer's fighter performs a move
- **THEN** the move's damage, speed and meter use are exactly what the same move does for the player

### Requirement: Difficulty levels
The player SHALL choose Easy, Normal or Hard before each match, and the chosen level SHALL apply to the whole match.

#### Scenario: Difficulty applies to the match
- **WHEN** the player picks Hard and starts a match
- **THEN** the computer plays at Hard level in every round of that match

### Requirement: Difficulty changes reactions
Harder levels SHALL react faster, guard more often, complete attack chains more often and use specials more deliberately than easier levels.

#### Scenario: Guarding increases with difficulty
- **WHEN** the same attack is aimed many times at an opponent on each level
- **THEN** the Hard opponent guards more of them than the Normal opponent, and the Normal opponent guards more than the Easy opponent

#### Scenario: Reaction speed increases with difficulty
- **WHEN** the player leaves themselves open in the same way on each level
- **THEN** the Hard opponent responds sooner than the Normal opponent, and the Normal opponent responds sooner than the Easy opponent

### Requirement: Beatable on Hard
On every level the computer SHALL take a noticeable moment to react to what the player does, and SHALL NOT guard every attack.

#### Scenario: Hard can still be hit
- **WHEN** the player attacks the Hard opponent repeatedly
- **THEN** some of the attacks land

### Requirement: Character-style behavior
The computer SHALL fight in its character's style: Nami tries to keep her distance and uses her ranged specials, Sanji and Luffy press forward to attack up close, and Zoro advances steadily and looks for heavy hits.

#### Scenario: Nami keeps her distance
- **WHEN** the computer plays Nami and the player is far away
- **THEN** Nami mostly stays at range and uses her specials instead of walking in

#### Scenario: Sanji closes in
- **WHEN** the computer plays Sanji and the player is far away
- **THEN** Sanji moves toward the player to attack

### Requirement: Uses its super
When its super meter is full, the computer SHALL use its super move when the player is within the move's reach. Harder levels SHALL use it sooner after the meter fills.

#### Scenario: Full meter in range
- **WHEN** the computer's meter is full and the player is within its super's reach
- **THEN** the computer uses its super move within a short time, sooner on Hard than on Easy

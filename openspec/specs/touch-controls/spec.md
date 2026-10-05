# touch-controls Specification

## Purpose

Defines the on-screen touch controls for playing on a phone held sideways, and how touches turn into fighter actions, so that 9-12 year olds can play without memorizing joystick motions.

## Requirements

### Requirement: Control layout
During a fight the game SHALL show a movement area on the left side of the screen and four buttons on the right side: Attack, Special, Guard and Super. Each button SHALL be at least 48 CSS pixels across.

#### Scenario: Controls shown in a fight
- **WHEN** a round is in progress
- **THEN** the movement area is on the left and the Attack, Special, Guard and Super buttons are on the right, each at least 48 CSS pixels across

### Requirement: Floating movement pad
Touching anywhere in the left movement area SHALL place the movement pad's center under the thumb. Dragging away from that point SHALL set the direction. Lifting the thumb SHALL return to neutral.

#### Scenario: Pad follows the thumb
- **WHEN** the player touches the movement area at any point
- **THEN** the pad appears centered on that point and drags are measured from it

#### Scenario: Releasing the pad
- **WHEN** the player lifts their thumb from the movement area
- **THEN** the fighter stops walking

### Requirement: Walking and jumping
Dragging left or right SHALL walk the fighter in that direction. Dragging up SHALL jump straight up, and dragging diagonally up-left or up-right SHALL jump in that direction.

#### Scenario: Walk forward
- **WHEN** the fighter faces right and the player drags right
- **THEN** the fighter walks toward the opponent

#### Scenario: Jump forward
- **WHEN** the fighter faces right and the player drags up-right
- **THEN** the fighter jumps forward

### Requirement: Attack button
Pressing Attack SHALL perform the next hit of the attack chain on the ground, or the jumping attack in the air.

#### Scenario: Attack on the ground
- **WHEN** the player presses Attack while the fighter is standing
- **THEN** the fighter performs the first hit of their attack chain

### Requirement: Special button with direction
Pressing Special while holding forward SHALL perform the forward special. Pressing Special with the pad in any other position, or not touched, SHALL perform the neutral special.

#### Scenario: Neutral special
- **WHEN** the player presses Special without touching the movement area
- **THEN** the fighter performs their neutral special

#### Scenario: Forward special
- **WHEN** the player holds the pad toward the opponent and presses Special
- **THEN** the fighter performs their forward special

#### Scenario: Back plus Special
- **WHEN** the player holds the pad away from the opponent and presses Special
- **THEN** the fighter performs their neutral special

### Requirement: Guard button
The fighter SHALL guard for as long as Guard is held, and stop guarding when it is released.

#### Scenario: Holding Guard
- **WHEN** the player holds Guard
- **THEN** the fighter guards until the button is released

### Requirement: Super button state
The Super button SHALL appear dimmed while the super meter is not full and highlighted when it is full. Pressing it while dimmed SHALL do nothing.

#### Scenario: Meter becomes full
- **WHEN** the player's super meter becomes full
- **THEN** the Super button changes from dimmed to highlighted

#### Scenario: Pressing a dimmed Super button
- **WHEN** the player presses Super while it is dimmed
- **THEN** nothing happens

### Requirement: Multi-touch
The controls SHALL accept the movement pad and at least one button at the same time.

#### Scenario: Moving while pressing a button
- **WHEN** the player holds the pad forward with one thumb and taps Special with the other
- **THEN** the fighter performs the forward special

#### Scenario: Walking while guarding
- **WHEN** the player keeps a thumb on the pad and holds Guard with the other thumb
- **THEN** the fighter guards, and resumes walking when Guard is released while the pad is still held

### Requirement: Forgiving button timing
A button pressed shortly before the fighter is able to act (for example, near the end of the previous move or while landing) SHALL be remembered briefly and performed as soon as the fighter can act.

#### Scenario: Early press
- **WHEN** the player presses Special a fraction of a second before the current move ends
- **THEN** the special starts as soon as the current move ends

### Requirement: Press feedback
Every button SHALL visibly react while it is pressed.

#### Scenario: Button pressed
- **WHEN** the player touches the Attack button
- **THEN** the button appears pressed until the touch ends

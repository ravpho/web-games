// Global constants. All times are in simulation frames (60 per second).
// Per-fighter tuning lives in src/fighters/*.js.

export const FPS = 60;
export const STEP_MS = 1000 / FPS;
export const MAX_STEPS_PER_FRAME = 5;

// Logical screen (the canvas is letterboxed to this 16:9 shape).
export const SCREEN_W = 960;
export const SCREEN_H = 540;
export const DPR_CAP = 2;

// Stage geometry. x is the fighter's center, y is height above the floor.
export const GROUND_Y = 470; // screen y of the floor line
export const STAGE_LEFT = 60;
export const STAGE_RIGHT = 900;
export const START_X = [330, 630];

// Bodies.
export const BODY_HALF_WIDTH = 24; // body box for being hit
export const BODY_HEIGHT = 112;
export const PUSH_HALF_WIDTH = 26; // spacing box
export const CROSS_OVER_HEIGHT = 90; // a jumper this high passes over the opponent

// Movement.
export const GRAVITY = 0.9;
export const JUMP_VY = 15.5;
export const FRICTION = 0.8; // decay of knockback slide per frame

// Match rules.
export const ROUNDS_TO_WIN = 2;
export const ROUND_FRAMES = 60 * FPS;
export const INTRO_FRAMES = 120; // "Round N" then "Fight!"
export const FIGHT_CALL_FRAME = 75; // when "Fight!" replaces "Round N"
export const ROUND_END_FRAMES = 150;
export const MATCH_END_FRAMES = 180;
export const MAX_HEALTH = 1000;

// Super meter.
export const METER_MAX = 1000;
export const METER_GAIN_DEALT = 1;
export const METER_GAIN_TAKEN = 0.5;
export const SUPER_FREEZE_FRAMES = 45;

// Hits and guarding.
export const CHIP_RATIO = 0.2;
export const GUARDSTUN_RATIO = 0.7;
export const GUARD_PUSH_RATIO = 0.7;
export const HITSTOP_LIGHT = 5;
export const HITSTOP_HEAVY = 9;
export const HEAVY_DAMAGE = 65; // hits at or above this count as heavy
export const KNOCKDOWN_FRAMES = 45;
export const GETUP_FRAMES = 20;
export const KNOCKDOWN_LAUNCH_VY = 7;

// Gags.
export const LIGHTNING_VS_RUBBER = 0.8;

// Controls.
export const INPUT_BUFFER_FRAMES = 8;

// Tuning constants for The Quiet Gallery — one place for every number the
// rest of the game reads, so balancing is a single-file edit.
export const TILE = 64;
export const COLS = 20;
export const ROWS = 12;
export const W = COLS * TILE; // 1280
export const H = ROWS * TILE; // 768

export const PLAYER_R = 14;
export const WALK_SPEED = 180; // px/s
export const SNEAK_SPEED = 90; // px/s, hold Shift
export const GUARD_SPEED = 110; // px/s on patrol
export const CHASE_SPEED = 200; // px/s during an alarm
export const GUARD_R = 15;

export const VISION_RANGE = 260; // px, how far a guard can see
export const VISION_HALF_ANGLE = (35 * Math.PI) / 180; // cone half-angle
export const SUSPICION_UP = 40; // per second while the thief is seen
export const SUSPICION_DOWN = 25; // per second while hidden
export const ALARM_SECONDS = 4; // an alarm lasts about this long
export const CHASE_LOSE_SECONDS = 3; // unseen this long and the chase ends
export const WAYPOINT_PAUSE = 1.5; // seconds a guard waits at a waypoint
export const COIN_INVESTIGATE_SECONDS = 3; // seconds a guard studies a coin
export const COIN_RADIUS = 300; // px, a guard hears a coin this far away
export const COIN_THROW_RANGE = 420; // px, a coin cannot be thrown further
export const MAX_COINS = 3;
export const MAX_LIVES = 3;
export const GEM_COUNT = 3;
export const CAUGHT_PAUSE = 1.6; // seconds the "Caught!" screen shows

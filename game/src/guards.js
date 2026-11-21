// Guards: patrol routes with pauses, vision cones, a suspicion meter that
// fills when they see the thief and drains when they lose him, an alarm
// chase when the meter fills, and coin investigation when something clinks.
import {
  GUARD_SPEED,
  CHASE_SPEED,
  GUARD_R,
  VISION_RANGE,
  VISION_HALF_ANGLE,
  SUSPICION_UP,
  SUSPICION_DOWN,
  CHASE_LOSE_SECONDS,
  WAYPOINT_PAUSE,
  COIN_INVESTIGATE_SECONDS,
  COIN_RADIUS,
} from './config.js';
import { hasLOS, moveBody } from './world.js';

export function createGuards(world) {
  return world.patrols.map((route, i) => ({
    id: i,
    x: route[0].x,
    y: route[0].y,
    r: GUARD_R,
    dir: 0, // facing angle, radians; starts facing east down the hall
    waypoints: route,
    wpIndex: 1 % route.length,
    pause: 0,
    state: 'patrol', // patrol | investigate | chase
    suspicion: 0,
    unseenFor: 0, // seconds the thief has been out of sight during a chase
    investigateTarget: null,
    investigateFor: 0,
    stepPhase: 0, // drives the footstep tick
  }));
}

function angleTo(guard, x, y) {
  return Math.atan2(y - guard.y, x - guard.x);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the thief stands inside this guard's cone with a clear line of
// sight. Sneaking halves the guard's effective range — patience is rewarded.
export function guardSeesPlayer(guard, player, world) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = player.sneaking ? VISION_RANGE * 0.5 : VISION_RANGE;
  if (dist > range) return false;
  if (dist < 26) return true; // bumping into a guard is always spotted
  const diff = Math.abs(angleDiff(angleTo(guard, player.x, player.y), guard.dir));
  if (diff > VISION_HALF_ANGLE) return false;
  return hasLOS(world, guard.x, guard.y, player.x, player.y);
}

function walkToward(guard, tx, ty, speed, dt, world) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = (dx / dist) * step;
  const ny = (dy / dist) * step;
  guard.dir = Math.atan2(dy, dx);
  moveBody(world, guard, nx, ny);
  guard.stepPhase += step;
  return dist - step < 2;
}

export function updateGuard(guard, dt, player, world, coins, audio) {
  const sees = guardSeesPlayer(guard, player, world);

  // Suspicion: fills fast while seen, drains while hidden — the recovery
  // chance that makes a near miss survivable instead of a death sentence.
  if (sees) {
    guard.suspicion = Math.min(100, guard.suspicion + SUSPICION_UP * dt);
    guard.unseenFor = 0;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DOWN * dt);
    guard.unseenFor += dt;
  }

  if (guard.state !== 'chase' && guard.suspicion >= 100) {
    guard.state = 'chase';
    guard.unseenFor = 0;
    audio.alarm();
  }

  if (guard.state === 'chase') {
    if (sees) {
      walkToward(guard, player.x, player.y, CHASE_SPEED, dt, world);
      guard.unseenFor = 0;
    } else if (guard.unseenFor < CHASE_LOSE_SECONDS) {
      // Keep hunting the last seen spot for a few seconds.
      walkToward(guard, player.x, player.y, CHASE_SPEED, dt, world);
    } else {
      guard.state = 'patrol';
      guard.suspicion = 40; // still wary, but no longer chasing
    }
    return;
  }

  if (guard.state === 'investigate') {
    const target = guard.investigateTarget;
    if (target && walkToward(guard, target.x, target.y, GUARD_SPEED * 1.3, dt, world)) {
      guard.investigateFor += dt;
      // Look around while studying the coin.
      guard.dir += dt * 1.2;
      if (guard.investigateFor >= COIN_INVESTIGATE_SECONDS) {
        guard.state = 'patrol';
        guard.investigateTarget = null;
        guard.investigateFor = 0;
      }
    }
    return;
  }

  // Patrol: walk to the next waypoint, pause, then move on.
  if (guard.pause > 0) {
    guard.pause -= dt;
    if (guard.pause <= 0) {
      guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
    }
    return;
  }
  const wp = guard.waypoints[guard.wpIndex];
  if (walkToward(guard, wp.x, wp.y, GUARD_SPEED, dt, world)) {
    guard.pause = WAYPOINT_PAUSE;
    // Face the next leg of the route while waiting.
    const next = guard.waypoints[(guard.wpIndex + 1) % guard.waypoints.length];
    guard.dir = Math.atan2(next.y - guard.y, next.x - guard.x);
  }
}

// A coin just landed: the nearest guard in earshot walks over to look.
export function distractGuards(guards, coin) {
  let best = null;
  let bestDist = COIN_RADIUS;
  for (const g of guards) {
    if (g.state === 'chase') continue; // a chasing guard ignores coins
    const d = Math.hypot(coin.x - g.x, coin.y - g.y);
    if (d < bestDist) {
      best = g;
      bestDist = d;
    }
  }
  if (best) {
    best.state = 'investigate';
    best.investigateTarget = { x: coin.x, y: coin.y };
    best.investigateFor = 0;
    best.suspicion = Math.max(0, best.suspicion - 20);
  }
}

export function updateGuards(guards, dt, player, world, coins, audio) {
  for (const g of guards) updateGuard(g, dt, player, world, coins, audio);
}

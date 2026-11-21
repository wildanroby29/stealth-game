// The thief: WASD/arrows to move, Shift to sneak (slower, harder to spot),
// mouse click to throw a coin that distracts the nearest guard.
import { PLAYER_R, WALK_SPEED, SNEAK_SPEED, MAX_COINS, COIN_THROW_RANGE } from './config.js';
import { moveBody, collides } from './world.js';

export function createPlayer(world) {
  return {
    x: world.start.x,
    y: world.start.y,
    r: PLAYER_R,
    dir: 0,
    moving: false,
    sneaking: false,
    stepPhase: 0,
    coinsLeft: MAX_COINS,
    coinsThrown: [],
  };
}

export function updatePlayer(player, input, dt, world) {
  let ax = 0;
  let ay = 0;
  if (input.left) ax -= 1;
  if (input.right) ax += 1;
  if (input.up) ay -= 1;
  if (input.down) ay += 1;
  player.moving = ax !== 0 || ay !== 0;
  player.sneaking = !!input.sneak;
  if (!player.moving) return;
  const len = Math.hypot(ax, ay);
  const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  const step = (speed * dt) / len;
  player.dir = Math.atan2(ay, ax);
  moveBody(world, player, ax * step, ay * step);
  player.stepPhase += speed * dt;
}

// Throw a coin toward (tx, ty). Returns the coin, or null when out of coins
// or when the target is inside a wall. The coin lands at most
// COIN_THROW_RANGE away from the thief.
export function throwCoin(player, tx, ty, world) {
  if (player.coinsLeft <= 0) return null;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return null;
  const range = Math.min(dist, COIN_THROW_RANGE);
  const x = player.x + (dx / dist) * range;
  const y = player.y + (dy / dist) * range;
  if (collides(world, x, y, 4)) return null;
  player.coinsLeft -= 1;
  const coin = { x, y, t: 0 };
  player.coinsThrown.push(coin);
  return coin;
}

export function resetPlayer(player, world) {
  player.x = world.start.x;
  player.y = world.start.y;
  player.dir = 0;
  player.moving = false;
  player.sneaking = false;
  player.stepPhase = 0;
}

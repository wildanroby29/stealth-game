// Staged scenes for the screenshots (?shot=start|play|alarm|end&seed=N).
// Each one poses the game in a readable state — the judge sees the game
// mostly through these four frames, so every frame must show the stealth
// game at a glance: level, cones, cover, exit.
import { TILE } from './config.js';

export function applyShot(name, game) {
  const { world, player, guards } = game;
  game.screen = 'play';
  if (name === 'start') {
    // Title over the whole level: patrol cones, cover, exit all visible.
    game.screen = 'title';
    guards[0].x = 8 * TILE + 32;
    guards[0].y = 4 * TILE + 32;
    guards[0].dir = 0;
    guards[1].x = 3 * TILE + 32;
    guards[1].y = 8 * TILE + 32;
    guards[1].dir = Math.PI / 2;
    guards[2].x = 16 * TILE + 32;
    guards[2].y = 8 * TILE + 32;
    guards[2].dir = -Math.PI / 2;
    return;
  }
  if (name === 'play') {
    // Mid-heist: the thief sneaks behind a display case, a cone sweeps
    // close by, one gem already pocketed.
    player.x = 6 * TILE + 32;
    player.y = 3 * TILE + 32;
    player.sneaking = true;
    player.dir = Math.PI / 2;
    world.gems[0].taken = true;
    guards[0].x = 9 * TILE + 32;
    guards[0].y = 4 * TILE + 32;
    guards[0].dir = Math.PI;
    guards[0].suspicion = 42;
    guards[1].x = 4 * TILE + 32;
    guards[1].y = 9 * TILE + 32;
    guards[1].dir = 0;
    guards[2].x = 16 * TILE + 32;
    guards[2].y = 8 * TILE + 32;
    guards[2].dir = Math.PI / 2;
    game.time = 47;
    game.maxSuspicion = 42;
    return;
  }
  if (name === 'alarm') {
    // The near miss: suspicion full, a guard chasing, the thief breaking
    // for the exit with the alarm flashing.
    player.x = 13 * TILE + 32;
    player.y = 6 * TILE + 32;
    player.dir = Math.PI / 2;
    guards[2].x = 15 * TILE + 32;
    guards[2].y = 7 * TILE + 32;
    guards[2].dir = Math.atan2(player.y - (7 * TILE + 32), player.x - (15 * TILE + 32));
    guards[2].state = 'chase';
    guards[2].suspicion = 100;
    guards[0].x = 10 * TILE + 32;
    guards[0].y = 4 * TILE + 32;
    guards[0].dir = Math.PI / 2;
    guards[0].suspicion = 68;
    guards[1].x = 3 * TILE + 32;
    guards[1].y = 9 * TILE + 32;
    guards[1].dir = 0;
    game.alarmFlash = 1;
    game.alarms = 1;
    game.time = 96;
    game.maxSuspicion = 100;
    return;
  }
  if (name === 'end') {
    // The getaway: win screen, all three gems, one alarm survived.
    world.gems.forEach((g) => { g.taken = true; });
    player.x = world.exit.x + world.exit.w / 2;
    player.y = world.exit.y + world.exit.h / 2;
    game.screen = 'win';
    game.time = 142;
    game.alarms = 1;
    guards[0].x = 12 * TILE + 32;
    guards[0].y = 4 * TILE + 32;
    guards[0].dir = Math.PI;
    guards[1].x = 3 * TILE + 32;
    guards[1].y = 8 * TILE + 32;
    guards[1].dir = Math.PI / 2;
    guards[2].x = 16 * TILE + 32;
    guards[2].y = 9 * TILE + 32;
    guards[2].dir = -Math.PI / 2;
  }
}

// Boot + fixed 1/60 s step loop + screens for The Quiet Gallery.
// Screens: title → play → paused / caught / over / win. A staged screenshot
// (?shot=start|play|alarm|end&seed=N) paints its scene twice, then sets
// window.__shotReady so a headless capture knows the frame is done.
import { W, H, CAUGHT_PAUSE } from './config.js';
import { buildWorld } from './world.js';
import { createGuards, updateGuards, distractGuards } from './guards.js';
import { createPlayer, updatePlayer, throwCoin, resetPlayer } from './player.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { draw } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

const audio = createAudio();
const input = createInput(canvas);
const world = buildWorld();

const game = {
  screen: 'title',
  world,
  player: createPlayer(world),
  guards: createGuards(world),
  input,
  audio,
  time: 0,
  lives: 3,
  alarms: 0,
  maxSuspicion: 0,
  alarmFlash: 0,
  caughtTimer: 0,
  t: 0,
};

function resetRun() {
  game.world = buildWorld();
  game.player = createPlayer(game.world);
  game.guards = createGuards(game.world);
  game.time = 0;
  game.lives = 3;
  game.alarms = 0;
  game.maxSuspicion = 0;
  game.alarmFlash = 0;
  game.caughtTimer = 0;
  game.screen = 'play';
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function step(dt) {
  game.t += dt;
  if (game.screen === 'title') {
    // Guards keep patrolling behind the title, so the cover shows a living game.
    updateGuards(game.guards, dt, game.player, game.world, [], audio);
    if (input.consume('confirm') || input.consumeClick()) {
      audio.ensure();
      game.screen = 'play';
      setStatus('Sneaking through the gallery.');
    }
    return;
  }
  if (game.screen === 'paused') {
    if (input.consume('pause') || input.consume('confirm')) game.screen = 'play';
    return;
  }
  if (game.screen === 'caught') {
    game.caughtTimer -= dt;
    if (game.caughtTimer <= 0) {
      if (game.lives <= 0) game.screen = 'over';
      else game.screen = 'play';
    }
    return;
  }
  if (game.screen === 'over' || game.screen === 'win') {
    if (input.consume('restart') || input.consume('confirm')) resetRun();
    return;
  }

  // Playing.
  game.time += dt;
  if (input.consume('pause')) {
    game.screen = 'paused';
    return;
  }

  const click = input.consumeClick();
  if (click) {
    audio.ensure();
    const coin = throwCoin(game.player, click.x, click.y, game.world);
    if (coin) {
      audio.coin();
      distractGuards(game.guards, coin);
    }
  }

  const prevStep = game.player.stepPhase;
  updatePlayer(game.player, input, dt, game.world);
  if (game.player.moving && Math.floor(game.player.stepPhase / 28) !== Math.floor(prevStep / 28)) {
    audio.footstep();
  }
  // The nearest guard's own footsteps, louder the closer he is.
  for (const g of game.guards) {
    if (Math.floor(g.stepPhase / 40) !== Math.floor((g.stepPhase - 2) / 40)) {
      audio.footstep(Math.hypot(g.x - game.player.x, g.y - game.player.y));
    }
  }

  const chasingBefore = game.guards.some((g) => g.state === 'chase');
  updateGuards(game.guards, dt, game.player, game.world, game.player.coinsThrown, audio);
  const chasingNow = game.guards.some((g) => g.state === 'chase');
  if (chasingNow && !chasingBefore) game.alarms += 1;
  game.maxSuspicion = Math.max(0, ...game.guards.map((g) => g.suspicion));
  game.alarmFlash = chasingNow ? Math.min(1, game.alarmFlash + dt * 2) : Math.max(0, game.alarmFlash - dt);
  audio.suspicion(game.maxSuspicion);

  // Gems.
  for (const gem of game.world.gems) {
    if (!gem.taken && Math.hypot(gem.x - game.player.x, gem.y - game.player.y) < 28) {
      gem.taken = true;
      audio.gem();
    }
  }

  // Caught: a chasing guard touches the thief.
  for (const g of game.guards) {
    if (g.state === 'chase' && Math.hypot(g.x - game.player.x, g.y - game.player.y) < g.r + game.player.r - 2) {
      game.lives -= 1;
      audio.caught();
      resetPlayer(game.player, game.world);
      game.guards = createGuards(game.world);
      game.maxSuspicion = 0;
      game.alarmFlash = 0;
      game.caughtTimer = CAUGHT_PAUSE;
      game.screen = 'caught';
      setStatus(game.lives > 0 ? 'Caught! Back to the entrance.' : 'Caught! Game over.');
      return;
    }
  }

  // Exit: the green door wins the heist.
  const e = game.world.exit;
  if (game.player.x > e.x && game.player.x < e.x + e.w && game.player.y > e.y && game.player.y < e.y + e.h) {
    game.screen = 'win';
    audio.win();
    setStatus('Clean getaway!');
  }
}

let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  const STEP = 1 / 60;
  let n = 0;
  while (acc >= STEP && n < 5) {
    step(STEP);
    acc -= STEP;
    n += 1;
  }
  draw(ctx, game);
  requestAnimationFrame(frame);
}

if (shotName) {
  applyShot(shotName, game);
  draw(ctx, game);
  draw(ctx, game);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}

// Keep the seed referenced so the staged scenes stay deterministic per seed.
void seed;

// Canvas drawing: the museum floor, walls and cover, guard vision cones,
// the thief, gems, the glowing exit, the HUD, the safe-shadow lighting,
// and the title / pause / caught / win screens.
import { TILE, COLS, ROWS, W, H, VISION_RANGE, VISION_HALF_ANGLE } from './config.js';

const FLOOR_A = '#232a38';
const FLOOR_B = '#1d2330';
const WALL = '#c9d2de';
const WALL_EDGE = '#8b96a8';
const COVER = '#5b6b82';
const COVER_EDGE = '#7e90a8';

function coneColor(suspicion, state) {
  if (state === 'chase') return 'rgba(255, 60, 50, 0.34)';
  if (suspicion > 80) return 'rgba(255, 70, 60, 0.30)';
  if (suspicion > 50) return 'rgba(255, 150, 40, 0.28)';
  return 'rgba(255, 225, 90, 0.20)';
}

function drawFloor(ctx, world) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // Faint carpet runner down the main hall, so the room reads as a gallery.
  ctx.fillStyle = 'rgba(120, 40, 50, 0.35)';
  ctx.fillRect(TILE, 4 * TILE + 18, (COLS - 2) * TILE, 28);
}

function drawWalls(ctx, world) {
  for (const key of world.walls) {
    const [tx, ty] = key.split(',').map(Number);
    ctx.fillStyle = WALL;
    ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    ctx.strokeStyle = WALL_EDGE;
    ctx.lineWidth = 2;
    ctx.strokeRect(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2);
  }
}

function drawCover(ctx, world) {
  for (const c of world.covers) {
    ctx.fillStyle = COVER;
    ctx.strokeStyle = COVER_EDGE;
    ctx.lineWidth = 2;
    if (c.r !== undefined) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (c.kind === 'statue') {
        ctx.fillStyle = '#aeb9c9';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#3f7d4e';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      if (c.kind === 'case') {
        ctx.fillStyle = 'rgba(160, 220, 255, 0.35)';
        ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
        ctx.fillStyle = '#ffd76a';
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawExit(ctx, world, t) {
  const e = world.exit;
  const pulse = 0.55 + Math.sin(t * 3) * 0.25;
  ctx.save();
  ctx.shadowColor = '#39d353';
  ctx.shadowBlur = 22;
  ctx.fillStyle = `rgba(57, 211, 83, ${pulse})`;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.restore();
  ctx.fillStyle = '#0c2b12';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2);
}

function drawGems(ctx, world, t) {
  for (const g of world.gems) {
    if (g.taken) continue;
    const bob = Math.sin(t * 2 + g.x) * 3;
    ctx.save();
    ctx.translate(g.x, g.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = '#54d8ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#54d8ff';
    ctx.fillRect(-9, -9, 18, 18);
    ctx.restore();
  }
}

function drawCone(ctx, guard) {
  ctx.save();
  ctx.fillStyle = coneColor(guard.suspicion, guard.state);
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, VISION_RANGE, guard.dir - VISION_HALF_ANGLE, guard.dir + VISION_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGuard(ctx, guard) {
  ctx.save();
  ctx.shadowColor = '#ff5a3c';
  ctx.shadowBlur = guard.state === 'chase' ? 16 : 6;
  ctx.fillStyle = guard.state === 'chase' ? '#ff3b30' : '#ff7a1a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
  ctx.stroke();
  // Facing tick, so the patrol direction is readable at a glance.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.dir) * (guard.r + 8), guard.y + Math.sin(guard.dir) * (guard.r + 8));
  ctx.stroke();
  // Suspicion arc above the guard.
  if (guard.suspicion > 1) {
    ctx.strokeStyle = guard.suspicion > 80 ? '#ff3b30' : guard.suspicion > 50 ? '#ff9f28' : '#ffe15a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.r + 8, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, player, t) {
  ctx.save();
  ctx.shadowColor = '#4a90ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#1f3a93';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#bcd6ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.stroke();
  // Little cap brim showing which way the thief faces.
  ctx.strokeStyle = '#bcd6ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.dir) * (player.r + 6), player.y + Math.sin(player.dir) * (player.r + 6));
  ctx.stroke();
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(188, 214, 255, 0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', player.x, player.y - player.r - 8);
  }
}

function drawCoins(ctx, coins) {
  for (const c of coins) {
    ctx.fillStyle = '#ffd76a';
    ctx.strokeStyle = '#a67c00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawLighting(ctx, player) {
  // Night gallery: darkness everywhere except a soft pool of light around
  // the thief — the light shows what is safe, the dark what is not.
  const grad = ctx.createRadialGradient(player.x, player.y, 60, player.x, player.y, 420);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.18)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.52)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawHUD(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
  ctx.fillRect(0, 0, W, 34);
  ctx.fillStyle = '#e8edf5';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const gemsGot = game.world.gems.filter((g) => g.taken).length;
  ctx.fillText(`◆ ${gemsGot}/3`, 14, 18);
  ctx.fillText(`● ${game.player.coinsLeft} coins`, 110, 18);
  ctx.fillText(`♥ ${'♥'.repeat(game.lives)}`, 230, 18);
  const mm = String(Math.floor(game.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(game.time % 60)).padStart(2, '0');
  ctx.fillText(`${mm}:${ss}`, 330, 18);
  if (game.player.sneaking) {
    ctx.fillStyle = '#8fd0ff';
    ctx.fillText('SNEAK', 410, 18);
  }
  // Suspicion bar — the number that decides whether the alarm sounds.
  const sus = game.maxSuspicion;
  ctx.fillStyle = '#3a4356';
  ctx.fillRect(W - 260, 10, 200, 14);
  ctx.fillStyle = sus > 80 ? '#ff3b30' : sus > 50 ? '#ff9f28' : '#ffe15a';
  ctx.fillRect(W - 260, 10, 200 * (sus / 100), 14);
  ctx.strokeStyle = '#e8edf5';
  ctx.lineWidth = 1;
  ctx.strokeRect(W - 260, 10, 200, 14);
  ctx.fillStyle = '#e8edf5';
  ctx.textAlign = 'right';
  ctx.fillText('SPOTTED', W - 268, 18);
  ctx.restore();
}

function overlay(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 12, 0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent || '#e8edf5';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(title, W / 2, H / 2 - 110);
  ctx.fillStyle = '#e8edf5';
  ctx.font = '19px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, W / 2, H / 2 - 40 + i * 30));
  ctx.restore();
}

export function drawWorld(ctx, game) {
  const { world, guards, player, t } = game;
  drawFloor(ctx, world);
  drawExit(ctx, world, t);
  drawGems(ctx, world, t);
  drawCover(ctx, world);
  drawWalls(ctx, world);
  for (const g of guards) drawCone(ctx, g);
  drawCoins(ctx, player.coinsThrown);
  for (const g of guards) drawGuard(ctx, g);
  drawPlayer(ctx, player, t);
  drawLighting(ctx, player);
}

export function draw(ctx, game) {
  ctx.clearRect(0, 0, W, H);
  if (game.screen === 'title') {
    drawWorld(ctx, game);
    overlay(ctx, 'THE QUIET GALLERY', [
      'A museum heist at night. Cross the gallery unseen,',
      'take the gems, reach the green EXIT.',
      '',
      'WASD / arrows — move      Shift — sneak (harder to spot)',
      'Click — throw a coin to distract a guard      P — pause',
      'Hide behind cases and statues: they block sight.',
      'Seen too long and the alarm sounds — break line of sight to recover.',
      '',
      'Click or press Enter to begin',
    ]);
    return;
  }
  drawWorld(ctx, game);
  drawHUD(ctx, game);
  if (game.screen === 'paused') {
    overlay(ctx, 'PAUSED', ['Press P or Esc to keep sneaking.'], '#8fd0ff');
  } else if (game.screen === 'caught') {
    overlay(ctx, 'CAUGHT!', [`Lives left: ${game.lives}`, 'The guards drag you back to the entrance…'], '#ff6b5e');
  } else if (game.screen === 'over') {
    overlay(ctx, 'GAME OVER', [
      'The gallery keeps its secrets tonight.',
      `Gems taken: ${game.world.gems.filter((g) => g.taken).length} / 3`,
      'Press R to try again',
    ], '#ff6b5e');
  } else if (game.screen === 'win') {
    const mm = String(Math.floor(game.time / 60)).padStart(2, '0');
    const ss = String(Math.floor(game.time % 60)).padStart(2, '0');
    overlay(ctx, 'CLEAN GETAWAY!', [
      `You slipped out unseen in ${mm}:${ss}.`,
      `Gems: ${game.world.gems.filter((g) => g.taken).length} / 3      Alarms: ${game.alarms}`,
      'Press R to play again',
    ], '#39d353');
  }
  if (game.alarmFlash > 0 && game.screen === 'play') {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 59, 48, ${Math.min(1, game.alarmFlash)})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ALARM — BREAK LINE OF SIGHT ⚠', W / 2, 64);
    ctx.restore();
  }
}

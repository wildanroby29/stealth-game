// The museum floor plan and everything that answers "can I walk here?" and
// "can a guard see through here?".
// Legend: # wall, . floor, C display case (rect cover), S statue (round cover),
// B bench (rect cover), P plant (round cover), G gem, E exit door, T thief start.
import { TILE, COLS, ROWS } from './config.js';

export const MAP = [
  '####################',
  '#T....C.....C....G.#',
  '#.....C.....C......#',
  '#..S......B.....SG.#',
  '#..................#',
  '####..######..######',
  '#......#......#....#',
  '#..C...#..S...#..C.#',
  '#......#......#....#',
  '#..G...#......#.E..#',
  '#......#......#....#',
  '####################',
];

// Guard patrol routes, as tile coordinates (centres). Each route is a loop
// the guard walks with a short pause at every waypoint — a route a player
// can watch, learn, and time their crossing against.
export const PATROLS = [
  // Top gallery, long east-west sweep across the open hall.
  [[2, 4], [17, 4]],
  // Bottom-left room, a small loop past the gem.
  [[2, 7], [5, 7], [5, 10], [2, 10]],
  // Bottom-right room, guarding the exit door.
  [[15, 7], [17, 7], [17, 10], [15, 10]],
];

const tileCenter = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });

export function buildWorld() {
  const walls = new Set(); // "tx,ty" of solid wall tiles
  const covers = []; // {kind, x, y, w, h, r} in pixels; block movement and sight
  const gems = [];
  let exit = null;
  let start = null;

  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = MAP[ty][tx];
      const cx = tx * TILE;
      const cy = ty * TILE;
      if (ch === '#') walls.add(tx + ',' + ty);
      else if (ch === 'C') covers.push({ kind: 'case', x: cx + 8, y: cy + 8, w: TILE - 16, h: TILE - 16 });
      else if (ch === 'S') covers.push({ kind: 'statue', x: cx + TILE / 2, y: cy + TILE / 2, r: 22 });
      else if (ch === 'B') covers.push({ kind: 'bench', x: cx + 6, y: cy + 18, w: TILE - 12, h: 28 });
      else if (ch === 'P') covers.push({ kind: 'plant', x: cx + TILE / 2, y: cy + TILE / 2, r: 16 });
      else if (ch === 'G') gems.push({ x: cx + TILE / 2, y: cy + TILE / 2, taken: false });
      else if (ch === 'E') exit = { x: cx + 6, y: cy, w: TILE - 12, h: TILE };
      else if (ch === 'T') start = tileCenter(tx, ty);
    }
  }

  const patrols = PATROLS.map((route) => route.map(([tx, ty]) => tileCenter(tx, ty)));

  return { walls, covers, gems, exit, start, patrols };
}

export function isWallTile(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return world.walls.has(tx + ',' + ty);
}

// True when the point sits inside a wall tile or a piece of cover.
export function pointIsSolid(world, x, y) {
  if (isWallTile(world, Math.floor(x / TILE), Math.floor(y / TILE))) return true;
  for (const c of world.covers) {
    if (c.r !== undefined) {
      const dx = x - c.x;
      const dy = y - c.y;
      if (dx * dx + dy * dy < c.r * c.r) return true;
    } else if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
      return true;
    }
  }
  return false;
}

// Circle-vs-world collision for a moving body of radius r at (x, y).
export function collides(world, x, y, r) {
  const tx0 = Math.floor((x - r) / TILE);
  const tx1 = Math.floor((x + r) / TILE);
  const ty0 = Math.floor((y - r) / TILE);
  const ty1 = Math.floor((y + r) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (!isWallTile(world, tx, ty)) continue;
      const rx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const ry = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      const dx = x - rx;
      const dy = y - ry;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  for (const c of world.covers) {
    if (c.r !== undefined) {
      const dx = x - c.x;
      const dy = y - c.y;
      if (dx * dx + dy * dy < (r + c.r) * (r + c.r)) return true;
    } else {
      const rx = Math.max(c.x, Math.min(x, c.x + c.w));
      const ry = Math.max(c.y, Math.min(y, c.y + c.h));
      const dx = x - rx;
      const dy = y - ry;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

// Line of sight: sample the segment in small steps; a wall or a piece of
// cover anywhere along it blocks the view. Sampling keeps the check simple
// and exact enough for a 260px vision cone.
export function hasLOS(world, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointIsSolid(world, x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

// Move a circle body by (dx, dy), sliding along walls: try the full step,
// then each axis alone, so the thief slides around corners instead of
// sticking to them.
export function moveBody(world, body, dx, dy) {
  if (!collides(world, body.x + dx, body.y + dy, body.r)) {
    body.x += dx;
    body.y += dy;
    return;
  }
  if (!collides(world, body.x + dx, body.y, body.r)) body.x += dx;
  if (!collides(world, body.x, body.y + dy, body.r)) body.y += dy;
}

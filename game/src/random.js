// Seeded random numbers (mulberry32) so a staged screenshot with ?seed=N
// always paints the same scene, and the game stays deterministic per seed.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an integer in [min, max] from a seeded generator.
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

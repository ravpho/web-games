// Seeded pseudo-random numbers (mulberry32). The generator state is a plain object
// so it can live inside the match state and be copied or compared like any other data.

export function createRng(seed) {
  return { s: seed >>> 0 };
}

// Returns a float in [0, 1) and advances the generator.
export function random(rng) {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(rng, p) {
  return random(rng) < p;
}

// Integer in [min, max] inclusive.
export function randInt(rng, min, max) {
  return min + Math.floor(random(rng) * (max - min + 1));
}

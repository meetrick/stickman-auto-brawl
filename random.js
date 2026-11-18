// A seeded PRNG makes a spectacular round reproducible without changing its odds.
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const range = (rng, lo, hi) => lo + rng() * (hi - lo);

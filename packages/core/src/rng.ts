/**
 * Deterministic RNG. Each model instance gets its own `sfc32` stream seeded
 * from (masterSeed, instanceKey), so adding or removing a model never perturbs
 * another model's random draws — a property that keeps trade studies stable.
 */

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  range(min: number, max: number): number;
  /** True with probability p. */
  chance(p: number): boolean;
  /** Standard-normal sample (Box–Muller). */
  normal(mean?: number, stdev?: number): number;
}

/** FNV-1a string hash → 32-bit, used to derive per-instance seeds. */
export function hashSeed(masterSeed: number, key: string): number {
  let h = (2166136261 ^ (masterSeed >>> 0)) >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** sfc32 — fast, well-distributed, tiny-state PRNG. */
export function makeRng(seed: number): Rng {
  let a = (seed >>> 0) || 1;
  let b = (Math.imul(seed, 0x9e3779b1) >>> 0) || 2;
  let c = (Math.imul(seed ^ 0x6d2b79f5, 0x85ebca6b) >>> 0) || 3;
  let d = 0xdeadbeef >>> 0;
  const next = (): number => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  // Warm up so nearby seeds diverge quickly.
  for (let i = 0; i < 12; i++) next();
  let spare: number | null = null;
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    chance: (p) => next() < p,
    normal: (mean = 0, stdev = 1) => {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return mean + stdev * v;
      }
      let u = 0;
      let v = 0;
      let s = 0;
      do {
        u = next() * 2 - 1;
        v = next() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const m = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * m;
      return mean + stdev * (u * m);
    },
  };
}

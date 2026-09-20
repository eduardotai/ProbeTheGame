/**
 * Seeded RNG for finite A→B transit generation.
 * Same seed → same sequence. Not an endless arena.
 */
export type Rng = {
  readonly seed: number;
  /** Uniform in [0, 1). */
  next(): number;
  /** Inclusive integer range. */
  int(min: number, max: number): number;
  float(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(p: number): boolean;
};

/** Mulberry32. Seed 0 is allowed; it is mixed so the stream is still usable. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed: seed >>> 0,
    next,
    int(min: number, max: number): number {
      if (max < min) {
        return min;
      }
      return min + Math.floor(next() * (max - min + 1));
    },
    float(min: number, max: number): number {
      return min + next() * (max - min);
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error('Rng.pick on empty list');
      }
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) {
        throw new Error('Rng.pick missed');
      }
      return item;
    },
    chance(p: number): boolean {
      return next() < p;
    },
  };
}

export function formatSeed(seed: number): string {
  return (seed >>> 0).toString(16).padStart(8, '0');
}

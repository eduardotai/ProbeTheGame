/**
 * Transit seed lock for procedural A→B spines.
 * `?seed=12345` wins. Otherwise the first roll is kept for this page so
 * Play Again (R) retries the same layout; a full reload without `seed` rolls new.
 */
const HELD_SEED_KEY = '__probeTransitSeed';

function asHeld(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value >>> 0 : null;
}

export function resolveTransitSeed(search = window.location.search): number {
  const raw = new URLSearchParams(search).get('seed')?.trim() ?? '';
  if (/^\d+$/.test(raw)) {
    const locked = Number(raw) >>> 0;
    holdTransitSeed(locked);
    return locked;
  }
  const held = asHeld((window as Window & { [HELD_SEED_KEY]?: unknown })[HELD_SEED_KEY]);
  if (held !== null) {
    return held;
  }
  const generated = (Math.random() * 0xffffffff) >>> 0;
  holdTransitSeed(generated);
  return generated;
}

export function holdTransitSeed(seed: number): void {
  (window as Window & { [HELD_SEED_KEY]?: number })[HELD_SEED_KEY] = seed >>> 0;
}

export function peekHeldTransitSeed(): number | null {
  return asHeld((window as Window & { [HELD_SEED_KEY]?: unknown })[HELD_SEED_KEY]);
}

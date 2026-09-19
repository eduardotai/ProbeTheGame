import { DriftTuning } from './tuning';

/** Dodges (and later boosts) are fuel-limited in Drift (GDD §4.1). */
export class FuelTank {
  readonly capacity: number;
  current: number;

  constructor(capacity = DriftTuning.fuelCapacity) {
    this.capacity = capacity;
    this.current = capacity;
  }

  tryConsumeDodge(cost = DriftTuning.dodgeCost): boolean {
    if (this.current < cost) {
      return false;
    }
    this.current = Math.max(0, this.current - cost);
    return true;
  }

  /** Slow regen so empty tank blocks dodges, not movement. */
  update(deltaMs: number): void {
    if (deltaMs <= 0 || this.current >= this.capacity) {
      return;
    }
    this.current = Math.min(
      this.capacity,
      this.current + (DriftTuning.fuelRegenPerSec * deltaMs) / 1000,
    );
  }

  toBar(width = 12): string {
    const filled = Math.round((this.current / this.capacity) * width);
    const clamped = Math.max(0, Math.min(width, filled));
    return `[${'#'.repeat(clamped)}${'.'.repeat(width - clamped)}]`;
  }
}

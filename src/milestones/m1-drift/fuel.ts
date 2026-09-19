const DEFAULT_CAPACITY = 100;
const DODGE_COST = 18;

/** Fuel tank stub. Dodges and boosts are fuel-limited in Drift (GDD §4.1). */
export class FuelTank {
  readonly capacity: number;
  current: number;

  constructor(capacity = DEFAULT_CAPACITY) {
    this.capacity = capacity;
    this.current = capacity;
  }

  tryConsumeDodge(cost = DODGE_COST): boolean {
    if (this.current < cost) {
      return false;
    }
    this.current = Math.max(0, this.current - cost);
    // TODO(M1): regen rules, boost cost, empty-tank fail state.
    return true;
  }

  toBar(width = 12): string {
    const filled = Math.round((this.current / this.capacity) * width);
    return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}]`;
  }
}

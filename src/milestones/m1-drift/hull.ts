import { DriftTuning } from './tuning';

/** Fragile probe hull. Hull 0 ends the run (GDD §2 / PRD §5). */
export class Hull {
  readonly max: number;
  current: number;

  constructor(max: number = DriftTuning.hullMax, current: number = max) {
    this.max = max;
    this.current = Math.max(0, Math.min(max, current));
  }

  applyHit(amount = 1): number {
    this.current = Math.max(0, this.current - amount);
    return this.current;
  }

  get depleted(): boolean {
    return this.current <= 0;
  }

  toBar(): string {
    return `${'█'.repeat(this.current)}${'░'.repeat(this.max - this.current)}`;
  }
}

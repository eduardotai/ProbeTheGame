import { createProbe } from './probe';
import { applyKeyboardMovement, haltProbe, tryDodge } from './movement';
export { createDriftCovers, coverRects, type DriftCover } from './cover';
export { FuelTank } from './fuel';
export { Hull } from './hull';
export {
  createLosHunter,
  emitDodgeNoise,
  haltHunter,
  hasLineOfSight,
  stunHunter,
  updateLosHunter,
  type LosHunter,
  type NoisePulse,
} from './hunterLos';
export { applyKeyboardMovement, createProbe, haltProbe, tryDodge };
export { createPointBTrigger, type PointBTrigger } from './pointB';
export { DriftTuning } from './tuning';

/** Drift is Map 1 phase 1 (GDD §4.1). Registered in M2 for later chaining. */
export const driftPhaseStub = {
  id: 'drift' as const,
  title: 'Drift',
};

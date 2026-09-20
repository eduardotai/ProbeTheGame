import { createProbe } from './probe';
import { applyKeyboardMovement, haltProbe, tryDodge } from './movement';
export { createDriftCovers, coverRects, paintDriftField, type DriftCover } from './cover';
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
export { DriftSpine, DriftTuning } from './tuning';
export {
  generateDriftLayout,
  type CoverSpec,
  type DriftLayout,
  type HunterSpec,
  type SegmentKind,
  type SpineSegment,
} from './procSpine';

/** Drift is Map 1 phase 1 (GDD §4.1). Registered in M2 for later chaining. */
export const driftPhaseStub = {
  id: 'drift' as const,
  title: 'Drift',
};

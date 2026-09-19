export { createProbe } from './probe';
export { applyKeyboardMovement, tryDodge } from './movement';
export { FuelTank } from './fuel';
export { createLosHunter, hasLineOfSight, type LosHunter } from './hunterLos';
export { createPointBTrigger, type PointBTrigger } from './pointB';

/** Drift is Map 1 phase 1 (GDD §4.1). Implemented under M1, registered in M2. */
export const driftPhaseStub = {
  id: 'drift' as const,
  title: 'Drift',
  // TODO(M1): open space, few hard covers, fuel-limited dodges, noise/LOS hunters, Point B gate.
};

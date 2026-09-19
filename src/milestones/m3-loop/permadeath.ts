/**
 * Permadeath stub (GDD §2 / PRD §7).
 * Hull 0 ends the run immediately. No mid-run revive.
 */
export type RunEndReason = 'hull-depleted' | 'map-cleared';

export function onHullDepleted(): RunEndReason {
  // TODO(M3): freeze transit, show death beat, offer next probe. No revive.
  return 'hull-depleted';
}

export function isRunOver(hull: number): boolean {
  return hull <= 0;
}

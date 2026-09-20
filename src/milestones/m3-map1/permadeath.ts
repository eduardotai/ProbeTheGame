import { isChainMode, markRunLost } from './runSession';

/**
 * Permadeath (GDD §2 / PRD §7).
 * Hull 0 ends the run immediately. No mid-run revive.
 * In Map 1 chain mode this ends the entire run, not only the current phase.
 */
export type RunEndReason = 'hull-depleted' | 'map-cleared';

export function onHullDepleted(): RunEndReason {
  if (isChainMode()) {
    markRunLost();
  }
  return 'hull-depleted';
}

export function isRunOver(hull: number): boolean {
  return hull <= 0;
}

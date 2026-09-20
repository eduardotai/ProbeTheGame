import type { PhaseId } from '../m2-phases';
import { MAP1_PHASE_ORDER } from '../m2-phases';

/**
 * A → B sequential chain (PRD §7 / GDD §2).
 * Map 1 six phases in order. Anomaly rewrite may later break order.
 */
export function getMap1Chain(): readonly PhaseId[] {
  return MAP1_PHASE_ORDER;
}

export function nextPhase(current: PhaseId): PhaseId | null {
  const index = MAP1_PHASE_ORDER.indexOf(current);
  if (index < 0) {
    return MAP1_PHASE_ORDER[0] ?? null;
  }
  return MAP1_PHASE_ORDER[index + 1] ?? null;
}

export function startRun(): PhaseId {
  const first = MAP1_PHASE_ORDER[0];
  if (!first) {
    throw new Error('Map 1 chain is empty.');
  }
  return first;
}

import { driftPhaseStub } from '../m1-drift';
import { anomalyPhase } from './anomaly';
import { bossGatePhase } from './bossGate';
import { debrisFieldPhase } from './debrisField';
import { gravityWellPhase } from './gravityWell';
import { swarmPhase } from './swarm';

/**
 * Map 1 phase ids in transit order (GDD §4).
 * Anomaly placement default: after Swarm, before Boss Gate.
 */
export type PhaseId =
  | 'drift'
  | 'debris-field'
  | 'gravity-well'
  | 'swarm'
  | 'anomaly'
  | 'boss-gate';

export type PhaseModule = {
  id: PhaseId;
  title: string;
  /** PRD §6: each M2 phase must boot standalone for test/debug. */
  bootStandalone: () => void;
};

export const MAP1_PHASE_ORDER: readonly PhaseId[] = [
  'drift',
  'debris-field',
  'gravity-well',
  'swarm',
  'anomaly',
  'boss-gate',
];

const driftPhase: PhaseModule = {
  id: driftPhaseStub.id,
  title: driftPhaseStub.title,
  bootStandalone: () => {
    // TODO(M1): boot Drift as the standalone validation gate.
  },
};

export const phaseRegistry: Record<PhaseId, PhaseModule> = {
  drift: driftPhase,
  'debris-field': debrisFieldPhase,
  'gravity-well': gravityWellPhase,
  swarm: swarmPhase,
  anomaly: anomalyPhase,
  'boss-gate': bossGatePhase,
};

export function getPhase(id: PhaseId): PhaseModule {
  return phaseRegistry[id];
}

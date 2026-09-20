import type { PhaseModule } from './phaseRegistry';

/**
 * GDD §4.5 — exactly one Anomaly per Map 1 run.
 * Default placement: after Swarm, before Boss Gate.
 * Rules invert for this phase only. No music bed in MVP.
 */
export const anomalyPhase: PhaseModule = {
  id: 'anomaly',
  title: 'Anomaly',
  sceneKey: null,
  bootStandalone: () => {
    // TODO(M2): pick one invert rule (mirrored controls / heal hurts / silence attracts / dark exit).
  },
};

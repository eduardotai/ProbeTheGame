import { SceneKey } from '../../game/constants';
import type { PhaseModule } from './phaseRegistry';

/**
 * GDD §4.5 — exactly one Anomaly per Map 1 run (after Swarm, before Boss Gate).
 * Invert lock: controls mirrored. Standalone-playable in M2.4. No music bed.
 */
export const anomalyPhase: PhaseModule = {
  id: 'anomaly',
  title: 'Anomaly',
  sceneKey: SceneKey.Anomaly,
  bootStandalone: () => {
    // PreloadScene starts Anomaly when ?phase=anomaly.
  },
};

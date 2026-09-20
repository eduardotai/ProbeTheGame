import { SceneKey } from '../../game/constants';
import type { PhaseModule } from './phaseRegistry';

/** GDD §4.5 — one invert (controls mirrored) for this phase only. Standalone-playable in M2.4. */
export const anomalyPhase: PhaseModule = {
  id: 'anomaly',
  title: 'Anomaly',
  sceneKey: SceneKey.Anomaly,
  bootStandalone: () => {
    // PreloadScene starts Anomaly when ?phase=anomaly.
  },
};

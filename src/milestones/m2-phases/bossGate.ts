import { SceneKey } from '../../game/constants';
import type { PhaseModule } from './phaseRegistry';

/**
 * GDD §4.6 — heavy Gate Bulwark. Default win: destroy guard to open B.
 * No bypass (do not invent Sensors/Utility skip). Standalone-playable in M2.5.
 * No music bed in MVP.
 */
export const bossGatePhase: PhaseModule = {
  id: 'boss-gate',
  title: 'Boss Gate',
  sceneKey: SceneKey.BossGate,
  bootStandalone: () => {
    // PreloadScene starts Boss Gate when ?phase=boss or ?phase=boss-gate.
  },
};

import { SceneKey } from '../../game/constants';
import type { PhaseModule } from './phaseRegistry';

/** GDD §4.3 — constant pull; shortcut vs long way. Standalone-playable in M2.2. */
export const gravityWellPhase: PhaseModule = {
  id: 'gravity-well',
  title: 'Gravity Well',
  sceneKey: SceneKey.GravityWell,
  bootStandalone: () => {
    // PreloadScene starts GravityWell when ?phase=gravity or ?phase=gravity-well.
  },
};

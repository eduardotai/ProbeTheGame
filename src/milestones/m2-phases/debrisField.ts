import { SceneKey } from '../../game/constants';
import type { PhaseModule } from './phaseRegistry';

/** GDD §4.2 — cover, funnel gaps. Standalone-playable in M2 before Gravity Well. */
export const debrisFieldPhase: PhaseModule = {
  id: 'debris-field',
  title: 'Debris Field',
  sceneKey: SceneKey.DebrisField,
  bootStandalone: () => {
    // PreloadScene starts DebrisField when ?phase=debris or ?phase=debris-field.
  },
};

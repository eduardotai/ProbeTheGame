import { SceneKey } from '../../game/constants';
import type { PhaseModule } from './phaseRegistry';

/** GDD §4.4 — Swarmlings; ammo/heat; clear vs push. Standalone-playable in M2.3. */
export const swarmPhase: PhaseModule = {
  id: 'swarm',
  title: 'Swarm',
  sceneKey: SceneKey.Swarm,
  bootStandalone: () => {
    // PreloadScene starts Swarm when ?phase=swarm.
  },
};

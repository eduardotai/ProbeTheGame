import type { PhaseModule } from './phaseRegistry';

/** GDD §4.4 — Swarmlings; ammo/heat; clear vs push. */
export const swarmPhase: PhaseModule = {
  id: 'swarm',
  title: 'Swarm',
  sceneKey: null,
  bootStandalone: () => {
    // TODO(M2): dense Swarmlings; ammo/heat limit; clear a pocket vs push through.
  },
};

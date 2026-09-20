import type { PhaseModule } from './phaseRegistry';

/** GDD §4.3 — constant pull; shortcut vs long way. */
export const gravityWellPhase: PhaseModule = {
  id: 'gravity-well',
  title: 'Gravity Well',
  sceneKey: null,
  bootStandalone: () => {
    // TODO(M2.2): center-mass pull; risky shortcut vs safer long route.
  },
};

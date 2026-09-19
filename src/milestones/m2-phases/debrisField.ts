import type { PhaseModule } from './phaseRegistry';

/** GDD §4.2 — cover, funnel gaps. Standalone-playable in M2 before Gravity Well. */
export const debrisFieldPhase: PhaseModule = {
  id: 'debris-field',
  title: 'Debris Field',
  bootStandalone: () => {
    // TODO(M2): cover occludes LOS for probe and hunters; enemies funnel gaps.
  },
};

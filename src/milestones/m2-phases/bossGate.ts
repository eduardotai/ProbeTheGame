import type { PhaseModule } from './phaseRegistry';

/**
 * GDD §4.6 — Bulwark-class guard. Default win: destroy guard to open B.
 * Bypass vs kill is still open (GDD Q6). No music bed in MVP.
 */
export const bossGatePhase: PhaseModule = {
  id: 'boss-gate',
  title: 'Boss Gate',
  sceneKey: null,
  bootStandalone: () => {
    // TODO(M2): heavy guard; destroy (default) or bypass per later lock; opens Point B.
  },
};

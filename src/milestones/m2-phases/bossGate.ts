import type { PhaseModule } from './phaseRegistry';

/**
 * GDD §4.6 — Bulwark-class guard. Default win: destroy guard to open B.
 * Bypass vs kill is still open (GDD Q6). No music bed in MVP.
 *
 * TODO(M2.5):
 * - Standalone scene at `?phase=boss` / `?phase=boss-gate`
 * - Heavy guard (Bulwark-class or unique); named variant
 * - Destroy guard to open Point B (default). Do not invent bypass until Q6 locks.
 * - Skill test: WASD + fuel dodge + Space fire. Finite A→B, not an arena.
 * - Progress media `docs/progress/boss-*` before merge
 * - Do not retune prior phases unless a shared bug blocks the gate
 */
export const bossGatePhase: PhaseModule = {
  id: 'boss-gate',
  title: 'Boss Gate',
  sceneKey: null,
  bootStandalone: () => {
    // TODO(M2): heavy guard; destroy (default) or bypass per later lock; opens Point B.
  },
};

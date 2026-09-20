import { SceneKey } from './constants';
import { getPhase, type PhaseId } from '../milestones/m2-phases';

/**
 * Standalone phase boot (PRD §6).
 * Default is Drift. Debris Field: `?phase=debris` or `?phase=debris-field`.
 */
const PHASE_ALIASES: Record<string, PhaseId> = {
  drift: 'drift',
  debris: 'debris-field',
  'debris-field': 'debris-field',
  debrisfield: 'debris-field',
  gravity: 'gravity-well',
  'gravity-well': 'gravity-well',
  gravitywell: 'gravity-well',
  swarm: 'swarm',
  anomaly: 'anomaly',
  boss: 'boss-gate',
  'boss-gate': 'boss-gate',
  bossgate: 'boss-gate',
};

export function resolveRequestedPhaseId(search = window.location.search): PhaseId {
  const raw = new URLSearchParams(search).get('phase')?.trim().toLowerCase() ?? '';
  const normalized = raw.replace(/[_\s]+/g, '-');
  return PHASE_ALIASES[normalized] ?? 'drift';
}

/** Phaser scene key for a playable phase; stubs fall back to Drift. */
export function resolvePlayableSceneKey(search = window.location.search): string {
  const phase = getPhase(resolveRequestedPhaseId(search));
  return phase.sceneKey ?? SceneKey.Drift;
}

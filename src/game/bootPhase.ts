import { SceneKey } from './constants';
import { getPhase, type PhaseId } from '../milestones/m2-phases';

/**
 * Boot resolver (PRD §6 / §7).
 *
 * - Default `/` and `?run=map1` → Map 1 chain (Drift → … → Boss Gate).
 * - `?phase=` always wins and boots that phase standalone (debug).
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

export type BootMode = 'chain' | 'standalone';

function readPhaseParam(search = window.location.search): string {
  return new URLSearchParams(search).get('phase')?.trim().toLowerCase().replace(/[_\s]+/g, '-') ?? '';
}

export function resolveBootMode(search = window.location.search): BootMode {
  return readPhaseParam(search) ? 'standalone' : 'chain';
}

export function resolveRequestedPhaseId(search = window.location.search): PhaseId {
  const normalized = readPhaseParam(search);
  return PHASE_ALIASES[normalized] ?? 'drift';
}

/** Phaser scene key for the first scene after Preload. */
export function resolvePlayableSceneKey(search = window.location.search): string {
  if (resolveBootMode(search) === 'chain') {
    return SceneKey.Drift;
  }
  const phase = getPhase(resolveRequestedPhaseId(search));
  return phase.sceneKey ?? SceneKey.Drift;
}

import { SceneKey } from '../../game/constants';
import { getPhase, MAP1_PHASE_ORDER, type PhaseId } from '../m2-phases';
import { applyPartialRefill, fullLoadout, type ProbeLoadout } from './carry';
import { nextPhase } from './chain';

export type RunStatus = 'idle' | 'playing' | 'advancing' | 'lost' | 'cleared';

export type Map1Run = {
  phase: PhaseId;
  status: RunStatus;
  loadout: ProbeLoadout;
};

let chainMode = false;
let run: Map1Run | null = null;

export function setChainMode(enabled: boolean): void {
  chainMode = enabled;
}

export function isChainMode(): boolean {
  return chainMode;
}

export function peekRun(): Map1Run | null {
  return run;
}

export function beginNewRun(): Map1Run {
  run = {
    phase: MAP1_PHASE_ORDER[0] ?? 'drift',
    status: 'playing',
    loadout: fullLoadout(),
  };
  console.info('[map1] new probe at Drift', snapshotLoadout(run.loadout));
  return run;
}

export function takePhaseLoadout(phaseId: PhaseId): ProbeLoadout {
  if (!chainMode) {
    return fullLoadout();
  }
  if (!run || run.status === 'lost' || run.status === 'cleared' || run.status === 'idle') {
    beginNewRun();
  }
  if (!run) {
    throw new Error('Map 1 run failed to start.');
  }
  run.phase = phaseId;
  if (run.status === 'advancing' || run.status === 'idle') {
    run.status = 'playing';
  }
  return { ...run.loadout };
}

export function commitPhaseResources(input: {
  hull: { current: number };
  fuel: { current: number };
  weapon?: { mag: { current: number } };
}): void {
  if (!chainMode || !run || run.status === 'lost' || run.status === 'cleared') {
    return;
  }
  run.loadout.hull = input.hull.current;
  run.loadout.fuel = input.fuel.current;
  if (input.weapon) {
    run.loadout.ammo = input.weapon.mag.current;
  }
}

export function refillAndAdvance(from: PhaseId): PhaseId | null {
  if (!chainMode || !run) {
    return null;
  }
  const next = nextPhase(from);
  if (!next) {
    run.status = 'cleared';
    run.phase = from;
    return null;
  }
  applyPartialRefill(run.loadout);
  run.status = 'advancing';
  run.phase = next;
  console.info(`[map1] transit ${from} → ${next}`, snapshotLoadout(run.loadout));
  return next;
}

export function markRunLost(): void {
  if (!run) {
    return;
  }
  run.status = 'lost';
}

export function markMapCleared(): void {
  if (!run) {
    return;
  }
  run.status = 'cleared';
}

export function sceneKeyForPhase(id: PhaseId): string {
  return getPhase(id).sceneKey ?? SceneKey.Drift;
}

export function phaseIndex(id: PhaseId): number {
  return MAP1_PHASE_ORDER.indexOf(id) + 1;
}

export function snapshotLoadout(loadout: ProbeLoadout): Record<string, number> {
  return {
    hull: loadout.hull,
    hullMax: loadout.hullMax,
    fuel: Math.round(loadout.fuel),
    fuelCapacity: loadout.fuelCapacity,
    ammo: loadout.ammo,
    ammoCapacity: loadout.ammoCapacity,
  };
}

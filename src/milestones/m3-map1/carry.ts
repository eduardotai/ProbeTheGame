import { DriftTuning } from '../m1-drift';
import { SwarmTuning } from '../m2-phases/swarm/tuning';

/**
 * Between-phase carry — **partial refill** (M3 lock).
 *
 * Skill still matters (you enter the next phase with leftover hull and ammo),
 * but the six-phase chain stays playable (fuel is full, hull gets a +1, empty
 * mag is not a hard gate into Anomaly / Boss Gate).
 *
 * | Resource | Carry into next phase | Gate refill |
 * |----------|------------------------|-------------|
 * | Hull     | remaining              | +1, capped at max |
 * | Fuel     | discarded leftover     | full refill |
 * | Ammo     | remaining              | restore 50% of missing, ceil, cap at max |
 * | Heat     | discarded              | cool / reset (not a carry resource) |
 */
export const MAP1_CARRY = {
  id: 'partial-refill' as const,
  hullRepair: 1,
  fuel: 'full' as const,
  ammoRestoreMissingFraction: 0.5,
  heat: 'reset' as const,
};

export type ProbeLoadout = {
  hull: number;
  hullMax: number;
  fuel: number;
  fuelCapacity: number;
  ammo: number;
  ammoCapacity: number;
};

export function fullLoadout(): ProbeLoadout {
  return {
    hull: DriftTuning.hullMax,
    hullMax: DriftTuning.hullMax,
    fuel: DriftTuning.fuelCapacity,
    fuelCapacity: DriftTuning.fuelCapacity,
    ammo: SwarmTuning.ammoCapacity,
    ammoCapacity: SwarmTuning.ammoCapacity,
  };
}

export function applyPartialRefill(loadout: ProbeLoadout): ProbeLoadout {
  const missingAmmo = Math.max(0, loadout.ammoCapacity - loadout.ammo);
  const restoredAmmo = Math.ceil(missingAmmo * MAP1_CARRY.ammoRestoreMissingFraction);
  loadout.hull = Math.min(loadout.hullMax, loadout.hull + MAP1_CARRY.hullRepair);
  loadout.fuel = loadout.fuelCapacity;
  loadout.ammo = Math.min(loadout.ammoCapacity, loadout.ammo + restoredAmmo);
  return loadout;
}

export function describeCarry(before: ProbeLoadout, after: ProbeLoadout): string {
  const hullDelta = after.hull - before.hull;
  const hullNote = hullDelta > 0 ? `hull ${after.hull}/${after.hullMax} (+${hullDelta})` : `hull ${after.hull}/${after.hullMax}`;
  const ammoDelta = after.ammo - before.ammo;
  const ammoNote =
    ammoDelta > 0 ? `ammo ${after.ammo}/${after.ammoCapacity} (+${ammoDelta})` : `ammo ${after.ammo}/${after.ammoCapacity}`;
  return `${hullNote}  ·  fuel full  ·  ${ammoNote}`;
}

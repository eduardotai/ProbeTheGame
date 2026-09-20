import Phaser from 'phaser';
import type { MoveVector } from '../../game/input/KeyboardController';
import type { FuelTank } from './fuel';
import { DriftTuning } from './tuning';

/**
 * Precise movement with slight inertia (GDD §3).
 * Facing comes from keyboard thrust — never from the pointer.
 */
export function applyKeyboardMovement(
  probe: Phaser.Physics.Arcade.Image,
  move: MoveVector,
  facing: number,
  _deltaMs: number,
): number {
  const body = probe.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return facing;
  }

  body.setAcceleration(move.x * DriftTuning.thrust, move.y * DriftTuning.thrust);

  let nextFacing = facing;
  if (move.x !== 0 || move.y !== 0) {
    nextFacing = Math.atan2(move.y, move.x);
  } else if (body.velocity.lengthSq() > 16) {
    nextFacing = Math.atan2(body.velocity.y, body.velocity.x);
  }

  probe.setRotation(nextFacing + Math.PI / 2);
  return nextFacing;
}

/** Fuel-limited dodge (GDD §4.1). Direction is current keyboard facing. */
export function tryDodge(probe: Phaser.Physics.Arcade.Image, fuel: FuelTank, facing: number): boolean {
  const body = probe.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return false;
  }
  if (!fuel.tryConsumeDodge()) {
    return false;
  }

  body.setVelocity(Math.cos(facing) * DriftTuning.dodgeSpeed, Math.sin(facing) * DriftTuning.dodgeSpeed);
  return true;
}

export function haltProbe(probe: Phaser.Physics.Arcade.Image): void {
  const body = probe.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
}

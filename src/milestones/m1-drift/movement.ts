import Phaser from 'phaser';
import type { MoveVector } from '../../game/input/KeyboardController';
import type { FuelTank } from './fuel';

const THRUST = 620;
const DODGE_SPEED = 380;

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

  body.setAcceleration(move.x * THRUST, move.y * THRUST);

  let nextFacing = facing;
  if (move.x !== 0 || move.y !== 0) {
    nextFacing = Math.atan2(move.y, move.x);
  } else if (body.velocity.lengthSq() > 16) {
    nextFacing = Math.atan2(body.velocity.y, body.velocity.x);
  }

  probe.setRotation(nextFacing + Math.PI / 2);
  return nextFacing;
}

/** Fuel-limited dodge stub (GDD §4.1). No i-frames / noise model yet. */
export function tryDodge(probe: Phaser.Physics.Arcade.Image, fuel: FuelTank, facing: number): boolean {
  if (!fuel.tryConsumeDodge()) {
    return false;
  }

  const body = probe.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return false;
  }

  body.setVelocity(Math.cos(facing) * DODGE_SPEED, Math.sin(facing) * DODGE_SPEED);
  // TODO(M1): raise noise on dodge; brief invuln optional; fail if fuel empty mid-hunt.
  return true;
}

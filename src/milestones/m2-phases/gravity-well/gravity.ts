import Phaser from 'phaser';
import { DriftTuning, type DriftCover, coverRects } from '../../m1-drift';
import { GravityTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type RouteBand = 'horizon' | 'shortcut' | 'long';

export function distanceToWell(pos: Vec2): number {
  return Math.hypot(pos.x - GravityTuning.well.x, pos.y - GravityTuning.well.y);
}

export function pullAccelAt(dist: number): number {
  return GravityTuning.pullG / Math.max(dist, GravityTuning.pullMinR);
}

export function isInsideHorizon(pos: Vec2): boolean {
  return distanceToWell(pos) <= GravityTuning.horizonRadius;
}

export function routeBand(pos: Vec2): RouteBand {
  const dist = distanceToWell(pos);
  if (dist <= GravityTuning.horizonRadius) {
    return 'horizon';
  }
  if (dist <= GravityTuning.shortcutRadius) {
    return 'shortcut';
  }
  return 'long';
}

/**
 * Always-on pull toward the center mass (GDD §4.3).
 * Adds to whatever acceleration keyboard thrust already set this frame.
 */
export function applyGravityPull(sprite: Phaser.Physics.Arcade.Image): number {
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return 0;
  }
  const dx = GravityTuning.well.x - sprite.x;
  const dy = GravityTuning.well.y - sprite.y;
  const dist = Math.hypot(dx, dy);
  const accel = pullAccelAt(dist);
  if (dist < 0.001) {
    return accel;
  }
  body.setAcceleration(
    body.acceleration.x + (dx / dist) * accel,
    body.acceleration.y + (dy / dist) * accel,
  );
  const extra = Math.min(
    GravityTuning.pullSpeedCap,
    Math.max(0, accel - 180) * GravityTuning.pullSpeedGain,
  );
  sprite.setMaxVelocity(DriftTuning.probeMaxSpeed + extra);
  return accel;
}

export function wellOccluder(): Phaser.Geom.Rectangle {
  const r = GravityTuning.massRadius * 0.82;
  const { x, y } = GravityTuning.well;
  return new Phaser.Geom.Rectangle(x - r, y - r, r * 2, r * 2);
}

export function gravityOccluders(covers: readonly DriftCover[]): Phaser.Geom.Rectangle[] {
  return [...coverRects(covers), wellOccluder()];
}

/** Keep hunters/bulwark out of the core so they do not vanish into the mass. */
export function pushOutOfWell(
  sprite: Phaser.Physics.Arcade.Image,
  radius = GravityTuning.massRadius + 10,
): void {
  const dx = sprite.x - GravityTuning.well.x;
  const dy = sprite.y - GravityTuning.well.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= radius || dist < 0.001) {
    return;
  }
  const scale = radius / dist;
  const nx = dx / dist;
  const ny = dy / dist;
  sprite.setPosition(GravityTuning.well.x + dx * scale, GravityTuning.well.y + dy * scale);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  const inward = body.velocity.x * nx + body.velocity.y * ny;
  if (inward < 0) {
    body.setVelocity(body.velocity.x - inward * nx, body.velocity.y - inward * ny);
  }
}

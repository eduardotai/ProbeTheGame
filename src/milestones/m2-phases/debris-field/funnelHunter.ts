import Phaser from 'phaser';
import {
  createLosHunter,
  emitDodgeNoise,
  haltHunter,
  hasLineOfSight,
  stunHunter,
  type LosHunter,
  type NoisePulse,
} from '../../m1-drift';
import type { NavGrid, Vec2 } from './navGrid';
import { DebrisTuning } from './tuning';

export type FunnelHunter = LosHunter & {
  path: Vec2[];
  pathIndex: number;
  repathAt: number;
  gap: readonly [Vec2, Vec2];
  patrolLeg: 0 | 1;
};

export function createFunnelHunter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  gap: readonly [Vec2, Vec2],
): FunnelHunter {
  const hunter = createLosHunter(scene, x, y);
  hunter.sprite.setMaxVelocity(DebrisTuning.hunterMaxSpeed);
  hunter.sprite.setDrag(DebrisTuning.hunterDrag);
  hunter.sprite.setBounce(0.08);
  return {
    ...hunter,
    path: [],
    pathIndex: 0,
    repathAt: 0,
    gap,
    patrolLeg: 0,
  };
}

export { emitDodgeNoise, haltHunter, stunHunter };

export function updateFunnelHunter(
  hunter: FunnelHunter,
  target: Vec2,
  occluders: readonly Phaser.Geom.Rectangle[],
  grid: NavGrid,
  noise: NoisePulse | null,
  now: number,
): void {
  const sprite = hunter.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }

  if (now < hunter.stunnedUntil) {
    body.setAcceleration(0, 0);
    return;
  }

  const from = { x: sprite.x, y: sprite.y };
  const dist = Phaser.Math.Distance.Between(from.x, from.y, target.x, target.y);
  const inRange = dist <= DebrisTuning.losRange;
  const los = inRange && hasLineOfSight(from, target, occluders);
  const hears =
    noise !== null &&
    now < noise.until &&
    Phaser.Math.Distance.Between(from.x, from.y, noise.x, noise.y) <= Math.min(noise.radius, DebrisTuning.hearRadius);

  hunter.seesTarget = los;
  if (los || hears) {
    hunter.lastSeen = { x: target.x, y: target.y };
  }

  if (los || hunter.lastSeen) {
    const goal = los ? target : hunter.lastSeen;
    if (!goal) {
      return;
    }
    followOrRepath(hunter, body, grid, goal, now, DebrisTuning.hunterPathAccel);
    if (!los && hunter.lastSeen) {
      const d = Phaser.Math.Distance.Between(from.x, from.y, hunter.lastSeen.x, hunter.lastSeen.y);
      if (d < 22) {
        hunter.lastSeen = null;
      }
    }
    return;
  }

  const hold = hunter.gap[hunter.patrolLeg];
  if (!hold) {
    return;
  }
  const atHold = Phaser.Math.Distance.Between(from.x, from.y, hold.x, hold.y) < DebrisTuning.waypointReach + 8;
  if (atHold) {
    hunter.patrolLeg = hunter.patrolLeg === 0 ? 1 : 0;
    hunter.repathAt = 0;
  }
  const next = hunter.gap[hunter.patrolLeg];
  if (next) {
    followOrRepath(hunter, body, grid, next, now, DebrisTuning.hunterAccel * 0.75);
  }
}

function followOrRepath(
  hunter: FunnelHunter,
  body: Phaser.Physics.Arcade.Body,
  grid: NavGrid,
  goal: Vec2,
  now: number,
  accel: number,
): void {
  if (now >= hunter.repathAt || hunter.pathIndex >= hunter.path.length) {
    hunter.path = grid.findPath({ x: hunter.sprite.x, y: hunter.sprite.y }, goal);
    hunter.pathIndex = 0;
    hunter.repathAt = now + DebrisTuning.repathMs;
  }

  const waypoint = nextWaypoint(hunter, goal);
  accelerateToward(body, waypoint, accel);
  faceSprite(hunter.sprite, waypoint);
}

function nextWaypoint(hunter: FunnelHunter, fallback: Vec2): Vec2 {
  while (hunter.pathIndex < hunter.path.length) {
    const point = hunter.path[hunter.pathIndex];
    if (!point) {
      hunter.pathIndex += 1;
      continue;
    }
    const d = Phaser.Math.Distance.Between(hunter.sprite.x, hunter.sprite.y, point.x, point.y);
    if (d <= DebrisTuning.waypointReach) {
      hunter.pathIndex += 1;
      continue;
    }
    return point;
  }
  return fallback;
}

function accelerateToward(body: Phaser.Physics.Arcade.Body, target: Vec2, accel: number): void {
  const dx = target.x - body.center.x;
  const dy = target.y - body.center.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) {
    body.setAcceleration(0, 0);
    return;
  }
  body.setAcceleration((dx / len) * accel, (dy / len) * accel);
}

function faceSprite(sprite: Phaser.Physics.Arcade.Image, target: Vec2): void {
  sprite.setRotation(Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y) + Math.PI / 2);
}

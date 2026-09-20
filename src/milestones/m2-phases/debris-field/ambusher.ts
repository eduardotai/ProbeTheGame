import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { hasLineOfSight, type NoisePulse } from '../../m1-drift';
import type { NavGrid, Vec2 } from './navGrid';
import { DebrisTuning } from './tuning';

export type DebrisAmbusher = {
  sprite: Phaser.Physics.Arcade.Image;
  seesTarget: boolean;
  lastSeen: Vec2 | null;
  home: Vec2;
  path: Vec2[];
  pathIndex: number;
  repathAt: number;
  stunnedUntil: number;
  lunging: boolean;
};

/**
 * Debris Ambusher (GDD §7): holds cover, lunges when the probe commits to the exit.
 * Soft cover is not in M2.1 (hard debris only). Hard cover still occludes + collides.
 */
export function createDebrisAmbusher(scene: Phaser.Scene, x: number, y: number): DebrisAmbusher {
  const sprite = scene.physics.add.image(x, y, TextureKey.Ambusher);
  sprite.setDamping(true);
  sprite.setDrag(DebrisTuning.hunterDrag);
  sprite.setMaxVelocity(DebrisTuning.hunterMaxSpeed);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(8);
  sprite.setBounce(0.08);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  body?.setSize(22, 26, true);
  return {
    sprite,
    seesTarget: false,
    lastSeen: null,
    home: { x, y },
    path: [],
    pathIndex: 0,
    repathAt: 0,
    stunnedUntil: 0,
    lunging: false,
  };
}

export function updateDebrisAmbusher(
  ambusher: DebrisAmbusher,
  target: Vec2,
  occluders: readonly Phaser.Geom.Rectangle[],
  grid: NavGrid,
  noise: NoisePulse | null,
  now: number,
): void {
  const sprite = ambusher.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }

  if (now < ambusher.stunnedUntil) {
    body.setAcceleration(0, 0);
    ambusher.lunging = false;
    return;
  }

  const from = { x: sprite.x, y: sprite.y };
  const dist = Phaser.Math.Distance.Between(from.x, from.y, target.x, target.y);
  const los = dist <= DebrisTuning.losRange && hasLineOfSight(from, target, occluders);
  const hears =
    noise !== null &&
    now < noise.until &&
    Phaser.Math.Distance.Between(from.x, from.y, noise.x, noise.y) <= DebrisTuning.hearRadius;

  ambusher.seesTarget = los;
  if (los || hears) {
    ambusher.lastSeen = { x: target.x, y: target.y };
  }

  const committed = target.x >= DebrisTuning.ambusherCommitX && dist <= DebrisTuning.ambusherLungeRange;
  ambusher.lunging = committed || (ambusher.lunging && dist < DebrisTuning.ambusherLungeRange * 1.35);

  if (ambusher.lunging && (los || ambusher.lastSeen)) {
    sprite.setMaxVelocity(DebrisTuning.ambusherLungeSpeed);
    const goal = los ? target : ambusher.lastSeen;
    if (goal) {
      follow(ambusher, body, grid, goal, now, DebrisTuning.ambusherLungeAccel);
    }
    return;
  }

  sprite.setMaxVelocity(DebrisTuning.hunterMaxSpeed);
  if (los) {
    follow(ambusher, body, grid, target, now, DebrisTuning.hunterPathAccel);
    return;
  }

  follow(ambusher, body, grid, ambusher.home, now, DebrisTuning.hunterAccel * 0.55);
}

export function stunAmbusher(ambusher: DebrisAmbusher, until: number): void {
  ambusher.stunnedUntil = until;
  ambusher.lunging = false;
  const body = ambusher.sprite.body as Phaser.Physics.Arcade.Body | null;
  body?.setAcceleration(0, 0);
  body?.setVelocity(0, 0);
}

export function haltAmbusher(ambusher: DebrisAmbusher): void {
  const body = ambusher.sprite.body as Phaser.Physics.Arcade.Body | null;
  body?.setAcceleration(0, 0);
  body?.setVelocity(0, 0);
}

function follow(
  ambusher: DebrisAmbusher,
  body: Phaser.Physics.Arcade.Body,
  grid: NavGrid,
  goal: Vec2,
  now: number,
  accel: number,
): void {
  if (now >= ambusher.repathAt || ambusher.pathIndex >= ambusher.path.length) {
    ambusher.path = grid.findPath({ x: ambusher.sprite.x, y: ambusher.sprite.y }, goal);
    ambusher.pathIndex = 0;
    ambusher.repathAt = now + DebrisTuning.repathMs;
  }

  let waypoint = goal;
  while (ambusher.pathIndex < ambusher.path.length) {
    const point = ambusher.path[ambusher.pathIndex];
    if (!point) {
      ambusher.pathIndex += 1;
      continue;
    }
    const d = Phaser.Math.Distance.Between(ambusher.sprite.x, ambusher.sprite.y, point.x, point.y);
    if (d <= DebrisTuning.waypointReach) {
      ambusher.pathIndex += 1;
      continue;
    }
    waypoint = point;
    break;
  }

  const dx = waypoint.x - body.center.x;
  const dy = waypoint.y - body.center.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) {
    body.setAcceleration(0, 0);
  } else {
    body.setAcceleration((dx / len) * accel, (dy / len) * accel);
  }
  ambusher.sprite.setRotation(
    Phaser.Math.Angle.Between(ambusher.sprite.x, ambusher.sprite.y, waypoint.x, waypoint.y) + Math.PI / 2,
  );
}

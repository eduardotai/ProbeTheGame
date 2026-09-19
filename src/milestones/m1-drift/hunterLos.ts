import Phaser from 'phaser';
import { TextureKey } from '../../game/constants';
import { DriftTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type NoisePulse = {
  x: number;
  y: number;
  radius: number;
  until: number;
};

export type LosHunter = {
  sprite: Phaser.Physics.Arcade.Image;
  seesTarget: boolean;
  lastSeen: Vec2 | null;
  home: Vec2;
  patrolDir: number;
};

/**
 * Hunter (GDD §7): direct pursuer that reacts to LOS (PRD §5) and dodge noise (GDD §4.1).
 */
export function createLosHunter(scene: Phaser.Scene, x: number, y: number): LosHunter {
  const sprite = scene.physics.add.image(x, y, TextureKey.Hunter);
  sprite.setDamping(true);
  sprite.setDrag(DriftTuning.hunterDrag);
  sprite.setMaxVelocity(DriftTuning.hunterMaxSpeed);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(8);
  sprite.setImmovable(false);
  return {
    sprite,
    seesTarget: false,
    lastSeen: null,
    home: { x, y },
    patrolDir: x < 640 ? 1 : -1,
  };
}

export function hasLineOfSight(
  from: Vec2,
  to: Vec2,
  occluders: readonly Phaser.Geom.Rectangle[] = [],
): boolean {
  const ray = new Phaser.Geom.Line(from.x, from.y, to.x, to.y);
  for (const box of occluders) {
    if (Phaser.Geom.Intersects.LineToRectangle(ray, box)) {
      return false;
    }
  }
  return true;
}

export function emitDodgeNoise(x: number, y: number, now: number): NoisePulse {
  return {
    x,
    y,
    radius: DriftTuning.hearRadius,
    until: now + DriftTuning.noiseDurationMs,
  };
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

/**
 * Chase while the probe is in LOS (or just heard a dodge).
 * Lost hunters check last-seen, then idle-patrol near home.
 */
export function updateLosHunter(
  hunter: LosHunter,
  target: Vec2,
  occluders: readonly Phaser.Geom.Rectangle[],
  noise: NoisePulse | null,
  now: number,
): void {
  const sprite = hunter.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }

  const from = { x: sprite.x, y: sprite.y };
  const dist = Phaser.Math.Distance.Between(from.x, from.y, target.x, target.y);
  const inRange = dist <= DriftTuning.losRange;
  const los = inRange && hasLineOfSight(from, target, occluders);
  const hears =
    noise !== null &&
    now < noise.until &&
    Phaser.Math.Distance.Between(from.x, from.y, noise.x, noise.y) <= noise.radius;

  hunter.seesTarget = los;

  if (los || hears) {
    hunter.lastSeen = { x: target.x, y: target.y };
  }

  if (los) {
    accelerateToward(body, target, DriftTuning.hunterAccel);
    faceSprite(sprite, target);
    sprite.setAlpha(1);
    return;
  }

  if (hunter.lastSeen) {
    const d = Phaser.Math.Distance.Between(from.x, from.y, hunter.lastSeen.x, hunter.lastSeen.y);
    if (d < 22) {
      hunter.lastSeen = null;
      body.setAcceleration(0, 0);
    } else {
      accelerateToward(body, hunter.lastSeen, DriftTuning.hunterAccel * 0.85);
      faceSprite(sprite, hunter.lastSeen);
    }
    sprite.setAlpha(0.92);
    return;
  }

  const dx = sprite.x - hunter.home.x;
  if (Math.abs(dx) > 96) {
    hunter.patrolDir = dx > 0 ? -1 : 1;
  }
  body.setAcceleration(hunter.patrolDir * 70, (hunter.home.y - sprite.y) * 1.6);
  sprite.setAlpha(0.72);
}

export function haltHunter(hunter: LosHunter): void {
  const body = hunter.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
}

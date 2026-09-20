import Phaser from 'phaser';
import { Palette, TextureKey } from '../../../game/constants';
import { hasLineOfSight, type NoisePulse } from '../../m1-drift';
import { distanceToWell, pushOutOfWell, type Vec2 } from './gravity';
import { GravityTuning } from './tuning';

export type GravityBulwark = {
  sprite: Phaser.Physics.Arcade.Image;
  seesTarget: boolean;
  lastSeen: Vec2 | null;
  home: Vec2;
  stunnedUntil: number;
};

/**
 * Gravity Bulwark (GDD §7 phase variant): slow, anchors near the well.
 * Blocks the shortcut; will not chase onto the long way (leash).
 */
export function createGravityBulwark(scene: Phaser.Scene, x: number, y: number): GravityBulwark {
  const sprite = scene.physics.add.image(x, y, TextureKey.Bulwark);
  sprite.setTint(Palette.bulwark);
  sprite.setScale(1.55);
  sprite.setDamping(true);
  sprite.setDrag(GravityTuning.bulwarkDrag);
  sprite.setMaxVelocity(GravityTuning.bulwarkMaxSpeed);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(8);
  sprite.setBounce(0.04);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  body?.setSize(26, 30, true);
  return {
    sprite,
    seesTarget: false,
    lastSeen: null,
    home: { x, y },
    stunnedUntil: 0,
  };
}

export function updateGravityBulwark(
  bulwark: GravityBulwark,
  target: Vec2,
  occluders: readonly Phaser.Geom.Rectangle[],
  noise: NoisePulse | null,
  now: number,
): void {
  const sprite = bulwark.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }

  pushOutOfWell(sprite);

  if (now < bulwark.stunnedUntil) {
    body.setAcceleration(0, 0);
    sprite.setAlpha(0.85);
    return;
  }

  const from = { x: sprite.x, y: sprite.y };
  const dist = Phaser.Math.Distance.Between(from.x, from.y, target.x, target.y);
  const los = dist <= 420 && hasLineOfSight(from, target, occluders);
  const hears =
    noise !== null &&
    now < noise.until &&
    Phaser.Math.Distance.Between(from.x, from.y, noise.x, noise.y) <= noise.radius;

  bulwark.seesTarget = los;
  if (los || hears) {
    bulwark.lastSeen = { x: target.x, y: target.y };
  }

  const probeNearWell = distanceToWell(target) <= GravityTuning.bulwarkLeash;
  const goal =
    probeNearWell && (los || bulwark.lastSeen)
      ? (los ? target : bulwark.lastSeen)
      : bulwark.home;

  if (!goal) {
    body.setAcceleration(0, 0);
    return;
  }

  const toHome = Phaser.Math.Distance.Between(from.x, from.y, goal.x, goal.y);
  if (goal === bulwark.home && toHome < GravityTuning.bulwarkHomeRadius) {
    body.setAcceleration(0, 0);
    sprite.setAlpha(0.92);
    return;
  }

  accelerateToward(body, goal, GravityTuning.bulwarkAccel);
  sprite.setRotation(Phaser.Math.Angle.Between(sprite.x, sprite.y, goal.x, goal.y) + Math.PI / 2);
  sprite.setAlpha(1);
}

export function stunBulwark(bulwark: GravityBulwark, until: number): void {
  bulwark.stunnedUntil = until;
  haltBulwark(bulwark);
}

export function haltBulwark(bulwark: GravityBulwark): void {
  const body = bulwark.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
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

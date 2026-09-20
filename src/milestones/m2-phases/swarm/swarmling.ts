import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { SwarmTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type SwarmlingRole = 'swarmling' | 'splitter' | 'mini';

export type Swarmling = {
  sprite: Phaser.Physics.Arcade.Image;
  kind: SwarmlingRole;
  home: Vec2;
  homeRadius: number;
  hp: number;
  stunnedUntil: number;
  alive: boolean;
};

export function createSwarmling(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: SwarmlingRole,
  homeRadius = 48,
): Swarmling {
  const key = kind === 'splitter' ? TextureKey.Splitter : TextureKey.Swarmling;
  const sprite = scene.physics.add.image(x, y, key);
  sprite.setDamping(true);
  sprite.setDrag(SwarmTuning.swarmlingDrag);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(8);
  sprite.setBounce(0.18);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (kind === 'splitter') {
    sprite.setMaxVelocity(SwarmTuning.splitterMaxSpeed);
    body?.setSize(18, 20, true);
  } else if (kind === 'mini') {
    sprite.setScale(0.62);
    sprite.setMaxVelocity(SwarmTuning.miniMaxSpeed);
    sprite.setTint(0xffe08a);
    body?.setSize(12, 12, true);
  } else {
    sprite.setMaxVelocity(SwarmTuning.swarmlingMaxSpeed);
    body?.setSize(14, 14, true);
  }
  return {
    sprite,
    kind,
    home: { x, y },
    homeRadius,
    hp: 1,
    stunnedUntil: 0,
    alive: true,
  };
}

export function contactRadiusFor(kind: SwarmlingRole): number {
  if (kind === 'splitter') {
    return SwarmTuning.splitterContactRadius;
  }
  if (kind === 'mini') {
    return SwarmTuning.miniContactRadius;
  }
  return SwarmTuning.contactRadius;
}

export function updateSwarmling(ling: Swarmling, target: Vec2, now: number, aggroEnabled: boolean): void {
  if (!ling.alive) {
    return;
  }
  const sprite = ling.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  if (now < ling.stunnedUntil) {
    body.setAcceleration(0, 0);
    sprite.setAlpha(0.8);
    return;
  }

  const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
  if (aggroEnabled && dist <= SwarmTuning.aggroRadius) {
    const accel =
      ling.kind === 'splitter'
        ? SwarmTuning.splitterAccel
        : ling.kind === 'mini'
          ? SwarmTuning.miniAccel
          : SwarmTuning.swarmlingAccel;
    accelerateToward(body, target, accel);
    sprite.setRotation(Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y) + Math.PI / 2);
    sprite.setAlpha(1);
    return;
  }

  const homeDist = Phaser.Math.Distance.Between(sprite.x, sprite.y, ling.home.x, ling.home.y);
  if (homeDist > ling.homeRadius) {
    accelerateToward(body, ling.home, SwarmTuning.wanderAccel);
  } else {
    const wander = now * 0.0018 + ling.home.x * 0.01;
    body.setAcceleration(Math.cos(wander) * SwarmTuning.wanderAccel, Math.sin(wander * 1.3) * SwarmTuning.wanderAccel);
  }
  sprite.setAlpha(0.78);
}

export function stunSwarmling(ling: Swarmling, until: number): void {
  ling.stunnedUntil = until;
  haltSwarmling(ling);
}

export function haltSwarmling(ling: Swarmling): void {
  const body = ling.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
}

export function killSwarmling(ling: Swarmling): void {
  ling.alive = false;
  ling.hp = 0;
  const body = ling.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (body) {
    body.stop();
    body.enable = false;
  }
  ling.sprite.setActive(false);
  ling.sprite.setVisible(false);
}

export function spawnSplitMinis(scene: Phaser.Scene, at: Vec2, facing: number): [Swarmling, Swarmling] {
  const ox = Math.cos(facing + Math.PI / 2) * SwarmTuning.splitOffset;
  const oy = Math.sin(facing + Math.PI / 2) * SwarmTuning.splitOffset;
  return [
    createSwarmling(scene, at.x + ox, at.y + oy, 'mini', 28),
    createSwarmling(scene, at.x - ox, at.y - oy, 'mini', 28),
  ];
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

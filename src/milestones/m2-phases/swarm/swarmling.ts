import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { SwarmTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type SwarmlingRole = 'swarmling' | 'splitter' | 'mini';

export type AggroPhase = 'idle' | 'tell' | 'chase';

export type Swarmling = {
  sprite: Phaser.Physics.Arcade.Image;
  kind: SwarmlingRole;
  home: Vec2;
  homeRadius: number;
  hp: number;
  stunnedUntil: number;
  alive: boolean;
  phase: AggroPhase;
  tellUntil: number;
  lungeUntil: number;
  baseScale: number;
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
  sprite.setBounce(0.14);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  const baseScale = kind === 'mini' ? 0.62 : 1;
  if (kind === 'splitter') {
    sprite.setMaxVelocity(SwarmTuning.splitterMaxSpeed);
    body?.setSize(18, 20, true);
  } else if (kind === 'mini') {
    sprite.setScale(baseScale);
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
    phase: 'idle',
    tellUntil: 0,
    lungeUntil: 0,
    baseScale,
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
  const inRange = aggroEnabled && dist <= SwarmTuning.aggroRadius;
  const dropped = dist > SwarmTuning.aggroDropRadius || !aggroEnabled;

  if (ling.phase === 'idle') {
    if (inRange) {
      beginTell(ling, now, target);
      return;
    }
    wander(ling, body, now);
    return;
  }

  if (dropped) {
    restIdle(ling);
    wander(ling, body, now);
    return;
  }

  faceSprite(sprite, target);

  if (ling.phase === 'tell') {
    body.setAcceleration(0, 0);
    body.setVelocity(0, 0);
    const pulse = 0.62 + 0.38 * Math.abs(Math.sin(now * 0.022));
    sprite.setAlpha(pulse);
    sprite.setTint(0xfff4d0);
    sprite.setScale(ling.baseScale * (1.08 + 0.1 * pulse));
    if (now >= ling.tellUntil) {
      commitLunge(ling, body, target, now);
    }
    return;
  }

  const accel =
    now < ling.lungeUntil
      ? SwarmTuning.lungeAccel
      : ling.kind === 'splitter'
        ? SwarmTuning.splitterAccel
        : ling.kind === 'mini'
          ? SwarmTuning.miniAccel
          : SwarmTuning.swarmlingAccel;
  accelerateToward(body, target, accel);
  sprite.setAlpha(1);
  sprite.setScale(ling.baseScale);
  if (ling.kind !== 'mini') {
    sprite.clearTint();
  } else {
    sprite.setTint(0xffe08a);
  }
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

export function spawnSplitMinis(
  scene: Phaser.Scene,
  at: Vec2,
  facing: number,
  now: number,
  toward: Vec2,
): [Swarmling, Swarmling] {
  const ox = Math.cos(facing + Math.PI / 2) * SwarmTuning.splitOffset;
  const oy = Math.sin(facing + Math.PI / 2) * SwarmTuning.splitOffset;
  const a = createSwarmling(scene, at.x + ox, at.y + oy, 'mini', 28);
  const b = createSwarmling(scene, at.x - ox, at.y - oy, 'mini', 28);
  beginTell(a, now, toward);
  beginTell(b, now, toward);
  return [a, b];
}

function beginTell(ling: Swarmling, now: number, target: Vec2): void {
  ling.phase = 'tell';
  ling.tellUntil = now + tellMsFor(ling.kind);
  haltSwarmling(ling);
  faceSprite(ling.sprite, target);
  ling.sprite.setTint(0xfff4d0);
}

function commitLunge(ling: Swarmling, body: Phaser.Physics.Arcade.Body, target: Vec2, now: number): void {
  ling.phase = 'chase';
  ling.lungeUntil = now + SwarmTuning.lungeMs;
  ling.sprite.setScale(ling.baseScale);
  if (ling.kind !== 'mini') {
    ling.sprite.clearTint();
  }
  ling.sprite.setAlpha(1);
  const dx = target.x - body.center.x;
  const dy = target.y - body.center.y;
  const len = Math.hypot(dx, dy) || 1;
  const cap = Math.max(body.maxVelocity.x, SwarmTuning.lungeSpeed);
  body.setMaxVelocity(cap, cap);
  body.setVelocity((dx / len) * SwarmTuning.lungeSpeed, (dy / len) * SwarmTuning.lungeSpeed);
}

function restIdle(ling: Swarmling): void {
  ling.phase = 'idle';
  ling.sprite.setScale(ling.baseScale);
  ling.sprite.setAlpha(0.78);
  if (ling.kind === 'mini') {
    ling.sprite.setTint(0xffe08a);
  } else {
    ling.sprite.clearTint();
  }
}

function wander(ling: Swarmling, body: Phaser.Physics.Arcade.Body, now: number): void {
  const sprite = ling.sprite;
  const homeDist = Phaser.Math.Distance.Between(sprite.x, sprite.y, ling.home.x, ling.home.y);
  if (homeDist > ling.homeRadius) {
    accelerateToward(body, ling.home, SwarmTuning.wanderAccel);
  } else {
    const wanderPhase = now * 0.0018 + ling.home.x * 0.01;
    body.setAcceleration(
      Math.cos(wanderPhase) * SwarmTuning.wanderAccel,
      Math.sin(wanderPhase * 1.3) * SwarmTuning.wanderAccel,
    );
  }
  sprite.setAlpha(0.78);
  sprite.setScale(ling.baseScale);
}

function tellMsFor(kind: SwarmlingRole): number {
  if (kind === 'splitter') {
    return SwarmTuning.splitterTellMs;
  }
  if (kind === 'mini') {
    return SwarmTuning.miniTellMs;
  }
  return SwarmTuning.tellMs;
}

function faceSprite(sprite: Phaser.Physics.Arcade.Image, target: Vec2): void {
  sprite.setRotation(Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y) + Math.PI / 2);
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

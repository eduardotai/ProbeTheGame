import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { AnomalyTuning } from './tuning';
import type { HunterKind } from './procSpine';

export type Vec2 = { x: number; y: number };

export type AggroPhase = 'idle' | 'tell' | 'chase';

export type AnomalyHunter = {
  sprite: Phaser.Physics.Arcade.Image;
  kind: HunterKind;
  home: Vec2;
  homeRadius: number;
  hp: number;
  stunnedUntil: number;
  alive: boolean;
  phase: AggroPhase;
  tellUntil: number;
  lungeUntil: number;
};

export function createAnomalyHunter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: HunterKind,
  homeRadius = 48,
): AnomalyHunter {
  const key = kind === 'echo' ? TextureKey.AnomalyEcho : TextureKey.AnomalyHunter;
  const sprite = scene.physics.add.image(x, y, key);
  sprite.setDamping(true);
  sprite.setDrag(AnomalyTuning.hunterDrag);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(8);
  sprite.setBounce(0.16);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (kind === 'echo') {
    sprite.setMaxVelocity(AnomalyTuning.echoMaxSpeed);
    body?.setSize(16, 16, true);
  } else {
    sprite.setMaxVelocity(AnomalyTuning.hunterMaxSpeed);
    body?.setSize(20, 22, true);
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
  };
}

export function contactRadiusFor(kind: HunterKind): number {
  return kind === 'echo' ? AnomalyTuning.echoContactRadius : AnomalyTuning.contactRadius;
}

export function updateAnomalyHunter(
  hunter: AnomalyHunter,
  target: Vec2,
  now: number,
  aggroEnabled: boolean,
): void {
  if (!hunter.alive) {
    return;
  }
  const sprite = hunter.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  if (now < hunter.stunnedUntil) {
    body.setAcceleration(0, 0);
    sprite.setAlpha(0.8);
    return;
  }

  const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
  const inRange = aggroEnabled && dist <= AnomalyTuning.aggroRadius;
  const dropped = dist > AnomalyTuning.aggroDropRadius || !aggroEnabled;

  if (hunter.phase === 'idle') {
    if (inRange) {
      beginTell(hunter, now, target);
      return;
    }
    wander(hunter, body, now);
    return;
  }

  if (dropped) {
    restIdle(hunter);
    wander(hunter, body, now);
    return;
  }

  faceSprite(sprite, target);

  if (hunter.phase === 'tell') {
    body.setAcceleration(0, 0);
    body.setVelocity(0, 0);
    const pulse = 0.62 + 0.38 * Math.abs(Math.sin(now * 0.022));
    sprite.setAlpha(pulse);
    sprite.setTint(hunter.kind === 'echo' ? 0x7cffd4 : 0xe07aff);
    sprite.setScale(1.08 + 0.1 * pulse);
    if (now >= hunter.tellUntil) {
      commitLunge(hunter, body, target, now);
    }
    return;
  }

  const accel =
    now < hunter.lungeUntil
      ? AnomalyTuning.lungeAccel
      : hunter.kind === 'echo'
        ? AnomalyTuning.echoAccel
        : AnomalyTuning.hunterAccel;
  accelerateToward(body, target, accel);
  sprite.setAlpha(1);
  sprite.setScale(1);
  sprite.clearTint();
}

export function stunAnomalyHunter(hunter: AnomalyHunter, until: number): void {
  hunter.stunnedUntil = until;
  haltAnomalyHunter(hunter);
}

export function haltAnomalyHunter(hunter: AnomalyHunter): void {
  const body = hunter.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
}

export function killAnomalyHunter(hunter: AnomalyHunter): void {
  hunter.alive = false;
  hunter.hp = 0;
  const body = hunter.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (body) {
    body.stop();
    body.enable = false;
  }
  hunter.sprite.setActive(false);
  hunter.sprite.setVisible(false);
}

function beginTell(hunter: AnomalyHunter, now: number, target: Vec2): void {
  hunter.phase = 'tell';
  hunter.tellUntil = now + (hunter.kind === 'echo' ? AnomalyTuning.echoTellMs : AnomalyTuning.tellMs);
  haltAnomalyHunter(hunter);
  faceSprite(hunter.sprite, target);
  hunter.sprite.setTint(hunter.kind === 'echo' ? 0x7cffd4 : 0xe07aff);
}

function commitLunge(
  hunter: AnomalyHunter,
  body: Phaser.Physics.Arcade.Body,
  target: Vec2,
  now: number,
): void {
  hunter.phase = 'chase';
  hunter.lungeUntil = now + AnomalyTuning.lungeMs;
  hunter.sprite.setScale(1);
  hunter.sprite.clearTint();
  hunter.sprite.setAlpha(1);
  const dx = target.x - body.center.x;
  const dy = target.y - body.center.y;
  const len = Math.hypot(dx, dy) || 1;
  const cap = Math.max(body.maxVelocity.x, AnomalyTuning.lungeSpeed);
  body.setMaxVelocity(cap, cap);
  body.setVelocity((dx / len) * AnomalyTuning.lungeSpeed, (dy / len) * AnomalyTuning.lungeSpeed);
}

function restIdle(hunter: AnomalyHunter): void {
  hunter.phase = 'idle';
  hunter.sprite.setScale(1);
  hunter.sprite.setAlpha(0.8);
  hunter.sprite.clearTint();
}

function wander(hunter: AnomalyHunter, body: Phaser.Physics.Arcade.Body, now: number): void {
  const sprite = hunter.sprite;
  const homeDist = Phaser.Math.Distance.Between(sprite.x, sprite.y, hunter.home.x, hunter.home.y);
  if (homeDist > hunter.homeRadius) {
    accelerateToward(body, hunter.home, AnomalyTuning.wanderAccel);
  } else {
    const wanderPhase = now * 0.0018 + hunter.home.x * 0.01;
    body.setAcceleration(
      Math.cos(wanderPhase) * AnomalyTuning.wanderAccel,
      Math.sin(wanderPhase * 1.3) * AnomalyTuning.wanderAccel,
    );
  }
  sprite.setAlpha(0.8);
  sprite.setScale(1);
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

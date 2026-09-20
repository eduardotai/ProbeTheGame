import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { AnomalyTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type EchoRole = 'echo' | 'prime';

export type AggroPhase = 'idle' | 'tell' | 'chase';

export type Echo = {
  sprite: Phaser.Physics.Arcade.Image;
  kind: EchoRole;
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

/**
 * Anomaly named variant (GDD §7): inverted tell vs Swarm.
 * Swarm flashes/grows then lunges. Echo dims/shrinks then lunges.
 */
export function createEcho(scene: Phaser.Scene, x: number, y: number, kind: EchoRole, homeRadius = 48): Echo {
  const key = kind === 'prime' ? TextureKey.EchoPrime : TextureKey.Echo;
  const sprite = scene.physics.add.image(x, y, key);
  sprite.setDamping(true);
  sprite.setDrag(AnomalyTuning.echoDrag);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(8);
  sprite.setBounce(0.14);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  const baseScale = kind === 'prime' ? 1 : 1;
  if (kind === 'prime') {
    sprite.setMaxVelocity(AnomalyTuning.primeMaxSpeed);
    body?.setSize(22, 24, true);
  } else {
    sprite.setMaxVelocity(AnomalyTuning.echoMaxSpeed);
    body?.setSize(16, 16, true);
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

export function contactRadiusFor(kind: EchoRole): number {
  return kind === 'prime' ? AnomalyTuning.primeContactRadius : AnomalyTuning.contactRadius;
}

export function updateEcho(echo: Echo, target: Vec2, now: number, aggroEnabled: boolean): void {
  if (!echo.alive) {
    return;
  }
  const sprite = echo.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  if (now < echo.stunnedUntil) {
    body.setAcceleration(0, 0);
    sprite.setAlpha(0.8);
    return;
  }

  const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
  const inRange = aggroEnabled && dist <= AnomalyTuning.aggroRadius;
  const dropped = dist > AnomalyTuning.aggroDropRadius || !aggroEnabled;

  if (echo.phase === 'idle') {
    if (inRange) {
      beginTell(echo, now, target);
      return;
    }
    wander(echo, body, now);
    return;
  }

  if (dropped) {
    restIdle(echo);
    wander(echo, body, now);
    return;
  }

  faceSprite(sprite, target);

  if (echo.phase === 'tell') {
    body.setAcceleration(0, 0);
    body.setVelocity(0, 0);
    const pulse = 0.22 + 0.18 * Math.abs(Math.sin(now * 0.028));
    sprite.setAlpha(pulse);
    sprite.setTint(0x5a1878);
    sprite.setScale(echo.baseScale * (0.62 + 0.1 * pulse));
    if (now >= echo.tellUntil) {
      commitLunge(echo, body, target, now);
    }
    return;
  }

  const accel =
    now < echo.lungeUntil
      ? AnomalyTuning.lungeAccel
      : echo.kind === 'prime'
        ? AnomalyTuning.primeAccel
        : AnomalyTuning.echoAccel;
  accelerateToward(body, target, accel);
  sprite.setAlpha(1);
  sprite.setScale(echo.baseScale);
  sprite.clearTint();
}

export function stunEcho(echo: Echo, until: number): void {
  echo.stunnedUntil = until;
  haltEcho(echo);
}

export function haltEcho(echo: Echo): void {
  const body = echo.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
}

export function killEcho(echo: Echo): void {
  echo.alive = false;
  echo.hp = 0;
  const body = echo.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (body) {
    body.stop();
    body.enable = false;
  }
  echo.sprite.setActive(false);
  echo.sprite.setVisible(false);
}

function beginTell(echo: Echo, now: number, target: Vec2): void {
  echo.phase = 'tell';
  echo.tellUntil = now + (echo.kind === 'prime' ? AnomalyTuning.primeTellMs : AnomalyTuning.tellMs);
  haltEcho(echo);
  faceSprite(echo.sprite, target);
  echo.sprite.setTint(0x5a1878);
}

function commitLunge(echo: Echo, body: Phaser.Physics.Arcade.Body, target: Vec2, now: number): void {
  echo.phase = 'chase';
  echo.lungeUntil = now + AnomalyTuning.lungeMs;
  echo.sprite.setScale(echo.baseScale);
  echo.sprite.clearTint();
  echo.sprite.setAlpha(1);
  const dx = target.x - body.center.x;
  const dy = target.y - body.center.y;
  const len = Math.hypot(dx, dy) || 1;
  const cap = Math.max(body.maxVelocity.x, AnomalyTuning.lungeSpeed);
  body.setMaxVelocity(cap, cap);
  body.setVelocity((dx / len) * AnomalyTuning.lungeSpeed, (dy / len) * AnomalyTuning.lungeSpeed);
}

function restIdle(echo: Echo): void {
  echo.phase = 'idle';
  echo.sprite.setScale(echo.baseScale);
  echo.sprite.setAlpha(0.82);
  echo.sprite.clearTint();
}

function wander(echo: Echo, body: Phaser.Physics.Arcade.Body, now: number): void {
  const sprite = echo.sprite;
  const homeDist = Phaser.Math.Distance.Between(sprite.x, sprite.y, echo.home.x, echo.home.y);
  if (homeDist > echo.homeRadius) {
    accelerateToward(body, echo.home, AnomalyTuning.wanderAccel);
  } else {
    const wanderPhase = now * 0.0018 + echo.home.x * 0.01;
    body.setAcceleration(
      Math.cos(wanderPhase) * AnomalyTuning.wanderAccel,
      Math.sin(wanderPhase * 1.3) * AnomalyTuning.wanderAccel,
    );
  }
  sprite.setAlpha(0.82);
  sprite.setScale(echo.baseScale);
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

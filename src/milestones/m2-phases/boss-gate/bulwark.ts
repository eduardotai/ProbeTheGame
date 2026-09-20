import Phaser from 'phaser';
import { Palette, TextureKey } from '../../../game/constants';
import { BossGateTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type GateMove = 'charge' | 'sweep' | 'slam';

export type GatePhase = 'idle' | 'tell' | 'commit' | 'recover' | 'dead';

export type GateBulwarkEvent =
  | { type: 'tell'; move: GateMove }
  | { type: 'charge' }
  | { type: 'sweep'; origin: Vec2; facing: number }
  | { type: 'slam'; origin: Vec2 }
  | { type: 'recover' }
  | { type: 'dead' };

export type GateBulwark = {
  sprite: Phaser.Physics.Arcade.Image;
  home: Vec2;
  hp: number;
  maxHp: number;
  alive: boolean;
  phase: GatePhase;
  move: GateMove | null;
  facing: number;
  tellUntil: number;
  commitUntil: number;
  recoverUntil: number;
  nextAttackAt: number;
  plateActive: boolean;
  enraged: boolean;
  baseScale: number;
  moveIndex: number;
};

/**
 * Boss Gate named variant (GDD §7): Gate Bulwark.
 * Slow, high HP, blocks the sealed gate. Readable tells, punishable commits.
 */
export function createGateBulwark(scene: Phaser.Scene, x: number, y: number): GateBulwark {
  const sprite = scene.physics.add.image(x, y, TextureKey.GateBulwark);
  sprite.setScale(BossGateTuning.bulwarkScale);
  sprite.setDamping(true);
  sprite.setDrag(BossGateTuning.bulwarkDrag);
  sprite.setMaxVelocity(BossGateTuning.bulwarkMaxSpeed);
  sprite.setCollideWorldBounds(true);
  sprite.setDepth(8);
  sprite.setBounce(0.02);
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  body?.setSize(28, 32, true);
  return {
    sprite,
    home: { x, y },
    hp: BossGateTuning.bulwarkHp,
    maxHp: BossGateTuning.bulwarkHp,
    alive: true,
    phase: 'idle',
    move: null,
    facing: Math.PI,
    tellUntil: 0,
    commitUntil: 0,
    recoverUntil: 0,
    nextAttackAt: 0,
    plateActive: false,
    enraged: false,
    baseScale: BossGateTuning.bulwarkScale,
    moveIndex: 0,
  };
}

export function updateGateBulwark(
  bulwark: GateBulwark,
  target: Vec2,
  now: number,
  inArena: boolean,
  onApproach: boolean,
): GateBulwarkEvent[] {
  const events: GateBulwarkEvent[] = [];
  if (!bulwark.alive) {
    return events;
  }
  const sprite = bulwark.sprite;
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return events;
  }

  if (bulwark.phase === 'tell') {
    body.setAcceleration(0, 0);
    body.setVelocity(0, 0);
    pulseTell(bulwark, now);
    if (now >= bulwark.tellUntil && bulwark.move) {
      commitMove(bulwark, now, events);
    }
    return events;
  }

  if (bulwark.phase === 'commit') {
    if (bulwark.move === 'charge') {
      body.setAcceleration(0, 0);
      body.setMaxVelocity(BossGateTuning.chargeSpeed);
      body.setVelocity(
        Math.cos(bulwark.facing) * BossGateTuning.chargeSpeed,
        Math.sin(bulwark.facing) * BossGateTuning.chargeSpeed,
      );
      sprite.setRotation(bulwark.facing + Math.PI / 2);
    }
    if (now >= bulwark.commitUntil) {
      beginRecover(bulwark, now, events);
    }
    return events;
  }

  if (bulwark.phase === 'recover') {
    body.setAcceleration(0, 0);
    sprite.setAlpha(0.88);
    sprite.setTint(0xe08a9a);
    sprite.setScale(bulwark.baseScale);
    if (now >= bulwark.recoverUntil) {
      restIdle(bulwark);
    }
    return events;
  }

  sprite.setAlpha(1);
  sprite.clearTint();
  if (bulwark.enraged) {
    sprite.setTint(Palette.gate);
  }
  sprite.setScale(bulwark.baseScale);
  body.setMaxVelocity(BossGateTuning.bulwarkMaxSpeed);

  const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
  if (inArena && dist > 8) {
    faceSprite(sprite, target);
    bulwark.facing = Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y);
  }

  if (inArena && now >= bulwark.nextAttackAt) {
    beginTell(bulwark, now, pickMove(bulwark), target, events);
    return events;
  }

  if (!inArena && onApproach && now >= bulwark.nextAttackAt) {
    beginTell(bulwark, now, 'sweep', target, events);
    bulwark.nextAttackAt = now + BossGateTuning.approachSweepGapMs;
    return events;
  }

  walkHome(bulwark, body);
  return events;
}

export function forceTell(bulwark: GateBulwark, move: GateMove, target: Vec2, now: number): GateBulwarkEvent[] {
  const events: GateBulwarkEvent[] = [];
  if (!bulwark.alive) {
    return events;
  }
  haltBulwark(bulwark);
  beginTell(bulwark, now, move, target, events);
  return events;
}

export function applyBulwarkHit(bulwark: GateBulwark, amount = 1): boolean {
  if (!bulwark.alive) {
    return false;
  }
  bulwark.hp = Math.max(0, bulwark.hp - amount);
  bulwark.sprite.setTint(0xffd0d8);
  if (!bulwark.enraged && bulwark.hp <= bulwark.maxHp / 2) {
    bulwark.enraged = true;
    bulwark.baseScale = BossGateTuning.bulwarkScale * 1.08;
  }
  if (bulwark.hp <= 0) {
    killBulwark(bulwark);
    return true;
  }
  return false;
}

export function killBulwark(bulwark: GateBulwark): void {
  bulwark.alive = false;
  bulwark.hp = 0;
  bulwark.phase = 'dead';
  bulwark.move = null;
  bulwark.plateActive = false;
  haltBulwark(bulwark);
  bulwark.sprite.setTint(0x4a3038);
  bulwark.sprite.setAlpha(0.35);
}

export function haltBulwark(bulwark: GateBulwark): void {
  const body = bulwark.sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return;
  }
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
}

export function boltHitsPlate(bulwark: GateBulwark, bolt: Phaser.Physics.Arcade.Image): boolean {
  if (!bulwark.plateActive || !bulwark.alive) {
    return false;
  }
  const body = bolt.body as Phaser.Physics.Arcade.Body | null;
  if (!body) {
    return false;
  }
  const vx = body.velocity.x;
  const vy = body.velocity.y;
  const len = Math.hypot(vx, vy);
  if (len < 1) {
    return false;
  }
  const fx = Math.cos(bulwark.facing);
  const fy = Math.sin(bulwark.facing);
  const dot = (vx / len) * fx + (vy / len) * fy;
  return dot < -BossGateTuning.plateDot;
}

export function hpBar(bulwark: GateBulwark, width = 14): string {
  const filled = Math.round((bulwark.hp / bulwark.maxHp) * width);
  const clamped = Math.max(0, Math.min(width, filled));
  return `${'█'.repeat(clamped)}${'░'.repeat(width - clamped)}`;
}

export function phaseLabel(bulwark: GateBulwark): string {
  if (!bulwark.alive) {
    return 'DOWN';
  }
  if (bulwark.phase === 'tell' && bulwark.move) {
    return `${bulwark.move.toUpperCase()} TELL`;
  }
  if (bulwark.phase === 'commit' && bulwark.move) {
    return bulwark.move.toUpperCase();
  }
  if (bulwark.phase === 'recover') {
    return 'RECOVER';
  }
  return bulwark.enraged ? 'ENRAGED' : 'GUARD';
}

function pickMove(bulwark: GateBulwark): GateMove {
  const cycle: readonly GateMove[] = bulwark.enraged
    ? ['charge', 'slam', 'sweep', 'slam']
    : ['charge', 'sweep'];
  const move = cycle[bulwark.moveIndex % cycle.length] ?? 'charge';
  bulwark.moveIndex += 1;
  return move;
}

function beginTell(
  bulwark: GateBulwark,
  now: number,
  move: GateMove,
  target: Vec2,
  events: GateBulwarkEvent[],
): void {
  const sprite = bulwark.sprite;
  bulwark.phase = 'tell';
  bulwark.move = move;
  bulwark.facing = Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y);
  sprite.setRotation(bulwark.facing + Math.PI / 2);
  bulwark.plateActive = move === 'charge';
  const tellMs =
    move === 'charge'
      ? BossGateTuning.chargeTellMs
      : move === 'sweep'
        ? BossGateTuning.sweepTellMs
        : BossGateTuning.slamTellMs;
  const shortened = bulwark.enraged ? Math.floor(tellMs * 0.86) : tellMs;
  bulwark.tellUntil = now + shortened;
  events.push({ type: 'tell', move });
}

function commitMove(bulwark: GateBulwark, now: number, events: GateBulwarkEvent[]): void {
  const origin = { x: bulwark.sprite.x, y: bulwark.sprite.y };
  if (bulwark.move === 'charge') {
    bulwark.phase = 'commit';
    bulwark.commitUntil = now + BossGateTuning.chargeMs;
    bulwark.plateActive = true;
    events.push({ type: 'charge' });
    return;
  }
  if (bulwark.move === 'sweep') {
    events.push({ type: 'sweep', origin, facing: bulwark.facing });
    beginRecover(bulwark, now, events);
    return;
  }
  events.push({ type: 'slam', origin });
  beginRecover(bulwark, now, events);
}

function beginRecover(bulwark: GateBulwark, now: number, events: GateBulwarkEvent[]): void {
  haltBulwark(bulwark);
  bulwark.phase = 'recover';
  bulwark.plateActive = false;
  bulwark.recoverUntil = now + BossGateTuning.recoverMs;
  bulwark.nextAttackAt = bulwark.recoverUntil + BossGateTuning.attackGapMs;
  const body = bulwark.sprite.body as Phaser.Physics.Arcade.Body | null;
  body?.setMaxVelocity(BossGateTuning.bulwarkMaxSpeed);
  events.push({ type: 'recover' });
}

function restIdle(bulwark: GateBulwark): void {
  bulwark.phase = 'idle';
  bulwark.move = null;
  bulwark.plateActive = false;
  bulwark.sprite.setAlpha(1);
  bulwark.sprite.clearTint();
  if (bulwark.enraged) {
    bulwark.sprite.setTint(Palette.gate);
  }
}

function pulseTell(bulwark: GateBulwark, now: number): void {
  const pulse = 0.7 + 0.3 * Math.abs(Math.sin(now * 0.018));
  bulwark.sprite.setAlpha(pulse);
  if (bulwark.move === 'charge') {
    bulwark.sprite.setTint(0xff5a4a);
    bulwark.sprite.setScale(bulwark.baseScale * (1.04 + 0.08 * pulse));
  } else if (bulwark.move === 'sweep') {
    bulwark.sprite.setTint(0xffc14a);
    bulwark.sprite.setScale(bulwark.baseScale * (1.02 + 0.05 * pulse));
  } else {
    bulwark.sprite.setTint(0xff8a5a);
    bulwark.sprite.setScale(bulwark.baseScale * (1.06 + 0.1 * pulse));
  }
}

function walkHome(bulwark: GateBulwark, body: Phaser.Physics.Arcade.Body): void {
  const sprite = bulwark.sprite;
  const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, bulwark.home.x, bulwark.home.y);
  if (dist < BossGateTuning.bulwarkHomeRadius) {
    body.setAcceleration(0, 0);
    return;
  }
  const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, bulwark.home.x, bulwark.home.y);
  body.setAcceleration(Math.cos(angle) * BossGateTuning.bulwarkAccel, Math.sin(angle) * BossGateTuning.bulwarkAccel);
  sprite.setRotation(angle + Math.PI / 2);
}

function faceSprite(sprite: Phaser.Physics.Arcade.Image, target: Vec2): void {
  sprite.setRotation(Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y) + Math.PI / 2);
}

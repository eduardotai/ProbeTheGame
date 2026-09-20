import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { SwarmTuning } from './tuning';

export class HeatSink {
  readonly capacity: number;
  current: number;
  overheated = false;
  private coolDelayMs = 0;

  constructor(capacity = SwarmTuning.heatCapacity) {
    this.capacity = capacity;
    this.current = 0;
  }

  get locked(): boolean {
    return this.overheated;
  }

  add(cost: number): void {
    this.current = Math.min(this.capacity, this.current + cost);
    this.coolDelayMs = SwarmTuning.heatCoolDelayMs;
    if (this.current >= this.capacity) {
      this.current = this.capacity;
      this.overheated = true;
    }
  }

  update(deltaMs: number): void {
    if (deltaMs <= 0) {
      return;
    }
    if (!this.overheated && this.coolDelayMs > 0) {
      this.coolDelayMs = Math.max(0, this.coolDelayMs - deltaMs);
      return;
    }
    if (this.current <= 0) {
      this.current = 0;
      this.overheated = false;
      return;
    }
    this.current = Math.max(0, this.current - (SwarmTuning.heatCoolPerSec * deltaMs) / 1000);
    if (this.overheated && this.current <= SwarmTuning.heatRecoverAt) {
      this.overheated = false;
    }
  }

  toBar(width = 10): string {
    const filled = Math.round((this.current / this.capacity) * width);
    const clamped = Math.max(0, Math.min(width, filled));
    return `[${'#'.repeat(clamped)}${'.'.repeat(width - clamped)}]`;
  }
}

export class Mag {
  readonly capacity: number;
  current: number;

  constructor(capacity: number = SwarmTuning.ammoCapacity, current: number = capacity) {
    this.capacity = capacity;
    this.current = Math.max(0, Math.min(capacity, Math.floor(current)));
  }

  tryConsume(): boolean {
    if (this.current < 1) {
      return false;
    }
    this.current -= 1;
    return true;
  }

  toBar(width = 10): string {
    const filled = Math.round((this.current / this.capacity) * width);
    const clamped = Math.max(0, Math.min(width, filled));
    return `[${'#'.repeat(clamped)}${'.'.repeat(width - clamped)}]`;
  }
}

export type FireResult = 'fired' | 'empty' | 'hot' | 'wait';

/** Heat + ammo gate sustained fire (GDD §4.4). Facing comes from the caller. */
export class SwarmWeapon {
  readonly heat: HeatSink;
  readonly mag: Mag;
  private nextShotAt = 0;
  private nextDryAt = 0;

  constructor(ammo?: number) {
    this.heat = new HeatSink();
    this.mag = new Mag(SwarmTuning.ammoCapacity, ammo ?? SwarmTuning.ammoCapacity);
  }

  update(deltaMs: number): void {
    this.heat.update(deltaMs);
  }

  tryFire(now: number): FireResult {
    if (now < this.nextShotAt) {
      return 'wait';
    }
    if (this.heat.locked) {
      if (now >= this.nextDryAt) {
        this.nextDryAt = now + 240;
        return 'hot';
      }
      return 'wait';
    }
    if (!this.mag.tryConsume()) {
      if (now >= this.nextDryAt) {
        this.nextDryAt = now + 240;
        return 'empty';
      }
      return 'wait';
    }
    this.heat.add(SwarmTuning.heatPerShot);
    this.nextShotAt = now + SwarmTuning.fireIntervalMs;
    return 'fired';
  }
}

export function spawnBolt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  facing: number,
  now: number,
): Phaser.Physics.Arcade.Image {
  const bolt = scene.physics.add.image(x, y, TextureKey.Bolt);
  bolt.setDepth(9);
  bolt.setRotation(facing + Math.PI / 2);
  bolt.setVelocity(Math.cos(facing) * SwarmTuning.boltSpeed, Math.sin(facing) * SwarmTuning.boltSpeed);
  bolt.setBounce(0);
  bolt.setCollideWorldBounds(false);
  const body = bolt.body as Phaser.Physics.Arcade.Body | null;
  body?.setAllowGravity(false);
  body?.setSize(8, 14, true);
  bolt.setData('born', now);
  return bolt;
}

export function boltExpired(bolt: Phaser.Physics.Arcade.Image, now: number, worldWidth: number): boolean {
  if (!bolt.active) {
    return true;
  }
  const born = Number(bolt.getData('born') ?? 0);
  if (now - born > SwarmTuning.boltLifeMs) {
    return true;
  }
  return bolt.x < -40 || bolt.x > worldWidth + 40 || bolt.y < -40 || bolt.y > SwarmTuning.world.height + 40;
}

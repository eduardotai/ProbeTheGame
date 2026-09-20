import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { BossGateTuning } from './tuning';

export function spawnWardBolt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  facing: number,
  now: number,
): Phaser.Physics.Arcade.Image {
  const bolt = scene.physics.add.image(x, y, TextureKey.WardBolt);
  bolt.setDepth(9);
  bolt.setRotation(facing + Math.PI / 2);
  bolt.setVelocity(Math.cos(facing) * BossGateTuning.sweepSpeed, Math.sin(facing) * BossGateTuning.sweepSpeed);
  bolt.setBounce(0);
  bolt.setCollideWorldBounds(false);
  const body = bolt.body as Phaser.Physics.Arcade.Body | null;
  body?.setAllowGravity(false);
  body?.setSize(8, 14, true);
  bolt.setData('kind', 'ward');
  bolt.setData('born', now);
  return bolt;
}

export function wardExpired(bolt: Phaser.Physics.Arcade.Image, now: number, worldWidth: number): boolean {
  if (!bolt.active) {
    return true;
  }
  const born = Number(bolt.getData('born') ?? 0);
  if (now - born > BossGateTuning.sweepLifeMs) {
    return true;
  }
  return bolt.x < -40 || bolt.x > worldWidth + 40 || bolt.y < -40 || bolt.y > BossGateTuning.world.height + 40;
}

export type Shockwave = {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  radius: number;
  alive: boolean;
  hit: boolean;
};

export function createShockwave(scene: Phaser.Scene, x: number, y: number): Shockwave {
  const graphics = scene.add.graphics().setDepth(7);
  return { graphics, x, y, radius: 36, alive: true, hit: false };
}

export function updateShockwave(wave: Shockwave, deltaMs: number): void {
  if (!wave.alive) {
    return;
  }
  wave.radius += (BossGateTuning.slamGrowPerSec * deltaMs) / 1000;
  wave.graphics.clear();
  wave.graphics.lineStyle(4, 0xff8a5a, 0.85);
  wave.graphics.strokeCircle(wave.x, wave.y, wave.radius);
  wave.graphics.lineStyle(10, 0xc45a6a, 0.22);
  wave.graphics.strokeCircle(wave.x, wave.y, wave.radius);
  if (wave.radius >= BossGateTuning.slamMaxRadius) {
    killShockwave(wave);
  }
}

export function shockwaveHits(wave: Shockwave, x: number, y: number): boolean {
  if (!wave.alive || wave.hit) {
    return false;
  }
  const dist = Math.hypot(x - wave.x, y - wave.y);
  const half = BossGateTuning.slamThickness / 2;
  return Math.abs(dist - wave.radius) <= half;
}

export function killShockwave(wave: Shockwave): void {
  wave.alive = false;
  wave.graphics.destroy();
}

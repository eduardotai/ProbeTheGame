import Phaser from 'phaser';
import { TextureKey } from '../../game/constants';

/**
 * Probe avatar stub (GDD §3).
 * Unmanned, compact silhouette: body + thruster + one sensor eye.
 */
export function createProbe(scene: Phaser.Scene, x: number, y: number): Phaser.Physics.Arcade.Image {
  const probe = scene.physics.add.image(x, y, TextureKey.Probe);
  probe.setDamping(true);
  probe.setDrag(0.92);
  probe.setMaxVelocity(240);
  probe.setCollideWorldBounds(true);
  probe.setDepth(10);
  probe.setOrigin(0.5, 0.55);
  return probe;
}

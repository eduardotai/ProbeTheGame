import Phaser from 'phaser';
import { TextureKey } from '../../game/constants';
import { DriftTuning } from './tuning';

/**
 * Probe avatar (GDD §3).
 * Unmanned, compact silhouette: body + thruster + one sensor eye.
 */
export function createProbe(scene: Phaser.Scene, x: number, y: number): Phaser.Physics.Arcade.Image {
  const probe = scene.physics.add.image(x, y, TextureKey.Probe);
  probe.setDamping(true);
  probe.setDrag(DriftTuning.probeDrag);
  probe.setMaxVelocity(DriftTuning.probeMaxSpeed);
  probe.setCollideWorldBounds(true);
  probe.setDepth(10);
  probe.setOrigin(0.5, 0.55);
  probe.setBounce(0.15);
  const body = probe.body as Phaser.Physics.Arcade.Body | null;
  body?.setSize(22, 28, true);
  return probe;
}

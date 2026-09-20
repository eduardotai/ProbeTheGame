import Phaser from 'phaser';
import { TextureKey } from '../../game/constants';

export type PointBTrigger = {
  marker: Phaser.GameObjects.Image;
  zone: Phaser.GameObjects.Zone;
  reached: boolean;
  onReached: () => void;
};

/** Point B / Drift exit (PRD §5). Overlap completes the phase. */
export function createPointBTrigger(scene: Phaser.Scene, x: number, y: number): PointBTrigger {
  const marker = scene.add.image(x, y, TextureKey.PointB).setDepth(6);
  scene.tweens.add({
    targets: marker,
    alpha: { from: 0.7, to: 1 },
    scale: { from: 0.92, to: 1.08 },
    duration: 900,
    yoyo: true,
    repeat: -1,
  });

  const zone = scene.add.zone(x, y, 56, 56);
  scene.physics.add.existing(zone, true);

  const trigger: PointBTrigger = {
    marker,
    zone,
    reached: false,
    onReached: () => {
      if (trigger.reached) {
        return;
      }
      trigger.reached = true;
    },
  };

  scene.add
    .text(x, y + 28, 'B', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '14px',
      color: '#5ee0ff',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  return trigger;
}

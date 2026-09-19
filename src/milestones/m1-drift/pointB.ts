import Phaser from 'phaser';
import { TextureKey } from '../../game/constants';

export type PointBTrigger = {
  marker: Phaser.GameObjects.Image;
  zone: Phaser.GameObjects.Zone;
  reached: boolean;
  onReached: () => void;
};

/** Point B / phase-exit trigger stub (PRD §5). Overlap only — no run complete. */
export function createPointBTrigger(scene: Phaser.Scene, x: number, y: number): PointBTrigger {
  const marker = scene.add.image(x, y, TextureKey.PointB).setDepth(6);
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
      // TODO(M1): complete Drift / hand off to next phase (M3 chain).
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

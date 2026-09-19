import Phaser from 'phaser';
import { TextureKey } from '../../game/constants';

export type LosHunter = {
  sprite: Phaser.Physics.Arcade.Image;
  seesTarget: boolean;
};

/**
 * Single LOS hunter stub (PRD §5 / GDD §7 Hunter).
 * Test shell draws a LOS ray; chase / noise reaction is TODO.
 */
export function createLosHunter(scene: Phaser.Scene, x: number, y: number): LosHunter {
  const sprite = scene.physics.add.image(x, y, TextureKey.Hunter);
  sprite.setImmovable(true);
  sprite.setDepth(8);
  return { sprite, seesTarget: false };
}

export function hasLineOfSight(
  from: { x: number; y: number },
  to: { x: number; y: number },
  occluders: readonly Phaser.Geom.Rectangle[] = [],
): boolean {
  const ray = new Phaser.Geom.Line(from.x, from.y, to.x, to.y);
  for (const box of occluders) {
    if (Phaser.Geom.Intersects.LineToRectangle(ray, box)) {
      return false;
    }
  }
  // TODO(M1): sound-based hunt; Drift cover is scarce so open LOS is the default.
  return true;
}

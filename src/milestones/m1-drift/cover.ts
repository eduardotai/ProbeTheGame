import Phaser from 'phaser';
import { Palette } from '../../game/constants';

export type DriftCover = {
  visual: Phaser.GameObjects.Rectangle;
  rect: Phaser.Geom.Rectangle;
};

const COVER_SPECS: ReadonlyArray<{ x: number; y: number; w: number; h: number }> = [
  { x: 400, y: 250, w: 44, h: 280 },
  { x: 740, y: 480, w: 44, h: 280 },
  { x: 980, y: 220, w: 180, h: 34 },
];

/**
 * Few hard covers in open Drift space (GDD §4.1).
 * Blocks LOS for hunters; solid for the probe. Hunters do not collide so they
 * can keep a chase without pathfinding (Debris Field owns funnel-gap pathing).
 */
export function createDriftCovers(scene: Phaser.Scene): DriftCover[] {
  return COVER_SPECS.map((spec) => {
    const visual = scene.add
      .rectangle(spec.x, spec.y, spec.w, spec.h, Palette.cover, 1)
      .setStrokeStyle(1, Palette.coverEdge, 0.9)
      .setDepth(4);
    scene.physics.add.existing(visual, true);
    const rect = new Phaser.Geom.Rectangle(spec.x - spec.w / 2, spec.y - spec.h / 2, spec.w, spec.h);
    return { visual, rect };
  });
}

export function coverRects(covers: readonly DriftCover[]): Phaser.Geom.Rectangle[] {
  return covers.map((cover) => cover.rect);
}

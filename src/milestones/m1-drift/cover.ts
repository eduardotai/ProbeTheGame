import Phaser from 'phaser';
import { createTiledCovers, type PixelCover } from '../../game/art';

export type DriftCover = PixelCover;

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
  return createTiledCovers(scene, COVER_SPECS, 'steel');
}

export function coverRects(covers: readonly DriftCover[]): Phaser.Geom.Rectangle[] {
  return covers.map((cover) => cover.rect);
}

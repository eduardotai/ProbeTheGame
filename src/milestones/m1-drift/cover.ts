import Phaser from 'phaser';
import { Palette } from '../../game/constants';
import { createTiledCovers, paintStarfield, placePointA, type PixelCover } from '../../game/art';
import type { CoverSpec, DriftLayout } from './procSpine';

export type DriftCover = PixelCover;

/**
 * Few hard covers in open Drift space (GDD §4.1).
 * Blocks LOS for hunters; solid for the probe. Hunters do not pathfind
 * (Debris Field owns funnel-gap pathing).
 */
export function createDriftCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): DriftCover[] {
  return createTiledCovers(scene, specs, 'steel');
}

export function paintDriftField(scene: Phaser.Scene, layout: DriftLayout): void {
  paintStarfield(scene, layout.world.width, layout.world.height, Palette.pointB, 200);
  placePointA(scene, layout.probe.x, layout.probe.y);
}

export function coverRects(covers: readonly DriftCover[]): Phaser.Geom.Rectangle[] {
  return covers.map((cover) => cover.rect);
}

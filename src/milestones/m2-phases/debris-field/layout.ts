import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import { createTiledCovers, paintStarfield, paintTiledFloor, placePointA } from '../../../game/art';
import type { DriftCover } from '../../m1-drift';
import type { Aabb, CoverSpec, DebrisLayout } from './procSpine';

export type DebrisCover = DriftCover;

export type { Aabb } from './procSpine';

export function createDebrisCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): DebrisCover[] {
  return createTiledCovers(scene, specs, 'debris');
}

export function paintDebrisField(scene: Phaser.Scene, layout: DebrisLayout): void {
  paintStarfield(scene, layout.world.width, layout.world.height, 0x3a4d66, 210);

  for (const floor of layout.pocketFloors) {
    paintTiledFloor(scene, floor.x, floor.y, floor.w, floor.h, TextureKey.PocketFloor, 1, 1);
    scene.add
      .text(floor.x + floor.w / 2, floor.y + floor.h / 2, 'POCKET', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '11px',
        color: '#8aa0b4',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0.7);
  }

  placePointA(scene, layout.probe.x, layout.probe.y);
}

export function isInSafePocket(x: number, y: number, pockets: readonly Aabb[]): boolean {
  for (const pocket of pockets) {
    if (x >= pocket.x && x <= pocket.x + pocket.w && y >= pocket.y && y <= pocket.y + pocket.h) {
      return true;
    }
  }
  return false;
}

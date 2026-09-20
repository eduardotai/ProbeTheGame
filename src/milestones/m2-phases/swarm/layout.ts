import Phaser from 'phaser';
import { Palette, TextureKey } from '../../../game/constants';
import { createTiledCovers, paintLane, paintStarfield, paintTiledFloor, placePointA } from '../../../game/art';
import type { DriftCover } from '../../m1-drift';
import type { CoverSpec, SwarmLayout, TransitZone } from './procSpine';

export type SwarmCover = DriftCover;

export function createSwarmCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): SwarmCover[] {
  return createTiledCovers(scene, specs, 'steel');
}

export function paintSwarmField(scene: Phaser.Scene, layout: SwarmLayout): void {
  paintStarfield(scene, layout.world.width, layout.world.height, Palette.swarmling, 220);

  for (const zone of layout.zones) {
    paintZone(scene, zone);
  }

  for (const segment of layout.segments) {
    if (segment.kind === 'launch') {
      continue;
    }
    paintLane(scene, segment.x0, segment.x1, segment.laneY, TextureKey.Lane);
  }

  placePointA(scene, layout.probe.x, layout.probe.y);
}

function paintZone(scene: Phaser.Scene, zone: TransitZone): void {
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + zone.h / 2;
  if (zone.kind === 'clear') {
    paintTiledFloor(scene, zone.x, zone.y, zone.w, zone.h, TextureKey.PocketFloor, 1, 0.95);
    scene.add
      .text(cx, cy, 'CLEAR', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#ffc14a',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0.8);
    return;
  }
  paintTiledFloor(scene, zone.x, zone.y, zone.w, zone.h, TextureKey.ZoneFloorWarm, 1, 0.55);
  scene.add
    .text(cx, zone.y + 16, 'PUSH', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '11px',
      color: '#ff8a5a',
    })
    .setOrigin(0.5, 0)
    .setDepth(6)
    .setAlpha(0.55);
}

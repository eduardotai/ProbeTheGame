import Phaser from 'phaser';
import { Palette, TextureKey } from '../../../game/constants';
import { createTiledCovers, paintLane, paintStarfield, paintTiledFloor, placePointA } from '../../../game/art';
import { INVERT_BIND_HINT, INVERT_RULE_LABEL } from './invert';
import type { DriftCover } from '../../m1-drift';
import type { AnomalyLayout, CoverSpec, TransitZone } from './procSpine';

export type AnomalyCover = DriftCover;

export function createAnomalyCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): AnomalyCover[] {
  return createTiledCovers(scene, specs, 'anomaly');
}

export function paintAnomalyField(scene: Phaser.Scene, layout: AnomalyLayout): void {
  paintStarfield(scene, layout.world.width, layout.world.height, Palette.anomaly, 220);

  for (const zone of layout.zones) {
    paintZone(scene, zone);
  }

  for (const segment of layout.segments) {
    if (segment.kind === 'launch') {
      continue;
    }
    paintLane(scene, segment.x0, segment.x1, segment.laneY, TextureKey.LaneAnomaly);
  }

  placePointA(scene, layout.probe.x, layout.probe.y);

  scene.add
    .text(layout.probe.x + 210, 196, INVERT_RULE_LABEL, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '22px',
      color: '#ff6ad5',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(layout.probe.x + 210, 226, INVERT_BIND_HINT, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '16px',
      color: '#c89aff',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(layout.probe.x + 210, 254, 'feel it on the runway — then fight through', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '12px',
      color: '#8aa0b4',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);
}

function paintZone(scene: Phaser.Scene, zone: TransitZone): void {
  const cx = zone.x + zone.w / 2;
  if (zone.kind === 'breathe') {
    paintTiledFloor(scene, zone.x, zone.y, zone.w, zone.h, TextureKey.PocketFloor, 1, 0.95);
    scene.add
      .text(cx, zone.y + zone.h / 2, 'BREATHE', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#c89aff',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0.8);
    return;
  }
  if (zone.kind === 'weave') {
    paintTiledFloor(scene, zone.x, zone.y, zone.w, zone.h, TextureKey.ZoneFloorAnomaly, 1, 0.5);
    scene.add
      .text(cx, zone.y + 16, 'WEAVE', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '11px',
        color: '#b07cff',
      })
      .setOrigin(0.5, 0)
      .setDepth(6)
      .setAlpha(0.6);
    return;
  }
  paintTiledFloor(scene, zone.x, zone.y, zone.w, zone.h, TextureKey.ZoneFloorAnomaly, 1, 0.55);
  scene.add
    .text(cx, zone.y + 16, 'PACK', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '11px',
      color: '#ff6ad5',
    })
    .setOrigin(0.5, 0)
    .setDepth(6)
    .setAlpha(0.55);
}

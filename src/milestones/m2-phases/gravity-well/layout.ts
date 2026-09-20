import Phaser from 'phaser';
import { Palette, TextureKey } from '../../../game/constants';
import { createTiledCovers, paintPixelRing, paintStarfield, placePointA } from '../../../game/art';
import type { DriftCover } from '../../m1-drift';
import { GravityTuning } from './tuning';
import type { CoverSpec, GravityLayout } from './procSpine';

export type GravityCover = DriftCover;

export function createGravityCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): GravityCover[] {
  return createTiledCovers(scene, specs, 'debris');
}

export function paintGravityField(scene: Phaser.Scene, layout: GravityLayout): void {
  paintStarfield(scene, layout.world.width, layout.world.height, Palette.wellRim, 210);

  const g = scene.add.graphics().setDepth(1);
  const { x, y } = layout.well;
  const rings: ReadonlyArray<{ r: number; fill: number; line: number; fa: number; la: number }> = [
    { r: 360, fill: 0x243044, line: Palette.longWay, fa: 0.07, la: 0.35 },
    { r: 260, fill: 0x3a2444, line: Palette.wellField, fa: 0.09, la: 0.4 },
    { r: GravityTuning.shortcutRadius, fill: 0x5a2038, line: Palette.shortcut, fa: 0.12, la: 0.5 },
    { r: 148, fill: 0x6a1830, line: Palette.wellRim, fa: 0.16, la: 0.6 },
  ];
  for (const ring of rings) {
    paintPixelRing(g, x, y, ring.r, ring.fill, ring.fa, true);
    paintPixelRing(g, x, y, ring.r, ring.line, ring.la, false);
  }

  paintPixelRing(g, x, y, GravityTuning.massRadius, 0x0c0608, 1, true);
  paintPixelRing(g, x, y, GravityTuning.massRadius, Palette.wellRim, 0.95, false);
  paintPixelRing(g, x, y, GravityTuning.horizonRadius, Palette.hull, 0.7, false);
  scene.add.image(x, y, TextureKey.WellCore).setDepth(3);

  paintPath(g, layout.shortcutPath, Palette.shortcut, 0.7);
  paintPath(g, layout.longPath, Palette.longWay, 0.65);

  const labelStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '12px',
  } as const;
  scene.add
    .text(layout.probe.x + 220, 300, 'SHORTCUT', { ...labelStyle, color: '#ff8a5a' })
    .setOrigin(0.5, 0.5)
    .setDepth(6)
    .setAlpha(0.8);
  scene.add
    .text(layout.probe.x + 280, 58, 'LONG WAY', { ...labelStyle, color: '#6a9aac' })
    .setOrigin(0.5, 0.5)
    .setDepth(6)
    .setAlpha(0.8);
  scene.add
    .text(x, y, 'WELL', { ...labelStyle, color: '#c45a6a' })
    .setOrigin(0.5, 0.5)
    .setDepth(6)
    .setAlpha(0.85);
  scene.add
    .text(x, 58, 'LONG WAY', { ...labelStyle, color: '#6a9aac' })
    .setOrigin(0.5, 0.5)
    .setDepth(6)
    .setAlpha(0.75);

  placePointA(scene, layout.probe.x, layout.probe.y);
}

function paintPath(
  g: Phaser.GameObjects.Graphics,
  points: readonly { x: number; y: number }[],
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  for (const point of points) {
    g.fillRect(point.x - 2, point.y - 2, 4, 4);
  }
}

import Phaser from 'phaser';
import { Palette, TextureKey, World } from '../../../game/constants';
import { createTiledCovers, paintPixelRing } from '../../../game/art';
import type { DriftCover } from '../../m1-drift';
import { GravityTuning } from './tuning';

export type GravityCover = DriftCover;

type Aabb = { x: number; y: number; w: number; h: number };

/**
 * Gravity scars (GDD §4.3): sparse rock, not a debris field.
 * South belt closes a cheap bottom hug so the long way is the northern loop.
 * Shortcut is the A→B line that cuts north of the well (stronger pull).
 */
const COVER_SPECS: readonly Aabb[] = [
  // Spawn scar — breaks A→trench sightline so launch is not a free LOS gift
  { x: 236, y: 358, w: 32, h: 100 },
  { x: 340, y: 668, w: 200, h: 28 },
  { x: 640, y: 690, w: 300, h: 24 },
  { x: 940, y: 668, w: 200, h: 28 },
  { x: 210, y: 560, w: 48, h: 72 },
  { x: 1070, y: 560, w: 48, h: 72 },
];

const SHORTCUT_PATH: readonly { x: number; y: number }[] = [
  { x: 200, y: 348 },
  { x: 360, y: 338 },
  { x: 520, y: 328 },
  { x: 640, y: 324 },
  { x: 760, y: 328 },
  { x: 920, y: 338 },
  { x: 1080, y: 348 },
];

const LONG_PATH: readonly { x: number; y: number }[] = [
  { x: 180, y: 280 },
  { x: 280, y: 150 },
  { x: 430, y: 84 },
  { x: 640, y: 68 },
  { x: 850, y: 84 },
  { x: 1000, y: 150 },
  { x: 1100, y: 280 },
];

export const GRAVITY_SPAWN = {
  probe: { x: 108, y: 348 },
  pointB: { x: World.width - 108, y: 348 },
  shortcutHunters: [
    { x: 580, y: 268 },
    { x: 920, y: 284 },
  ],
  longHunter: { x: 1020, y: 118 },
  bulwark: { x: 670, y: 360 },
} as const;

export function paintGravityField(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(1);
  const { x, y } = GravityTuning.well;
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

  paintPath(g, SHORTCUT_PATH, Palette.shortcut, 0.7);
  paintPath(g, LONG_PATH, Palette.longWay, 0.65);

  const labelStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '12px',
  } as const;
  scene.add
    .text(320, 300, 'SHORTCUT', { ...labelStyle, color: '#ff8a5a' })
    .setOrigin(0.5, 0.5)
    .setDepth(6)
    .setAlpha(0.8);
  scene.add
    .text(720, 58, 'LONG WAY', { ...labelStyle, color: '#6a9aac' })
    .setOrigin(0.5, 0.5)
    .setDepth(6)
    .setAlpha(0.8);
  scene.add
    .text(x, y, 'WELL', { ...labelStyle, color: '#c45a6a' })
    .setOrigin(0.5, 0.5)
    .setDepth(6)
    .setAlpha(0.85);
}

export function createGravityCovers(scene: Phaser.Scene): GravityCover[] {
  return createTiledCovers(scene, COVER_SPECS, 'debris');
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

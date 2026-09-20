import Phaser from 'phaser';
import { Palette, World } from '../../../game/constants';
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
    { r: 360, fill: 0x243044, line: Palette.longWay, fa: 0.07, la: 0.22 },
    { r: 260, fill: 0x3a2444, line: Palette.wellField, fa: 0.09, la: 0.28 },
    { r: GravityTuning.shortcutRadius, fill: 0x5a2038, line: Palette.shortcut, fa: 0.12, la: 0.4 },
    { r: 148, fill: 0x6a1830, line: Palette.wellRim, fa: 0.16, la: 0.5 },
  ];
  for (const ring of rings) {
    g.fillStyle(ring.fill, ring.fa);
    g.fillCircle(x, y, ring.r);
    g.lineStyle(2, ring.line, ring.la);
    g.strokeCircle(x, y, ring.r);
  }

  g.fillStyle(0x0c0608, 1);
  g.fillCircle(x, y, GravityTuning.massRadius);
  g.lineStyle(2, Palette.wellRim, 0.9);
  g.strokeCircle(x, y, GravityTuning.massRadius);
  g.lineStyle(1, Palette.hull, 0.55);
  g.strokeCircle(x, y, GravityTuning.horizonRadius);

  paintPath(g, SHORTCUT_PATH, Palette.shortcut, 0.55);
  paintPath(g, LONG_PATH, Palette.longWay, 0.5);

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
    .text(320, 78, 'LONG WAY', { ...labelStyle, color: '#6a9aac' })
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

import Phaser from 'phaser';
import { Palette, World } from '../../../game/constants';
import type { DriftCover } from '../../m1-drift';

export type DebrisCover = DriftCover;

export type Aabb = { x: number; y: number; w: number; h: number };

export type Vec2 = { x: number; y: number };

/**
 * Hard debris (GDD §4.2): opaque slabs that collide and occlude LOS both ways.
 * Layout teaches cover + funnel gaps. North/south sneaks and two L-pockets
 * are safer but longer (clock/fuel delay). The center gap is the trap.
 *
 *   y
 *   0  [pocket L]  ====C1n====          ====C2 bar====
 *      sneak N
 *  360  A  ----GAP 1----   C2 pillar   ----GAP 3----  B
 *      sneak S
 * 720  [pocket L]  ====C1s====          ====C3s====
 */
const COVER_SPECS: readonly Aabb[] = [
  // Belt 1 — main funnel (gap y≈308–452) with 80px north/south sneaks
  { x: 300, y: 188, w: 64, h: 216 },
  { x: 300, y: 552, w: 64, h: 184 },

  // Top-left L-pocket (blind corner)
  { x: 168, y: 40, w: 164, h: 24 },
  { x: 94, y: 118, w: 26, h: 156 },
  { x: 158, y: 172, w: 86, h: 24 },

  // Bottom-left L-pocket
  { x: 176, y: 688, w: 168, h: 24 },
  { x: 100, y: 618, w: 26, h: 128 },
  { x: 172, y: 562, w: 92, h: 24 },

  // Belt 2 — blocks the straight shot after gap 1; north or south around the pillar
  { x: 548, y: 86, w: 236, h: 40 },
  { x: 560, y: 372, w: 72, h: 292 },
  { x: 700, y: 646, w: 220, h: 40 },

  // Scatter (vision breaks so the exit is not a free telescope)
  { x: 430, y: 214, w: 52, h: 52 },
  { x: 456, y: 536, w: 72, h: 36 },
  { x: 748, y: 268, w: 42, h: 96 },

  // Belt 3 — last funnel before B (gap y≈348–458)
  { x: 886, y: 196, w: 64, h: 284 },
  { x: 886, y: 586, w: 64, h: 236 },

  // Exit shoulders (don't sit on B; punish a blind rush along y=360)
  { x: 1088, y: 128, w: 132, h: 32 },
  { x: 1088, y: 592, w: 132, h: 32 },
];

const POCKET_FLOORS: readonly Aabb[] = [
  { x: 130, y: 72, w: 110, h: 88 },
  { x: 134, y: 586, w: 112, h: 90 },
];

/** Inner safe-pocket AABBs (top-left). Fuel regen pauses while the probe is inside. */
export const SAFE_POCKETS: readonly Aabb[] = [
  { x: 118, y: 58, w: 118, h: 108 },
  { x: 122, y: 572, w: 122, h: 108 },
];

export const DEBRIS_SPAWN = {
  probe: { x: 110, y: World.height / 2 },
  pointB: { x: World.width - 105, y: World.height / 2 },
  funnelHunters: [
    {
      x: 372,
      y: 368,
      gap: [
        { x: 372, y: 318 },
        { x: 372, y: 438 },
      ] as const,
    },
    {
      x: 708,
      y: 408,
      gap: [
        { x: 708, y: 210 },
        { x: 708, y: 520 },
      ] as const,
    },
  ],
  ambusher: { x: 838, y: 236 },
} as const;

export function createDebrisCovers(scene: Phaser.Scene): DebrisCover[] {
  for (const floor of POCKET_FLOORS) {
    scene.add
      .rectangle(floor.x + floor.w / 2, floor.y + floor.h / 2, floor.w, floor.h, Palette.pocket, 1)
      .setDepth(1);
  }

  return COVER_SPECS.map((spec) => {
    const visual = scene.add
      .rectangle(spec.x, spec.y, spec.w, spec.h, Palette.cover, 1)
      .setStrokeStyle(1, Palette.coverEdge, 0.95)
      .setDepth(4);
    scene.physics.add.existing(visual, true);
    const rect = new Phaser.Geom.Rectangle(spec.x - spec.w / 2, spec.y - spec.h / 2, spec.w, spec.h);
    return { visual, rect };
  });
}

export function isInSafePocket(x: number, y: number): boolean {
  for (const pocket of SAFE_POCKETS) {
    if (x >= pocket.x && x <= pocket.x + pocket.w && y >= pocket.y && y <= pocket.y + pocket.h) {
      return true;
    }
  }
  return false;
}

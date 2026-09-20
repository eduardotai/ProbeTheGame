import Phaser from 'phaser';
import { TextureKey, World } from '../../../game/constants';
import { createTiledCovers, paintTiledFloor } from '../../../game/art';
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

  // Top-left L-pocket below the HUD. South-east opening into the north sneak.
  { x: 148, y: 118, w: 160, h: 20 },
  { x: 72, y: 156, w: 20, h: 72 },
  { x: 122, y: 188, w: 82, h: 20 },

  // Bottom-left L-pocket. North-east opening into the south sneak.
  { x: 156, y: 696, w: 180, h: 20 },
  { x: 70, y: 650, w: 20, h: 80 },
  { x: 124, y: 618, w: 90, h: 20 },

  // Belt 2 — blocks the straight shot after gap 1; north or south around the pillar
  { x: 548, y: 86, w: 236, h: 40 },
  { x: 560, y: 372, w: 72, h: 292 },
  { x: 700, y: 646, w: 220, h: 40 },

  // Scatter (vision breaks so the exit is not a free telescope)
  { x: 430, y: 214, w: 52, h: 52 },
  { x: 456, y: 536, w: 72, h: 36 },
  { x: 748, y: 268, w: 42, h: 96 },

  // Spawn slab — breaks the A→gap sightline so launch is not a free LOS gift
  { x: 220, y: 360, w: 36, h: 100 },

  // Belt 3 — last funnel before B (gap y≈348–458)
  { x: 886, y: 196, w: 64, h: 284 },
  { x: 886, y: 586, w: 64, h: 236 },

  // Exit shoulders (don't sit on B; punish a blind rush along y=360)
  { x: 1088, y: 128, w: 132, h: 32 },
  { x: 1088, y: 592, w: 132, h: 32 },
];

const POCKET_FLOORS: readonly Aabb[] = [
  { x: 84, y: 128, w: 150, h: 56 },
  { x: 84, y: 620, w: 160, h: 62 },
];

/** Inner safe-pocket AABBs (top-left). Fuel regen pauses while the probe is inside. */
export const SAFE_POCKETS: readonly Aabb[] = [
  { x: 84, y: 126, w: 160, h: 62 },
  { x: 82, y: 616, w: 168, h: 70 },
];

export const DEBRIS_SPAWN = {
  probe: { x: 110, y: World.height / 2 },
  pointB: { x: World.width - 105, y: World.height / 2 },
  funnelHunters: [
    {
      x: 500,
      y: 200,
      gap: [
        { x: 372, y: 330 },
        { x: 372, y: 430 },
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
  ambusher: { x: 780, y: 248 },
} as const;

export function createDebrisCovers(scene: Phaser.Scene): DebrisCover[] {
  for (const floor of POCKET_FLOORS) {
    paintTiledFloor(scene, floor.x, floor.y, floor.w, floor.h, TextureKey.PocketFloor, 1, 1);
  }

  return createTiledCovers(scene, COVER_SPECS, 'debris');
}

export function isInSafePocket(x: number, y: number): boolean {
  for (const pocket of SAFE_POCKETS) {
    if (x >= pocket.x && x <= pocket.x + pocket.w && y >= pocket.y && y <= pocket.y + pocket.h) {
      return true;
    }
  }
  return false;
}

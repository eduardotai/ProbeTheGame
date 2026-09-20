import type { Rng } from '../../../game/proc';
import { GravitySpine, GravityTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type CoverSpec = { x: number; y: number; w: number; h: number };

export type HunterSpec = { x: number; y: number };

export type GravityLayout = {
  seed: number;
  world: { width: number; height: number };
  well: Vec2;
  probe: Vec2;
  pointB: Vec2;
  covers: CoverSpec[];
  shortcutHunters: HunterSpec[];
  longHunters: HunterSpec[];
  bulwark: Vec2;
  shortcutPath: Vec2[];
  longPath: Vec2[];
};

/**
 * Seeded A→B gravity transit (finite, not a single-screen well room).
 * Same seed → same scars and hunter homes. One center mass (GDD §4.3).
 * Shortcut is the A→B trench north of the well; long way is the north rim.
 */
export function generateGravityLayout(rng: Rng): GravityLayout {
  const world = GravityTuning.world;
  const well = { x: GravityTuning.well.x, y: GravityTuning.well.y };
  const covers: CoverSpec[] = [];

  addSpawnOccluder(covers);
  addSouthBelt(rng, covers, world.width);
  addScars(rng, covers, world.width, well);

  const shortcutHunters: HunterSpec[] = [
    { x: 780 + rng.int(-30, 40), y: 268 + rng.int(-16, 16) },
    { x: 1320 + rng.int(-40, 40), y: 300 + rng.int(-18, 18) },
    { x: well.x + 40 + rng.int(-24, 30), y: 284 + rng.int(-12, 16) },
    { x: well.x + 720 + rng.int(-40, 50), y: 300 + rng.int(-16, 20) },
    { x: world.width - 620 + rng.int(-30, 30), y: 276 + rng.int(-14, 18) },
  ];

  const longHunters: HunterSpec[] = [
    { x: 1100 + rng.int(-40, 50), y: 118 + rng.int(-10, 14) },
    { x: well.x + 180 + rng.int(-50, 40), y: 96 + rng.int(-8, 12) },
    { x: world.width - 780 + rng.int(-40, 40), y: 124 + rng.int(-10, 16) },
  ];

  return {
    seed: rng.seed,
    world: { width: world.width, height: world.height },
    well,
    probe: { x: 108, y: 348 },
    pointB: { x: world.width - 108, y: 348 },
    covers: covers.filter((cover) => !blocksTerminals(cover, world.width, well)),
    shortcutHunters,
    longHunters,
    bulwark: { x: well.x + 30 + rng.int(-16, 16), y: 360 + rng.int(-10, 12) },
    shortcutPath: buildShortcutPath(world.width),
    longPath: buildLongPath(world.width),
  };
}

function addSpawnOccluder(covers: CoverSpec[]): void {
  covers.push({ x: 236, y: 358, w: 32, h: 100 });
}

function addSouthBelt(rng: Rng, covers: CoverSpec[], worldWidth: number): void {
  const start = 340;
  const end = worldWidth - 180;
  let x = start;
  while (x < end) {
    const w = rng.int(180, 280);
    covers.push({
      x: x + w / 2,
      y: rng.chance(0.5) ? 668 : 690,
      w,
      h: rng.int(24, 30),
    });
    x += w + rng.int(40, 90);
  }
}

function addScars(rng: Rng, covers: CoverSpec[], worldWidth: number, well: Vec2): void {
  covers.push({ x: well.x - 430 + rng.int(-20, 20), y: 560, w: 48, h: 72 });
  covers.push({ x: well.x + 430 + rng.int(-20, 20), y: 560, w: 48, h: 72 });
  const extras = rng.int(2, 3);
  for (let i = 0; i < extras; i += 1) {
    const x = rng.int(GravitySpine.launchWidth + 80, worldWidth - GravitySpine.approachWidth - 80);
    if (Math.abs(x - well.x) < 220) {
      continue;
    }
    covers.push({
      x,
      y: rng.pick([200, 500, 620]),
      w: rng.int(36, 56),
      h: rng.int(48, 80),
    });
  }
}

function buildShortcutPath(worldWidth: number): Vec2[] {
  const points: Vec2[] = [];
  for (let x = 200; x <= worldWidth - 160; x += 160) {
    const towardWell = 1 - Math.min(1, Math.abs(x - GravityTuning.well.x) / 900);
    points.push({ x, y: 348 - towardWell * 24 });
  }
  return points;
}

function buildLongPath(worldWidth: number): Vec2[] {
  return [
    { x: 180, y: 280 },
    { x: 280, y: 150 },
    { x: 480, y: 84 },
    { x: 860, y: 68 },
    { x: GravityTuning.well.x, y: 58 },
    { x: worldWidth - 860, y: 68 },
    { x: worldWidth - 400, y: 84 },
    { x: worldWidth - 220, y: 150 },
    { x: worldWidth - 120, y: 280 },
  ];
}

function blocksTerminals(cover: CoverSpec, worldWidth: number, well: Vec2): boolean {
  const left = cover.x - cover.w / 2;
  const right = cover.x + cover.w / 2;
  if (right > 70 && left < 170 && cover.y > 280 && cover.y < 440) {
    return true;
  }
  if (right > worldWidth - 170 && left < worldWidth - 70 && cover.y > 280 && cover.y < 440) {
    return true;
  }
  const dx = cover.x - well.x;
  const dy = cover.y - well.y;
  if (Math.hypot(dx, dy) < GravityTuning.massRadius + 20) {
    return true;
  }
  return false;
}

import type { Rng } from '../../../game/proc';
import { DebrisSpine, DebrisTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type CoverSpec = { x: number; y: number; w: number; h: number };

/** Axis-aligned box, top-left origin. */
export type Aabb = { x: number; y: number; w: number; h: number };

export type FunnelSpec = {
  x: number;
  y: number;
  gap: readonly [Vec2, Vec2];
};

export type SegmentKind = 'launch' | 'funnel' | 'pocket' | 'mix' | 'approach';

export type SpineSegment = {
  kind: SegmentKind;
  x0: number;
  x1: number;
  laneY: number;
  gapHalf: number;
};

export type DebrisLayout = {
  seed: number;
  world: { width: number; height: number };
  probe: Vec2;
  pointB: Vec2;
  covers: CoverSpec[];
  pockets: Aabb[];
  pocketFloors: Aabb[];
  funnelHunters: FunnelSpec[];
  ambusher: Vec2;
  ambusherCommitX: number;
  segments: SpineSegment[];
};

/**
 * Seeded A→B debris spine (finite transit, not a single-screen maze).
 * Same seed → same belts, pockets, funnel homes, and last-corridor ambusher.
 * Rules stay GDD §4.2: cover occludes both ways, hunters funnel gaps, pockets pause fuel.
 */
export function generateDebrisLayout(rng: Rng): DebrisLayout {
  const world = DebrisTuning.world;
  const segments = planSegments(rng, world.width);
  const covers: CoverSpec[] = [];
  const pockets: Aabb[] = [];
  const pocketFloors: Aabb[] = [];
  const funnelHunters: FunnelSpec[] = [];

  addSpawnOccluder(covers);

  for (const segment of segments) {
    if (segment.kind === 'launch') {
      continue;
    }
    addBelt(rng, segment, covers, funnelHunters);
    if (segment.kind === 'pocket') {
      addPocket(rng, segment, covers, pockets, pocketFloors);
    } else if (segment.kind === 'mix') {
      addScatter(rng, segment, covers);
    }
  }

  const last = segments[segments.length - 1];
  const commitX = last ? last.x0 + 40 : world.width - 560;
  const ambusher = {
    x: clamp(commitX - 80 + rng.int(-20, 20), world.width - 720, world.width - 420),
    y: rng.pick([220, 248, 490]),
  };

  addExitShoulders(covers, world.width);

  return {
    seed: rng.seed,
    world: { width: world.width, height: world.height },
    probe: { x: 110, y: 360 },
    pointB: { x: world.width - 105, y: 360 },
    covers: covers.filter((cover) => !blocksTerminals(cover, world.width)),
    pockets,
    pocketFloors,
    funnelHunters,
    ambusher,
    ambusherCommitX: commitX,
    segments,
  };
}

function planSegments(rng: Rng, worldWidth: number): SpineSegment[] {
  const launchW = DebrisSpine.launchWidth;
  const approachW = DebrisSpine.approachWidth;
  const bodyW = worldWidth - launchW - approachW;
  const n = DebrisSpine.bodySegments;
  const span = bodyW / n;
  const bodyKinds = pickBodyKinds(rng, n);

  const segments: SpineSegment[] = [];
  let laneY = 360;
  segments.push({ kind: 'launch', x0: 0, x1: launchW, laneY, gapHalf: 78 });

  for (let i = 0; i < n; i += 1) {
    laneY = clamp(laneY + rng.int(-36, 36), 300, 430);
    const x0 = launchW + i * span;
    const kind = bodyKinds[i] ?? 'funnel';
    segments.push({
      kind,
      x0,
      x1: x0 + span,
      laneY,
      gapHalf: kind === 'funnel' ? rng.int(62, 78) : rng.int(70, 88),
    });
  }

  segments.push({
    kind: 'approach',
    x0: worldWidth - approachW,
    x1: worldWidth,
    laneY: clamp(laneY + rng.int(-20, 16), 320, 400),
    gapHalf: 58,
  });

  return segments;
}

function pickBodyKinds(rng: Rng, n: number): SegmentKind[] {
  const template: SegmentKind[] = ['funnel', 'pocket', 'funnel', 'mix', 'pocket', 'funnel'];
  const kinds = template.slice(0, n);
  while (kinds.length < n) {
    kinds.push(rng.chance(0.55) ? 'funnel' : 'mix');
  }
  return kinds;
}

function addSpawnOccluder(covers: CoverSpec[]): void {
  covers.push({ x: 220, y: 360, w: 36, h: 100 });
}

function addBelt(
  rng: Rng,
  segment: SpineSegment,
  covers: CoverSpec[],
  hunters: FunnelSpec[],
): void {
  const sneak = 72;
  const x = segment.x0 + rng.int(70, Math.max(90, Math.floor(segment.x1 - segment.x0 - 110)));
  const topBottom = segment.laneY - segment.gapHalf;
  const topH = Math.max(48, topBottom - sneak);
  covers.push({ x, y: sneak + topH / 2, w: rng.int(56, 68), h: topH });

  const botTop = segment.laneY + segment.gapHalf;
  const botH = Math.max(48, 720 - sneak - botTop);
  covers.push({ x: x + rng.int(-8, 8), y: botTop + botH / 2, w: rng.int(56, 68), h: botH });

  const holdX = x + 78;
  hunters.push({
    x: holdX + rng.int(8, 36),
    y: segment.laneY + rng.int(-80, 80),
    gap: [
      { x: holdX, y: segment.laneY - 46 },
      { x: holdX, y: segment.laneY + 46 },
    ],
  });

  if (segment.kind === 'approach' || rng.chance(0.4)) {
    covers.push({
      x: x + rng.int(110, 170),
      y: rng.pick([86, 646]),
      w: rng.int(160, 230),
      h: 36,
    });
  }
}

function addPocket(
  rng: Rng,
  segment: SpineSegment,
  covers: CoverSpec[],
  pockets: Aabb[],
  floors: Aabb[],
): void {
  const north = segment.laneY >= 360;
  const left = rng.int(Math.floor(segment.x0 + 40), Math.floor(segment.x1 - 190));
  const w = rng.int(150, 176);
  const h = rng.int(52, 66);
  const top = north ? rng.int(48, 72) : rng.int(620, 640);

  floors.push({ x: left, y: top, w, h });
  pockets.push({ x: left - 4, y: top - 4, w: w + 10, h: h + 10 });

  covers.push({ x: left + w / 2, y: top, w: w + 16, h: 18 });
  covers.push({ x: left + w / 2, y: top + h, w: w + 16, h: 18 });
  covers.push({
    x: north ? left + 10 : left + w - 10,
    y: top + h / 2,
    w: 18,
    h: h - 6,
  });
}

function addScatter(rng: Rng, segment: SpineSegment, covers: CoverSpec[]): void {
  const n = rng.int(2, 3);
  for (let i = 0; i < n; i += 1) {
    covers.push({
      x: rng.float(segment.x0 + 40, segment.x1 - 40),
      y: rng.pick([214, 268, 500, 536]),
      w: rng.int(40, 72),
      h: rng.int(36, 96),
    });
  }
}

function addExitShoulders(covers: CoverSpec[], worldWidth: number): void {
  covers.push({ x: worldWidth - 192, y: 128, w: 132, h: 32 });
  covers.push({ x: worldWidth - 192, y: 592, w: 132, h: 32 });
}

function blocksTerminals(cover: CoverSpec, worldWidth: number): boolean {
  const left = cover.x - cover.w / 2;
  const right = cover.x + cover.w / 2;
  if (right > 60 && left < 180 && cover.y > 280 && cover.y < 440) {
    return true;
  }
  if (right > worldWidth - 170 && left < worldWidth - 70 && cover.y > 280 && cover.y < 440) {
    return true;
  }
  return false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

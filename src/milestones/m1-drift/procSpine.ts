import type { Rng } from '../../game/proc';
import { DriftSpine, DriftTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type CoverSpec = { x: number; y: number; w: number; h: number };

export type HunterSpec = { x: number; y: number };

export type SegmentKind = 'launch' | 'open' | 'cover' | 'mix' | 'approach';

export type SpineSegment = {
  kind: SegmentKind;
  x0: number;
  x1: number;
  laneY: number;
};

export type DriftLayout = {
  seed: number;
  world: { width: number; height: number };
  probe: Vec2;
  pointB: Vec2;
  covers: CoverSpec[];
  hunters: HunterSpec[];
  segments: SpineSegment[];
};

/**
 * Seeded A→B spine (finite transit, not a single-screen dash).
 * Same seed → same covers and hunter homes. Open space, few hard covers (GDD §4.1).
 */
export function generateDriftLayout(rng: Rng): DriftLayout {
  const world = DriftTuning.world;
  const segments = planSegments(rng, world.width);
  const covers: CoverSpec[] = [];
  const hunters: HunterSpec[] = [];

  addSpawnOccluder(covers);

  for (const segment of segments) {
    if (segment.kind === 'launch') {
      continue;
    }
    addCovers(rng, segment, covers);
    addHunters(rng, segment, hunters, world.width);
  }

  return {
    seed: rng.seed,
    world: { width: world.width, height: world.height },
    probe: { x: 120, y: 360 },
    pointB: { x: world.width - 110, y: 360 },
    covers: covers.filter((cover) => !blocksTerminals(cover, world.width)),
    hunters: hunters.filter((hunter) => hunter.x >= DriftTuning.minHunterX && hunter.x <= world.width - 180),
    segments,
  };
}

function planSegments(rng: Rng, worldWidth: number): SpineSegment[] {
  const launchW = DriftSpine.launchWidth;
  const approachW = DriftSpine.approachWidth;
  const bodyW = worldWidth - launchW - approachW;
  const n = DriftSpine.bodySegments;
  const span = bodyW / n;
  const bodyKinds = pickBodyKinds(rng, n);

  const segments: SpineSegment[] = [];
  let laneY = 360;
  segments.push({ kind: 'launch', x0: 0, x1: launchW, laneY });

  for (let i = 0; i < n; i += 1) {
    laneY = clamp(laneY + rng.int(-48, 48), 280, 440);
    const x0 = launchW + i * span;
    segments.push({
      kind: bodyKinds[i] ?? 'open',
      x0,
      x1: x0 + span,
      laneY,
    });
  }

  segments.push({
    kind: 'approach',
    x0: worldWidth - approachW,
    x1: worldWidth,
    laneY: clamp(laneY + rng.int(-24, 24), 300, 420),
  });

  return segments;
}

function pickBodyKinds(rng: Rng, n: number): SegmentKind[] {
  const template: SegmentKind[] = ['cover', 'open', 'cover', 'mix', 'open', 'cover'];
  const kinds = template.slice(0, n);
  while (kinds.length < n) {
    kinds.push(rng.chance(0.55) ? 'cover' : 'open');
  }
  for (let i = 1; i < kinds.length - 1; i += 1) {
    if (!rng.chance(0.3)) {
      continue;
    }
    const next = kinds[i + 1];
    const cur = kinds[i];
    if (next === undefined || cur === undefined) {
      continue;
    }
    if (cur === 'cover' && next === 'open') {
      kinds[i] = next;
      kinds[i + 1] = cur;
    }
  }
  return kinds;
}

function addSpawnOccluder(covers: CoverSpec[]): void {
  covers.push({ x: 236, y: 360, w: 28, h: 108 });
}

function addCovers(rng: Rng, segment: SpineSegment, covers: CoverSpec[]): void {
  if (segment.kind === 'open') {
    if (rng.chance(0.45)) {
      covers.push({
        x: rng.float(segment.x0 + 60, segment.x1 - 60),
        y: rng.int(160, 560),
        w: rng.int(36, 52),
        h: rng.int(40, 72),
      });
    }
    return;
  }

  const slabs = segment.kind === 'approach' ? rng.int(1, 2) : segment.kind === 'mix' ? 2 : 1;
  for (let i = 0; i < slabs; i += 1) {
    const x = segment.x0 + 70 + ((i + 0.5) / slabs) * (segment.x1 - segment.x0 - 140) + rng.int(-24, 24);
    if (rng.chance(0.38)) {
      covers.push({
        x,
        y: rng.pick([180, 220, 500, 540]),
        w: rng.int(150, 210),
        h: rng.int(28, 38),
      });
    } else {
      covers.push({
        x,
        y: rng.int(220, 500),
        w: rng.int(36, 48),
        h: rng.int(200, 300),
      });
    }
  }
}

function addHunters(rng: Rng, segment: SpineSegment, hunters: HunterSpec[], worldWidth: number): void {
  const density = 0.7 + (segment.x0 / Math.max(1, worldWidth)) * 0.9;
  const base = segment.kind === 'open' ? 1 : segment.kind === 'approach' ? 2 : segment.kind === 'mix' ? 2 : 1;
  const count = Math.max(1, Math.round(base * (0.85 + density * 0.25)));
  const bands = [90, 220, 500, 630] as const;
  for (let i = 0; i < count; i += 1) {
    hunters.push({
      x: rng.float(segment.x0 + 48, segment.x1 - 48),
      y: bands[(i + rng.int(0, 3)) % bands.length] ?? 90,
    });
  }
}

function blocksTerminals(cover: CoverSpec, worldWidth: number): boolean {
  const left = cover.x - cover.w / 2;
  const right = cover.x + cover.w / 2;
  if (right > 70 && left < 170 && cover.y > 280 && cover.y < 440) {
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

import type { Rng } from '../../../game/proc';
import { AnomalySpine, AnomalyTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type CoverSpec = { x: number; y: number; w: number; h: number };

export type HunterKind = 'hunter' | 'echo';

export type HunterSpec = {
  x: number;
  y: number;
  kind: HunterKind;
  homeRadius: number;
};

export type ZoneKind = 'launch' | 'pack' | 'approach';

/** Axis-aligned zone, top-left origin. */
export type TransitZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ZoneKind;
};

export type SegmentKind = 'launch' | 'pack' | 'hunt' | 'mix' | 'approach';

export type SpineSegment = {
  kind: SegmentKind;
  x0: number;
  x1: number;
  laneY: number;
  gapHalf: number;
};

export type AnomalyLayout = {
  seed: number;
  world: { width: number; height: number };
  probe: Vec2;
  pointB: Vec2;
  covers: CoverSpec[];
  hunters: HunterSpec[];
  zones: TransitZone[];
  segments: SpineSegment[];
  invert: 'controls-mirrored';
};

/**
 * Seeded A→B spine (finite transit, not an endless arena).
 * Same seed → same covers and hunter homes.
 */
export function generateAnomalyLayout(rng: Rng): AnomalyLayout {
  const world = AnomalyTuning.world;
  const segments = planSegments(rng, world.width);
  const covers: CoverSpec[] = [];
  const hunters: HunterSpec[] = [];
  const zones: TransitZone[] = [];

  addSpawnOccluder(covers);

  for (const segment of segments) {
    const density = densityAt(segment.x0, world.width);
    addLaneCovers(rng, segment, covers);
    if (segment.kind === 'launch') {
      zones.push({
        x: 8,
        y: 120,
        w: Math.max(80, segment.x1 - 40),
        h: 480,
        kind: 'launch',
      });
    } else if (segment.kind === 'pack') {
      addPack(rng, segment, hunters, zones, density);
    } else if (segment.kind === 'hunt') {
      addHunt(rng, segment, hunters, zones, density);
    } else if (segment.kind === 'mix') {
      addMix(rng, segment, hunters, zones, density);
    } else {
      addApproach(rng, segment, hunters, zones, density);
    }
  }

  const layout: AnomalyLayout = {
    seed: rng.seed,
    world: { width: world.width, height: world.height },
    probe: { x: 120, y: 360 },
    pointB: { x: world.width - 110, y: 360 },
    covers: covers.filter((cover) => !blocksTerminals(cover, world.width)),
    hunters: [],
    zones,
    segments,
    invert: 'controls-mirrored',
  };

  for (const spec of hunters) {
    if (hitsCover(spec.x, spec.y, layout.covers, 24)) {
      continue;
    }
    if (spec.x < AnomalyTuning.minHomeX || spec.x > world.width - 150) {
      continue;
    }
    layout.hunters.push(spec);
  }

  return layout;
}

export function zoneAt(zones: readonly TransitZone[], x: number, y: number): TransitZone | null {
  for (const zone of zones) {
    if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
      return zone;
    }
  }
  return null;
}

function planSegments(rng: Rng, worldWidth: number): SpineSegment[] {
  const launchW = AnomalySpine.launchWidth;
  const approachW = AnomalySpine.approachWidth;
  const bodyW = worldWidth - launchW - approachW;
  const n = AnomalySpine.bodySegments;
  const span = bodyW / n;
  const bodyKinds = pickBodyKinds(rng, n);

  const segments: SpineSegment[] = [];
  let laneY = 360;
  segments.push({
    kind: 'launch',
    x0: 0,
    x1: launchW,
    laneY,
    gapHalf: 86,
  });

  for (let i = 0; i < n; i += 1) {
    laneY = clamp(laneY + rng.int(-64, 64), 220, 510);
    const x0 = launchW + i * span;
    const kind = bodyKinds[i] ?? 'pack';
    segments.push({
      kind,
      x0,
      x1: x0 + span,
      laneY,
      gapHalf: kind === 'pack' ? rng.int(54, 70) : rng.int(66, 88),
    });
  }

  segments.push({
    kind: 'approach',
    x0: worldWidth - approachW,
    x1: worldWidth,
    laneY: clamp(laneY + rng.int(-36, 24), 280, 440),
    gapHalf: 60,
  });

  return segments;
}

function pickBodyKinds(rng: Rng, n: number): SegmentKind[] {
  const template: SegmentKind[] = ['hunt', 'pack', 'mix', 'hunt', 'pack', 'mix', 'hunt', 'pack'];
  const kinds = template.slice(0, n);
  while (kinds.length < n) {
    kinds.push(rng.chance(0.55) ? 'pack' : 'mix');
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
    kinds[i] = next;
    kinds[i + 1] = cur;
  }
  return kinds;
}

function densityAt(x: number, worldWidth: number): number {
  const t = clamp(x / Math.max(1, worldWidth), 0, 1);
  return 0.88 + t * 0.9;
}

function addSpawnOccluder(covers: CoverSpec[]): void {
  covers.push({ x: 248, y: 360, w: 26, h: 104 });
}

function addLaneCovers(rng: Rng, segment: SpineSegment, covers: CoverSpec[]): void {
  if (segment.kind === 'launch') {
    return;
  }
  const pillars = segment.kind === 'pack' || segment.kind === 'approach' ? rng.int(2, 3) : rng.int(1, 2);
  const usable = segment.x1 - segment.x0 - 90;
  for (let i = 0; i < pillars; i += 1) {
    const x = segment.x0 + 50 + ((i + 0.5) / pillars) * usable + rng.int(-16, 16);
    const topH = Math.max(48, segment.laneY - segment.gapHalf - 16);
    const bottomY0 = segment.laneY + segment.gapHalf;
    const bottomH = Math.max(48, 704 - bottomY0);
    covers.push({ x, y: 16 + topH / 2, w: rng.int(28, 42), h: topH });
    covers.push({ x: x + rng.int(-10, 10), y: bottomY0 + bottomH / 2, w: rng.int(28, 44), h: bottomH });
  }
}

function addPack(
  rng: Rng,
  segment: SpineSegment,
  hunters: HunterSpec[],
  zones: TransitZone[],
  density: number,
): void {
  zones.push({
    x: segment.x0 + 12,
    y: segment.laneY - segment.gapHalf - 10,
    w: Math.max(80, segment.x1 - segment.x0 - 24),
    h: segment.gapHalf * 2 + 20,
    kind: 'pack',
  });
  const count = Math.round(5 * density);
  for (let i = 0; i < count; i += 1) {
    hunters.push({
      x: rng.float(segment.x0 + 36, segment.x1 - 36),
      y: segment.laneY + rng.float(-segment.gapHalf - 18, segment.gapHalf + 18),
      kind: i === 0 ? 'echo' : 'hunter',
      homeRadius: 42,
    });
  }
}

function addHunt(
  rng: Rng,
  segment: SpineSegment,
  hunters: HunterSpec[],
  zones: TransitZone[],
  density: number,
): void {
  zones.push({
    x: segment.x0 + 16,
    y: 160,
    w: Math.max(80, segment.x1 - segment.x0 - 32),
    h: 400,
    kind: 'pack',
  });
  const count = Math.round(4 * density);
  for (let i = 0; i < count; i += 1) {
    hunters.push({
      x: rng.float(segment.x0 + 40, segment.x1 - 40),
      y: rng.float(170, 550),
      kind: 'hunter',
      homeRadius: 52,
    });
  }
}

function addMix(
  rng: Rng,
  segment: SpineSegment,
  hunters: HunterSpec[],
  zones: TransitZone[],
  density: number,
): void {
  zones.push({
    x: segment.x0 + 16,
    y: 180,
    w: Math.max(80, segment.x1 - segment.x0 - 32),
    h: 360,
    kind: 'pack',
  });
  const count = Math.round(4.5 * density);
  for (let i = 0; i < count; i += 1) {
    hunters.push({
      x: rng.float(segment.x0 + 40, segment.x1 - 40),
      y: rng.float(160, 560),
      kind: i % 3 === 0 ? 'echo' : 'hunter',
      homeRadius: 48,
    });
  }
}

function addApproach(
  rng: Rng,
  segment: SpineSegment,
  hunters: HunterSpec[],
  zones: TransitZone[],
  density: number,
): void {
  zones.push({
    x: segment.x0 + 8,
    y: 140,
    w: Math.max(80, segment.x1 - segment.x0 - 140),
    h: 440,
    kind: 'approach',
  });
  const count = Math.round(7 * density);
  for (let i = 0; i < count; i += 1) {
    hunters.push({
      x: rng.float(segment.x0 + 30, segment.x1 - 150),
      y: rng.float(140, 580),
      kind: i === 0 ? 'echo' : 'hunter',
      homeRadius: 40,
    });
  }
}

function hitsCover(x: number, y: number, covers: readonly CoverSpec[], pad: number): boolean {
  for (const cover of covers) {
    const left = cover.x - cover.w / 2 - pad;
    const right = cover.x + cover.w / 2 + pad;
    const top = cover.y - cover.h / 2 - pad;
    const bottom = cover.y + cover.h / 2 + pad;
    if (x >= left && x <= right && y >= top && y <= bottom) {
      return true;
    }
  }
  return false;
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

import type { Rng } from '../../../game/proc';
import { SwarmSpine, SwarmTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type CoverSpec = { x: number; y: number; w: number; h: number };

export type SwarmlingKind = 'swarmling' | 'splitter';

export type SwarmlingSpec = {
  x: number;
  y: number;
  kind: SwarmlingKind;
  homeRadius: number;
};

export type ZoneKind = 'clear' | 'push';

/** Axis-aligned zone, top-left origin. */
export type TransitZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ZoneKind;
};

export type SegmentKind = 'launch' | 'pocket' | 'push' | 'mix' | 'approach';

export type SpineSegment = {
  kind: SegmentKind;
  x0: number;
  x1: number;
  laneY: number;
  gapHalf: number;
};

export type SwarmLayout = {
  seed: number;
  world: { width: number; height: number };
  probe: Vec2;
  pointB: Vec2;
  covers: CoverSpec[];
  swarmlings: SwarmlingSpec[];
  zones: TransitZone[];
  segments: SpineSegment[];
};

/**
 * Seeded A→B spine (finite transit, not an endless arena).
 * Same seed → same covers, pockets, and swarmling homes.
 */
export function generateSwarmLayout(rng: Rng): SwarmLayout {
  const world = SwarmTuning.world;
  const segments = planSegments(rng, world.width);
  const covers: CoverSpec[] = [];
  const swarmlings: SwarmlingSpec[] = [];
  const zones: TransitZone[] = [];

  addSpawnOccluder(covers);

  for (const segment of segments) {
    const density = densityAt(segment.x0, world.width);
    addLaneCovers(rng, segment, covers);
    if (segment.kind === 'pocket') {
      addPocket(rng, segment, covers, swarmlings, zones, density);
    } else if (segment.kind === 'push') {
      addPush(rng, segment, swarmlings, zones, density);
    } else if (segment.kind === 'mix') {
      addMix(rng, segment, swarmlings, zones, density);
    } else if (segment.kind === 'launch') {
      // Quiet runway — no pack on A.
    } else {
      addApproach(rng, segment, swarmlings, zones, density);
    }
  }

  const layout: SwarmLayout = {
    seed: rng.seed,
    world: { width: world.width, height: world.height },
    probe: { x: 120, y: 360 },
    pointB: { x: world.width - 110, y: 360 },
    covers: covers.filter((cover) => !blocksTerminals(cover, world.width)),
    swarmlings: [],
    zones,
    segments,
  };

  for (const spec of swarmlings) {
    if (hitsCover(spec.x, spec.y, layout.covers, 22)) {
      continue;
    }
    if (spec.x < SwarmTuning.minHomeX || spec.x > world.width - 160) {
      continue;
    }
    layout.swarmlings.push(spec);
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
  const launchW = SwarmSpine.launchWidth;
  const approachW = SwarmSpine.approachWidth;
  const bodyW = worldWidth - launchW - approachW;
  const n = SwarmSpine.bodySegments;
  const span = bodyW / n;
  const bodyKinds = pickBodyKinds(rng, n);

  const segments: SpineSegment[] = [];
  let laneY = 360;
  segments.push({
    kind: 'launch',
    x0: 0,
    x1: launchW,
    laneY,
    gapHalf: 78,
  });

  for (let i = 0; i < n; i += 1) {
    laneY = clamp(laneY + rng.int(-70, 70), 210, 520);
    const x0 = launchW + i * span;
    const kind = bodyKinds[i] ?? 'push';
    segments.push({
      kind,
      x0,
      x1: x0 + span,
      laneY,
      gapHalf: kind === 'push' ? rng.int(52, 68) : rng.int(64, 86),
    });
  }

  segments.push({
    kind: 'approach',
    x0: worldWidth - approachW,
    x1: worldWidth,
    laneY: clamp(laneY + rng.int(-40, 20), 280, 440),
    gapHalf: 58,
  });

  return segments;
}

function pickBodyKinds(rng: Rng, n: number): SegmentKind[] {
  const template: SegmentKind[] = ['pocket', 'push', 'mix', 'pocket', 'push', 'mix', 'pocket', 'push'];
  const kinds = template.slice(0, n);
  while (kinds.length < n) {
    kinds.push(rng.chance(0.55) ? 'push' : 'mix');
  }
  for (let i = 1; i < kinds.length - 1; i += 1) {
    if (!rng.chance(0.34)) {
      continue;
    }
    const next = kinds[i + 1];
    const cur = kinds[i];
    if (next === undefined || cur === undefined) {
      continue;
    }
    if ((cur === 'pocket' && next === 'pocket') || (cur === 'push' && next === 'mix')) {
      kinds[i] = next;
      kinds[i + 1] = cur;
    }
  }
  return kinds;
}

function densityAt(x: number, worldWidth: number): number {
  const t = clamp(x / Math.max(1, worldWidth), 0, 1);
  return 0.82 + t * 0.95;
}

function addSpawnOccluder(covers: CoverSpec[]): void {
  covers.push({ x: 236, y: 360, w: 28, h: 108 });
}

function addLaneCovers(rng: Rng, segment: SpineSegment, covers: CoverSpec[]): void {
  if (segment.kind === 'launch') {
    return;
  }
  const pillars = segment.kind === 'push' || segment.kind === 'approach' ? rng.int(2, 3) : rng.int(1, 2);
  const usable = segment.x1 - segment.x0 - 90;
  for (let i = 0; i < pillars; i += 1) {
    const x = segment.x0 + 50 + ((i + 0.5) / pillars) * usable + rng.int(-18, 18);
    const topH = Math.max(48, segment.laneY - segment.gapHalf - 16);
    const bottomY0 = segment.laneY + segment.gapHalf;
    const bottomH = Math.max(48, 704 - bottomY0);
    covers.push({ x, y: 16 + topH / 2, w: rng.int(28, 42), h: topH });
    covers.push({ x: x + rng.int(-10, 10), y: bottomY0 + bottomH / 2, w: rng.int(28, 44), h: bottomH });
  }
}

function addPocket(
  rng: Rng,
  segment: SpineSegment,
  covers: CoverSpec[],
  swarmlings: SwarmlingSpec[],
  zones: TransitZone[],
  density: number,
): void {
  const north = segment.laneY >= 360;
  const innerY = north ? rng.int(72, 110) : rng.int(560, 610);
  const x = rng.int(Math.floor(segment.x0 + 70), Math.floor(segment.x1 - 170));
  const w = rng.int(150, 196);
  const h = rng.int(96, 128);
  const top = north ? innerY : innerY - h;
  const left = x;

  covers.push({ x: left + w / 2, y: top, w: w + 12, h: 18 });
  covers.push({ x: left + w / 2, y: top + h, w: w + 12, h: 18 });
  covers.push({
    x: north ? left + 10 : left + w - 10,
    y: top + h / 2,
    w: 18,
    h: h - 8,
  });

  zones.push({ x: left + 16, y: top + 14, w: w - 32, h: h - 28, kind: 'clear' });
  zones.push({
    x: segment.x0 + 24,
    y: segment.laneY - 48,
    w: Math.max(80, segment.x1 - segment.x0 - 48),
    h: 96,
    kind: 'push',
  });

  const cluster = Math.round(6 * density);
  for (let i = 0; i < cluster; i += 1) {
    swarmlings.push({
      x: left + 28 + rng.float(0, w - 56),
      y: top + 28 + rng.float(0, h - 56),
      kind: i === 0 ? 'splitter' : 'swarmling',
      homeRadius: 28,
    });
  }
  const roamers = Math.max(2, Math.round(3 * density));
  for (let i = 0; i < roamers; i += 1) {
    swarmlings.push({
      x: rng.float(segment.x0 + 40, segment.x1 - 40),
      y: segment.laneY + rng.float(-segment.gapHalf + 8, segment.gapHalf - 8),
      kind: 'swarmling',
      homeRadius: 48,
    });
  }
}

function addPush(
  rng: Rng,
  segment: SpineSegment,
  swarmlings: SwarmlingSpec[],
  zones: TransitZone[],
  density: number,
): void {
  zones.push({
    x: segment.x0 + 12,
    y: segment.laneY - segment.gapHalf - 10,
    w: Math.max(80, segment.x1 - segment.x0 - 24),
    h: segment.gapHalf * 2 + 20,
    kind: 'push',
  });
  const count = Math.round(10 * density);
  for (let i = 0; i < count; i += 1) {
    swarmlings.push({
      x: rng.float(segment.x0 + 36, segment.x1 - 36),
      y: segment.laneY + rng.float(-segment.gapHalf - 24, segment.gapHalf + 24),
      kind: i === 0 && density > 1.15 ? 'splitter' : 'swarmling',
      homeRadius: 40,
    });
  }
}

function addMix(
  rng: Rng,
  segment: SpineSegment,
  swarmlings: SwarmlingSpec[],
  zones: TransitZone[],
  density: number,
): void {
  zones.push({
    x: segment.x0 + 16,
    y: 180,
    w: Math.max(80, segment.x1 - segment.x0 - 32),
    h: 360,
    kind: 'push',
  });
  const count = Math.round(7 * density);
  for (let i = 0; i < count; i += 1) {
    swarmlings.push({
      x: rng.float(segment.x0 + 40, segment.x1 - 40),
      y: rng.float(160, 560),
      kind: 'swarmling',
      homeRadius: 48,
    });
  }
}

function addApproach(
  rng: Rng,
  segment: SpineSegment,
  swarmlings: SwarmlingSpec[],
  zones: TransitZone[],
  density: number,
): void {
  zones.push({
    x: segment.x0 + 8,
    y: 140,
    w: Math.max(80, segment.x1 - segment.x0 - 140),
    h: 440,
    kind: 'push',
  });
  const count = Math.round(15 * density);
  for (let i = 0; i < count; i += 1) {
    swarmlings.push({
      x: rng.float(segment.x0 + 30, segment.x1 - 150),
      y: rng.float(140, 580),
      kind: i === 0 ? 'splitter' : 'swarmling',
      homeRadius: 42,
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

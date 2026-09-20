import type { Rng } from '../../../game/proc';
import { BossGateSpine, BossGateTuning } from './tuning';

export type Vec2 = { x: number; y: number };

export type CoverSpec = { x: number; y: number; w: number; h: number };

export type ZoneKind = 'approach' | 'arena';

/** Axis-aligned zone, top-left origin. */
export type TransitZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ZoneKind;
};

export type ScarSpec = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type SpineSegment = {
  kind: 'launch' | 'approach' | 'arena' | 'gate';
  x0: number;
  x1: number;
  laneY: number;
};

export type BossGateLayout = {
  seed: number;
  world: { width: number; height: number };
  probe: Vec2;
  pointB: Vec2;
  bulwark: Vec2;
  gate: { x: number; w: number };
  covers: CoverSpec[];
  zones: TransitZone[];
  scars: ScarSpec[];
  segments: SpineSegment[];
  arena: { x0: number; x1: number };
};

/**
 * Seeded A→B approach into a sealed gate (finite transit, not an endless arena).
 * Same seed → same pillars and charge scars. Win is destroy-the-guard (GDD Q6 default).
 */
export function generateBossGateLayout(rng: Rng): BossGateLayout {
  const world = BossGateTuning.world;
  const launchEnd = BossGateSpine.launchWidth;
  const approachEnd = launchEnd + BossGateSpine.approachWidth;
  const arenaEnd = approachEnd + BossGateSpine.arenaWidth;
  const gateX = arenaEnd + 48;
  const laneY = world.height / 2;

  const segments: SpineSegment[] = [
    { kind: 'launch', x0: 0, x1: launchEnd, laneY },
    { kind: 'approach', x0: launchEnd, x1: approachEnd, laneY },
    { kind: 'arena', x0: approachEnd, x1: arenaEnd, laneY },
    { kind: 'gate', x0: arenaEnd, x1: world.width, laneY },
  ];

  const covers: CoverSpec[] = [];
  addSpawnOccluder(covers);
  addApproachPillars(rng, launchEnd, approachEnd, covers);
  addArenaPillars(rng, approachEnd, arenaEnd, covers);

  const zones: TransitZone[] = [
    {
      kind: 'approach',
      x: launchEnd,
      y: 48,
      w: approachEnd - launchEnd,
      h: world.height - 96,
    },
    {
      kind: 'arena',
      x: approachEnd,
      y: 36,
      w: arenaEnd - approachEnd,
      h: world.height - 72,
    },
  ];

  const scars = paintScars(rng, approachEnd, arenaEnd, laneY);

  return {
    seed: rng.seed,
    world,
    probe: { x: 96, y: laneY },
    pointB: { x: Math.min(world.width - 96, gateX + 220), y: laneY },
    bulwark: { x: arenaEnd - 220, y: laneY },
    gate: { x: gateX, w: 44 },
    covers,
    zones,
    scars,
    segments,
    arena: { x0: approachEnd, x1: arenaEnd },
  };
}

export function zoneAt(zones: readonly TransitZone[], x: number, y: number): TransitZone | null {
  for (const zone of zones) {
    if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
      return zone;
    }
  }
  return null;
}

function addSpawnOccluder(covers: CoverSpec[]): void {
  covers.push({ x: 36, y: 360, w: 18, h: 220 });
}

function addApproachPillars(rng: Rng, x0: number, x1: number, covers: CoverSpec[]): void {
  const count = 5;
  const span = x1 - x0;
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const x = x0 + t * span + rng.int(-18, 18);
    const north = rng.chance(0.5);
    const y = north ? rng.int(118, 168) : rng.int(552, 602);
    covers.push({ x, y, w: rng.int(46, 72), h: rng.int(90, 140) });
  }
}

function addArenaPillars(rng: Rng, x0: number, x1: number, covers: CoverSpec[]): void {
  covers.push({
    x: x0 + rng.int(160, 220),
    y: rng.int(120, 150),
    w: 56,
    h: 96,
  });
  covers.push({
    x: x0 + rng.int(160, 220),
    y: rng.int(570, 600),
    w: 56,
    h: 96,
  });
  covers.push({
    x: x1 - rng.int(340, 400),
    y: rng.pick([rng.int(108, 140), rng.int(580, 612)]),
    w: 48,
    h: 88,
  });
}

function paintScars(rng: Rng, x0: number, x1: number, laneY: number): ScarSpec[] {
  const scars: ScarSpec[] = [];
  for (let i = 0; i < 6; i += 1) {
    const xA = rng.int(x0 + 40, x1 - 80);
    const yA = laneY + rng.int(-110, 110);
    const facing = rng.float(-0.55, 0.55);
    const len = rng.int(140, 260);
    scars.push({
      x0: xA,
      y0: yA,
      x1: xA + Math.cos(facing) * len,
      y1: yA + Math.sin(facing) * len,
    });
  }
  return scars;
}

/** Debris Field numbers (GDD §4.2). Distinct from DriftTuning — do not retune M1. */
export const DebrisTuning = {
  /** Long cover-funnel transit. Viewport stays 1280×720; camera follows. */
  world: { width: 4200, height: 720 },
  hunterMaxSpeed: 118,
  hunterAccel: 340,
  hunterPathAccel: 380,
  hunterDrag: 0.9,
  repathMs: 180,
  waypointReach: 28,
  losRange: 560,
  hearRadius: 210,
  navCell: 32,
  navInflate: 16,
  ambusherLungeSpeed: 370,
  ambusherLungeAccel: 540,
  ambusherCommitX: 760,
  ambusherLungeRange: 300,
  spawnProtectMs: 1600,
} as const;

export const DebrisSpine = {
  launchWidth: 640,
  approachWidth: 680,
  bodySegments: 6,
} as const;

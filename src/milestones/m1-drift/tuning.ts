/** Drift phase numbers (GDD §4.1). Tuned for a hunted A→B transit, not a spreadsheet lock. */
export const DriftTuning = {
  /** Long horizontal transit. Viewport stays 1280×720; camera follows. */
  world: { width: 3600, height: 720 },
  thrust: 620,
  probeMaxSpeed: 240,
  probeDrag: 0.92,
  dodgeSpeed: 420,
  dodgeCost: 18,
  dodgeIFramesMs: 240,
  fuelCapacity: 100,
  fuelRegenPerSec: 7,
  hullMax: 3,
  hitIFramesMs: 900,
  hitKnockback: 340,
  hunterStunMs: 420,
  hunterMaxSpeed: 128,
  hunterAccel: 300,
  hunterDrag: 0.90,
  losRange: 440,
  hearRadius: 240,
  noiseDurationMs: 480,
  contactDamage: 1,
  contactRadius: 46,
  spawnProtectMs: 1400,
  minHunterX: 680,
} as const;

export const DriftSpine = {
  launchWidth: 640,
  approachWidth: 520,
  bodySegments: 6,
} as const;

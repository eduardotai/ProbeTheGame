/** Swarm numbers (GDD §4.4). Distinct from Drift/Debris/Gravity — do not retune them. */
export const SwarmTuning = {
  /** Long horizontal transit. Viewport stays 1280×720; camera follows. */
  world: { width: 4600, height: 720 },
  spawnProtectMs: 2200,
  /** Precise cruise — close to Drift, not a VS slog. */
  probeMaxSpeed: 232,
  probeDrag: 0.9,
  /** Dodge must actually outrun a lunge; burst then restore cruise cap. */
  dodgeBurstSpeed: 390,
  dodgeBurstMs: 220,
  contactDamage: 1,
  contactRadius: 22,
  splitterContactRadius: 28,
  miniContactRadius: 16,
  /** Short enough that standing in a pack is death. Dodge is the skill answer. */
  hitIFramesMs: 420,
  hitKnockback: 360,
  stunMs: 240,
  aggroRadius: 320,
  /** Drop chase with hysteresis so they don't flicker tell/idle. */
  aggroDropRadius: 430,
  minHomeX: 720,
  swarmlingMaxSpeed: 102,
  swarmlingAccel: 220,
  swarmlingDrag: 0.9,
  splitterMaxSpeed: 78,
  splitterAccel: 160,
  miniMaxSpeed: 124,
  miniAccel: 270,
  wanderAccel: 54,
  /** Face, flash, then commit — readable tell, not auto-aim popcorn. */
  tellMs: 280,
  splitterTellMs: 420,
  miniTellMs: 150,
  lungeMs: 190,
  lungeSpeed: 276,
  lungeAccel: 520,
  /** Burst fire, then heat gates spray. */
  fireIntervalMs: 170,
  ammoCapacity: 28,
  heatCapacity: 100,
  heatPerShot: 24,
  heatCoolPerSec: 36,
  heatCoolDelayMs: 220,
  heatRecoverAt: 28,
  boltSpeed: 600,
  boltLifeMs: 480,
  boltRadius: 12,
  splitOffset: 16,
} as const;

export const SwarmSpine = {
  launchWidth: 680,
  approachWidth: 560,
  bodySegments: 8,
} as const;

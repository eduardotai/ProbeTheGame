/** Swarm numbers (GDD §4.4). Distinct from Drift/Debris/Gravity — do not retune them. */
export const SwarmTuning = {
  /** Long horizontal transit. Viewport stays 1280×720; camera follows. */
  world: { width: 4400, height: 720 },
  spawnProtectMs: 2200,
  probeMaxSpeed: 196,
  contactDamage: 1,
  contactRadius: 24,
  splitterContactRadius: 30,
  miniContactRadius: 18,
  hitIFramesMs: 900,
  hitKnockback: 300,
  stunMs: 360,
  /** Swarmlings only chase when the probe is this close — finite field, not a magnet. */
  aggroRadius: 300,
  /** No homes west of this; launch is a quiet runway. */
  minHomeX: 720,
  swarmlingMaxSpeed: 108,
  swarmlingAccel: 240,
  swarmlingDrag: 0.9,
  splitterMaxSpeed: 86,
  splitterAccel: 180,
  miniMaxSpeed: 128,
  miniAccel: 280,
  wanderAccel: 70,
  fireIntervalMs: 140,
  ammoCapacity: 32,
  heatCapacity: 100,
  heatPerShot: 18,
  heatCoolPerSec: 40,
  heatCoolDelayMs: 200,
  heatRecoverAt: 30,
  boltSpeed: 520,
  boltLifeMs: 640,
  boltRadius: 12,
  splitOffset: 16,
} as const;

export const SwarmSpine = {
  launchWidth: 680,
  approachWidth: 520,
  bodySegments: 8,
} as const;

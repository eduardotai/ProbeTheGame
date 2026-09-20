/** Anomaly numbers (GDD §4.5). Distinct from Drift/Debris/Gravity/Swarm — do not retune them. */
export const AnomalyTuning = {
  /** Long horizontal transit. Viewport stays 1280×720; camera follows. */
  world: { width: 4800, height: 720 },
  spawnProtectMs: 2400,
  probeMaxSpeed: 232,
  probeDrag: 0.9,
  dodgeBurstSpeed: 390,
  dodgeBurstMs: 220,
  contactDamage: 1,
  contactRadius: 26,
  echoContactRadius: 22,
  hitIFramesMs: 420,
  hitKnockback: 360,
  stunMs: 240,
  aggroRadius: 340,
  aggroDropRadius: 450,
  minHomeX: 820,
  hunterMaxSpeed: 108,
  hunterAccel: 240,
  hunterDrag: 0.9,
  echoMaxSpeed: 128,
  echoAccel: 280,
  wanderAccel: 48,
  /** Inverted tell: cool flash, then commit — not auto-aim popcorn. */
  tellMs: 300,
  echoTellMs: 220,
  lungeMs: 200,
  lungeSpeed: 286,
  lungeAccel: 540,
  fireIntervalMs: 180,
  ammoCapacity: 32,
  heatCapacity: 100,
  heatPerShot: 22,
  heatCoolPerSec: 38,
  heatCoolDelayMs: 220,
  heatRecoverAt: 28,
  boltSpeed: 600,
  boltLifeMs: 480,
  boltRadius: 12,
} as const;

export const AnomalySpine = {
  launchWidth: 800,
  approachWidth: 560,
  bodySegments: 8,
} as const;

/** GDD §4.5 — exactly one invert, this phase only. */
export const AnomalyInvert = {
  id: 'controls-mirrored' as const,
  label: 'AXES FLIPPED',
  hint: 'W↓  A→  S↑  D←',
};

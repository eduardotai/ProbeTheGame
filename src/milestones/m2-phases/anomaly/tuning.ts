/** Anomaly numbers (GDD §4.5). Distinct from prior phases — do not retune them. */
export const AnomalyTuning = {
  /** Long horizontal transit. Viewport stays 1280×720; camera follows. */
  world: { width: 4400, height: 720 },
  spawnProtectMs: 2400,
  probeMaxSpeed: 228,
  probeDrag: 0.9,
  dodgeBurstSpeed: 380,
  dodgeBurstMs: 220,
  contactDamage: 1,
  contactRadius: 24,
  primeContactRadius: 32,
  /** Slightly longer than Swarm — invert makes panic-dodge cost more. */
  hitIFramesMs: 480,
  hitKnockback: 340,
  stunMs: 260,
  aggroRadius: 300,
  aggroDropRadius: 410,
  minHomeX: 760,
  echoMaxSpeed: 96,
  echoAccel: 200,
  echoDrag: 0.9,
  primeMaxSpeed: 74,
  primeAccel: 150,
  wanderAccel: 48,
  /** Inverted tell vs Swarm: dim/shrink, then lunge. Longer so the wind-up reads under mirrored WASD. */
  tellMs: 560,
  primeTellMs: 720,
  lungeMs: 200,
  lungeSpeed: 258,
  lungeAccel: 500,
} as const;

export const AnomalySpine = {
  launchWidth: 720,
  approachWidth: 540,
  bodySegments: 7,
} as const;

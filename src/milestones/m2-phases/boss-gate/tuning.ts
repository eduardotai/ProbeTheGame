/** Boss Gate numbers (GDD §4.6). Distinct from prior phases — do not retune them. */
export const BossGateTuning = {
  /** Shorter than Swarm/Anomaly, still a transit — not a 10s dash. Viewport 1280×720. */
  world: { width: 3200, height: 720 },
  spawnProtectMs: 2000,
  probeMaxSpeed: 228,
  probeDrag: 0.9,
  dodgeBurstSpeed: 380,
  dodgeBurstMs: 220,
  contactDamage: 1,
  contactRadius: 54,
  hitIFramesMs: 560,
  hitKnockback: 380,
  /** Heavy Gate Bulwark — skill test, not a sponge. */
  bulwarkHp: 14,
  bulwarkScale: 2.2,
  bulwarkMaxSpeed: 86,
  bulwarkAccel: 180,
  bulwarkDrag: 0.94,
  bulwarkHomeRadius: 28,
  /** Readable tells (Hades/Dead Cells). Charge plate blocks frontal bolts. */
  chargeTellMs: 720,
  chargeMs: 540,
  chargeSpeed: 400,
  chargeRange: 460,
  sweepTellMs: 640,
  sweepSpread: 0.7,
  sweepCount: 7,
  sweepSpeed: 240,
  sweepLifeMs: 920,
  slamTellMs: 680,
  slamGrowPerSec: 320,
  slamMaxRadius: 268,
  slamThickness: 30,
  recoverMs: 820,
  attackGapMs: 300,
  approachSweepGapMs: 2400,
  plateDot: 0.35,
  arenaEnterPad: 40,
} as const;

export const BossGateSpine = {
  launchWidth: 700,
  approachWidth: 980,
  arenaWidth: 1040,
} as const;

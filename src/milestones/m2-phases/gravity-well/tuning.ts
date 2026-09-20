/** Gravity Well numbers (GDD §4.3). Distinct from Drift/Debris — do not retune them. */
export const GravityTuning = {
  /** Long pull-transit. Viewport stays 1280×720; camera follows. */
  world: { width: 3800, height: 720 },
  /** Center mass sits mid-transit so pull ramps, then eases toward B. */
  well: { x: 1900, y: 540 },
  /** Instant hull 0 if the probe crosses this radius. */
  horizonRadius: 80,
  /** Visual mass + hunter keep-out. Probe can still fall through. */
  massRadius: 96,
  /** Distances at or inside this count as the shortcut (stronger pull). */
  shortcutRadius: 220,
  /** Inverse-linear pull: accel = pullG / max(dist, pullMinR). */
  pullG: 66_000,
  pullMinR: 88,
  /** Extra max-speed while fighting a strong pull, capped. */
  pullSpeedGain: 0.18,
  pullSpeedCap: 130,
  hunterMaxSpeed: 122,
  hunterDrag: 0.9,
  bulwarkMaxSpeed: 56,
  bulwarkAccel: 150,
  bulwarkDrag: 0.94,
  /** Bulwark will not chase beyond this distance from the well. */
  bulwarkLeash: 236,
  bulwarkHomeRadius: 18,
  spawnProtectMs: 1800,
} as const;

export const GravitySpine = {
  launchWidth: 620,
  approachWidth: 560,
} as const;

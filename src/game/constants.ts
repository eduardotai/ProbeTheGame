/** High-contrast greybox palette (GDD §9). Near-black void, sparse neons. */
export const Palette = {
  void: 0x05070a,
  probeBody: 0xc8e7ff,
  thruster: 0x3d7cff,
  sensorEye: 0x7cffd4,
  hunter: 0xff5a4a,
  pointB: 0x5ee0ff,
  hud: 0x8aa0b4,
  hudWarn: 0xffc14a,
  cover: 0x1a2433,
  coverEdge: 0x3a4d66,
  hull: 0xff6b6b,
} as const;

export const World = {
  width: 1280,
  height: 720,
} as const;

export const SceneKey = {
  Boot: 'Boot',
  Preload: 'Preload',
  Drift: 'Drift',
  Test: 'Test',
} as const;

export const TextureKey = {
  Probe: 'probe',
  Hunter: 'hunter',
  PointB: 'point-b',
} as const;

/** Theme lock (GDD §1). */
export const THEME_LINE = 'You are not a hero. You are a probe. You do not return.';

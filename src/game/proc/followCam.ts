import type Phaser from 'phaser';

export type TransitWorld = {
  width: number;
  height: number;
};

/** Set world + camera bounds before spawning physics bodies. */
export function setTransitBounds(scene: Phaser.Scene, world: TransitWorld): void {
  scene.cameras.main.setBounds(0, 0, world.width, world.height);
  scene.physics.world.setBounds(0, 0, world.width, world.height);
}

/**
 * Camera for a long A→B transit: viewport stays 1280×720, world is wider.
 * Shared by Drift, Debris, Gravity, Swarm, Anomaly, and Boss Gate.
 */
export function bindTransitCamera(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  world: TransitWorld,
  lerp = 0.14,
): void {
  setTransitBounds(scene, world);
  const cam = scene.cameras.main;
  cam.startFollow(target, true, lerp, lerp);
  cam.setDeadzone(72, 32);
}

export function viewportCenter(scene: Phaser.Scene): { x: number; y: number } {
  const cam = scene.cameras.main;
  return { x: cam.width / 2, y: cam.height / 2 };
}

import type Phaser from 'phaser';

/**
 * Next-probe restart stub (GDD MVP assumption / PRD §7).
 * Play Again on Map 1. No retained meta-upgrades.
 */
export function requestNextProbe(scene: Phaser.Scene): void {
  // TODO(M3): reset run inventory/hull/fuel; do not keep meta (meta is post-MVP).
  if (scene.physics.world.isPaused) {
    scene.physics.resume();
  }
  scene.scene.restart();
}

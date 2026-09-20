import type Phaser from 'phaser';
import { SceneKey } from '../../game/constants';
import { beginNewRun, isChainMode, peekRun } from './runSession';

/**
 * Next-probe restart (GDD MVP assumption / PRD §7).
 * Standalone: relaunch this phase.
 * Chain: Play Again launches a **new probe at Drift**. No retained meta.
 * During a between-phase transit beat, R / click wait for the auto-advance.
 */
export function requestNextProbe(scene: Phaser.Scene): void {
  if (isChainMode()) {
    const status = peekRun()?.status;
    if (status === 'advancing') {
      return;
    }
    beginNewRun();
    if (scene.physics.world.isPaused) {
      scene.physics.resume();
    }
    scene.scene.start(SceneKey.Drift);
    return;
  }

  if (scene.physics.world.isPaused) {
    scene.physics.resume();
  }
  scene.scene.restart();
}

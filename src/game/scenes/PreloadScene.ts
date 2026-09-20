import Phaser from 'phaser';
import { generatePixelAtlas } from '../art';
import { resolveBootMode, resolvePlayableSceneKey } from '../bootPhase';
import { SceneKey } from '../constants';
import { beginNewRun, setChainMode } from '../../milestones/m3-map1';

/** Generates a shared pixel atlas (canvas-drawn, nearest-neighbor). */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    generatePixelAtlas(this);
  }

  create(): void {
    const chain = resolveBootMode() === 'chain';
    setChainMode(chain);
    if (chain) {
      beginNewRun();
      console.info('[map1] boot chain  Drift → Debris → Gravity → Swarm → Anomaly → Boss Gate');
    } else {
      console.info(`[map1] boot standalone  ${resolvePlayableSceneKey()}`);
    }
    this.scene.start(resolvePlayableSceneKey());
  }
}

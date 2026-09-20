import Phaser from 'phaser';
import { resolvePlayableSceneKey } from '../bootPhase';
import { SceneKey } from '../constants';
import { generatePixelAtlas } from '../art';

/** Generates a shared pixel atlas (canvas-drawn, nearest-neighbor). */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    generatePixelAtlas(this);
  }

  create(): void {
    this.scene.start(resolvePlayableSceneKey());
  }
}

import Phaser from 'phaser';
import { SceneKey } from '../constants';

/** Empty boot shell. Hands off to Preload. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x05070a);
    this.scene.start(SceneKey.Preload);
  }
}

import Phaser from 'phaser';
import { resolvePlayableSceneKey } from '../bootPhase';
import { Palette, SceneKey, TextureKey } from '../constants';

/** Generates greybox silhouettes. No shipped art pack (GDD §9 MVP). */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    this.generateProbeTexture();
    this.generateHunterTexture();
    this.generateAmbusherTexture();
    this.generatePointBTexture();
  }

  create(): void {
    this.scene.start(resolvePlayableSceneKey());
  }

  private generateProbeTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.probeBody, 1);
    g.fillTriangle(20, 2, 2, 34, 38, 34);
    g.fillStyle(Palette.thruster, 1);
    g.fillTriangle(16, 34, 20, 42, 24, 34);
    g.fillStyle(Palette.sensorEye, 1);
    g.fillCircle(20, 18, 3);
    g.generateTexture(TextureKey.Probe, 40, 44);
    g.destroy();
  }

  private generateHunterTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.hunter, 1);
    g.fillTriangle(18, 36, 2, 4, 34, 4);
    g.generateTexture(TextureKey.Hunter, 36, 40);
    g.destroy();
  }

  private generateAmbusherTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.ambusher, 1);
    g.fillTriangle(18, 2, 2, 20, 34, 20);
    g.fillTriangle(18, 38, 2, 20, 34, 20);
    g.generateTexture(TextureKey.Ambusher, 36, 40);
    g.destroy();
  }

  private generatePointBTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.pointB, 1);
    g.fillTriangle(16, 0, 32, 16, 16, 32);
    g.fillTriangle(16, 0, 0, 16, 16, 32);
    g.generateTexture(TextureKey.PointB, 32, 32);
    g.destroy();
  }
}

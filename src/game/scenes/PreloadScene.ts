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
    this.generateBulwarkTexture();
    this.generateSwarmlingTexture();
    this.generateSplitterTexture();
    this.generateBoltTexture();
    this.generateEchoTexture();
    this.generateEchoPrimeTexture();
    this.generateWardBoltTexture();
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

  private generateBulwarkTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.bulwark, 1);
    g.fillRect(6, 12, 28, 22);
    g.fillTriangle(20, 2, 4, 14, 36, 14);
    g.fillTriangle(20, 42, 6, 32, 34, 32);
    g.fillStyle(Palette.coverEdge, 1);
    g.fillRect(14, 18, 12, 8);
    g.generateTexture(TextureKey.Bulwark, 40, 44);
    g.destroy();
  }

  private generateSwarmlingTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.swarmling, 1);
    g.fillTriangle(12, 2, 2, 22, 22, 22);
    g.fillTriangle(12, 22, 6, 16, 18, 16);
    g.generateTexture(TextureKey.Swarmling, 24, 24);
    g.destroy();
  }

  private generateSplitterTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.splitter, 1);
    g.fillTriangle(16, 2, 2, 16, 30, 16);
    g.fillTriangle(16, 30, 2, 16, 30, 16);
    g.fillStyle(Palette.swarmling, 1);
    g.fillCircle(16, 16, 3);
    g.generateTexture(TextureKey.Splitter, 32, 32);
    g.destroy();
  }

  private generateBoltTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.bolt, 1);
    g.fillRect(3, 0, 8, 18);
    g.fillStyle(0xffffff, 1);
    g.fillRect(5, 0, 4, 7);
    g.generateTexture(TextureKey.Bolt, 14, 18);
    g.destroy();
  }

  private generateEchoTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.echo, 1);
    g.fillTriangle(14, 2, 2, 14, 26, 14);
    g.fillTriangle(14, 26, 2, 14, 26, 14);
    g.generateTexture(TextureKey.Echo, 28, 28);
    g.destroy();
  }

  private generateEchoPrimeTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.echoPrime, 1);
    g.fillTriangle(18, 2, 2, 18, 34, 18);
    g.fillTriangle(18, 34, 2, 18, 34, 18);
    g.fillStyle(Palette.anomaly, 1);
    g.fillRect(14, 14, 8, 8);
    g.generateTexture(TextureKey.EchoPrime, 36, 36);
    g.destroy();
  }

  private generateWardBoltTexture(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(Palette.ward, 1);
    g.fillTriangle(7, 0, 0, 18, 14, 18);
    g.fillStyle(0xffc14a, 1);
    g.fillRect(5, 2, 4, 8);
    g.generateTexture(TextureKey.WardBolt, 14, 18);
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

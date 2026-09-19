import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TestScene } from './scenes/TestScene';
import { Palette, World } from './constants';

/**
 * Phaser 3 canvas game config.
 * Input lock (PRD §3.1): keyboard-only gameplay. No mouse aiming.
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: Palette.void,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: World.width,
    height: World.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: false,
  },
  scene: [BootScene, PreloadScene, TestScene],
};

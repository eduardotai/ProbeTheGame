import Phaser from 'phaser';

export type MoveVector = {
  x: number;
  y: number;
};

/**
 * Keyboard-only controller (PRD §3.1).
 * Exact binds are still TBD — this is a provisional scaffold map, not a lock.
 *
 * - Move: WASD or arrows (facing follows thrust; no pointer aim)
 * - Dodge: Shift (fuel-limited in Drift — GDD §4.1)
 * - Restart stub: R (M3 next-probe placeholder)
 * - Fire: not bound yet
 */
export class KeyboardController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly w: Phaser.Input.Keyboard.Key;
  private readonly a: Phaser.Input.Keyboard.Key;
  private readonly s: Phaser.Input.Keyboard.Key;
  private readonly d: Phaser.Input.Keyboard.Key;
  private readonly dodge: Phaser.Input.Keyboard.Key;
  private readonly restart: Phaser.Input.Keyboard.Key;

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.cursors = keyboard.createCursorKeys();
    this.w = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.a = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.s = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.d = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.dodge = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.restart = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  getMoveVector(): MoveVector {
    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.a.isDown) {
      x -= 1;
    }
    if (this.cursors.right.isDown || this.d.isDown) {
      x += 1;
    }
    if (this.cursors.up.isDown || this.w.isDown) {
      y -= 1;
    }
    if (this.cursors.down.isDown || this.s.isDown) {
      y += 1;
    }

    const length = Math.hypot(x, y);
    if (length > 0) {
      return { x: x / length, y: y / length };
    }

    return { x: 0, y: 0 };
  }

  consumeDodgePressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.dodge);
  }

  consumeRestartPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.restart);
  }
}

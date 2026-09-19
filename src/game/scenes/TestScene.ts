import Phaser from 'phaser';
import { Palette, SceneKey, THEME_LINE } from '../constants';
import { KeyboardController } from '../input/KeyboardController';
import {
  applyKeyboardMovement,
  createLosHunter,
  createPointBTrigger,
  createProbe,
  FuelTank,
  hasLineOfSight,
  tryDodge,
  type LosHunter,
  type PointBTrigger,
} from '../../milestones/m1-drift';
import { MAP1_PHASE_ORDER, phaseRegistry } from '../../milestones/m2-phases';
import { onHullDepleted, requestNextProbe } from '../../milestones/m3-map1';

/**
 * Runnable empty shell: probe placeholder + keyboard movement.
 * Wires M1 stubs only. No real hunt / phase / permadeath logic.
 */
export class TestScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private probe!: Phaser.Physics.Arcade.Image;
  private hunter!: LosHunter;
  private pointB!: PointBTrigger;
  private fuel!: FuelTank;
  private losLine!: Phaser.GameObjects.Line;
  private hud!: Phaser.GameObjects.Text;
  private pointBBanner!: Phaser.GameObjects.Text;
  private facing = 0;

  constructor() {
    super(SceneKey.Test);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(Palette.void);
    this.drawStarfield();

    this.fuel = new FuelTank();
    this.probe = createProbe(this, 160, this.scale.height / 2);
    this.hunter = createLosHunter(this, 640, 180);
    this.pointB = createPointBTrigger(this, this.scale.width - 120, this.scale.height / 2);

    this.losLine = this.add
      .line(0, 0, this.hunter.sprite.x, this.hunter.sprite.y, this.probe.x, this.probe.y, Palette.hunter, 0.35)
      .setOrigin(0, 0)
      .setLineWidth(1);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required (PRD §3.1 keyboard-only).');
    }
    this.keys = new KeyboardController(keyboard);

    this.physics.add.overlap(this.probe, this.pointB.zone, () => {
      this.pointB.onReached();
      this.pointBBanner.setVisible(true);
    });

    this.hud = this.add
      .text(16, 16, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '14px',
        color: '#8aa0b4',
        lineSpacing: 6,
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.pointBBanner = this.add
      .text(this.scale.width / 2, 88, 'POINT B REACHED (stub)', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '18px',
        color: '#5ee0ff',
      })
      .setOrigin(0.5, 0)
      .setVisible(false)
      .setDepth(20);

    this.add
      .text(this.scale.width / 2, this.scale.height - 28, THEME_LINE, {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#5a6b7a',
      })
      .setOrigin(0.5, 1)
      .setDepth(20);

    // Touch M2/M3 modules so the shell compiles against the milestone map.
    void phaseRegistry;
    void MAP1_PHASE_ORDER;
    void onHullDepleted;
  }

  update(_time: number, delta: number): void {
    if (this.keys.consumeRestartPressed()) {
      requestNextProbe(this);
      return;
    }

    const move = this.keys.getMoveVector();
    const dodging = this.keys.consumeDodgePressed();
    this.facing = applyKeyboardMovement(this.probe, move, this.facing, delta);

    if (dodging) {
      tryDodge(this.probe, this.fuel, this.facing);
    }

    const occluders: Phaser.Geom.Rectangle[] = [];
    const seesProbe = hasLineOfSight(
      { x: this.hunter.sprite.x, y: this.hunter.sprite.y },
      { x: this.probe.x, y: this.probe.y },
      occluders,
    );
    this.hunter.seesTarget = seesProbe;
    this.hunter.sprite.setRotation(
      Phaser.Math.Angle.Between(this.hunter.sprite.x, this.hunter.sprite.y, this.probe.x, this.probe.y) +
        Math.PI / 2,
    );

    this.losLine.setTo(this.hunter.sprite.x, this.hunter.sprite.y, this.probe.x, this.probe.y);
    this.losLine.setAlpha(seesProbe ? 0.45 : 0.08);

    this.hud.setText(this.buildHud());
  }

  private buildHud(): string {
    const fuelBar = this.fuel.toBar();
    const phase = phaseRegistry.drift.title;
    return [
      `PROBE TEST SHELL  ·  phase ${phase} (M1 stubs)`,
      `FUEL ${this.fuel.current.toFixed(0)}/${this.fuel.capacity}  ${fuelBar}`,
      'WASD / arrows  move    Shift  dodge (fuel)    R  next probe (stub)',
      'Keyboard only. No mouse aiming.',
    ].join('\n');
  }

  private drawStarfield(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xffffff, 1);
    for (let i = 0; i < 80; i += 1) {
      const x = (i * 97) % this.scale.width;
      const y = (i * 53) % this.scale.height;
      const size = i % 7 === 0 ? 2 : 1;
      g.fillRect(x, y, size, size);
    }
  }
}

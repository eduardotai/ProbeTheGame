import Phaser from 'phaser';
import { Palette, SceneKey, THEME_LINE, World } from '../constants';
import { paintStarfield, placePointA } from '../art';
import { KeyboardController } from '../input/KeyboardController';
import { Sfx } from '../audio/Sfx';
import {
  applyKeyboardMovement,
  coverRects,
  createDriftCovers,
  createLosHunter,
  createPointBTrigger,
  createProbe,
  DriftTuning,
  emitDodgeNoise,
  FuelTank,
  haltHunter,
  haltProbe,
  Hull,
  tryDodge,
  updateLosHunter,
  stunHunter,
  type DriftCover,
  type LosHunter,
  type NoisePulse,
  type PointBTrigger,
} from '../../milestones/m1-drift';
import {
  createPhaseEquipment,
  exposeMap1Window,
  formatPhaseHudLine,
  isRunOver,
  requestNextProbe,
  resetViewportCamera,
  resolvePhaseClear,
  resolvePhaseLost,
} from '../../milestones/m3-map1';

type RunState = 'playing' | 'recovered' | 'lost';

/**
 * Milestone 1 — Drift (GDD §4.1 / PRD §5).
 * Keyboard-only probe, fuel dodges, LOS hunters, Point B or hull 0.
 */
export class DriftScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private probe!: Phaser.Physics.Arcade.Image;
  private hunters!: LosHunter[];
  private pointB!: PointBTrigger;
  private covers!: DriftCover[];
  private fuel!: FuelTank;
  private hull!: Hull;
  private noise: NoisePulse | null = null;
  private losLines!: Phaser.GameObjects.Line[];
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private facing = 0;
  private invulnerableUntil = 0;
  private spawnProtectedUntil = 0;
  private runState: RunState = 'playing';

  constructor() {
    super(SceneKey.Drift);
  }

  create(): void {
    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + DriftTuning.spawnProtectMs;
    this.noise = null;
    this.facing = 0;
    this.sfx = new Sfx();

    this.cameras.main.setBackgroundColor(Palette.void);
    resetViewportCamera(this, World.width, World.height);
    this.physics.world.setBounds(0, 0, World.width, World.height);
    paintStarfield(this, World.width, World.height, Palette.pointB);

    const kit = createPhaseEquipment('drift');
    this.fuel = kit.fuel;
    this.hull = kit.hull;
    this.covers = createDriftCovers(this);

    this.probe = createProbe(this, 140, World.height / 2);
    placePointA(this, 140, World.height / 2);

    this.hunters = [
      createLosHunter(this, 640, 80),
      createLosHunter(this, 1140, 640),
    ];
    this.pointB = createPointBTrigger(this, World.width - 110, World.height / 2);

    for (const cover of this.covers) {
      this.physics.add.collider(this.probe, cover.visual);
      for (const hunter of this.hunters) {
        this.physics.add.collider(hunter.sprite, cover.visual);
      }
    }

    this.losLines = this.hunters.map((hunter) =>
      this.add
        .line(0, 0, hunter.sprite.x, hunter.sprite.y, this.probe.x, this.probe.y, Palette.hunter, 0.35)
        .setOrigin(0, 0)
        .setLineWidth(1)
        .setDepth(5),
    );

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required (PRD §3.1 keyboard-only).');
    }
    this.keys = new KeyboardController(keyboard);

    this.physics.add.overlap(this.probe, this.pointB.zone, () => {
      this.completeIfPlaying();
    });

    for (const hunter of this.hunters) {
      this.physics.add.collider(this.probe, hunter.sprite, () => {
        this.contactHunter(hunter);
      });
    }

    this.hud = this.add
      .text(16, 16, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '14px',
        color: '#8aa0b4',
        lineSpacing: 6,
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.banner = this.add
      .text(World.width / 2, 300, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '22px',
        color: '#5ee0ff',
      })
      .setOrigin(0.5, 0)
      .setVisible(false)
      .setDepth(21);

    this.hint = this.add
      .text(World.width / 2, 338, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '14px',
        color: '#8aa0b4',
      })
      .setOrigin(0.5, 0)
      .setVisible(false)
      .setDepth(21);

    this.add
      .text(World.width / 2, World.height - 28, THEME_LINE, {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#5a6b7a',
      })
      .setOrigin(0.5, 1)
      .setDepth(20);

    this.input.on('pointerdown', () => {
      if (this.runState !== 'playing') {
        requestNextProbe(this);
      }
    });

    this.exposeDebug();
  }

  update(time: number, delta: number): void {
    if (this.keys.consumeRestartPressed()) {
      requestNextProbe(this);
      return;
    }

    if (this.runState !== 'playing') {
      return;
    }

    this.sfx.resume();
    this.fuel.update(delta);

    const move = this.keys.getMoveVector();
    this.facing = applyKeyboardMovement(this.probe, move, this.facing, delta);

    if (this.keys.consumeDodgePressed()) {
      const dodged = tryDodge(this.probe, this.fuel, this.facing);
      if (dodged) {
        this.invulnerableUntil = Math.max(this.invulnerableUntil, time + DriftTuning.dodgeIFramesMs);
        this.noise = emitDodgeNoise(this.probe.x, this.probe.y, time);
        this.sfx.dodge();
      } else {
        this.sfx.dry();
      }
    }

    const occluders = coverRects(this.covers);
    const target = { x: this.probe.x, y: this.probe.y };
    this.hunters.forEach((hunter, index) => {
      updateLosHunter(hunter, target, occluders, this.noise, time);
      const line = this.losLines[index];
      if (!line) {
        return;
      }
      line.setTo(hunter.sprite.x, hunter.sprite.y, this.probe.x, this.probe.y);
      line.setAlpha(hunter.seesTarget ? 0.5 : hunter.lastSeen ? 0.18 : 0.06);
    });

    this.hud.setText(this.buildHud());
  }

  private contactHunter(hunter: LosHunter): void {
    if (this.runState !== 'playing') {
      return;
    }
    const now = this.time.now;
    if (now < this.spawnProtectedUntil || now < this.invulnerableUntil) {
      return;
    }
    const dist = Phaser.Math.Distance.Between(
      this.probe.x,
      this.probe.y,
      hunter.sprite.x,
      hunter.sprite.y,
    );
    if (dist > DriftTuning.contactRadius) {
      return;
    }

    this.invulnerableUntil = now + DriftTuning.hitIFramesMs;
    this.hull.applyHit(DriftTuning.contactDamage);
    stunHunter(hunter, now + DriftTuning.hunterStunMs);
    this.sfx.hit();
    this.cameras.main.shake(90, 0.005);

    const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const angle = Phaser.Math.Angle.Between(hunter.sprite.x, hunter.sprite.y, this.probe.x, this.probe.y);
      body.setVelocity(Math.cos(angle) * DriftTuning.hitKnockback, Math.sin(angle) * DriftTuning.hitKnockback);
    }

    if (isRunOver(this.hull.current)) {
      this.loseRun();
    }
  }

  private completeIfPlaying(): void {
    if (this.runState !== 'playing') {
      return;
    }
    this.pointB.onReached();
    this.runState = 'recovered';
    this.freezeField();
    this.sfx.recovered();
    resolvePhaseClear(this, 'drift', { hull: this.hull, fuel: this.fuel }, { banner: this.banner, hint: this.hint });
    this.hud.setText(this.buildHud());
  }

  private loseRun(): void {
    this.runState = 'lost';
    this.freezeField();
    this.sfx.death();
    this.probe.setTint(0x664444);
    resolvePhaseLost({ banner: this.banner, hint: this.hint });
    this.hud.setText(this.buildHud());
  }

  private freezeField(): void {
    haltProbe(this.probe);
    for (const hunter of this.hunters) {
      haltHunter(hunter);
    }
    for (const line of this.losLines) {
      line.setAlpha(0);
    }
    this.physics.pause();
  }

  private buildHud(): string {
    const locked = this.hunters.some((hunter) => hunter.seesTarget);
    const hunting = this.hunters.some((hunter) => hunter.lastSeen !== null);
    const hunterState =
      this.runState === 'recovered'
        ? 'CLEAR'
        : this.runState === 'lost'
          ? 'KILL'
          : locked
            ? 'LOS LOCK'
            : hunting
              ? 'LAST SEEN'
              : 'PATROL';
    const protectedNote =
      this.runState === 'playing' && this.time.now < this.spawnProtectedUntil ? '  LAUNCH WINDOW' : '';
    return [
      formatPhaseHudLine('drift', 'DRIFT  ·  M1', protectedNote),
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `HUNTER ${hunterState}`,
      'WASD/arrows move   Shift dodge   R next probe   keyboard only',
    ].join('\n');
  }

  private exposeDebug(): void {
    const debug = {
      snapshot: () => ({
        runState: this.runState,
        hull: this.hull.current,
        hullMax: this.hull.max,
        fuel: Number(this.fuel.current.toFixed(2)),
        fuelCapacity: this.fuel.capacity,
        probe: { x: this.probe.x, y: this.probe.y },
        hunters: this.hunters.map((hunter) => ({
          x: hunter.sprite.x,
          y: hunter.sprite.y,
          seesTarget: hunter.seesTarget,
          lastSeen: hunter.lastSeen,
        })),
        pointBReached: this.pointB.reached,
      }),
      placeProbe: (x: number, y: number) => {
        this.probe.setPosition(x, y);
        const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
        body?.reset(x, y);
      },
      hitProbe: (amount = 1) => {
        if (this.runState !== 'playing') {
          return this.hull.current;
        }
        this.hull.applyHit(amount);
        if (isRunOver(this.hull.current)) {
          this.loseRun();
        }
        return this.hull.current;
      },
      completePhase: () => {
        this.completeIfPlaying();
      },
      restart: () => {
        requestNextProbe(this);
      },
    };
    (window as Window).__drift = debug;
    exposeMap1Window('drift');
  }

}

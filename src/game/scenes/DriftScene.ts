import Phaser from 'phaser';
import { Palette, SceneKey, THEME_LINE, World } from '../constants';
import { KeyboardController } from '../input/KeyboardController';
import { Sfx } from '../audio/Sfx';
import { bindTransitCamera, createRng, formatSeed, resolveTransitSeed, setTransitBounds } from '../proc';
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
  generateDriftLayout,
  haltHunter,
  haltProbe,
  Hull,
  paintDriftField,
  tryDodge,
  updateLosHunter,
  stunHunter,
  type DriftCover,
  type DriftLayout,
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
  resolvePhaseClear,
  resolvePhaseLost,
} from '../../milestones/m3-map1';

type RunState = 'playing' | 'recovered' | 'lost';

/**
 * Milestone 1 — Drift (GDD §4.1 / PRD §5).
 * Long seeded A→B transit. Keyboard-only probe, fuel dodges, LOS hunters, Point B or hull 0.
 */
export class DriftScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private layout!: DriftLayout;
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
  private elapsedMs = 0;
  private runState: RunState = 'playing';

  constructor() {
    super(SceneKey.Drift);
  }

  create(): void {
    const seed = resolveTransitSeed();
    const rng = createRng(seed);
    this.layout = generateDriftLayout(rng);
    console.info(
      `[drift] seed ${this.layout.seed} (${formatSeed(this.layout.seed)}) world ${this.layout.world.width}x${this.layout.world.height}`,
    );

    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + DriftTuning.spawnProtectMs;
    this.noise = null;
    this.facing = 0;
    this.elapsedMs = 0;
    this.sfx = new Sfx();

    this.cameras.main.setBackgroundColor(Palette.void);
    setTransitBounds(this, this.layout.world);
    paintDriftField(this, this.layout);

    const kit = createPhaseEquipment('drift');
    this.fuel = kit.fuel;
    this.hull = kit.hull;
    this.covers = createDriftCovers(this, this.layout.covers);

    this.probe = createProbe(this, this.layout.probe.x, this.layout.probe.y);

    this.hunters = this.layout.hunters.map((spec) => createLosHunter(this, spec.x, spec.y));
    this.pointB = createPointBTrigger(this, this.layout.pointB.x, this.layout.pointB.y);
    bindTransitCamera(this, this.probe, this.layout.world, 0.2);

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
        backgroundColor: '#05070a',
        padding: { x: 10, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(20);

    const midX = World.width / 2;
    this.banner = this.add
      .text(midX, 292, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '22px',
        color: '#5ee0ff',
        backgroundColor: '#05070a',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(21);

    this.hint = this.add
      .text(midX, 340, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '14px',
        color: '#8aa0b4',
        backgroundColor: '#05070a',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(21);

    this.add
      .text(midX, World.height - 28, THEME_LINE, {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#5a6b7a',
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
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
    this.elapsedMs += delta;
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
    const toB = Math.max(0, Math.round(this.layout.pointB.x - this.probe.x));
    return [
      formatPhaseHudLine('drift', 'DRIFT  ·  M1', `  SEED ${formatSeed(this.layout.seed)}${protectedNote}`),
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `HUNTER ${hunterState}    TO B ${toB}    CLOCK ${formatClock(this.elapsedMs)}`,
      'WASD/arrows move   Shift dodge   R next probe   keyboard only',
    ].join('\n');
  }

  private exposeDebug(): void {
    const debug = {
      snapshot: () => ({
        runState: this.runState,
        seed: this.layout.seed,
        seedHex: formatSeed(this.layout.seed),
        world: this.layout.world,
        hull: this.hull.current,
        hullMax: this.hull.max,
        fuel: Number(this.fuel.current.toFixed(2)),
        fuelCapacity: this.fuel.capacity,
        elapsedMs: Math.round(this.elapsedMs),
        toB: Math.max(0, Math.round(this.layout.pointB.x - this.probe.x)),
        probe: { x: this.probe.x, y: this.probe.y },
        hunters: this.hunters.map((hunter) => ({
          x: hunter.sprite.x,
          y: hunter.sprite.y,
          seesTarget: hunter.seesTarget,
          lastSeen: hunter.lastSeen,
        })),
        pointBReached: this.pointB.reached,
        pointB: { x: this.layout.pointB.x, y: this.layout.pointB.y },
      }),
      placeProbe: (x: number, y: number) => {
        this.probe.setPosition(x, y);
        const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
        body?.reset(x, y);
        this.cameras.main.centerOn(x, y);
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

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

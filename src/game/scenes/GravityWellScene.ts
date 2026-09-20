import Phaser from 'phaser';
import { Palette, SceneKey, THEME_LINE, World } from '../constants';
import { paintStarfield, placePointA } from '../art';
import { KeyboardController } from '../input/KeyboardController';
import { Sfx } from '../audio/Sfx';
import {
  applyKeyboardMovement,
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
  type LosHunter,
  type NoisePulse,
  type PointBTrigger,
} from '../../milestones/m1-drift';
import { isRunOver, onHullDepleted, requestNextProbe } from '../../milestones/m3-map1';
import {
  applyGravityPull,
  createGravityBulwark,
  createGravityCovers,
  distanceToWell,
  GRAVITY_SPAWN,
  gravityOccluders,
  GravityTuning,
  haltBulwark,
  isInsideHorizon,
  paintGravityField,
  pushOutOfWell,
  routeBand,
  stunBulwark,
  updateGravityBulwark,
  type GravityBulwark,
  type GravityCover,
} from '../../milestones/m2-phases/gravity-well';

type RunState = 'playing' | 'recovered' | 'lost';

type Threat = {
  sprite: Phaser.Physics.Arcade.Image;
  seesTarget: boolean;
  lastSeen: { x: number; y: number } | null;
};

/**
 * Milestone 2.2 — Gravity Well (GDD §4.3 / PRD §6).
 * Constant pull toward a center mass. Shortcut cuts closer (stronger pull,
 * denser threats). Long way around is safer and slower.
 */
export class GravityWellScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private probe!: Phaser.Physics.Arcade.Image;
  private hunters!: LosHunter[];
  private bulwark!: GravityBulwark;
  private pointB!: PointBTrigger;
  private covers!: GravityCover[];
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
  private pullAccel = 0;
  private runState: RunState = 'playing';

  constructor() {
    super(SceneKey.GravityWell);
  }

  create(): void {
    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + GravityTuning.spawnProtectMs;
    this.noise = null;
    this.facing = 0;
    this.elapsedMs = 0;
    this.pullAccel = 0;
    this.sfx = new Sfx();

    this.cameras.main.setBackgroundColor(Palette.void);
    this.physics.world.setBounds(0, 0, World.width, World.height);
    paintStarfield(this, World.width, World.height, Palette.wellRim);
    paintGravityField(this);

    this.fuel = new FuelTank();
    this.hull = new Hull();
    this.covers = createGravityCovers(this);

    this.probe = createProbe(this, GRAVITY_SPAWN.probe.x, GRAVITY_SPAWN.probe.y);
    placePointA(this, GRAVITY_SPAWN.probe.x, GRAVITY_SPAWN.probe.y);

    this.hunters = [
      ...GRAVITY_SPAWN.shortcutHunters.map((spec) => this.spawnHunter(spec.x, spec.y)),
      this.spawnHunter(GRAVITY_SPAWN.longHunter.x, GRAVITY_SPAWN.longHunter.y),
    ];
    this.bulwark = createGravityBulwark(this, GRAVITY_SPAWN.bulwark.x, GRAVITY_SPAWN.bulwark.y);
    this.pointB = createPointBTrigger(this, GRAVITY_SPAWN.pointB.x, GRAVITY_SPAWN.pointB.y);

    for (const cover of this.covers) {
      this.physics.add.collider(this.probe, cover.visual);
      for (const hunter of this.hunters) {
        this.physics.add.collider(hunter.sprite, cover.visual);
      }
      this.physics.add.collider(this.bulwark.sprite, cover.visual);
    }

    this.losLines = this.threats().map((threat) =>
      this.add
        .line(0, 0, threat.sprite.x, threat.sprite.y, this.probe.x, this.probe.y, Palette.hunter, 0.35)
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
        this.contactThreat(hunter, DriftTuning.contactRadius);
      });
    }
    this.physics.add.collider(this.probe, this.bulwark.sprite, () => {
      this.contactThreat(this.bulwark, DriftTuning.contactRadius + 12);
    });

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

    this.banner = this.add
      .text(World.width / 2, 292, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '22px',
        color: '#5ee0ff',
        backgroundColor: '#05070a',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setVisible(false)
      .setDepth(21);

    this.hint = this.add
      .text(World.width / 2, 340, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '14px',
        color: '#8aa0b4',
        backgroundColor: '#05070a',
        padding: { x: 12, y: 6 },
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

    this.pullAccel = applyGravityPull(this.probe);
    this.tintForPull();

    if (isInsideHorizon({ x: this.probe.x, y: this.probe.y })) {
      this.swallowProbe();
      return;
    }

    const occluders = gravityOccluders(this.covers);
    const target = { x: this.probe.x, y: this.probe.y };
    for (const hunter of this.hunters) {
      updateLosHunter(hunter, target, occluders, this.noise, time);
      pushOutOfWell(hunter.sprite);
    }
    updateGravityBulwark(this.bulwark, target, occluders, this.noise, time);

    this.threats().forEach((threat, index) => {
      const line = this.losLines[index];
      if (!line) {
        return;
      }
      line.setTo(threat.sprite.x, threat.sprite.y, this.probe.x, this.probe.y);
      const color = threat === this.bulwark ? Palette.bulwark : Palette.hunter;
      line.setStrokeStyle(1, color, threat.seesTarget ? 0.5 : threat.lastSeen ? 0.18 : 0.06);
    });

    this.hud.setText(this.buildHud());
  }

  private spawnHunter(x: number, y: number): LosHunter {
    const hunter = createLosHunter(this, x, y);
    hunter.sprite.setMaxVelocity(GravityTuning.hunterMaxSpeed);
    hunter.sprite.setDrag(GravityTuning.hunterDrag);
    return hunter;
  }

  private contactThreat(threat: Threat, radius: number): void {
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
      threat.sprite.x,
      threat.sprite.y,
    );
    if (dist > radius) {
      return;
    }

    this.invulnerableUntil = now + DriftTuning.hitIFramesMs;
    this.hull.applyHit(DriftTuning.contactDamage);
    if (threat === this.bulwark) {
      stunBulwark(this.bulwark, now + DriftTuning.hunterStunMs);
    } else {
      const hunter = this.hunters.find((item) => item === threat);
      if (hunter) {
        stunHunter(hunter, now + DriftTuning.hunterStunMs);
      }
    }
    this.sfx.hit();
    this.cameras.main.shake(90, 0.005);

    const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const angle = Phaser.Math.Angle.Between(threat.sprite.x, threat.sprite.y, this.probe.x, this.probe.y);
      body.setVelocity(Math.cos(angle) * DriftTuning.hitKnockback, Math.sin(angle) * DriftTuning.hitKnockback);
    }

    if (isRunOver(this.hull.current)) {
      this.loseRun();
    }
  }

  private swallowProbe(): void {
    if (this.runState !== 'playing') {
      return;
    }
    this.hull.applyHit(this.hull.current);
    this.loseRun();
  }

  private completeIfPlaying(): void {
    if (this.runState !== 'playing') {
      return;
    }
    this.pointB.onReached();
    this.runState = 'recovered';
    this.freezeField();
    this.sfx.recovered();
    this.banner.setColor('#5ee0ff');
    this.banner.setText('POINT B — PROBE RECOVERED');
    this.banner.setVisible(true);
    this.hint.setText('Press R or click — launch next probe');
    this.hint.setVisible(true);
    this.hud.setText(this.buildHud());
  }

  private loseRun(): void {
    onHullDepleted();
    this.runState = 'lost';
    this.freezeField();
    this.sfx.death();
    this.probe.setTint(0x664444);
    this.banner.setColor('#ff6b6b');
    this.banner.setText('HULL 0 — PROBE LOST');
    this.banner.setVisible(true);
    this.hint.setText('Press R or click — launch next probe');
    this.hint.setVisible(true);
    this.hud.setText(this.buildHud());
  }

  private freezeField(): void {
    haltProbe(this.probe);
    for (const hunter of this.hunters) {
      haltHunter(hunter);
    }
    haltBulwark(this.bulwark);
    for (const line of this.losLines) {
      line.setAlpha(0);
    }
    this.physics.pause();
  }

  private tintForPull(): void {
    const band = routeBand({ x: this.probe.x, y: this.probe.y });
    if (band === 'horizon') {
      this.probe.setTint(0xff6b6b);
      return;
    }
    if (band === 'shortcut' && this.pullAccel > 520) {
      this.probe.setTint(0xffc8b0);
      return;
    }
    this.probe.clearTint();
  }

  private buildHud(): string {
    const threats = this.threats();
    const locked = threats.some((threat) => threat.seesTarget);
    const hunting = threats.some((threat) => threat.lastSeen !== null);
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
    const pos = { x: this.probe.x, y: this.probe.y };
    const band = routeBand(pos);
    const pullLabel =
      band === 'horizon' ? 'HORIZON' : this.pullAccel >= 480 ? 'STRONG' : this.pullAccel >= 260 ? 'FIRM' : 'WEAK';
    const routeLabel = band === 'horizon' ? 'WELL' : band === 'shortcut' ? 'SHORTCUT' : 'LONG WAY';
    return [
      `GRAVITY WELL  ·  M2.2${protectedNote}`,
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `PULL ${pullLabel}  ·  ${routeLabel}    HUNTER ${hunterState}    CLOCK ${formatClock(this.elapsedMs)}`,
      'WASD/arrows move   Shift dodge   R next probe   keyboard only',
    ].join('\n');
  }

  private threats(): Threat[] {
    return [...this.hunters, this.bulwark];
  }

  private exposeDebug(): void {
    const debug = {
      snapshot: () => {
        const probe = { x: this.probe.x, y: this.probe.y };
        const dist = distanceToWell(probe);
        return {
          runState: this.runState,
          hull: this.hull.current,
          hullMax: this.hull.max,
          fuel: Number(this.fuel.current.toFixed(2)),
          fuelCapacity: this.fuel.capacity,
          elapsedMs: Math.round(this.elapsedMs),
          pullAccel: Number(this.pullAccel.toFixed(1)),
          distToWell: Number(dist.toFixed(1)),
          routeBand: routeBand(probe),
          probe,
          hunters: this.hunters.map((hunter) => ({
            x: hunter.sprite.x,
            y: hunter.sprite.y,
            seesTarget: hunter.seesTarget,
            lastSeen: hunter.lastSeen,
            kind: 'hunter' as const,
          })),
          bulwark: {
            x: this.bulwark.sprite.x,
            y: this.bulwark.sprite.y,
            seesTarget: this.bulwark.seesTarget,
            lastSeen: this.bulwark.lastSeen,
            kind: 'bulwark' as const,
          },
          pointBReached: this.pointB.reached,
        };
      },
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
      restart: () => {
        requestNextProbe(this);
      },
    };
    (window as Window).__gravity = debug;
    (window as Window).__bootPhase = 'gravity-well';
  }
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

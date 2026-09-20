import Phaser from 'phaser';
import { Palette, SceneKey, THEME_LINE, World } from '../constants';
import { paintStarfield, placePointA } from '../art';
import { KeyboardController } from '../input/KeyboardController';
import { Sfx } from '../audio/Sfx';
import {
  applyKeyboardMovement,
  coverRects,
  createPointBTrigger,
  createProbe,
  DriftTuning,
  emitDodgeNoise,
  FuelTank,
  haltProbe,
  Hull,
  hasLineOfSight,
  tryDodge,
  type NoisePulse,
  type PointBTrigger,
} from '../../milestones/m1-drift';
import { isRunOver, onHullDepleted, requestNextProbe } from '../../milestones/m3-map1';
import {
  createDebrisAmbusher,
  createDebrisCovers,
  createFunnelHunter,
  DEBRIS_SPAWN,
  DebrisTuning,
  haltAmbusher,
  haltHunter,
  isInSafePocket,
  NavGrid,
  stunAmbusher,
  stunHunter,
  updateDebrisAmbusher,
  updateFunnelHunter,
  type DebrisAmbusher,
  type DebrisCover,
  type FunnelHunter,
} from '../../milestones/m2-phases/debris-field';

type RunState = 'playing' | 'recovered' | 'lost';

type Threat = {
  sprite: Phaser.Physics.Arcade.Image;
  seesTarget: boolean;
  lastSeen: { x: number; y: number } | null;
};

/**
 * Milestone 2.1 — Debris Field (GDD §4.2 / PRD §6).
 * Cover occludes LOS both ways. Hunters funnel gaps. Safe pockets pause fuel regen.
 */
export class DebrisFieldScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private probe!: Phaser.Physics.Arcade.Image;
  private hunters!: FunnelHunter[];
  private ambusher!: DebrisAmbusher;
  private pointB!: PointBTrigger;
  private covers!: DebrisCover[];
  private grid!: NavGrid;
  private fuel!: FuelTank;
  private hull!: Hull;
  private noise: NoisePulse | null = null;
  private losLines!: Phaser.GameObjects.Line[];
  private ghosts!: Phaser.GameObjects.Rectangle[];
  private memory!: Array<{ x: number; y: number } | null>;
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private facing = 0;
  private invulnerableUntil = 0;
  private spawnProtectedUntil = 0;
  private elapsedMs = 0;
  private inPocket = false;
  private runState: RunState = 'playing';

  constructor() {
    super(SceneKey.DebrisField);
  }

  create(): void {
    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + DebrisTuning.spawnProtectMs;
    this.noise = null;
    this.facing = 0;
    this.elapsedMs = 0;
    this.inPocket = false;
    this.sfx = new Sfx();

    this.cameras.main.setBackgroundColor(Palette.void);
    this.physics.world.setBounds(0, 0, World.width, World.height);
    paintStarfield(this, World.width, World.height, Palette.coverEdge);

    this.fuel = new FuelTank();
    this.hull = new Hull();
    this.covers = createDebrisCovers(this);
    const occluders = coverRects(this.covers);
    this.grid = new NavGrid(occluders);

    this.probe = createProbe(this, DEBRIS_SPAWN.probe.x, DEBRIS_SPAWN.probe.y);
    placePointA(this, DEBRIS_SPAWN.probe.x, DEBRIS_SPAWN.probe.y);

    this.hunters = DEBRIS_SPAWN.funnelHunters.map((spec) =>
      createFunnelHunter(this, spec.x, spec.y, spec.gap),
    );
    this.ambusher = createDebrisAmbusher(this, DEBRIS_SPAWN.ambusher.x, DEBRIS_SPAWN.ambusher.y);
    this.pointB = createPointBTrigger(this, DEBRIS_SPAWN.pointB.x, DEBRIS_SPAWN.pointB.y);

    const threats = this.threats();
    for (const cover of this.covers) {
      this.physics.add.collider(this.probe, cover.visual);
      for (const threat of threats) {
        this.physics.add.collider(threat.sprite, cover.visual);
      }
    }

    this.losLines = threats.map((threat) =>
      this.add
        .line(0, 0, threat.sprite.x, threat.sprite.y, this.probe.x, this.probe.y, Palette.hunter, 0.35)
        .setOrigin(0, 0)
        .setLineWidth(1)
        .setDepth(5)
        .setVisible(false),
    );
    this.ghosts = threats.map((threat) =>
      this.add
        .rectangle(threat.sprite.x, threat.sprite.y, 8, 8, Palette.hunter, 0.35)
        .setDepth(7)
        .setVisible(false),
    );
    this.memory = threats.map(() => null);

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
        this.contactThreat(hunter);
      });
    }
    this.physics.add.collider(this.probe, this.ambusher.sprite, () => {
      this.contactThreat(this.ambusher);
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
    this.inPocket = isInSafePocket(this.probe.x, this.probe.y);
    if (!this.inPocket) {
      this.fuel.update(delta);
    }

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
    for (const hunter of this.hunters) {
      updateFunnelHunter(hunter, target, occluders, this.grid, this.noise, time);
    }
    updateDebrisAmbusher(this.ambusher, target, occluders, this.grid, this.noise, time);
    this.updateVision(occluders);
    this.hud.setText(this.buildHud());
  }

  private contactThreat(threat: { sprite: Phaser.Physics.Arcade.Image }): void {
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
    if (dist > DriftTuning.contactRadius) {
      return;
    }

    this.invulnerableUntil = now + DriftTuning.hitIFramesMs;
    this.hull.applyHit(DriftTuning.contactDamage);
    if (threat === this.ambusher) {
      stunAmbusher(this.ambusher, now + DriftTuning.hunterStunMs);
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
    haltAmbusher(this.ambusher);
    for (const line of this.losLines) {
      line.setVisible(false);
    }
    this.physics.pause();
  }

  private updateVision(occluders: readonly Phaser.Geom.Rectangle[]): void {
    const probePos = { x: this.probe.x, y: this.probe.y };
    this.threats().forEach((threat, index) => {
      const seen = hasLineOfSight(probePos, { x: threat.sprite.x, y: threat.sprite.y }, occluders);
      threat.sprite.setVisible(seen);
      const line = this.losLines[index];
      const ghost = this.ghosts[index];
      if (seen) {
        this.memory[index] = { x: threat.sprite.x, y: threat.sprite.y };
        ghost?.setVisible(false);
        if (line) {
          line.setVisible(true);
          line.setTo(threat.sprite.x, threat.sprite.y, this.probe.x, this.probe.y);
          line.setAlpha(threat.seesTarget ? 0.5 : 0.18);
          line.setStrokeStyle(1, threat === this.ambusher ? Palette.ambusher : Palette.hunter, threat.seesTarget ? 0.5 : 0.18);
        }
        return;
      }
      line?.setVisible(false);
      const ping = this.memory[index];
      if (ping && ghost) {
        ghost.setPosition(ping.x, ping.y);
        ghost.setFillStyle(threat === this.ambusher ? Palette.ambusher : Palette.hunter, 0.32);
        ghost.setVisible(true);
      }
    });
  }

  private buildHud(): string {
    const threats = this.threats();
    const visible = threats.filter((threat) => threat.sprite.visible);
    const locked = visible.some((threat) => threat.seesTarget);
    const tracking = threats.some((threat) => threat.lastSeen !== null);
    const hunterState =
      this.runState === 'recovered'
        ? 'CLEAR'
        : this.runState === 'lost'
          ? 'KILL'
          : locked
            ? 'LOS LOCK'
            : visible.length > 0
              ? 'CONTACT'
              : tracking
                ? 'LAST SEEN'
                : 'OCCLUDED';
    const protectedNote =
      this.runState === 'playing' && this.time.now < this.spawnProtectedUntil ? '  LAUNCH WINDOW' : '';
    const pocketNote = this.inPocket ? '  POCKET — fuel regen paused' : '';
    return [
      `DEBRIS FIELD  ·  M2.1${protectedNote}${pocketNote}`,
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `HUNTER ${hunterState}    CLOCK ${formatClock(this.elapsedMs)}`,
      'WASD/arrows move   Shift dodge   R next probe   keyboard only',
    ].join('\n');
  }

  private threats(): Threat[] {
    return [...this.hunters, this.ambusher];
  }

  private exposeDebug(): void {
    const debug = {
      snapshot: () => ({
        runState: this.runState,
        hull: this.hull.current,
        hullMax: this.hull.max,
        fuel: Number(this.fuel.current.toFixed(2)),
        fuelCapacity: this.fuel.capacity,
        elapsedMs: Math.round(this.elapsedMs),
        inPocket: this.inPocket,
        probe: { x: this.probe.x, y: this.probe.y },
        hunters: this.threats().map((threat, index) => ({
          x: threat.sprite.x,
          y: threat.sprite.y,
          seesTarget: threat.seesTarget,
          lastSeen: threat.lastSeen,
          visibleToProbe: threat.sprite.visible,
          kind: (index === this.hunters.length ? 'ambusher' : 'funnel') as 'ambusher' | 'funnel',
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
      restart: () => {
        requestNextProbe(this);
      },
    };
    (window as Window).__debris = debug;
    (window as Window).__bootPhase = 'debris-field';
  }
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

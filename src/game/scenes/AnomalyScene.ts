import Phaser from 'phaser';
import { Palette, SceneKey, TextureKey, THEME_LINE, World } from '../constants';
import { KeyboardController } from '../input/KeyboardController';
import { Sfx } from '../audio/Sfx';
import { bindTransitCamera, createRng, formatSeed, resolveTransitSeed, setTransitBounds } from '../proc';
import {
  applyKeyboardMovement,
  createPointBTrigger,
  createProbe,
  DriftTuning,
  FuelTank,
  haltProbe,
  Hull,
  tryDodge,
  type PointBTrigger,
} from '../../milestones/m1-drift';
import { isRunOver, onHullDepleted, requestNextProbe } from '../../milestones/m3-map1';
import {
  AnomalyTuning,
  contactRadiusFor,
  createAnomalyCovers,
  createEcho,
  generateAnomalyLayout,
  haltEcho,
  INVERT_BIND_HINT,
  INVERT_HUD_LINE,
  INVERT_RULE_ID,
  INVERT_RULE_LABEL,
  invertMove,
  killEcho,
  paintAnomalyField,
  stunEcho,
  updateEcho,
  zoneAt,
  type AnomalyCover,
  type AnomalyLayout,
  type Echo,
} from '../../milestones/m2-phases/anomaly/index';
import { boltExpired, spawnBolt, SwarmWeapon } from '../../milestones/m2-phases/swarm/weapon';

type RunState = 'playing' | 'recovered' | 'lost';

/**
 * Milestone 2.4 — Anomaly (GDD §4.5 / PRD §6).
 * Long seeded A→B transit. One invert: controls mirrored.
 * Echoes dim-then-lunge (inverted Swarm tell). Keyboard facing; Space fires.
 */
export class AnomalyScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private layout!: AnomalyLayout;
  private probe!: Phaser.Physics.Arcade.Image;
  private echoes: Echo[] = [];
  private echoGroup!: Phaser.Physics.Arcade.Group;
  private boltGroup!: Phaser.Physics.Arcade.Group;
  private pointB!: PointBTrigger;
  private covers!: AnomalyCover[];
  private fuel!: FuelTank;
  private hull!: Hull;
  private weapon!: SwarmWeapon;
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private facing = 0;
  private invulnerableUntil = 0;
  private spawnProtectedUntil = 0;
  private dodgeUntil = 0;
  private elapsedMs = 0;
  private runState: RunState = 'playing';

  constructor() {
    super(SceneKey.Anomaly);
  }

  create(): void {
    const seed = resolveTransitSeed();
    const rng = createRng(seed);
    this.layout = generateAnomalyLayout(rng);
    console.info(
      `[anomaly] seed ${this.layout.seed} (${formatSeed(this.layout.seed)}) invert ${INVERT_RULE_ID} world ${this.layout.world.width}x${this.layout.world.height}`,
    );

    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + AnomalyTuning.spawnProtectMs;
    this.facing = 0;
    this.elapsedMs = 0;
    this.dodgeUntil = 0;
    this.echoes = [];
    this.sfx = new Sfx();
    this.weapon = new SwarmWeapon();
    this.fuel = new FuelTank();
    this.hull = new Hull();

    this.cameras.main.setBackgroundColor(Palette.void);
    setTransitBounds(this, this.layout.world);
    paintAnomalyField(this, this.layout);
    this.covers = createAnomalyCovers(this, this.layout.covers);

    this.probe = createProbe(this, this.layout.probe.x, this.layout.probe.y);
    this.probe.setMaxVelocity(AnomalyTuning.probeMaxSpeed);
    this.probe.setDrag(AnomalyTuning.probeDrag);

    this.echoGroup = this.physics.add.group();
    this.boltGroup = this.physics.add.group();

    for (const spec of this.layout.echoes) {
      this.adoptEcho(createEcho(this, spec.x, spec.y, spec.kind, spec.homeRadius));
    }

    this.pointB = createPointBTrigger(this, this.layout.pointB.x, this.layout.pointB.y);
    bindTransitCamera(this, this.probe, this.layout.world, 0.2);

    for (const cover of this.covers) {
      this.physics.add.collider(this.probe, cover.visual);
      this.physics.add.collider(this.echoGroup, cover.visual);
      this.physics.add.collider(this.boltGroup, cover.visual, (boltObj) => {
        const bolt = boltObj as Phaser.Physics.Arcade.Image;
        bolt.destroy();
      });
    }

    this.physics.add.collider(this.echoGroup, this.echoGroup);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required (PRD §3.1 keyboard-only).');
    }
    this.keys = new KeyboardController(keyboard);

    this.physics.add.overlap(this.probe, this.pointB.zone, () => {
      this.completeIfPlaying();
    });
    this.physics.add.collider(this.probe, this.echoGroup, (_probe, obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Image;
      const echo = this.findEcho(sprite);
      if (echo) {
        this.contactEcho(echo);
      }
    });
    this.physics.add.overlap(this.boltGroup, this.echoGroup, (a, b) => {
      const one = a as Phaser.Physics.Arcade.Image;
      const two = b as Phaser.Physics.Arcade.Image;
      const bolt = one.texture.key === TextureKey.Bolt ? one : two;
      const sprite = one.texture.key === TextureKey.Bolt ? two : one;
      this.strikeEcho(bolt, sprite);
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

    this.add
      .text(World.width - 20, 16, INVERT_HUD_LINE, {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '15px',
        color: '#ff6ad5',
        backgroundColor: '#160814',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(21);

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
    this.weapon.update(delta);

    const move = invertMove(this.keys.getMoveVector());
    this.facing = applyKeyboardMovement(this.probe, move, this.facing, delta);

    if (this.keys.consumeDodgePressed()) {
      const dodged = tryDodge(this.probe, this.fuel, this.facing);
      if (dodged) {
        this.invulnerableUntil = Math.max(this.invulnerableUntil, time + DriftTuning.dodgeIFramesMs);
        this.probe.setMaxVelocity(AnomalyTuning.dodgeBurstSpeed);
        this.dodgeUntil = time + AnomalyTuning.dodgeBurstMs;
        this.sfx.dodge();
      } else {
        this.sfx.dry();
      }
    }
    if (time >= this.dodgeUntil) {
      this.probe.setMaxVelocity(AnomalyTuning.probeMaxSpeed);
    }
    if (time >= this.invulnerableUntil) {
      this.probe.clearTint();
    }

    const wantsFire = this.keys.consumeFirePressed() || this.keys.isFireDown();
    if (wantsFire) {
      this.tryWeapon(time);
    }

    const target = { x: this.probe.x, y: this.probe.y };
    const aggroEnabled = time >= this.spawnProtectedUntil;
    for (const echo of this.echoes) {
      updateEcho(echo, target, time, aggroEnabled);
    }
    this.cullBolts(time);

    this.hud.setText(this.buildHud());
  }

  private tryWeapon(now: number): void {
    const result = this.weapon.tryFire(now);
    if (result === 'wait') {
      return;
    }
    if (result === 'hot' || result === 'empty') {
      this.sfx.dry();
      return;
    }
    const x = this.probe.x + Math.cos(this.facing) * 22;
    const y = this.probe.y + Math.sin(this.facing) * 22;
    const bolt = spawnBolt(this, x, y, this.facing, now);
    this.boltGroup.add(bolt);
    this.sfx.fire();
  }

  private cullBolts(now: number): void {
    const worldWidth = this.layout.world.width;
    for (const child of this.boltGroup.getChildren()) {
      const bolt = child as Phaser.Physics.Arcade.Image;
      if (boltExpired(bolt, now, worldWidth)) {
        bolt.destroy();
      }
    }
  }

  private adoptEcho(echo: Echo): void {
    this.echoes.push(echo);
    this.echoGroup.add(echo.sprite);
  }

  private findEcho(sprite: Phaser.Physics.Arcade.Image): Echo | undefined {
    return this.echoes.find((echo) => echo.sprite === sprite && echo.alive);
  }

  private contactEcho(echo: Echo): void {
    if (this.runState !== 'playing' || !echo.alive) {
      return;
    }
    const now = this.time.now;
    if (now < this.spawnProtectedUntil || now < this.invulnerableUntil) {
      return;
    }
    const dist = Phaser.Math.Distance.Between(this.probe.x, this.probe.y, echo.sprite.x, echo.sprite.y);
    if (dist > contactRadiusFor(echo.kind)) {
      return;
    }

    this.invulnerableUntil = now + AnomalyTuning.hitIFramesMs;
    this.hull.applyHit(AnomalyTuning.contactDamage);
    stunEcho(echo, now + AnomalyTuning.stunMs);
    this.sfx.hit();
    this.cameras.main.shake(110, 0.007);
    this.probe.setTint(0xe08aff);
    this.probe.setMaxVelocity(AnomalyTuning.dodgeBurstSpeed);
    this.dodgeUntil = Math.max(this.dodgeUntil, now + 160);

    const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const angle = Phaser.Math.Angle.Between(echo.sprite.x, echo.sprite.y, this.probe.x, this.probe.y);
      body.setVelocity(Math.cos(angle) * AnomalyTuning.hitKnockback, Math.sin(angle) * AnomalyTuning.hitKnockback);
    }

    if (isRunOver(this.hull.current)) {
      this.loseRun();
    }
  }

  private strikeEcho(bolt: Phaser.Physics.Arcade.Image, sprite: Phaser.Physics.Arcade.Image): void {
    if (this.runState !== 'playing' || !bolt.active) {
      return;
    }
    const echo = this.findEcho(sprite);
    if (!echo) {
      return;
    }
    bolt.destroy();
    killEcho(echo);
    this.sfx.kill();
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
    for (const echo of this.echoes) {
      haltEcho(echo);
    }
    for (const child of this.boltGroup.getChildren()) {
      const bolt = child as Phaser.Physics.Arcade.Image;
      const body = bolt.body as Phaser.Physics.Arcade.Body | null;
      body?.setVelocity(0, 0);
    }
    this.physics.pause();
  }

  private buildHud(): string {
    const alive = this.echoes.filter((echo) => echo.alive).length;
    const telling = this.echoes.some((echo) => echo.alive && echo.phase === 'tell');
    const zone = zoneAt(this.layout.zones, this.probe.x, this.probe.y);
    const heat = this.weapon.heat;
    const mag = this.weapon.mag;
    const heatLabel = heat.locked ? 'LOCK' : heat.current > 48 ? 'WARM' : 'OK';
    const ammoLabel = mag.current <= 0 ? 'EMPTY' : `${mag.current}/${mag.capacity}`;
    const protectedNote =
      this.runState === 'playing' && this.time.now < this.spawnProtectedUntil ? '  LAUNCH WINDOW' : '';
    const zoneLabel =
      this.runState !== 'playing'
        ? this.runState.toUpperCase()
        : zone?.kind === 'breathe'
          ? 'BREATHE'
          : zone?.kind === 'weave'
            ? 'WEAVE'
            : zone?.kind === 'pack'
              ? 'PACK'
              : 'TRANSIT';
    const echoState = telling ? 'DIM TELL' : 'ECHO';
    const toB = Math.max(0, Math.round(this.layout.pointB.x - this.probe.x));
    return [
      `ANOMALY  ·  M2.4  SEED ${formatSeed(this.layout.seed)}  ${INVERT_RULE_LABEL}${protectedNote}`,
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `AMMO ${ammoLabel} ${mag.toBar()}    HEAT ${heat.toBar()} ${heatLabel}    ${zoneLabel}    ${echoState} ${alive}    TO B ${toB}    CLOCK ${formatClock(this.elapsedMs)}`,
      `${INVERT_BIND_HINT}   Shift dodge   Space fire   R next probe   keyboard only`,
    ].join('\n');
  }

  private exposeDebug(): void {
    const debug = {
      snapshot: () => ({
        runState: this.runState,
        invertRule: INVERT_RULE_ID,
        invertLabel: INVERT_RULE_LABEL,
        invertHint: INVERT_BIND_HINT,
        seed: this.layout.seed,
        seedHex: formatSeed(this.layout.seed),
        world: this.layout.world,
        hull: this.hull.current,
        hullMax: this.hull.max,
        fuel: Number(this.fuel.current.toFixed(2)),
        fuelCapacity: this.fuel.capacity,
        ammo: this.weapon.mag.current,
        ammoCapacity: this.weapon.mag.capacity,
        heat: Number(this.weapon.heat.current.toFixed(2)),
        overheated: this.weapon.heat.locked,
        elapsedMs: Math.round(this.elapsedMs),
        toB: Math.max(0, Math.round(this.layout.pointB.x - this.probe.x)),
        zone: zoneAt(this.layout.zones, this.probe.x, this.probe.y)?.kind ?? null,
        echoAlive: this.echoes.filter((echo) => echo.alive).length,
        echoTotal: this.echoes.length,
        echoTelling: this.echoes.filter((echo) => echo.alive && echo.phase === 'tell').length,
        nearestEchoX: nearestX(this.echoes),
        probe: { x: this.probe.x, y: this.probe.y },
        facing: this.facing,
        pointBReached: this.pointB.reached,
        pointB: { x: this.layout.pointB.x, y: this.layout.pointB.y },
        zones: this.layout.zones.map((zone) => ({
          kind: zone.kind,
          x: zone.x,
          y: zone.y,
          w: zone.w,
          h: zone.h,
        })),
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
      restart: () => {
        requestNextProbe(this);
      },
      pause: () => {
        this.scene.pause();
      },
      resume: () => {
        this.scene.resume();
        if (this.physics.world.isPaused) {
          this.physics.resume();
        }
      },
    };
    (window as Window).__anomaly = debug;
    (window as Window).__bootPhase = 'anomaly';
  }
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function nearestX(echoes: readonly Echo[]): number | null {
  let min: number | null = null;
  for (const echo of echoes) {
    if (!echo.alive) {
      continue;
    }
    if (min === null || echo.sprite.x < min) {
      min = echo.sprite.x;
    }
  }
  return min === null ? null : Number(min.toFixed(1));
}

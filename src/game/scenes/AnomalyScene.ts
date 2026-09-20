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
  AnomalyInvert,
  AnomalyTuning,
  AnomalyWeapon,
  boltExpired,
  contactRadiusFor,
  createAnomalyCovers,
  createAnomalyHunter,
  generateAnomalyLayout,
  haltAnomalyHunter,
  invertInputCaption,
  invertMove,
  killAnomalyHunter,
  paintAnomalyField,
  spawnBolt,
  stunAnomalyHunter,
  updateAnomalyHunter,
  zoneAt,
  type AnomalyCover,
  type AnomalyHunter,
  type AnomalyLayout,
} from '../../milestones/m2-phases/anomaly/index';

type RunState = 'playing' | 'recovered' | 'lost';

/**
 * Milestone 2.4 — Anomaly (GDD §4.5 / PRD §6).
 * Long seeded A→B transit. Exactly one invert: WASD/arrow axes flip.
 * Keyboard facing (from inverted thrust); Space fires. No music bed.
 */
export class AnomalyScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private layout!: AnomalyLayout;
  private probe!: Phaser.Physics.Arcade.Image;
  private hunters: AnomalyHunter[] = [];
  private hunterGroup!: Phaser.Physics.Arcade.Group;
  private boltGroup!: Phaser.Physics.Arcade.Group;
  private pointB!: PointBTrigger;
  private covers!: AnomalyCover[];
  private fuel!: FuelTank;
  private hull!: Hull;
  private weapon!: AnomalyWeapon;
  private hud!: Phaser.GameObjects.Text;
  private invertBadge!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private facing = 0;
  private invulnerableUntil = 0;
  private spawnProtectedUntil = 0;
  private dodgeUntil = 0;
  private elapsedMs = 0;
  private inputCaption: string | null = null;
  private runState: RunState = 'playing';

  constructor() {
    super(SceneKey.Anomaly);
  }

  create(): void {
    const seed = resolveTransitSeed();
    const rng = createRng(seed);
    this.layout = generateAnomalyLayout(rng);
    console.info(
      `[anomaly] seed ${this.layout.seed} (${formatSeed(this.layout.seed)}) invert ${AnomalyInvert.id} world ${this.layout.world.width}x${this.layout.world.height}`,
    );

    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + AnomalyTuning.spawnProtectMs;
    this.facing = 0;
    this.elapsedMs = 0;
    this.dodgeUntil = 0;
    this.inputCaption = null;
    this.hunters = [];
    this.sfx = new Sfx();
    this.weapon = new AnomalyWeapon();
    this.fuel = new FuelTank();
    this.hull = new Hull();

    this.cameras.main.setBackgroundColor(Palette.void);
    setTransitBounds(this, this.layout.world);
    paintAnomalyField(this, this.layout);
    this.covers = createAnomalyCovers(this, this.layout.covers);

    this.probe = createProbe(this, this.layout.probe.x, this.layout.probe.y);
    this.probe.setMaxVelocity(AnomalyTuning.probeMaxSpeed);
    this.probe.setDrag(AnomalyTuning.probeDrag);

    this.hunterGroup = this.physics.add.group();
    this.boltGroup = this.physics.add.group();

    for (const spec of this.layout.hunters) {
      this.adoptHunter(createAnomalyHunter(this, spec.x, spec.y, spec.kind, spec.homeRadius));
    }

    this.pointB = createPointBTrigger(this, this.layout.pointB.x, this.layout.pointB.y);
    bindTransitCamera(this, this.probe, this.layout.world, 0.2);

    for (const cover of this.covers) {
      this.physics.add.collider(this.probe, cover.visual);
      this.physics.add.collider(this.hunterGroup, cover.visual);
      this.physics.add.collider(this.boltGroup, cover.visual, (boltObj) => {
        const bolt = boltObj as Phaser.Physics.Arcade.Image;
        bolt.destroy();
      });
    }

    this.physics.add.collider(this.hunterGroup, this.hunterGroup);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required (PRD §3.1 keyboard-only).');
    }
    this.keys = new KeyboardController(keyboard);

    this.physics.add.overlap(this.probe, this.pointB.zone, () => {
      this.completeIfPlaying();
    });
    this.physics.add.collider(this.probe, this.hunterGroup, (_probe, obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Image;
      const hunter = this.findHunter(sprite);
      if (hunter) {
        this.contactHunter(hunter);
      }
    });
    this.physics.add.overlap(this.boltGroup, this.hunterGroup, (a, b) => {
      const one = a as Phaser.Physics.Arcade.Image;
      const two = b as Phaser.Physics.Arcade.Image;
      const bolt = one.texture.key === TextureKey.Bolt ? one : two;
      const sprite = one.texture.key === TextureKey.Bolt ? two : one;
      this.strikeHunter(bolt, sprite);
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

    const midX = World.width / 2;
    this.invertBadge = this.add
      .text(midX, 108, `INVERT ACTIVE  ·  ${AnomalyInvert.label}  ·  ${AnomalyInvert.hint}`, {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '15px',
        color: '#e07aff',
        backgroundColor: '#05070a',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(21);

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

    const raw = this.keys.getMoveVector();
    const move = invertMove(raw);
    this.inputCaption = invertInputCaption(raw);
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
    for (const hunter of this.hunters) {
      updateAnomalyHunter(hunter, target, time, aggroEnabled);
    }
    this.cullBolts(time);

    const pulse = 0.72 + 0.28 * Math.abs(Math.sin(time * 0.004));
    this.invertBadge.setAlpha(pulse);
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

  private adoptHunter(hunter: AnomalyHunter): void {
    this.hunters.push(hunter);
    this.hunterGroup.add(hunter.sprite);
  }

  private findHunter(sprite: Phaser.Physics.Arcade.Image): AnomalyHunter | undefined {
    return this.hunters.find((hunter) => hunter.sprite === sprite && hunter.alive);
  }

  private contactHunter(hunter: AnomalyHunter): void {
    if (this.runState !== 'playing' || !hunter.alive) {
      return;
    }
    const now = this.time.now;
    if (now < this.spawnProtectedUntil || now < this.invulnerableUntil) {
      return;
    }
    const dist = Phaser.Math.Distance.Between(this.probe.x, this.probe.y, hunter.sprite.x, hunter.sprite.y);
    if (dist > contactRadiusFor(hunter.kind)) {
      return;
    }

    this.invulnerableUntil = now + AnomalyTuning.hitIFramesMs;
    this.hull.applyHit(AnomalyTuning.contactDamage);
    stunAnomalyHunter(hunter, now + AnomalyTuning.stunMs);
    this.sfx.hit();
    this.cameras.main.shake(110, 0.007);
    this.probe.setTint(0xff8a8a);
    this.probe.setMaxVelocity(AnomalyTuning.dodgeBurstSpeed);
    this.dodgeUntil = Math.max(this.dodgeUntil, now + 160);

    const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const angle = Phaser.Math.Angle.Between(hunter.sprite.x, hunter.sprite.y, this.probe.x, this.probe.y);
      body.setVelocity(Math.cos(angle) * AnomalyTuning.hitKnockback, Math.sin(angle) * AnomalyTuning.hitKnockback);
    }

    if (isRunOver(this.hull.current)) {
      this.loseRun();
    }
  }

  private strikeHunter(bolt: Phaser.Physics.Arcade.Image, sprite: Phaser.Physics.Arcade.Image): void {
    if (this.runState !== 'playing' || !bolt.active) {
      return;
    }
    const hunter = this.findHunter(sprite);
    if (!hunter) {
      return;
    }
    bolt.destroy();
    killAnomalyHunter(hunter);
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
    for (const hunter of this.hunters) {
      haltAnomalyHunter(hunter);
    }
    for (const child of this.boltGroup.getChildren()) {
      const bolt = child as Phaser.Physics.Arcade.Image;
      const body = bolt.body as Phaser.Physics.Arcade.Body | null;
      body?.setVelocity(0, 0);
    }
    this.physics.pause();
  }

  private buildHud(): string {
    const alive = this.hunters.filter((hunter) => hunter.alive).length;
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
        : zone?.kind === 'launch'
          ? 'LAUNCH'
          : zone?.kind === 'approach'
            ? 'APPROACH'
            : zone?.kind === 'pack'
              ? 'PACK'
              : 'TRANSIT';
    const toB = Math.max(0, Math.round(this.layout.pointB.x - this.probe.x));
    const inputLine = this.inputCaption ? `INPUT ${this.inputCaption}` : `INPUT ${AnomalyInvert.hint}`;
    return [
      `ANOMALY  ·  M2.4  SEED ${formatSeed(this.layout.seed)}  INVERT ${AnomalyInvert.label}${protectedNote}`,
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `AMMO ${ammoLabel} ${mag.toBar()}    HEAT ${heat.toBar()} ${heatLabel}    ${zoneLabel}    TO B ${toB}    HUNT ${alive}    CLOCK ${formatClock(this.elapsedMs)}`,
      `${inputLine}    WASD/arrows inverted   Shift dodge   Space fire   R next probe`,
    ].join('\n');
  }

  private exposeDebug(): void {
    const debug = {
      snapshot: () => ({
        runState: this.runState,
        seed: this.layout.seed,
        seedHex: formatSeed(this.layout.seed),
        invert: AnomalyInvert.id,
        invertLabel: AnomalyInvert.label,
        inputCaption: this.inputCaption,
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
        hunterAlive: this.hunters.filter((hunter) => hunter.alive).length,
        hunterTotal: this.hunters.length,
        nearestHunterX: nearestX(this.hunters),
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

function nearestX(hunters: readonly AnomalyHunter[]): number | null {
  let min: number | null = null;
  for (const hunter of hunters) {
    if (!hunter.alive) {
      continue;
    }
    if (min === null || hunter.sprite.x < min) {
      min = hunter.sprite.x;
    }
  }
  return min === null ? null : Number(min.toFixed(1));
}

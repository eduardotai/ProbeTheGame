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
import {
  createPhaseEquipment,
  exposeMap1Window,
  formatPhaseHudLine,
  isRunOver,
  requestNextProbe,
  resolvePhaseClear,
  resolvePhaseLost,
} from '../../milestones/m3-map1';
import {
  boltExpired,
  contactRadiusFor,
  createSwarmCovers,
  createSwarmling,
  generateSwarmLayout,
  haltSwarmling,
  killSwarmling,
  paintSwarmField,
  spawnBolt,
  spawnSplitMinis,
  stunSwarmling,
  SwarmTuning,
  SwarmWeapon,
  updateSwarmling,
  zoneAt,
  type SwarmCover,
  type SwarmLayout,
  type Swarmling,
} from '../../milestones/m2-phases/swarm/index';

type RunState = 'playing' | 'recovered' | 'lost';

/**
 * Milestone 2.3 — Swarm (GDD §4.4 / PRD §6).
 * Long seeded A→B transit. Dozens of Swarmlings. Heat/ammo gate fire.
 * Clear a pocket or push through damage. Keyboard facing; Space fires.
 */
export class SwarmScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private layout!: SwarmLayout;
  private probe!: Phaser.Physics.Arcade.Image;
  private swarmlings: Swarmling[] = [];
  private swarmGroup!: Phaser.Physics.Arcade.Group;
  private boltGroup!: Phaser.Physics.Arcade.Group;
  private pointB!: PointBTrigger;
  private covers!: SwarmCover[];
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
    super(SceneKey.Swarm);
  }

  create(): void {
    const seed = resolveTransitSeed();
    const rng = createRng(seed);
    this.layout = generateSwarmLayout(rng);
    console.info(`[swarm] seed ${this.layout.seed} (${formatSeed(this.layout.seed)}) world ${this.layout.world.width}x${this.layout.world.height}`);

    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + SwarmTuning.spawnProtectMs;
    this.facing = 0;
    this.elapsedMs = 0;
    this.dodgeUntil = 0;
    this.swarmlings = [];
    this.sfx = new Sfx();
    const kit = createPhaseEquipment('swarm');
    this.weapon = kit.weapon;
    this.fuel = kit.fuel;
    this.hull = kit.hull;

    this.cameras.main.setBackgroundColor(Palette.void);
    setTransitBounds(this, this.layout.world);
    paintSwarmField(this, this.layout);
    this.covers = createSwarmCovers(this, this.layout.covers);

    this.probe = createProbe(this, this.layout.probe.x, this.layout.probe.y);
    this.probe.setMaxVelocity(SwarmTuning.probeMaxSpeed);
    this.probe.setDrag(SwarmTuning.probeDrag);

    this.swarmGroup = this.physics.add.group();
    this.boltGroup = this.physics.add.group();

    for (const spec of this.layout.swarmlings) {
      this.adoptSwarmling(createSwarmling(this, spec.x, spec.y, spec.kind, spec.homeRadius));
    }

    this.pointB = createPointBTrigger(this, this.layout.pointB.x, this.layout.pointB.y);
    bindTransitCamera(this, this.probe, this.layout.world, 0.2);

    for (const cover of this.covers) {
      this.physics.add.collider(this.probe, cover.visual);
      this.physics.add.collider(this.swarmGroup, cover.visual);
      this.physics.add.collider(this.boltGroup, cover.visual, (boltObj) => {
        const bolt = boltObj as Phaser.Physics.Arcade.Image;
        bolt.destroy();
      });
    }

    this.physics.add.collider(this.swarmGroup, this.swarmGroup);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required (PRD §3.1 keyboard-only).');
    }
    this.keys = new KeyboardController(keyboard);

    this.physics.add.overlap(this.probe, this.pointB.zone, () => {
      this.completeIfPlaying();
    });
    this.physics.add.collider(this.probe, this.swarmGroup, (_probe, obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Image;
      const ling = this.findLing(sprite);
      if (ling) {
        this.contactSwarmling(ling);
      }
    });
    this.physics.add.overlap(this.boltGroup, this.swarmGroup, (a, b) => {
      const one = a as Phaser.Physics.Arcade.Image;
      const two = b as Phaser.Physics.Arcade.Image;
      const bolt = one.texture.key === TextureKey.Bolt ? one : two;
      const sprite = one.texture.key === TextureKey.Bolt ? two : one;
      this.strikeSwarmling(bolt, sprite);
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

    const move = this.keys.getMoveVector();
    this.facing = applyKeyboardMovement(this.probe, move, this.facing, delta);

    if (this.keys.consumeDodgePressed()) {
      const dodged = tryDodge(this.probe, this.fuel, this.facing);
      if (dodged) {
        this.invulnerableUntil = Math.max(this.invulnerableUntil, time + DriftTuning.dodgeIFramesMs);
        this.probe.setMaxVelocity(SwarmTuning.dodgeBurstSpeed);
        this.dodgeUntil = time + SwarmTuning.dodgeBurstMs;
        this.sfx.dodge();
      } else {
        this.sfx.dry();
      }
    }
    if (time >= this.dodgeUntil) {
      this.probe.setMaxVelocity(SwarmTuning.probeMaxSpeed);
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
    for (const ling of this.swarmlings) {
      updateSwarmling(ling, target, time, aggroEnabled);
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

  private adoptSwarmling(ling: Swarmling): void {
    this.swarmlings.push(ling);
    this.swarmGroup.add(ling.sprite);
  }

  private findLing(sprite: Phaser.Physics.Arcade.Image): Swarmling | undefined {
    return this.swarmlings.find((ling) => ling.sprite === sprite && ling.alive);
  }

  private contactSwarmling(ling: Swarmling): void {
    if (this.runState !== 'playing' || !ling.alive) {
      return;
    }
    const now = this.time.now;
    if (now < this.spawnProtectedUntil || now < this.invulnerableUntil) {
      return;
    }
    const dist = Phaser.Math.Distance.Between(this.probe.x, this.probe.y, ling.sprite.x, ling.sprite.y);
    if (dist > contactRadiusFor(ling.kind)) {
      return;
    }

    this.invulnerableUntil = now + SwarmTuning.hitIFramesMs;
    this.hull.applyHit(SwarmTuning.contactDamage);
    stunSwarmling(ling, now + SwarmTuning.stunMs);
    this.sfx.hit();
    this.cameras.main.shake(110, 0.007);
    this.probe.setTint(0xff8a8a);
    this.probe.setMaxVelocity(SwarmTuning.dodgeBurstSpeed);
    this.dodgeUntil = Math.max(this.dodgeUntil, now + 160);

    const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const angle = Phaser.Math.Angle.Between(ling.sprite.x, ling.sprite.y, this.probe.x, this.probe.y);
      body.setVelocity(Math.cos(angle) * SwarmTuning.hitKnockback, Math.sin(angle) * SwarmTuning.hitKnockback);
    }

    if (isRunOver(this.hull.current)) {
      this.loseRun();
    }
  }

  private strikeSwarmling(bolt: Phaser.Physics.Arcade.Image, sprite: Phaser.Physics.Arcade.Image): void {
    if (this.runState !== 'playing' || !bolt.active) {
      return;
    }
    const ling = this.findLing(sprite);
    if (!ling) {
      return;
    }
    const boltBody = bolt.body as Phaser.Physics.Arcade.Body | null;
    const splitFacing = boltBody
      ? Math.atan2(boltBody.velocity.y, boltBody.velocity.x)
      : this.facing;
    bolt.destroy();
    const at = { x: ling.sprite.x, y: ling.sprite.y };
    const wasSplitter = ling.kind === 'splitter';
    killSwarmling(ling);
    this.sfx.kill();
    if (wasSplitter) {
      const toward = { x: this.probe.x, y: this.probe.y };
      for (const mini of spawnSplitMinis(this, at, splitFacing, this.time.now, toward)) {
        this.adoptSwarmling(mini);
      }
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
    resolvePhaseClear(
      this,
      'swarm',
      { hull: this.hull, fuel: this.fuel, weapon: this.weapon },
      { banner: this.banner, hint: this.hint },
    );
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
    for (const ling of this.swarmlings) {
      haltSwarmling(ling);
    }
    for (const child of this.boltGroup.getChildren()) {
      const bolt = child as Phaser.Physics.Arcade.Image;
      const body = bolt.body as Phaser.Physics.Arcade.Body | null;
      body?.setVelocity(0, 0);
    }
    this.physics.pause();
  }

  private buildHud(): string {
    const alive = this.swarmlings.filter((ling) => ling.alive).length;
    const zone = zoneAt(this.layout.zones, this.probe.x, this.probe.y);
    const heat = this.weapon.heat;
    const mag = this.weapon.mag;
    const heatLabel = heat.locked ? 'LOCK' : heat.current > 48 ? 'WARM' : 'OK';
    const ammoLabel = mag.current <= 0 ? 'EMPTY' : `${mag.current}/${mag.capacity}`;
    const protectedNote =
      this.runState === 'playing' && this.time.now < this.spawnProtectedUntil ? '  LAUNCH WINDOW' : '';
    const zoneLabel =
      this.runState !== 'playing' ? this.runState.toUpperCase() : zone?.kind === 'clear' ? 'CLEAR POCKET' : zone?.kind === 'push' ? 'PUSH' : 'TRANSIT';
    const toB = Math.max(0, Math.round(this.layout.pointB.x - this.probe.x));
    return [
      formatPhaseHudLine('swarm', 'SWARM  ·  M2.3', `  SEED ${formatSeed(this.layout.seed)}${protectedNote}`),
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `AMMO ${ammoLabel} ${mag.toBar()}    HEAT ${heat.toBar()} ${heatLabel}    ${zoneLabel}    TO B ${toB}    SWARM ${alive}    CLOCK ${formatClock(this.elapsedMs)}`,
      'WASD/arrows move   Shift dodge   Space fire   R next probe   keyboard only',
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
        ammo: this.weapon.mag.current,
        ammoCapacity: this.weapon.mag.capacity,
        heat: Number(this.weapon.heat.current.toFixed(2)),
        overheated: this.weapon.heat.locked,
        elapsedMs: Math.round(this.elapsedMs),
        toB: Math.max(0, Math.round(this.layout.pointB.x - this.probe.x)),
        zone: zoneAt(this.layout.zones, this.probe.x, this.probe.y)?.kind ?? null,
        swarmlingAlive: this.swarmlings.filter((ling) => ling.alive).length,
        swarmlingTotal: this.swarmlings.length,
        nearestSwarmlingX: nearestX(this.swarmlings),
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
      completePhase: () => {
        this.completeIfPlaying();
      },
    };
    (window as Window).__swarm = debug;
    exposeMap1Window('swarm');
  }
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function nearestX(lings: readonly Swarmling[]): number | null {
  let min: number | null = null;
  for (const ling of lings) {
    if (!ling.alive) {
      continue;
    }
    if (min === null || ling.sprite.x < min) {
      min = ling.sprite.x;
    }
  }
  return min === null ? null : Number(min.toFixed(1));
}

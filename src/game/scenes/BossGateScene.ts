import Phaser from 'phaser';
import { Palette, SceneKey, TextureKey, THEME_LINE, World } from '../constants';
import { KeyboardController } from '../input/KeyboardController';
import { Sfx } from '../audio/Sfx';
import { bindTransitCamera, createRng, formatSeed, resolveTransitSeed, setTransitBounds } from '../proc';
import {
  applyKeyboardMovement,
  createProbe,
  DriftTuning,
  FuelTank,
  haltProbe,
  Hull,
  tryDodge,
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
import { boltExpired, spawnBolt, SwarmWeapon } from '../../milestones/m2-phases/swarm/weapon';
import {
  applyBulwarkHit,
  boltHitsPlate,
  BossGateSpine,
  BossGateTuning,
  createBossCovers,
  createGateBulwark,
  createGateWall,
  createSealedPointB,
  createShockwave,
  forceTell,
  generateBossGateLayout,
  haltBulwark,
  hpBar,
  killBulwark,
  openGateWall,
  paintBossField,
  phaseLabel,
  shockwaveHits,
  spawnWardBolt,
  updateGateBulwark,
  updateShockwave,
  wardExpired,
  zoneAt,
  type BossCover,
  type BossGateLayout,
  type GateBulwark,
  type GateBulwarkEvent,
  type GateMove,
  type GateWall,
  type SealedPointB,
  type Shockwave,
} from '../../milestones/m2-phases/boss-gate';

type RunState = 'playing' | 'recovered' | 'lost';

/**
 * Milestone 2.5 — Boss Gate (GDD §4.6 / PRD §6).
 * Finite A→B approach into a sealed gate. Destroy the Gate Bulwark to open B.
 * No bypass. Keyboard facing; Space fires; Shift dodge. No music bed.
 */
export class BossGateScene extends Phaser.Scene {
  private keys!: KeyboardController;
  private sfx!: Sfx;
  private layout!: BossGateLayout;
  private probe!: Phaser.Physics.Arcade.Image;
  private bulwark!: GateBulwark;
  private gate!: GateWall;
  private pointB!: SealedPointB;
  private covers!: BossCover[];
  private boltGroup!: Phaser.Physics.Arcade.Group;
  private wardGroup!: Phaser.Physics.Arcade.Group;
  private shockwaves: Shockwave[] = [];
  private tells!: Phaser.GameObjects.Graphics;
  private hpLabel!: Phaser.GameObjects.Text;
  private fuel!: FuelTank;
  private hull!: Hull;
  private weapon!: SwarmWeapon;
  private hud!: Phaser.GameObjects.Text;
  private destroyChip!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private facing = 0;
  private invulnerableUntil = 0;
  private spawnProtectedUntil = 0;
  private dodgeUntil = 0;
  private elapsedMs = 0;
  private runState: RunState = 'playing';

  constructor() {
    super(SceneKey.BossGate);
  }

  create(): void {
    const seed = resolveTransitSeed();
    const rng = createRng(seed);
    this.layout = generateBossGateLayout(rng);
    console.info(
      `[boss-gate] seed ${this.layout.seed} (${formatSeed(this.layout.seed)}) world ${this.layout.world.width}x${this.layout.world.height} win=destroy-guard`,
    );

    this.runState = 'playing';
    this.invulnerableUntil = 0;
    this.spawnProtectedUntil = this.time.now + BossGateTuning.spawnProtectMs;
    this.facing = 0;
    this.elapsedMs = 0;
    this.dodgeUntil = 0;
    this.shockwaves = [];
    this.sfx = new Sfx();
    const kit = createPhaseEquipment('boss-gate');
    this.weapon = kit.weapon;
    this.fuel = kit.fuel;
    this.hull = kit.hull;

    this.cameras.main.setBackgroundColor(Palette.void);
    setTransitBounds(this, this.layout.world);
    paintBossField(this, this.layout);
    this.covers = createBossCovers(this, this.layout.covers);

    this.probe = createProbe(this, this.layout.probe.x, this.layout.probe.y);
    this.probe.setMaxVelocity(BossGateTuning.probeMaxSpeed);
    this.probe.setDrag(BossGateTuning.probeDrag);

    this.bulwark = createGateBulwark(this, this.layout.bulwark.x, this.layout.bulwark.y);
    this.gate = createGateWall(this, this.layout);
    this.pointB = createSealedPointB(this, this.layout.pointB.x, this.layout.pointB.y);

    this.boltGroup = this.physics.add.group();
    this.wardGroup = this.physics.add.group();
    this.tells = this.add.graphics().setDepth(7);

    this.hpLabel = this.add
      .text(this.bulwark.sprite.x, this.bulwark.sprite.y - 52, '', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#ff8a5a',
        backgroundColor: '#05070a',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(12);

    bindTransitCamera(this, this.probe, this.layout.world, 0.2);

    for (const cover of this.covers) {
      this.physics.add.collider(this.probe, cover.visual);
      this.physics.add.collider(this.bulwark.sprite, cover.visual);
      this.physics.add.collider(this.boltGroup, cover.visual, (boltObj) => {
        (boltObj as Phaser.Physics.Arcade.Image).destroy();
      });
      this.physics.add.collider(this.wardGroup, cover.visual, (boltObj) => {
        (boltObj as Phaser.Physics.Arcade.Image).destroy();
      });
    }

    this.physics.add.collider(this.probe, this.gate.visual);
    this.physics.add.collider(this.bulwark.sprite, this.gate.visual);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required (PRD §3.1 keyboard-only).');
    }
    this.keys = new KeyboardController(keyboard);

    this.physics.add.overlap(this.probe, this.pointB.zone, () => {
      this.completeIfPlaying();
    });
    this.physics.add.collider(this.probe, this.bulwark.sprite, () => {
      this.contactBulwark();
    });
    this.physics.add.overlap(this.boltGroup, this.bulwark.sprite, (a, b) => {
      const one = a as Phaser.Physics.Arcade.Image;
      const two = b as Phaser.Physics.Arcade.Image;
      const bolt = one.texture.key === TextureKey.Bolt ? one : two;
      this.strikeBulwark(bolt);
    });
    this.physics.add.overlap(this.wardGroup, this.probe, (a, b) => {
      const one = a as Phaser.Physics.Arcade.Image;
      const two = b as Phaser.Physics.Arcade.Image;
      const ward = one.texture.key === TextureKey.WardBolt ? one : two;
      this.contactWard(ward);
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

    this.destroyChip = this.add
      .text(World.width - 20, 16, 'DESTROY THE GUARD', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '15px',
        color: '#ff8a5a',
        backgroundColor: '#14080a',
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
      this.drawTelegraph();
      this.syncHpLabel();
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
        this.probe.setMaxVelocity(BossGateTuning.dodgeBurstSpeed);
        this.dodgeUntil = time + BossGateTuning.dodgeBurstMs;
        this.sfx.dodge();
      } else {
        this.sfx.dry();
      }
    }
    if (time >= this.dodgeUntil) {
      this.probe.setMaxVelocity(BossGateTuning.probeMaxSpeed);
    }
    if (time >= this.invulnerableUntil) {
      this.probe.clearTint();
    }

    const wantsFire = this.keys.consumeFirePressed() || this.keys.isFireDown();
    if (wantsFire) {
      this.tryWeapon(time);
    }

    const target = { x: this.probe.x, y: this.probe.y };
    const inArena = this.probe.x >= this.layout.arena.x0 - BossGateTuning.arenaEnterPad;
    const onApproach = this.probe.x >= BossGateSpine.launchWidth && !inArena;
    const events = updateGateBulwark(this.bulwark, target, time, inArena, onApproach);
    this.handleBulwarkEvents(events, time);

    this.cullBolts(time);
    this.stepShockwaves(delta);
    this.drawTelegraph();
    this.syncHpLabel();
    this.hud.setText(this.buildHud());
  }

  private handleBulwarkEvents(events: readonly GateBulwarkEvent[], now: number): void {
    for (const event of events) {
      if (event.type === 'tell') {
        this.sfx.tell();
      } else if (event.type === 'charge') {
        this.cameras.main.shake(80, 0.004);
      } else if (event.type === 'sweep') {
        this.fireSweep(event.origin, event.facing, now);
      } else if (event.type === 'slam') {
        this.sfx.slam();
        this.cameras.main.shake(140, 0.01);
        this.shockwaves.push(createShockwave(this, event.origin.x, event.origin.y));
      }
    }
  }

  private fireSweep(origin: { x: number; y: number }, facing: number, now: number): void {
    const count = BossGateTuning.sweepCount;
    const spread = BossGateTuning.sweepSpread;
    const denom = Math.max(1, count - 1);
    for (let i = 0; i < count; i += 1) {
      const t = i / denom;
      const angle = facing - spread / 2 + t * spread;
      const x = origin.x + Math.cos(angle) * 36;
      const y = origin.y + Math.sin(angle) * 36;
      const bolt = spawnWardBolt(this, x, y, angle, now);
      this.wardGroup.add(bolt);
    }
    this.sfx.fire();
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
    for (const child of this.wardGroup.getChildren()) {
      const bolt = child as Phaser.Physics.Arcade.Image;
      if (wardExpired(bolt, now, worldWidth)) {
        bolt.destroy();
      }
    }
  }

  private stepShockwaves(delta: number): void {
    for (const wave of this.shockwaves) {
      updateShockwave(wave, delta);
      if (wave.alive && shockwaveHits(wave, this.probe.x, this.probe.y)) {
        wave.hit = true;
        this.applyProbeHit(wave.x, wave.y);
      }
    }
    this.shockwaves = this.shockwaves.filter((wave) => wave.alive);
  }

  private drawTelegraph(): void {
    this.tells.clear();
    if (!this.bulwark.alive || this.bulwark.phase !== 'tell' || !this.bulwark.move) {
      return;
    }
    const s = this.bulwark.sprite;
    const facing = this.bulwark.facing;
    if (this.bulwark.move === 'charge') {
      const len = BossGateTuning.chargeRange;
      this.tells.lineStyle(14, 0xff5a4a, 0.28);
      this.tells.beginPath();
      this.tells.moveTo(s.x, s.y);
      this.tells.lineTo(s.x + Math.cos(facing) * len, s.y + Math.sin(facing) * len);
      this.tells.strokePath();
      this.tells.lineStyle(4, 0xff8a5a, 0.7);
      this.tells.beginPath();
      this.tells.moveTo(s.x, s.y);
      this.tells.lineTo(s.x + Math.cos(facing) * len, s.y + Math.sin(facing) * len);
      this.tells.strokePath();
      return;
    }
    if (this.bulwark.move === 'sweep') {
      const reach = 280;
      const half = BossGateTuning.sweepSpread / 2;
      this.tells.fillStyle(0xffc14a, 0.16);
      this.tells.slice(s.x, s.y, reach, facing - half, facing + half, false);
      this.tells.fillPath();
      this.tells.lineStyle(2, 0xffc14a, 0.7);
      this.tells.slice(s.x, s.y, reach, facing - half, facing + half, false);
      this.tells.strokePath();
      return;
    }
    this.tells.lineStyle(3, 0xff8a5a, 0.75);
    this.tells.strokeCircle(s.x, s.y, 70);
    this.tells.lineStyle(8, 0xc45a6a, 0.25);
    this.tells.strokeCircle(s.x, s.y, 118);
  }

  private syncHpLabel(): void {
    this.hpLabel.setPosition(this.bulwark.sprite.x, this.bulwark.sprite.y - 58);
    this.hpLabel.setText(
      this.bulwark.alive ? `GATE BULWARK  ${hpBar(this.bulwark, 12)}` : 'GATE BULWARK  DOWN',
    );
    this.hpLabel.setVisible(this.bulwark.alive);
  }

  private contactBulwark(): void {
    if (this.runState !== 'playing' || !this.bulwark.alive) {
      return;
    }
    const dist = Phaser.Math.Distance.Between(
      this.probe.x,
      this.probe.y,
      this.bulwark.sprite.x,
      this.bulwark.sprite.y,
    );
    if (dist > BossGateTuning.contactRadius) {
      return;
    }
    this.applyProbeHit(this.bulwark.sprite.x, this.bulwark.sprite.y);
  }

  private contactWard(ward: Phaser.Physics.Arcade.Image): void {
    if (this.runState !== 'playing' || !ward.active) {
      return;
    }
    ward.destroy();
    this.applyProbeHit(ward.x, ward.y);
  }

  private applyProbeHit(fromX: number, fromY: number): void {
    if (this.runState !== 'playing') {
      return;
    }
    const now = this.time.now;
    if (now < this.spawnProtectedUntil || now < this.invulnerableUntil) {
      return;
    }
    this.invulnerableUntil = now + BossGateTuning.hitIFramesMs;
    this.hull.applyHit(BossGateTuning.contactDamage);
    this.sfx.hit();
    this.cameras.main.shake(110, 0.007);
    this.probe.setTint(0xff8a8a);
    this.probe.setMaxVelocity(BossGateTuning.dodgeBurstSpeed);
    this.dodgeUntil = Math.max(this.dodgeUntil, now + 160);

    const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const angle = Phaser.Math.Angle.Between(fromX, fromY, this.probe.x, this.probe.y);
      body.setVelocity(Math.cos(angle) * BossGateTuning.hitKnockback, Math.sin(angle) * BossGateTuning.hitKnockback);
    }

    if (isRunOver(this.hull.current)) {
      this.loseRun();
    }
  }

  private strikeBulwark(bolt: Phaser.Physics.Arcade.Image): void {
    if (this.runState !== 'playing' || !bolt.active || !this.bulwark.alive) {
      return;
    }
    if (boltHitsPlate(this.bulwark, bolt)) {
      bolt.destroy();
      this.sfx.absorb();
      this.bulwark.sprite.setTint(0xffe0a0);
      return;
    }
    bolt.destroy();
    const dead = applyBulwarkHit(this.bulwark);
    this.sfx.kill();
    if (dead) {
      this.openTheGate();
    }
  }

  private openTheGate(): void {
    openGateWall(this.gate);
    this.pointB.unlock();
    this.sfx.gateOpen();
    this.tells.clear();
    this.destroyChip.setVisible(false);
  }

  private completeIfPlaying(): void {
    if (this.runState !== 'playing' || !this.pointB.open) {
      return;
    }
    this.pointB.onReached();
    this.runState = 'recovered';
    this.freezeField();
    this.sfx.recovered();
    resolvePhaseClear(
      this,
      'boss-gate',
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
    haltBulwark(this.bulwark);
    for (const child of this.boltGroup.getChildren()) {
      const bolt = child as Phaser.Physics.Arcade.Image;
      const body = bolt.body as Phaser.Physics.Arcade.Body | null;
      body?.setVelocity(0, 0);
    }
    for (const child of this.wardGroup.getChildren()) {
      const bolt = child as Phaser.Physics.Arcade.Image;
      const body = bolt.body as Phaser.Physics.Arcade.Body | null;
      body?.setVelocity(0, 0);
    }
    this.physics.pause();
  }

  private buildHud(): string {
    const heat = this.weapon.heat;
    const mag = this.weapon.mag;
    const heatLabel = heat.locked ? 'LOCK' : heat.current > 48 ? 'WARM' : 'OK';
    const ammoLabel = mag.current <= 0 ? 'EMPTY' : `${mag.current}/${mag.capacity}`;
    const protectedNote =
      this.runState === 'playing' && this.time.now < this.spawnProtectedUntil ? '  LAUNCH WINDOW' : '';
    const gateLabel = this.pointB.open ? 'GATE OPEN' : 'GATE SEALED';
    const zone = zoneAt(this.layout.zones, this.probe.x, this.probe.y);
    const zoneLabel =
      this.runState !== 'playing'
        ? this.runState.toUpperCase()
        : this.probe.x >= this.layout.arena.x1
          ? 'GATE'
          : zone?.kind === 'arena'
            ? 'ARENA'
            : zone?.kind === 'approach'
              ? 'APPROACH'
              : 'LAUNCH';
    const toB = Math.max(0, Math.round(this.layout.pointB.x - this.probe.x));
    return [
      formatPhaseHudLine(
        'boss-gate',
        'BOSS GATE  ·  M2.5',
        `  SEED ${formatSeed(this.layout.seed)}  ${gateLabel}${protectedNote}`,
      ),
      `HULL ${this.hull.current}/${this.hull.max} ${this.hull.toBar()}    FUEL ${Math.floor(this.fuel.current)}/${this.fuel.capacity} ${this.fuel.toBar()}`,
      `AMMO ${ammoLabel} ${mag.toBar()}    HEAT ${heat.toBar()} ${heatLabel}    ${zoneLabel}    ${phaseLabel(this.bulwark)} ${hpBar(this.bulwark, 10)}    TO B ${toB}    CLOCK ${formatClock(this.elapsedMs)}`,
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
        gateOpen: this.pointB.open,
        gateSealed: this.gate.sealed,
        pointBReached: this.pointB.reached,
        winRule: 'destroy-guard' as const,
        bulwark: {
          alive: this.bulwark.alive,
          hp: this.bulwark.hp,
          hpMax: this.bulwark.maxHp,
          phase: this.bulwark.phase,
          move: this.bulwark.move,
          plateActive: this.bulwark.plateActive,
          enraged: this.bulwark.enraged,
          x: Number(this.bulwark.sprite.x.toFixed(1)),
          y: Number(this.bulwark.sprite.y.toFixed(1)),
        },
        probe: { x: this.probe.x, y: this.probe.y },
        facing: this.facing,
        pointB: { x: this.layout.pointB.x, y: this.layout.pointB.y },
        arena: this.layout.arena,
      }),
      placeProbe: (x: number, y: number) => {
        this.probe.setPosition(x, y);
        const body = this.probe.body as Phaser.Physics.Arcade.Body | null;
        body?.reset(x, y);
        this.cameras.main.centerOn(x, y);
        this.spawnProtectedUntil = 0;
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
      hitBulwark: (amount = 1) => {
        if (this.runState !== 'playing' || !this.bulwark.alive) {
          return this.bulwark.hp;
        }
        const dead = applyBulwarkHit(this.bulwark, amount);
        if (dead) {
          this.openTheGate();
        }
        return this.bulwark.hp;
      },
      killBulwark: () => {
        if (this.runState !== 'playing' || !this.bulwark.alive) {
          return;
        }
        killBulwark(this.bulwark);
        this.openTheGate();
      },
      completePhase: () => {
        this.completeIfPlaying();
      },
      forceTell: (move: GateMove = 'charge') => {
        const now = this.time.now;
        const target = { x: this.probe.x, y: this.probe.y };
        this.handleBulwarkEvents(forceTell(this.bulwark, move, target, now), now);
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
    (window as Window).__boss = debug;
    exposeMap1Window('boss-gate');
  }
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

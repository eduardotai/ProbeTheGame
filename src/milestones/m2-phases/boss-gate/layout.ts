import Phaser from 'phaser';
import { TextureKey } from '../../../game/constants';
import {
  createTiledCovers,
  paintLane,
  paintPixelLine,
  paintStarfield,
  paintTiledFloor,
  placePointA,
} from '../../../game/art';
import type { DriftCover } from '../../m1-drift';
import type { BossGateLayout, CoverSpec, TransitZone } from './procSpine';

export type BossCover = DriftCover;

export type GateWall = {
  visual: Phaser.GameObjects.TileSprite;
  label: Phaser.GameObjects.Text;
  sealed: boolean;
};

export type SealedPointB = {
  marker: Phaser.GameObjects.Image;
  zone: Phaser.GameObjects.Zone;
  label: Phaser.GameObjects.Text;
  reached: boolean;
  open: boolean;
  onReached: () => void;
  unlock: () => void;
};

export function createBossCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): BossCover[] {
  return createTiledCovers(scene, specs, 'gate');
}

export function createGateWall(scene: Phaser.Scene, layout: BossGateLayout): GateWall {
  const h = layout.world.height;
  const visual = scene.add.tileSprite(layout.gate.x, h / 2, layout.gate.w, h, TextureKey.GateWall).setDepth(5);
  scene.physics.add.existing(visual, true);

  const label = scene.add
    .text(layout.gate.x, h / 2 - 88, 'SEALED\nDESTROY THE GUARD', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '13px',
      color: '#ff8a5a',
      align: 'center',
      lineSpacing: 4,
    })
    .setOrigin(0.5)
    .setDepth(6);

  return { visual, label, sealed: true };
}

export function openGateWall(gate: GateWall): void {
  if (!gate.sealed) {
    return;
  }
  gate.sealed = false;
  const body = gate.visual.body as Phaser.Physics.Arcade.StaticBody | null;
  if (body) {
    body.enable = false;
  }
  gate.visual.setTexture(TextureKey.GateWallOpen);
  gate.visual.setAlpha(0.85);
  gate.label.setColor('#5ee0ff');
  gate.label.setText('OPEN');
}

export function createSealedPointB(scene: Phaser.Scene, x: number, y: number): SealedPointB {
  const marker = scene.add.image(x, y, TextureKey.PointB).setDepth(6).setAlpha(0.28);
  const label = scene.add
    .text(x, y + 28, 'SEALED', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '13px',
      color: '#8a3a4a',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  const zone = scene.add.zone(x, y, 56, 56);
  scene.physics.add.existing(zone, true);

  const trigger: SealedPointB = {
    marker,
    zone,
    label,
    reached: false,
    open: false,
    onReached: () => {
      if (!trigger.open || trigger.reached) {
        return;
      }
      trigger.reached = true;
    },
    unlock: () => {
      if (trigger.open) {
        return;
      }
      trigger.open = true;
      marker.setAlpha(1);
      label.setColor('#5ee0ff');
      label.setText('B');
      scene.tweens.add({
        targets: marker,
        alpha: { from: 0.7, to: 1 },
        scale: { from: 0.92, to: 1.08 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    },
  };

  return trigger;
}

export function paintBossField(scene: Phaser.Scene, layout: BossGateLayout): void {
  paintStarfield(scene, layout.world.width, layout.world.height, 0xff8a5a, 180);

  const g = scene.add.graphics().setDepth(1);
  for (const zone of layout.zones) {
    paintZone(scene, zone);
  }

  for (const scar of layout.scars) {
    paintPixelLine(g, scar.x0, scar.y0, scar.x1, scar.y1, 0x8a3a4a, 0.45);
  }

  for (const segment of layout.segments) {
    if (segment.kind === 'launch' || segment.kind === 'gate') {
      continue;
    }
    paintLane(scene, segment.x0, segment.x1, segment.laneY, TextureKey.LaneGate);
  }

  placePointA(scene, layout.probe.x, layout.probe.y);

  scene.add
    .text(layout.probe.x + 230, 188, 'BOSS GATE', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '22px',
      color: '#ff8a5a',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(layout.probe.x + 230, 218, 'DESTROY THE GUARD TO OPEN B', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '14px',
      color: '#c45a6a',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(layout.probe.x + 230, 244, 'no bypass  ·  WASD  ·  Shift dodge  ·  Space fire', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '12px',
      color: '#8aa0b4',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  const approachEnd = layout.arena.x0;
  scene.add
    .text(approachEnd - 120, 64, 'GATE AHEAD', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '12px',
      color: '#ff8a5a',
    })
    .setOrigin(0.5, 0)
    .setDepth(6)
    .setAlpha(0.75);
}

function paintZone(scene: Phaser.Scene, zone: TransitZone): void {
  const cx = zone.x + zone.w / 2;
  if (zone.kind === 'approach') {
    paintTiledFloor(scene, zone.x, zone.y, zone.w, zone.h, TextureKey.ZoneFloor, 1, 0.5);
    scene.add
      .text(cx, zone.y + 16, 'APPROACH', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '11px',
        color: '#4a7a8a',
      })
      .setOrigin(0.5, 0)
      .setDepth(6)
      .setAlpha(0.6);
    return;
  }
  paintTiledFloor(scene, zone.x, zone.y, zone.w, zone.h, TextureKey.ZoneFloorGate, 1, 0.55);
  scene.add
    .text(cx, zone.y + 16, 'ARENA', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '11px',
      color: '#ff8a5a',
    })
    .setOrigin(0.5, 0)
    .setDepth(6)
    .setAlpha(0.65);
}

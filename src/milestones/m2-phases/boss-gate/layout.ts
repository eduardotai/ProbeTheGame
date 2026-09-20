import Phaser from 'phaser';
import { Palette, TextureKey } from '../../../game/constants';
import type { DriftCover } from '../../m1-drift';
import type { BossGateLayout, CoverSpec, TransitZone } from './procSpine';

export type BossCover = DriftCover;

export type GateWall = {
  visual: Phaser.GameObjects.Rectangle;
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
  return specs.map((spec) => {
    const visual = scene.add
      .rectangle(spec.x, spec.y, spec.w, spec.h, Palette.cover, 1)
      .setStrokeStyle(1, Palette.gate, 0.7)
      .setDepth(4);
    scene.physics.add.existing(visual, true);
    const rect = new Phaser.Geom.Rectangle(spec.x - spec.w / 2, spec.y - spec.h / 2, spec.w, spec.h);
    return { visual, rect };
  });
}

export function createGateWall(scene: Phaser.Scene, layout: BossGateLayout): GateWall {
  const h = layout.world.height;
  const visual = scene.add
    .rectangle(layout.gate.x, h / 2, layout.gate.w, h, Palette.cover, 1)
    .setStrokeStyle(2, Palette.gate, 0.95)
    .setDepth(5);
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
  gate.visual.setAlpha(0.18);
  gate.visual.setStrokeStyle(1, Palette.pointB, 0.55);
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
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0xffffff, 1);
  for (let i = 0; i < 180; i += 1) {
    const x = (i * 97) % layout.world.width;
    const y = (i * 53) % layout.world.height;
    const size = i % 7 === 0 ? 2 : 1;
    g.fillRect(x, y, size, size);
  }

  for (const zone of layout.zones) {
    paintZone(scene, g, zone);
  }

  g.lineStyle(3, Palette.gate, 0.28);
  for (const scar of layout.scars) {
    g.beginPath();
    g.moveTo(scar.x0, scar.y0);
    g.lineTo(scar.x1, scar.y1);
    g.strokePath();
  }

  g.fillStyle(Palette.gate, 0.5);
  for (const segment of layout.segments) {
    if (segment.kind === 'launch' || segment.kind === 'gate') {
      continue;
    }
    g.fillRect(segment.x0 + 8, segment.laneY - 2, Math.max(4, segment.x1 - segment.x0 - 16), 4);
  }

  scene.add
    .text(layout.probe.x, layout.probe.y + 36, 'A', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '14px',
      color: '#8aa0b4',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

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

function paintZone(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, zone: TransitZone): void {
  const cx = zone.x + zone.w / 2;
  if (zone.kind === 'approach') {
    g.fillStyle(Palette.longWay, 0.06);
    g.fillRect(zone.x, zone.y, zone.w, zone.h);
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
  g.fillStyle(Palette.gate, 0.08);
  g.fillRect(zone.x, zone.y, zone.w, zone.h);
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

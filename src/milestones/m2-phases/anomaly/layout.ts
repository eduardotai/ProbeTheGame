import Phaser from 'phaser';
import { Palette } from '../../../game/constants';
import type { DriftCover } from '../../m1-drift';
import { AnomalyInvert } from './tuning';
import type { AnomalyLayout, CoverSpec, TransitZone } from './procSpine';

export type AnomalyCover = DriftCover;

export function createAnomalyCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): AnomalyCover[] {
  return specs.map((spec) => {
    const visual = scene.add
      .rectangle(spec.x, spec.y, spec.w, spec.h, Palette.cover, 1)
      .setStrokeStyle(1, Palette.anomalyDim, 0.9)
      .setDepth(4);
    scene.physics.add.existing(visual, true);
    const rect = new Phaser.Geom.Rectangle(spec.x - spec.w / 2, spec.y - spec.h / 2, spec.w, spec.h);
    return { visual, rect };
  });
}

export function paintAnomalyField(scene: Phaser.Scene, layout: AnomalyLayout): void {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0xffffff, 1);
  for (let i = 0; i < 240; i += 1) {
    const x = (i * 97) % layout.world.width;
    const y = (i * 53) % layout.world.height;
    const size = i % 7 === 0 ? 2 : 1;
    g.fillRect(x, y, size, size);
  }

  g.fillStyle(Palette.anomaly, 0.05);
  for (let x = 0; x < layout.world.width; x += 220) {
    g.fillRect(x, 0, 36, layout.world.height);
  }

  for (const zone of layout.zones) {
    paintZone(scene, g, zone);
  }

  g.fillStyle(Palette.anomaly, 0.45);
  for (const segment of layout.segments) {
    if (segment.kind === 'launch') {
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
    .text(200, 188, `INVERT  ${AnomalyInvert.label}`, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '16px',
      color: '#e07aff',
      backgroundColor: '#05070a',
      padding: { x: 10, y: 6 },
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(200, 228, AnomalyInvert.hint, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '14px',
      color: '#c46cff',
      backgroundColor: '#05070a',
      padding: { x: 10, y: 4 },
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(200, 268, 'A / ←  TOWARD B', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '13px',
      color: '#8aa0b4',
      backgroundColor: '#05070a',
      padding: { x: 10, y: 4 },
    })
    .setOrigin(0.5, 0)
    .setDepth(6);
}

function paintZone(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, zone: TransitZone): void {
  const cx = zone.x + zone.w / 2;
  if (zone.kind === 'launch') {
    g.fillStyle(Palette.anomalyDim, 0.18);
    g.fillRect(zone.x, zone.y, zone.w, zone.h);
    return;
  }
  if (zone.kind === 'approach') {
    g.fillStyle(Palette.anomaly, 0.06);
    g.fillRect(zone.x, zone.y, zone.w, zone.h);
    scene.add
      .text(cx, zone.y + 16, 'APPROACH', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '11px',
        color: '#e07aff',
      })
      .setOrigin(0.5, 0)
      .setDepth(6)
      .setAlpha(0.7);
    return;
  }
  g.fillStyle(Palette.anomaly, 0.07);
  g.fillRect(zone.x, zone.y, zone.w, zone.h);
  scene.add
    .text(cx, zone.y + 16, 'PACK', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '11px',
      color: '#ff6ad5',
    })
    .setOrigin(0.5, 0)
    .setDepth(6)
    .setAlpha(0.55);
}

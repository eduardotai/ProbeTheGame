import Phaser from 'phaser';
import { Palette } from '../../../game/constants';
import { INVERT_BIND_HINT, INVERT_RULE_LABEL } from './invert';
import type { DriftCover } from '../../m1-drift';
import type { AnomalyLayout, CoverSpec, TransitZone } from './procSpine';

export type AnomalyCover = DriftCover;

export function createAnomalyCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): AnomalyCover[] {
  return specs.map((spec) => {
    const visual = scene.add
      .rectangle(spec.x, spec.y, spec.w, spec.h, Palette.cover, 1)
      .setStrokeStyle(1, Palette.anomaly, 0.55)
      .setDepth(4);
    scene.physics.add.existing(visual, true);
    const rect = new Phaser.Geom.Rectangle(spec.x - spec.w / 2, spec.y - spec.h / 2, spec.w, spec.h);
    return { visual, rect };
  });
}

export function paintAnomalyField(scene: Phaser.Scene, layout: AnomalyLayout): void {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0xb8a0ff, 1);
  for (let i = 0; i < 220; i += 1) {
    const x = (i * 97) % layout.world.width;
    const y = (i * 53) % layout.world.height;
    const size = i % 7 === 0 ? 2 : 1;
    g.fillRect(x, y, size, size);
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
    .text(layout.probe.x + 210, 196, INVERT_RULE_LABEL, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '22px',
      color: '#ff6ad5',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(layout.probe.x + 210, 226, INVERT_BIND_HINT, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '16px',
      color: '#c89aff',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);

  scene.add
    .text(layout.probe.x + 210, 254, 'feel it on the runway — then fight through', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '12px',
      color: '#8aa0b4',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);
}

function paintZone(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, zone: TransitZone): void {
  const cx = zone.x + zone.w / 2;
  if (zone.kind === 'breathe') {
    g.fillStyle(Palette.pocket, 0.9);
    g.fillRect(zone.x, zone.y, zone.w, zone.h);
    g.lineStyle(1, Palette.anomaly, 0.45);
    g.strokeRect(zone.x, zone.y, zone.w, zone.h);
    scene.add
      .text(cx, zone.y + zone.h / 2, 'BREATHE', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#c89aff',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0.8);
    return;
  }
  if (zone.kind === 'weave') {
    g.fillStyle(Palette.anomaly, 0.06);
    g.fillRect(zone.x, zone.y, zone.w, zone.h);
    scene.add
      .text(cx, zone.y + 16, 'WEAVE', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '11px',
        color: '#b07cff',
      })
      .setOrigin(0.5, 0)
      .setDepth(6)
      .setAlpha(0.6);
    return;
  }
  g.fillStyle(Palette.invert, 0.07);
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

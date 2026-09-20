import Phaser from 'phaser';
import { Palette } from '../../../game/constants';
import type { DriftCover } from '../../m1-drift';
import type { CoverSpec, SwarmLayout, TransitZone } from './procSpine';

export type SwarmCover = DriftCover;

export function createSwarmCovers(scene: Phaser.Scene, specs: readonly CoverSpec[]): SwarmCover[] {
  return specs.map((spec) => {
    const visual = scene.add
      .rectangle(spec.x, spec.y, spec.w, spec.h, Palette.cover, 1)
      .setStrokeStyle(1, Palette.coverEdge, 0.92)
      .setDepth(4);
    scene.physics.add.existing(visual, true);
    const rect = new Phaser.Geom.Rectangle(spec.x - spec.w / 2, spec.y - spec.h / 2, spec.w, spec.h);
    return { visual, rect };
  });
}

export function paintSwarmField(scene: Phaser.Scene, layout: SwarmLayout): void {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(0xffffff, 1);
  for (let i = 0; i < 220; i += 1) {
    const x = (i * 97) % layout.world.width;
    const y = (i * 53) % layout.world.height;
    const size = i % 7 === 0 ? 2 : 1;
    g.fillRect(x, y, size, size);
  }

  for (const zone of layout.zones) {
    paintZone(scene, g, zone);
  }

  g.fillStyle(Palette.pointB, 0.55);
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
}

function paintZone(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, zone: TransitZone): void {
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + zone.h / 2;
  if (zone.kind === 'clear') {
    g.fillStyle(Palette.pocket, 0.9);
    g.fillRect(zone.x, zone.y, zone.w, zone.h);
    g.lineStyle(1, Palette.swarmling, 0.45);
    g.strokeRect(zone.x, zone.y, zone.w, zone.h);
    scene.add
      .text(cx, cy, 'CLEAR', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        color: '#ffc14a',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0.8);
    return;
  }
  g.fillStyle(Palette.shortcut, 0.07);
  g.fillRect(zone.x, zone.y, zone.w, zone.h);
  scene.add
    .text(cx, zone.y + 16, 'PUSH', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '11px',
      color: '#ff8a5a',
    })
    .setOrigin(0.5, 0)
    .setDepth(6)
    .setAlpha(0.55);
}

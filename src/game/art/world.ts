import Phaser from 'phaser';
import { TextureKey } from '../constants';

export type CoverSpec = { x: number; y: number; w: number; h: number };

export type PixelCover = {
  visual: Phaser.GameObjects.TileSprite;
  rect: Phaser.Geom.Rectangle;
};

export type CoverStyle = 'steel' | 'debris' | 'anomaly' | 'gate';

const COVER_TEXTURE: Record<CoverStyle, string> = {
  steel: TextureKey.Cover,
  debris: TextureKey.CoverDebris,
  anomaly: TextureKey.CoverAnomaly,
  gate: TextureKey.CoverGate,
};

export function createTiledCover(scene: Phaser.Scene, spec: CoverSpec, style: CoverStyle = 'steel'): PixelCover {
  const visual = scene.add.tileSprite(spec.x, spec.y, spec.w, spec.h, COVER_TEXTURE[style]).setDepth(4);
  scene.physics.add.existing(visual, true);
  const rect = new Phaser.Geom.Rectangle(spec.x - spec.w / 2, spec.y - spec.h / 2, spec.w, spec.h);
  return { visual, rect };
}

export function createTiledCovers(
  scene: Phaser.Scene,
  specs: readonly CoverSpec[],
  style: CoverStyle = 'steel',
): PixelCover[] {
  return specs.map((spec) => createTiledCover(scene, spec, style));
}

export function paintStarfield(
  scene: Phaser.Scene,
  width: number,
  height: number,
  accent = 0xffffff,
  count = 80,
): void {
  const g = scene.add.graphics().setDepth(0);
  for (let i = 0; i < count; i += 1) {
    const x = (i * 97) % width;
    const y = (i * 53) % height;
    const size = i % 7 === 0 ? 2 : 1;
    const color = i % 11 === 0 ? accent : 0xffffff;
    g.fillStyle(color, i % 5 === 0 ? 0.55 : 1);
    g.fillRect(x, y, size, size);
  }
}

export function paintTiledFloor(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  texture: string,
  depth = 1,
  alpha = 1,
): Phaser.GameObjects.TileSprite {
  return scene.add
    .tileSprite(x + w / 2, y + h / 2, w, h, texture)
    .setDepth(depth)
    .setAlpha(alpha);
}

export function paintLane(
  scene: Phaser.Scene,
  x0: number,
  x1: number,
  laneY: number,
  texture: string,
): void {
  const w = Math.max(4, x1 - x0 - 16);
  scene.add.tileSprite(x0 + 8 + w / 2, laneY, w, 4, texture).setDepth(1).setAlpha(0.7);
}

export function placePointA(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.image(x, y, TextureKey.PointA).setDepth(5).setAlpha(0.92);
  scene.add
    .text(x, y + 36, 'A', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '14px',
      color: '#8aa0b4',
    })
    .setOrigin(0.5, 0)
    .setDepth(6);
}

export function paintPixelRing(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  color: number,
  alpha: number,
  fill = false,
): void {
  if (fill) {
    g.fillStyle(color, alpha);
    for (let y = -radius; y <= radius; y += 2) {
      const span = Math.floor(Math.sqrt(radius * radius - y * y));
      g.fillRect(cx - span, cy + y, span * 2 + 1, 2);
    }
    return;
  }
  g.fillStyle(color, alpha);
  let x = radius;
  let y = 0;
  let err = 1 - x;
  while (x >= y) {
    plotRing(g, cx, cy, x, y);
    y += 1;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      x -= 1;
      err += 2 * (y - x) + 1;
    }
  }
}

function plotRing(g: Phaser.GameObjects.Graphics, cx: number, cy: number, x: number, y: number): void {
  g.fillRect(cx + x, cy + y, 2, 2);
  g.fillRect(cx - x, cy + y, 2, 2);
  g.fillRect(cx + x, cy - y, 2, 2);
  g.fillRect(cx - x, cy - y, 2, 2);
  g.fillRect(cx + y, cy + x, 2, 2);
  g.fillRect(cx - y, cy + x, 2, 2);
  g.fillRect(cx + y, cy - x, 2, 2);
  g.fillRect(cx - y, cy - x, 2, 2);
}

export function paintPixelLine(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const dy = Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx - dy;
  let step = 0;
  while (true) {
    if (step % 3 !== 2) {
      g.fillRect(x, y, 2, 2);
    }
    if (x === tx && y === ty) {
      break;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    step += 1;
  }
}

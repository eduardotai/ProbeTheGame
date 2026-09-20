import Phaser from 'phaser';

/** Canvas-drawn nearest-neighbor sprites. One art pixel becomes `scale` texels. */
export type PixelPalette = Record<string, number>;

export function bakePixelSprite(
  scene: Phaser.Scene,
  key: string,
  rows: readonly string[],
  palette: PixelPalette,
  scale = 2,
): void {
  const first = rows[0];
  if (!first) {
    throw new Error(`Pixel sprite "${key}" has no rows.`);
  }
  const gridW = first.length;
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    if (!row || row.length !== gridW) {
      throw new Error(`Pixel sprite "${key}" row ${y} width ${row?.length ?? 0} != ${gridW}.`);
    }
  }

  const width = gridW * scale;
  const height = rows.length * scale;
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    throw new Error(`Failed to create canvas texture "${key}".`);
  }
  const ctx = texture.getContext();
  const image = ctx.createImageData(width, height);
  const data = image.data;

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    if (!row) {
      continue;
    }
    for (let x = 0; x < gridW; x += 1) {
      const ch = row[x];
      if (!ch || ch === '.' || ch === ' ') {
        continue;
      }
      const color = palette[ch];
      if (color === undefined) {
        throw new Error(`Pixel sprite "${key}" unknown color "${ch}" at ${x},${y}.`);
      }
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const i = ((y * scale + sy) * width + (x * scale + sx)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0);
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

import Phaser from 'phaser';
import { World } from '../../../game/constants';
import { DebrisTuning } from './tuning';

export type Vec2 = { x: number; y: number };

type Cell = { c: number; r: number };

/**
 * Grid A* around hard debris so hunters funnel gaps instead of sliding into slabs.
 */
export class NavGrid {
  readonly cell: number;
  readonly cols: number;
  readonly rows: number;
  private readonly blocked: Uint8Array;

  constructor(
    occluders: readonly Phaser.Geom.Rectangle[],
    cell = DebrisTuning.navCell,
    inflate = DebrisTuning.navInflate,
  ) {
    this.cell = cell;
    this.cols = Math.ceil(World.width / cell);
    this.rows = Math.ceil(World.height / cell);
    this.blocked = new Uint8Array(this.cols * this.rows);

    const inflated = occluders.map(
      (box) =>
        new Phaser.Geom.Rectangle(box.x - inflate, box.y - inflate, box.width + inflate * 2, box.height + inflate * 2),
    );

    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const rect = new Phaser.Geom.Rectangle(c * cell, r * cell, cell, cell);
        const i = this.index(c, r);
        if (i < 0) {
          continue;
        }
        for (const box of inflated) {
          if (Phaser.Geom.Intersects.RectangleToRectangle(rect, box)) {
            this.blocked[i] = 1;
            break;
          }
        }
      }
    }
  }

  findPath(from: Vec2, to: Vec2): Vec2[] {
    const start = this.snapOpen(from);
    const goal = this.snapOpen(to);
    if (!start || !goal) {
      return [];
    }
    if (start.c === goal.c && start.r === goal.r) {
      return [this.cellCenter(goal.c, goal.r)];
    }

    const startI = this.index(start.c, start.r);
    const goalI = this.index(goal.c, goal.r);
    if (startI < 0 || goalI < 0) {
      return [];
    }

    const size = this.cols * this.rows;
    const bestG = new Float64Array(size);
    bestG.fill(Number.POSITIVE_INFINITY);
    const came = new Int32Array(size);
    came.fill(-1);
    const closed = new Uint8Array(size);
    const openC: number[] = [start.c];
    const openR: number[] = [start.r];
    const openG: number[] = [0];
    const openF: number[] = [heuristic(start.c, start.r, goal.c, goal.r)];
    bestG[startI] = 0;

    const dirs: ReadonlyArray<readonly [number, number, number]> = [
      [1, 0, 1],
      [-1, 0, 1],
      [0, 1, 1],
      [0, -1, 1],
      [1, 1, Math.SQRT2],
      [1, -1, Math.SQRT2],
      [-1, 1, Math.SQRT2],
      [-1, -1, Math.SQRT2],
    ];

    while (openC.length > 0) {
      let best = 0;
      for (let i = 1; i < openF.length; i += 1) {
        const fi = openF[i];
        const fb = openF[best];
        if (fi !== undefined && fb !== undefined && fi < fb) {
          best = i;
        }
      }

      const c = openC[best];
      const r = openR[best];
      const g = openG[best];
      if (c === undefined || r === undefined || g === undefined) {
        break;
      }
      openC.splice(best, 1);
      openR.splice(best, 1);
      openG.splice(best, 1);
      openF.splice(best, 1);

      const ci = this.index(c, r);
      if (ci < 0 || closed[ci]) {
        continue;
      }
      closed[ci] = 1;

      if (c === goal.c && r === goal.r) {
        return this.reconstruct(came, c, r);
      }

      for (const [dc, dr, cost] of dirs) {
        const nc = c + dc;
        const nr = r + dr;
        if (!this.inBounds(nc, nr) || this.isBlocked(nc, nr)) {
          continue;
        }
        if (dc !== 0 && dr !== 0) {
          if (this.isBlocked(c + dc, r) || this.isBlocked(c, r + dr)) {
            continue;
          }
        }
        const ni = this.index(nc, nr);
        if (ni < 0 || closed[ni]) {
          continue;
        }
        const nextG = g + cost;
        const known = bestG[ni];
        if (known !== undefined && nextG >= known) {
          continue;
        }
        bestG[ni] = nextG;
        came[ni] = ci;
        openC.push(nc);
        openR.push(nr);
        openG.push(nextG);
        openF.push(nextG + heuristic(nc, nr, goal.c, goal.r));
      }
    }

    return [];
  }

  private reconstruct(came: Int32Array, c: number, r: number): Vec2[] {
    const cells: Cell[] = [{ c, r }];
    let i = this.index(c, r);
    let guard = 0;
    while (i >= 0 && guard < this.cols * this.rows) {
      const prev = came[i];
      if (prev === undefined || prev < 0) {
        break;
      }
      const pc = prev % this.cols;
      const pr = Math.floor(prev / this.cols);
      cells.push({ c: pc, r: pr });
      i = prev;
      guard += 1;
    }
    cells.reverse();
    return cells.map((cell) => this.cellCenter(cell.c, cell.r));
  }

  private snapOpen(point: Vec2): Cell | null {
    const seed = this.worldToCell(point.x, point.y);
    if (!this.isBlocked(seed.c, seed.r)) {
      return seed;
    }

    const queue: Cell[] = [seed];
    const seen = new Uint8Array(this.cols * this.rows);
    const startI = this.index(seed.c, seed.r);
    if (startI >= 0) {
      seen[startI] = 1;
    }

    const dirs: ReadonlyArray<readonly [number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];

    while (queue.length > 0) {
      const cur = queue.shift();
      if (!cur) {
        break;
      }
      for (const [dc, dr] of dirs) {
        const nc = cur.c + dc;
        const nr = cur.r + dr;
        if (!this.inBounds(nc, nr)) {
          continue;
        }
        const ni = this.index(nc, nr);
        if (ni < 0 || seen[ni]) {
          continue;
        }
        seen[ni] = 1;
        if (!this.isBlocked(nc, nr)) {
          return { c: nc, r: nr };
        }
        queue.push({ c: nc, r: nr });
      }
    }
    return null;
  }

  private worldToCell(x: number, y: number): Cell {
    const c = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cell)));
    const r = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cell)));
    return { c, r };
  }

  private cellCenter(c: number, r: number): Vec2 {
    return { x: c * this.cell + this.cell / 2, y: r * this.cell + this.cell / 2 };
  }

  private inBounds(c: number, r: number): boolean {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
  }

  private isBlocked(c: number, r: number): boolean {
    if (!this.inBounds(c, r)) {
      return true;
    }
    return this.blocked[this.index(c, r)] === 1;
  }

  private index(c: number, r: number): number {
    return r * this.cols + c;
  }
}

function heuristic(c: number, r: number, gc: number, gr: number): number {
  return Math.hypot(c - gc, r - gr);
}

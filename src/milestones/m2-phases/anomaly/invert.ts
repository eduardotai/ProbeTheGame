import type { MoveVector } from '../../../game/input/KeyboardController';
import { AnomalyInvert } from './tuning';

/**
 * GDD §4.5 invert — WASD / arrow axes flip for Anomaly only.
 * Other phases keep KeyboardController as-is.
 */
export function invertMove(move: MoveVector): MoveVector {
  if (move.x === 0 && move.y === 0) {
    return move;
  }
  return { x: -move.x, y: -move.y };
}

/** Readable tell for HUD / invert-active stills. Raw (pre-invert) thrust. */
export function invertInputCaption(raw: MoveVector): string | null {
  if (raw.x === 0 && raw.y === 0) {
    return null;
  }
  const parts: string[] = [];
  if (raw.x > 0.2) {
    parts.push('D/→ WEST');
  }
  if (raw.x < -0.2) {
    parts.push('A/← EAST');
  }
  if (raw.y < -0.2) {
    parts.push('W/↑ SOUTH');
  }
  if (raw.y > 0.2) {
    parts.push('S/↓ NORTH');
  }
  return parts.length > 0 ? parts.join('  ') : AnomalyInvert.hint;
}

export { AnomalyInvert };

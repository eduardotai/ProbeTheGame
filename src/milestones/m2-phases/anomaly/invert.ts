import type { MoveVector } from '../../../game/input/KeyboardController';

/**
 * GDD §4.5 — pick one invert and implement it well.
 * Lock: **controls mirrored**. Skill-readable: every WASD/arrow press is a
 * Hades/Dead Cells check. Silence-attracts was the other candidate; it reads
 * more like a gimmick after Swarm's heat/ammo loop and can collapse into
 * "hold Space," which fights Eduardo's no-auto-aim north star.
 */
export const INVERT_RULE_ID = 'controls-mirrored' as const;
export const INVERT_RULE_LABEL = 'CONTROLS MIRRORED';
export const INVERT_BIND_HINT = 'W↓  S↑  A→  D←';
export const INVERT_HUD_LINE = `INVERT  ${INVERT_RULE_LABEL}  ·  ${INVERT_BIND_HINT}`;

/** Negate thrust. Facing and dodge follow this vector in Anomaly only. */
export function invertMove(move: MoveVector): MoveVector {
  if (move.x === 0 && move.y === 0) {
    return move;
  }
  return { x: -move.x, y: -move.y };
}

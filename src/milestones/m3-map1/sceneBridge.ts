import Phaser from 'phaser';
import { FuelTank, Hull } from '../m1-drift';
import { getPhase, type PhaseId } from '../m2-phases';
import { SwarmWeapon } from '../m2-phases/swarm/weapon';
import { describeCarry, MAP1_CARRY, type ProbeLoadout } from './carry';
import {
  commitPhaseResources,
  isChainMode,
  markMapCleared,
  peekRun,
  phaseIndex,
  refillAndAdvance,
  sceneKeyForPhase,
  takePhaseLoadout,
} from './runSession';
import { onHullDepleted } from './permadeath';

export const TRANSIT_MS = 720;

export type PhaseEquipment = {
  hull: Hull;
  fuel: FuelTank;
  weapon: SwarmWeapon;
};

export type EndCard = {
  banner: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
};

export function createPhaseEquipment(phaseId: PhaseId): PhaseEquipment {
  const loadout = takePhaseLoadout(phaseId);
  return {
    hull: new Hull(loadout.hullMax, loadout.hull),
    fuel: new FuelTank(loadout.fuelCapacity, loadout.fuel),
    weapon: new SwarmWeapon(loadout.ammo),
  };
}

export function formatPhaseHudLine(phaseId: PhaseId, standaloneTitle: string, extra = ''): string {
  const suffix = extra;
  if (!isChainMode()) {
    return `${standaloneTitle}${suffix}`;
  }
  const title = getPhase(phaseId).title.toUpperCase();
  return `MAP 1  ·  ${phaseIndex(phaseId)}/6  ${title}${suffix}`;
}

export function playAgainHint(): string {
  return isChainMode()
    ? 'Press R — launch next probe at Drift'
    : 'Press R — launch next probe';
}

export function resolvePhaseClear(
  scene: Phaser.Scene,
  phaseId: PhaseId,
  resources: { hull: Hull; fuel: FuelTank; weapon?: SwarmWeapon },
  card: EndCard,
): void {
  if (!isChainMode()) {
    showRecovered(card, 'POINT B — PROBE RECOVERED', playAgainHint());
    return;
  }

  commitPhaseResources(resources);
  const before: ProbeLoadout | null = peekRun() ? { ...peekRun()!.loadout } : null;
  const next = refillAndAdvance(phaseId);

  if (!next) {
    markMapCleared();
    showRecovered(card, 'MAP 1 — PROBE RECOVERED', playAgainHint());
    return;
  }

  const after = peekRun()?.loadout;
  const carryLine = before && after ? describeCarry(before, after) : MAP1_CARRY.id;
  const nextTitle = getPhase(next).title.toUpperCase();
  showRecovered(card, `TRANSIT — ${nextTitle}`, carryLine);
  scene.time.delayedCall(TRANSIT_MS, () => {
    scene.scene.start(sceneKeyForPhase(next));
  });
}

export function resolvePhaseLost(card: EndCard): void {
  onHullDepleted();
  card.banner.setColor('#ff6b6b');
  card.banner.setText('HULL 0 — PROBE LOST');
  card.banner.setVisible(true);
  card.hint.setText(playAgainHint());
  card.hint.setVisible(true);
}

export function exposeMap1Window(phaseId: PhaseId): void {
  (window as Window).__bootPhase = phaseId;
  (window as Window).__map1 = {
    mode: isChainMode() ? 'chain' : 'standalone',
    phase: phaseId,
    carry: MAP1_CARRY.id,
    snapshot: () => ({
      mode: isChainMode() ? 'chain' : 'standalone',
      phase: peekRun()?.phase ?? phaseId,
      status: peekRun()?.status ?? 'idle',
      loadout: peekRun() ? { ...peekRun()!.loadout } : takePhaseLoadout(phaseId),
      carry: MAP1_CARRY.id,
    }),
  };
}

export function resetViewportCamera(scene: Phaser.Scene, width: number, height: number): void {
  const cam = scene.cameras.main;
  cam.stopFollow();
  cam.setDeadzone(0, 0);
  cam.setBounds(0, 0, width, height);
  cam.setScroll(0, 0);
}

function showRecovered(card: EndCard, title: string, hint: string): void {
  card.banner.setColor('#5ee0ff');
  card.banner.setText(title);
  card.banner.setVisible(true);
  card.hint.setText(hint);
  card.hint.setVisible(true);
}

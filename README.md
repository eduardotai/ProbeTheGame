# ProbeTheGame

Sci-fi roguelike set in **Thursday Arena** (Grokbot Galaxy). You are not a hero — you are a **probe**. Each run is one expendable unmanned craft trying to cross Point A to Point B while hunters close in.

> You are not a hero. You are a probe. You do not return.

**Current playable gate: Milestone 1 — Drift.** Phaser 3 + TypeScript + Vite. Greybox silhouettes. Keyboard-only.

Design source of truth (do not contradict):

- [`docs/desktop/GDD-probe-thursday-arena.md`](docs/desktop/GDD-probe-thursday-arena.md)
- [`docs/desktop/PRD-probe-thursday-arena.md`](docs/desktop/PRD-probe-thursday-arena.md)

Working title is still open (GDD Q1). Not TTBR. Not RunDB. No production deploy from this repo.

## How to run

Needs Node 20+.

```bash
npm install
npm run dev
```

Open the Vite URL (default `http://localhost:5173`). Boot → Preload → **Drift**.

```bash
npm run build    # tsc --noEmit && vite build
npm run preview  # serve the production bundle
```

## How to play (M1 Drift)

Launch at **A** (left). Cross open space to **B** (right). Hunters chase when they have **line of sight**. A few hard covers break vision. Dodging costs **fuel** and makes noise (nearby hunters get a last-seen ping even through cover). Contact chips **hull**. Hull 0 ends the probe. Reaching B recovers it.

| Action | Keys |
|--------|------|
| Move (facing follows thrust) | `WASD` or arrow keys |
| Dodge (fuel + noise, brief i-frames) | `Shift` |
| Next probe (after win or death, or mid-run) | `R` (or click the end card) |

No mouse aiming. Fire is not bound yet (out of scope for M1).

## Milestone map

Gated by the PRD. **Do not start the next milestone until the previous gate is playable.**

```
M1 Drift (validation gate)  ← current
  src/milestones/m1-drift/
    probe.ts          avatar
    movement.ts       inertia + keyboard facing + dodge
    fuel.ts           dodge spend + slow regen
    hull.ts           contact HP; 0 = run over
    hunterLos.ts      LOS chase + dodge-noise last-seen
    cover.ts          few hard covers (vision occluders)
    pointB.ts         Point B overlap = recovered
      → playable Drift: probe, LOS hunt, fuel dodges, reach B or die

M2 Phases 2–6 (one at a time, each standalone-bootable)
  src/milestones/m2-phases/
    phaseRegistry.ts  Map 1 order + registry
    debrisField.ts    cover / funnel gaps
    gravityWell.ts    pull + shortcut vs long way
    swarm.ts          Swarmlings / ammo-heat
    anomaly.ts        one invert-rules phase per run
    bossGate.ts       Bulwark guard; default destroy to open B

M3 Full Map 1 loop
  src/milestones/m3-map1/
    chain.ts          A→B sequential transit
    permadeath.ts     hull 0 ends the run; no revive
    restart.ts        next probe = Play Again, no meta
```

MVP **does not** include narrative logs, meta-upgrades at B, Map 2+, music beds, or art polish beyond readable silhouettes.

## Stack

- Phaser 3 (HTML5 canvas, not Phaser 4)
- TypeScript
- Vite

Clean start: no prior ship-game HTML was copied into this tree.

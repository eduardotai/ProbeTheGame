# ProbeTheGame

Sci-fi roguelike set in **Thursday Arena** (Grokbot Galaxy). You are not a hero — you are a **probe**. Each run is one expendable unmanned craft trying to cross Point A to Point B while hunters close in.

> You are not a hero. You are a probe. You do not return.

This repo is a **Phaser 3 + TypeScript + Vite** scaffold. Gameplay beyond placeholders is out of scope for this commit.

Design source of truth (do not contradict):

- [`docs/desktop/GDD-probe-thursday-arena.md`](docs/desktop/GDD-probe-thursday-arena.md)
- [`docs/desktop/PRD-probe-thursday-arena.md`](docs/desktop/PRD-probe-thursday-arena.md)

Working title is still open (GDD Q1). Not TTBR. Not RunDB. No production deploy from this scaffold.

## How to run

Needs Node 20+.

```bash
npm install
npm run dev
```

Open the Vite URL (default `http://localhost:5173`). Boot → Preload → `TestScene`: a greybox probe on a black field.

```bash
npm run build    # tsc --noEmit && vite build
npm run preview  # serve the production bundle
```

## Keyboard only

MVP input is **keyboard-only**. **No mouse aiming** (PRD §3.1). Pointer is unused for facing, fire, and dodge. Exact binds are still TBD; the test shell uses this provisional map:

| Action | Keys |
|--------|------|
| Move (facing follows thrust) | `WASD` or arrow keys |
| Dodge (consumes fuel stub) | `Shift` |
| Next probe (restart stub) | `R` |

Fire is not bound yet. Do not add pointer-aim later without an explicit control-lock change.

## Milestone map

Gated by the PRD. **Do not start the next milestone until the previous gate is playable.**

```
M1 Drift (validation gate)
  src/milestones/m1-drift/
    probe.ts          probe avatar stub
    movement.ts       inertia + keyboard facing
    fuel.ts           dodge spend
    hunterLos.ts      one LOS hunter placeholder
    pointB.ts         Point B overlap trigger
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

Current shell boots `TestScene` and wires M1 movement stubs only. M2/M3 files are empty modules with TODOs.

MVP **does not** include narrative logs, meta-upgrades at B, Map 2+, music beds, or art polish beyond readable silhouettes.

## Stack

- Phaser 3 (HTML5 canvas, not Phaser 4)
- TypeScript
- Vite

Clean start: no prior ship-game HTML was copied into this tree.

# ProbeTheGame

Sci-fi roguelike set in **Thursday Arena** (Grokbot Galaxy). You are not a hero — you are a **probe**. Each run is one expendable unmanned craft trying to cross Point A to Point B while hunters close in.

> You are not a hero. You are a probe. You do not return.

**Current playable gate: Milestone 2.3 — Swarm** (M1 Drift still boots by default). Phaser 3 + TypeScript + Vite. Greybox silhouettes. Keyboard-only.

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

Open the Vite URL (default `http://localhost:5173`). Boot → Preload → **Drift** (default).

```bash
npm run build    # tsc --noEmit && vite build
npm run preview  # serve the production bundle
```

### Standalone phase boot (PRD §6)

| Phase | URL |
|-------|-----|
| Drift (default) | `/` or `?phase=drift` |
| Debris Field | `?phase=debris` or `?phase=debris-field` |
| Gravity Well | `?phase=gravity` or `?phase=gravity-well` |
| Swarm | `?phase=swarm` (optional `&seed=12345` locks the spine) |

Other Map 1 ids resolve in the phase registry but are still stubs (they fall back to Drift).

## How to play

Keyboard only. No mouse aiming. End-card **click** is OK for next probe.

| Action | Keys |
|--------|------|
| Move (facing follows thrust) | `WASD` or arrow keys |
| Dodge (fuel + noise, brief i-frames) | `Shift` |
| Fire (primary; facing from thrust, not pointer) | `Space` |
| Next probe (after win or death, or mid-run) | `R` (or click the end card) |

`KeyboardController` exposes `consumeFirePressed()` (tap) and `isFireDown()` (hold). Swarm uses both so a tap still shoots and a hold sprays until heat/ammo gates it.

### M1 Drift

Launch at **A** (left). Cross open space to **B** (right). Hunters chase when they have **line of sight**. A few hard covers break vision. Dodging costs **fuel** and makes noise. Contact chips **hull**. Hull 0 ends the probe. Reaching B recovers it. Fire is bound globally but this phase has nothing to shoot.

### M2.1 Debris Field

Cover slabs block vision **both ways** (hunters behind debris are hidden; they cannot see you through slabs either). Hunters **funnel the gaps** instead of walking through rock. Two L-shaped **safe pockets** (northwest / southwest) hide you but **pause fuel regen** and burn the clock. The straight line to B is the trap — an **Ambusher** lunges when you commit to the last corridor. Reach B or die; **R** relaunches this phase (standalone).

### M2.2 Gravity Well

A center mass pulls **always**. The **shortcut** is the A→B line that cuts north of the well: shorter, stronger pull, denser threats (two hunters + a Gravity Bulwark that anchors near the well). The **long way** loops the north rim: weaker pull, one hunter, slower. Fall inside the horizon and hull hits 0. Reach B or die; **R** relaunches this phase (standalone).

### M2.3 Swarm

A **long horizontal transit** (world ~4600px, camera follows the probe). Seeded procedural spine: same `seed` → same covers, pockets, and Swarmling homes. HUD and the console show the seed. Point B is far east — this is still a finite hunted A→B, not an endless arena.

Dozens of small **Swarmlings** pressure the whole run (denser near B). They **flash and lunge** after a short tell — dodge through the commit, do not auto-aim popcorn. **Heat** and **ammo** gate spray (short bursts only). Named variant: a **Splitter** dies into two smaller Swarmlings (no further split).

Choice: **CLEAR** a pocket (spend ammo/heat, quieter lane) vs **PUSH** through contact damage toward B. Reach B or die; **R** relaunches Swarm (same seed for this page load unless you passed `?seed=`).

## Milestone map

Gated by the PRD. **Do not start the next milestone until the previous gate is playable.**

```
M1 Drift (validation gate)  ← done
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
    debris-field/     M2.1 playable — cover / funnel gaps / pockets
    debrisField.ts    registry entry (sceneKey DebrisField)
    gravity-well/     M2.2 playable — center pull / shortcut vs long way
    gravityWell.ts    registry entry (sceneKey GravityWell)
    swarm/            M2.3 playable — long A→B spine / Swarmlings / heat+ammo
    swarm.ts          registry entry (sceneKey Swarm)
    anomaly.ts        stub — one invert-rules phase per run
    bossGate.ts       stub — Bulwark guard; default destroy to open B
  src/game/proc/      shared seeded RNG + transit camera (Swarm uses it now)

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

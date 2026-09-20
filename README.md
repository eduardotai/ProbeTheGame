# ProbeTheGame

Sci-fi roguelike set in **Thursday Arena** (Grokbot Galaxy). You are not a hero — you are a **probe**. Each run is one expendable unmanned craft trying to cross Point A to Point B while hunters close in.

> You are not a hero. You are a probe. You do not return.

**Current playable gate: Milestone 2.5 — Boss Gate** (M1 Drift still boots by default). Phaser 3 + TypeScript + Vite. Greybox silhouettes. Keyboard-only.

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
| Anomaly | `?phase=anomaly` (optional `&seed=12345` locks the spine) |
| Boss Gate | `?phase=boss` or `?phase=boss-gate` (optional `&seed=12345` locks the approach) |

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

### M2.4 Anomaly

Exactly one Anomaly per Map 1 run later (after Swarm, before Boss Gate). This milestone ships it **standalone**.

**Invert lock (this phase only): controls mirrored.** WASD and arrows reverse on both axes (`W` is down, `S` is up, `A` is right, `D` is left). Facing, dodge, and Space fire follow the inverted thrust — not the pointer. The HUD chip and the launch runway both spell it: `INVERT  CONTROLS MIRRORED  ·  W↓  S↑  A→  D←`.

Why this invert (not silence-attracts): it is the more skill-readable Hades/Dead Cells check on precise WASD. Silence-attracts after Swarm's heat/ammo loop can collapse into holding Space, which fights the no-auto-aim north star.

Long seeded A→B (~4400px, camera follows). Same `seed` → same covers and Echo homes. Quiet runway so you feel the invert before contact; then weave / pack / breathe toward B. Named variant: **Echo** (inverted Swarm tell — dims and shrinks, then lunges). One **Echo Prime** on the approach. Heat + ammo still gate spray. Reach B or die; **R** relaunches Anomaly.

No music bed (MVP).

### M2.5 Boss Gate

Standalone final Map 1 phase. Finite A→B approach (~3200px, camera follows) into a **sealed gate**. Shorter than Swarm/Anomaly, not a 10-second dash.

Heavy **Gate Bulwark** (named variant) holds Point B. Default win: **destroy the guard to open B** (GDD §4.6 / Q6 — no Sensors/Utility bypass). You still have to fly to B after the gate opens.

Skill test of prior verbs: WASD, fuel **Shift** dodge, **Space** fire (heat + ammo still gate spray). The Bulwark **telegraphs** then commits:

- **CHARGE TELL** — red lane + frontal plate (bolts into the face are absorbed; flank or wait for recover)
- **SWEEP TELL** — orange cone, then a fan of slow ward bolts to weave
- **SLAM TELL** (enraged, half HP) — ring shockwave; dodge through the band

Punishable mistakes: eating a charge, standing in the slam ring, dumping ammo into the plate. Reach B or die; **R** relaunches Boss Gate.

No music bed (MVP).

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
    anomaly/          M2.4 playable — mirrored controls / Echo dim-tell / long spine
    anomaly.ts        registry entry (sceneKey Anomaly)
    boss-gate/        M2.5 playable — Gate Bulwark / destroy to open B / tells
    bossGate.ts       registry entry (sceneKey BossGate)
  src/game/proc/      shared seeded RNG + transit camera (Swarm / Anomaly / Boss Gate)

M3 Full Map 1 loop
  src/milestones/m3-map1/
    chain.ts          A→B sequential transit
    permadeath.ts     hull 0 ends the run; no revive
    restart.ts        next probe = Play Again, no meta
```

MVP **does not** include narrative logs, meta-upgrades at B, Map 2+, music beds, or art polish beyond readable silhouettes.

## Map 1 chain TODOs (M3 — after M2.5)

Boss Gate is standalone-playable. Do not start the full Map 1 chain until this gate is mergeable.

- Sequential transit: Drift → Debris → Gravity → Swarm → Anomaly → Boss Gate for one run.
- Carry hull / fuel / ammo across phases (or reset per phase — lock at M3).
- Permadeath: hull 0 ends the **run**, not only the current standalone scene.
- Restart: R / Play Again launches a **new probe at Drift**, no meta (GDD MVP).
- Point B of phase N starts phase N+1; Boss Gate B is Map 1 recovered.
- Keep standalone `?phase=` boots for debug.
- Do not invent Boss Gate bypass; chaining must still destroy the guard to open B.

## Stack

- Phaser 3 (HTML5 canvas, not Phaser 4)
- TypeScript
- Vite

Clean start: no prior ship-game HTML was copied into this tree.

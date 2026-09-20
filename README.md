# ProbeTheGame

Sci-fi roguelike set in **Thursday Arena** (Grokbot Galaxy). You are not a hero — you are a **probe**. Each run is one expendable unmanned craft trying to cross Point A to Point B while hunters close in.

> You are not a hero. You are a probe. You do not return.

**Current playable gate: Milestone 3 — Full Map 1 chain.** Phaser 3 + TypeScript + Vite. Pixel-art silhouettes (canvas atlas, nearest-neighbor). Keyboard-only.

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

Open the Vite URL (default `http://localhost:5173`). Boot → Preload → **Map 1 chain** (default), starting at Drift.

```bash
npm run build    # tsc --noEmit && vite build
npm run preview  # serve the production bundle
```

### Map 1 chain (PRD §7) — default

One probe, six phases, same run:

**Drift → Debris Field → Gravity Well → Swarm → Anomaly → Boss Gate**

| Boot | URL |
|------|-----|
| Map 1 chain (default) | `/` |
| Map 1 chain (explicit) | `?run=map1` |

Reaching **B** in phase N starts phase N+1 (brief `TRANSIT` beat, then the next scene). Boss Gate B is **MAP 1 — PROBE RECOVERED** (no meta spend screen). Hull 0 is **permadeath**: the entire run ends. **R** / Play Again launches a **new probe at Drift**.

Optional `&seed=12345` locks the seeded spines (Drift / Debris / Gravity / Swarm / Anomaly / Boss Gate) for the page.

### Standalone phase boot (PRD §6)

`?phase=` always wins over the chain. Use this to test or debug a single phase. **R** relaunches that phase, not Drift.

| Phase | URL |
|-------|-----|
| Drift | `?phase=drift` (optional `&seed=12345`) |
| Debris Field | `?phase=debris` or `?phase=debris-field` (optional `&seed=12345`) |
| Gravity Well | `?phase=gravity` or `?phase=gravity-well` (optional `&seed=12345`) |
| Swarm | `?phase=swarm` (optional `&seed=12345`) |
| Anomaly | `?phase=anomaly` (optional `&seed=12345`) |
| Boss Gate | `?phase=boss` or `?phase=boss-gate` (optional `&seed=12345`) |

## Between-phase carry (locked: partial refill)

Skill still matters; the six-phase chain stays playable. Implemented in `src/milestones/m3-map1/carry.ts` (`MAP1_CARRY.id = 'partial-refill'`).

| Resource | Carry into next phase | Gate refill at B |
|----------|------------------------|------------------|
| **Hull** | remaining | **+1**, capped at max (3) |
| **Fuel** | leftover discarded | **full refill** |
| **Ammo** | remaining | restore **50% of missing**, rounded up, capped at mag (28) |
| **Heat** | discarded | cool / reset (not a carry resource) |

Examples: hull 2 → 3 at the gate; hull 3 stays 3. Empty mag (0/28) enters the next fire-phase at 14/28; 10/28 becomes 19/28; a full mag stays 28. Fuel is always full at the next A.

Standalone `?phase=` boots always start a fresh full loadout (hull 3 / fuel 100 / ammo 28). They do not read or write the Map 1 run.

## How to play

Keyboard only. No mouse aiming. End-card **click** is OK for next probe.

| Action | Keys |
|--------|------|
| Move (facing follows thrust) | `WASD` or arrow keys |
| Dodge (fuel + noise, brief i-frames) | `Shift` |
| Fire (primary; facing from thrust, not pointer) | `Space` |
| Next probe | `R` (keyboard-only hint; click on the end card still works) |

In the **chain**, R / Play Again after death or Map 1 clear (and mid-run abandon) launches a new probe at **Drift**. In **standalone**, R relaunches the current phase.

`KeyboardController` exposes `consumeFirePressed()` (tap) and `isFireDown()` (hold). Swarm / Anomaly / Boss Gate use both so a tap still shoots and a hold sprays until heat/ammo gates it.

### M1 Drift

Launch at **A** (left). Cross **open space** to **B** (right) on a long seeded transit (world **3600×720**, camera follows). Same `seed` → same covers and hunter homes. HUD shows SEED and TO B.

Hunters chase when they have **line of sight**. A few hard covers break vision along the spine. Dodging costs **fuel** and makes noise. Contact chips **hull**. Hull 0 ends the probe. Reaching B recovers it (chain: starts Debris Field). Fire is bound globally but this phase has nothing to shoot.

### M2.1 Debris Field

Long seeded cover maze (world **4200×720**, camera follows). Cover slabs block vision **both ways**. Hunters **funnel the gaps** instead of walking through rock. **Safe pockets** hide you but **pause fuel regen** and burn the clock. The last corridor is the trap — an **Ambusher** lunges when you commit. Reach B or die.

### M2.2 Gravity Well

Long seeded pull-transit (world **3800×720**, camera follows). A center mass sits **mid-run** and pulls **always** (ramps as you approach, eases after periapsis). The **shortcut** is the A→B trench that cuts north of the well: shorter, stronger pull, denser threats (hunters + a Gravity Bulwark that anchors near the well). The **long way** loops the north rim: weaker pull, fewer hunters, slower. Fall inside the horizon and hull hits 0. Reach B or die.

### M2.3 Swarm

A **long horizontal transit** (world ~4600px, camera follows the probe). Seeded procedural spine: same `seed` → same covers, pockets, and Swarmling homes. HUD and the console show the seed. Point B is far east — this is still a finite hunted A→B, not an endless arena.

Dozens of small **Swarmlings** pressure the whole run (denser near B). They **flash and lunge** after a short tell — dodge through the commit, do not auto-aim popcorn. **Heat** and **ammo** gate spray (short bursts only). Named variant: a **Splitter** dies into two smaller Swarmlings (no further split).

Choice: **CLEAR** a pocket (spend ammo/heat, quieter lane) vs **PUSH** through contact damage toward B. Reach B or die.

### M2.4 Anomaly

Exactly one Anomaly per Map 1 run (after Swarm, before Boss Gate).

**Invert lock (this phase only): controls mirrored.** WASD and arrows reverse on both axes (`W` is down, `S` is up, `A` is right, `D` is left). Facing, dodge, and Space fire follow the inverted thrust — not the pointer. The HUD chip and the launch runway both spell it: `INVERT  CONTROLS MIRRORED  ·  W↓  S↑  A→  D←`.

Long seeded A→B (~4400px, camera follows). Quiet runway so you feel the invert before contact; then weave / pack / breathe toward B. Named variant: **Echo** (inverted Swarm tell — dims and shrinks, then lunges). One **Echo Prime** on the approach. Heat + ammo still gate spray. Reach B or die.

No music bed (MVP).

### M2.5 Boss Gate

Final Map 1 phase. Finite A→B approach (~3200px, camera follows) into a **sealed gate**. Shorter than Swarm/Anomaly, not a 10-second dash.

Heavy **Gate Bulwark** (named variant) holds Point B. Win: **destroy the guard to open B** (GDD §4.6 / Q6 — **no bypass**, even in the chain). You still have to fly to B after the gate opens.

Skill test of prior verbs: WASD, fuel **Shift** dodge, **Space** fire (heat + ammo still gate spray). The Bulwark **telegraphs** then commits:

- **CHARGE TELL** — red lane + frontal plate (bolts into the face are absorbed; flank or wait for recover)
- **SWEEP TELL** — orange cone, then a fan of slow ward bolts to weave
- **SLAM TELL** (enraged, half HP) — ring shockwave; dodge through the band

Punishable mistakes: eating a charge, standing in the slam ring, dumping ammo into the plate. In the chain, reaching open B is **MAP 1 — PROBE RECOVERED**.

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

M2 Phases 2–6 (one at a time, each standalone-bootable)  ← done
  src/milestones/m2-phases/
    phaseRegistry.ts  Map 1 order + registry
    debris-field/     M2.1 playable — cover / funnel gaps / pockets
    gravity-well/     M2.2 playable — center pull / shortcut vs long way
    swarm/            M2.3 playable — long A→B spine / Swarmlings / heat+ammo
    anomaly/          M2.4 playable — mirrored controls / Echo dim-tell / long spine
    boss-gate/        M2.5 playable — Gate Bulwark / destroy to open B / tells
  src/game/proc/      shared seeded RNG + transit camera (all six phases)
  src/game/art/       pixel atlas (on main; M3 does not rewrite it)

M3 Full Map 1 loop  ← done
  src/milestones/m3-map1/
    chain.ts          A→B sequential transit
    carry.ts          partial-refill lock (hull +1 / fuel full / ammo 50% missing)
    runSession.ts     one probe / one run; permadeath + Play Again at Drift
    sceneBridge.ts    scene loadout, transit beat, HUD title
    permadeath.ts     hull 0 ends the run; no revive
    restart.ts        next probe = Play Again, no meta
```

MVP **does not** include narrative logs, meta-upgrades at B, Map 2+, or music beds. Pixel-art silhouettes are in (canvas atlas, nearest-neighbor).

## TODOs after M3

Length pass for Drift / Debris / Gravity is in: all six Map 1 phases are camera-follow A→B transits (~3200–4600px). Not an endless VS arena.

## Stack

- Phaser 3 (HTML5 canvas, not Phaser 4)
- TypeScript
- Vite

Clean start: no prior ship-game HTML was copied into this tree.

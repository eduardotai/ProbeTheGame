# Game Design Document — Probe Roguelike (Thursday Arena / Grokbot Galaxy)

**Status:** Design draft for review · not a build ticket · **MVP scope locked**  
**Owner:** Eduardo  
**Eng note:** New product. Not TTBR. Not RunDB. No repo / deploy from this document alone.  
**Path:** `/workspace/docs/desktop/GDD-probe-thursday-arena.md`  
**Date:** 2026-09-19 · MVP lock same day

---

## Summary

A sci-fi roguelike set in the cold dark of **Thursday Arena** (X / SpaceXAI “Grokbot Galaxy” event space): you are not a hero — you are a **probe**. Each run is one expendable unmanned craft trying to cross from Point A to Point B while hunters close in. Death is expected. Tone is lonely, diegetic, and merciless. **MVP validates only whether players will play that loop.** Full vision (meta at B, Map 2+, narrative logs, polish audio/art) remains below as post-MVP.

---

## MVP Scope

**Goal:** Validate whether players actually play the A→B hunt loop **before** investing in meta-progression or narrative.

### In MVP (mechanical core only)

| Include | Spec |
|---------|------|
| Probe avatar | Small unmanned craft; compact readable silhouette; fragile; expendable; no pilot |
| Point A → B loop | Launch at A, transit phases, reach B or die |
| Six Map 1 phases | Drift, Debris Field, Gravity Well, Swarm, Anomaly, Boss Gate — distinct rules |
| Enemies hunting | Hunter / Ambusher / Swarmling / Bulwark (and simple phase variants) |
| Permadeath | Hull 0 ends the run; next launch is a new probe |

### Explicitly stripped from MVP (build later)

| Strip | Why |
|-------|-----|
| Narrative layer (logs / transmissions / story beats) | Does not validate the loop |
| Meta-upgrade tree at B | Progression invest after loop proven |
| Multi-map scaling (Map 2+) | Scale after Map 1 loop proven |
| Art polish beyond readable silhouettes | Greybox / high-contrast placeholders OK |
| Audio beyond basic cues | Optional one-shot SFX only; **no** music beds, even in Anomaly/Boss Gate, for MVP |

### MVP acceptance (draft)

- Player can complete or die in a full A→B attempt without tutorials that explain lore.
- At least one cold playtester **chooses to start a second probe** after death or clear (loop interest signal).
- No account, no meta screen required to play.

**Sections below keep the full design vision.** Where content is not in MVP, headers are tagged **(post-MVP)**.

---

## 1. Vision

### Setting

- **Thursday Arena** as fictional arena / event space tied to X and SpaceXAI cultural texture (“Grokbot Galaxy”), not as a clone of the [thursdayarena.com](https://thursdayarena.com) auto-battler product.
- Empty lanes of debris, gravity scars, and silent hunters. No parade of power fantasy.

### Tone

- Sci-fi, cold, lonely.
- Theme line (lock): **“You are not a hero. You are a probe. You do not return.”**
- Failure is the default ending. *(Full vision: meaning lives in what the next probe inherits via meta — post-MVP.)*

### Fantasy

- Survive the transit. Reach B. *(Post-MVP: spend scrap on meta-nodes; launch again, slightly less blind.)*
- **MVP fantasy:** Survive the transit. Reach B — or don’t. Launch another probe.

---

## 2. Core loop

1. **Launch** a new probe at Point A (run starts; prior probe is gone). **(MVP)**
2. **Transit A → B** through sequential phases; enemies hunt the probe. **(MVP)**
3. **Reach B** (or die trying). **(MVP)**
4. If B: spend run rewards on **meta-upgrades** that persist **within the current map** (see §6). **(post-MVP)** — MVP: reaching B is a win screen / “probe recovered” beat only.
5. Death ends the run immediately. No mid-run revive. **(MVP — permadeath)**
6. Next probe continues: same map progress / meta state as defined in open questions if needed — default assumption: **meta persists within Map N until Map N is cleared or abandoned**. **(post-MVP)**

**MVP assumption:** “Next probe” is just Play Again on Map 1 with no retained upgrades.

**Full-vision assumption (labeled, post-MVP):** “Continues” means meta-upgrades and map unlock state persist; the probe body and run inventory do not.

---

## 3. Avatar — The Probe **(MVP)**

| Trait | Spec |
|-------|------|
| Identity | Small **unmanned** craft. No pilot. No face. Expendable. |
| Fantasy | Fragile instrument, not a warship. |
| Readability | Compact silhouette; readable at mobile size; high-contrast against black space. |
| Fragility | Low hit points relative to hunter damage; mistakes end the run. |
| Control feel | Precise, slight inertia; dodges cost **fuel** in Drift (and related phases). |

Art direction: one clear body + one thruster signature + one sensor “eye” max. No legs, no cape, no cockpit glass with a person inside.

---

## 4. Map 1 — six phases (distinct rules) **(MVP)**

Phases run in order unless an Anomaly rewrite says otherwise. Each phase has a **win condition** (reach the gate / exit) and a **fail condition** (hull 0).

### 4.1 Drift

- Open space. Few hard covers.
- Dodges and boosts are **fuel-limited**.
- Enemies hunt by **sound** (boosting/firing raises noise) and/or **line of sight**.
- Teaches: silence and pathing matter.

### 4.2 Debris Field

- Cover blocks vision for both probe and hunters.
- Enemies **funnel gaps**; safe pockets exist but delay the clock/fuel.
- Teaches: use cover; don’t tunnel-vision the exit.

### 4.3 Gravity Well

- Constant pull toward a center mass.
- A **shortcut** cuts closer to the well: faster, riskier (stronger pull / denser threats).
- Long way around: safer, slower.
- Teaches: risk/reward routing.

### 4.4 Swarm

- Dozens of small enemies (**Swarmlings** dominant).
- **Ammo** and/or **heat** limit sustained fire.
- Choice: **clear** a pocket vs **push** through damage.
- Teaches: resource discipline under pressure.

### 4.5 Anomaly

- **Exactly one Anomaly per run** on Map 1 (placement: after Swarm, before Boss Gate — default).
- Rules **invert** for this phase only (examples to pick one at implementation time: controls mirrored; heal hurts; silence attracts; darkness hides exit until noise).
- Music **allowed** here in full vision (§9) — **not in MVP** (basic cues only).
- Teaches: adapt or die.

### 4.6 Boss Gate

- Heavy **guard** enemy (Bulwark-class or Boss Gate unique).
- Tests player skill (and, **post-MVP**, whether meta-upgrades clear the gate).
- Music **allowed** here in full vision (§9) — **not in MVP**.
- Win: destroy or bypass per final combat rule (default: **destroy guard** to open B).

---

## 5. Map 2+ — scaling **(post-MVP)**

When Map 1 is cleared (definition TBD in Review Notes if “clear” = beat Boss Gate once):

| Lever | Map 2+ change |
|-------|----------------|
| Damage | Enemy damage up |
| Density | More simultaneous hunters |
| HP | Enemy HP up |
| Phases | Same six **roles**, with **twisted variants** (e.g. Drift with intermittent EMP; Debris with moving cover; Swarm with elite Swarmling cores) |

**Assumption:** New maps reuse the six-phase spine; they do not add a seventh role in v0.

---

## 6. Meta-upgrades at Point B **(post-MVP)**

Spend **scrap** earned this run (and banked map scrap if allowed — default: **bank scrap across probes on the same map**).

### Categories (5)

1. **Hull** — max HP, resist chips, emergency plate  
2. **Propulsion** — fuel capacity, thrust, drift efficiency  
3. **Weapons** — damage, heat/ammo economy, projectile behavior  
4. **Sensors** — LOS range, noise dampening, reveal ambushers  
5. **Utility** — scrap magnet, temporary buff duration, heal kit capacity  

### Starter node budget

- About **12 starter nodes** total across the five categories (not 12 per category).  
- Example split (design lock for first spreadsheet): Hull 3 · Propulsion 3 · Weapons 2 · Sensors 2 · Utility 2.  
- Nodes have simple prerequisites inside a category (linear or small branching).  
- Persist **within the current map** until map complete/reset.

Exact node names/numbers live in a balance table at build time; this GDD locks **structure**, not every +1%.

---

## 7. Enemies **(MVP roster; variants may be simplified)**

### Base roster (4)

| Enemy | Role |
|-------|------|
| **Hunter** | Direct pursuer; reacts to noise / LOS |
| **Ambusher** | Holds cover / darkness; lunges when probe commits |
| **Swarmling** | Fragile, numerous; overwhelms heat/ammo |
| **Bulwark** | Slow, high HP; blocks gates and chokepoints |

### Phase variants

- **One named variant per phase** (reskin + one rule tweak), e.g. Drift Hunter listens farther; Debris Ambusher ignores soft cover; Gravity Bulwark anchors near the well; Swarm Swarmling splits; Anomaly *Any* gains inverted tell; Boss Gate Bulwark (or unique).

---

## 8. Drops **(MVP: scrap optional as score only; heal kits scarce; temp buffs optional)**

| Drop | Role |
|------|------|
| **Scrap** | **Post-MVP:** primary meta currency at B. **MVP:** optional score/counter only — no spend screen |
| **Temp buffs** | Short run-only modifiers (thrust, cloak window, damage) — **MVP optional** |
| **Healing kits** | **Scarce**; never reliable full-heal economy — **MVP OK** |

No shop during transit in v0 unless Review Notes add one. Default: drops only.

---

## 9. Art / audio

### Art

- **MVP:** Readable silhouettes only (probe + enemies + gates). Greybox / flat shapes OK. High contrast preferred. No polish pass required to ship the test.  
- **Post-MVP:** Minimalist high contrast (near-black void, sparse neons); UI glyph-first; phone-width readability with art pass.

### Audio

- **MVP:** Basic cues only (hit, death, gate). No music beds.  
- **Post-MVP:** Diegetic sparse bed (thrusters, hull ticks, hunter tones). **Music only in Anomaly and Boss Gate.** Prefer silence elsewhere.

---

## 10. Open questions (blank for review)

Q2/Q5 partially answered by MVP lock; rest still open.

Fill during design review. Do not invent answers in eng without Eduardo.

| # | Question | Decision |
|---|----------|----------|
| Q1 | Final **title**? | |
| Q2 | **Narrative** emphasis vs pure **mechanical** run? | **MVP lock:** mechanical only; narrative = post-MVP |
| Q3 | **Single-player** only vs co-op later? | |
| Q4 | Ship first on **web/HTML5**, then native? | |
| Q5 | Does meta reset on map clear or carry into Map 2? | **post-MVP** (no meta in MVP) |
| Q6 | Boss Gate: must kill vs can bypass with Sensors/Utility? | |
| Q7 | PT-BR UI day one or EN first? | |
| Q8 | Relationship to “Fleet Draft” HTML prototype (same franchise or separate)? | |

---

## 11. Explicit non-goals (this GDD)

- Building inside TTBR or RunDB  
- Shipping X OAuth / season leaderboard as part of *this* doc’s acceptance  
- Matching Thursday Arena the auto-battler’s shop/bots systems  
- Full 3D AAA scope  
- **MVP non-goals:** narrative logs/transmissions, meta-upgrade tree, Map 2+, art polish, music  

---

## Review Notes

_(Blank for Eduardo / design review. Paste comments, cuts, and approvals below.)_

-

-

-

---

*End of GDD draft*

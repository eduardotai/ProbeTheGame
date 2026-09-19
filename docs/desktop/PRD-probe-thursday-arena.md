# Product Requirements Document — Probe Roguelike (Thursday Arena / Grokbot Galaxy)

**Status:** PRD draft for review · not a build ticket · not a deploy  
**Owner:** Eduardo  
**Eng note:** New product. Not TTBR. Not RunDB. No repo / deploy from this document alone.  
**Path:** `/workspace/docs/desktop/PRD-probe-thursday-arena.md`  
**Design SoT:** `/workspace/docs/desktop/GDD-probe-thursday-arena.md`  
**Date:** 2026-09-19 · input lock: keyboard-only (no mouse aiming)

---

## Summary

This PRD defines how we ship an MVP that answers one question: do players actually engage with the A→B probe hunt loop? Build is web-first (browser), mechanical-only, and gated by milestones — Drift alone first, then phases 2–6, then full Map 1 with permadeath and restart. Meta, narrative, Map 2+, polish art/audio, and native/mobile are out. Design details live in the GDD; this document must not contradict it.

---

## 1. Goal

Validate whether players actually engage with the **A→B roguelike loop** (probe launch → hunted transit → reach B or die → launch again) **before** investing in meta-progression, narrative, or multi-map scaling.

Aligned with GDD **MVP Scope**: mechanical core only.

---

## 2. Non-goals (MVP)

| Non-goal | Notes |
|----------|--------|
| Narrative layer | No logs, transmissions, or story beats |
| Meta-upgrade tree | No Point B progression spend |
| Map 2+ | Map 1 only |
| Multiplayer | Single-player only |
| Native builds | No Electron / iOS / Android for MVP |
| Audio beyond basic cues | One-shot SFX OK; no music beds |
| Art polish beyond readable silhouettes | Greybox / high-contrast placeholders OK |
| TTBR / RunDB integration | Separate product |
| Reuse of prior ship-game HTML | **Start clean** — old ship-game HTML is explicitly excluded |
| Mouse aiming / pointer aim | **Locked out for MVP** — keyboard-only control |

---

## 3. Platform

| Item | MVP decision |
|------|----------------|
| Delivery | **Web-first**, playable in browser |
| Target browsers | Chrome and Firefox on **desktop** |
| Mobile | **Not required** for MVP |
| Input | **Keyboard only** for MVP — **no mouse aiming** (locked; see §3.1) |

### 3.1 Controls (MVP lock)

| Rule | Spec |
|------|------|
| Scheme | **Keyboard only** |
| Aiming | **No mouse aiming** — facing / fire / dodge direction from keyboard (relative facing or cardinal/strafe binds) |
| Mouse | Not used for gameplay aiming; UI click on menus only if needed (Play Again) |
| Still open | Exact keybind map (WASD/arrows, dodge, fire) — TBD at implementation |


---

## 4. Engine / stack

**Default: Phaser 3 on HTML5 Canvas.**

| Choice | Rationale |
|--------|-----------|
| **Phaser 3 (default)** | 2D top-down fits natively; scene/plugin model maps cleanly to six rule-distinct phases; built-in input, arcade/matter physics options, and fast local iteration without Unity editor/build overhead. |
| **PixiJS (alternative)** | Lighter renderer if we want full custom game loop and zero framework opinions; more DIY for scenes, collisions, and phase lifecycle. Prefer Phaser unless a concrete need for Pixi-only pipeline appears. |

Stack constraints for MVP:

- Static-friendly frontend (no required backend for play).
- No Unity / Godot / Unreal for this MVP path.

---

## 5. MVP scope — Milestone 1 (validation gate)

**Single phase: Drift**, playable end-to-end in the browser.

Must include:

- Controllable **probe** avatar (readable silhouette); **keyboard-only** (no mouse aiming).
- Enemies that **hunt by line of sight**.
- **Fuel-limited dodges**.
- Reach **Point B** to complete the phase (or die / fail).

**Gate:** M1 must be playable and reviewable before starting M2. This is the first validation gate (controls + hunt + fuel + exit feel).

Phase rules: per GDD §4.1 Drift.

---

## 6. Milestone 2

Add **phases 2–6 one at a time**, each with its distinct rule from the GDD:

| Order | Phase |
|-------|--------|
| 2 | Debris Field |
| 3 | Gravity Well |
| 4 | Swarm |
| 5 | Anomaly |
| 6 | Boss Gate |

**Requirement:** each phase must be **playable standalone** (boot directly into that phase for test/debug), in addition to eventual chaining in M3.

Do not start phase N+1 until phase N is standalone-playable.

---

## 7. Milestone 3

**Full Map 1:** all six phases chained **A → B**.

Must include:

- Sequential phase transit for one run.
- **Permadeath** (hull 0 ends the run; no mid-run revive).
- **Restart loop** (“next probe” = Play Again on Map 1; no retained meta — per GDD MVP assumption).

**Gate:** M3 is the **“does the loop hold?”** test. Success metrics in §8 apply primarily here.

MVP win at B: recovery / clear beat only — **no** meta-upgrade screen (GDD).

---

## 8. Success metrics

Instrument (or manually log in early playtests) at least:

| Metric | Definition | Target |
|--------|------------|--------|
| Session length | Time from launch to death or Map 1 clear | **TBD** pending first playtest |
| Death rate per phase | Deaths attributed to phase / attempts that entered that phase | **TBD** |
| Map 1 completion rate | Clears / runs started | **TBD** |
| Replay rate | Players who start a **second run** after death or clear | **TBD** (GDD cold-playtest signal: at least one playtester chooses a second probe) |

No account system required to collect early signals; anonymous/local counters OK for first pass.

---

## 9. Reference (design source of truth)

- **GDD:** `/workspace/docs/desktop/GDD-probe-thursday-arena.md`
- This PRD **must not contradict** the GDD. If a conflict appears, **GDD wins** until Eduardo updates either doc.
- Theme: Thursday Arena / Grokbot Galaxy texture as fictional setting — not a clone of thursdayarena.com auto-battler systems (GDD non-goal).

---

## 10. Open decisions

| Topic | Decision / status |
|-------|-------------------|
| Hosting | **Open** — Vercel or other static host TBD; this PRD does not authorize deploy |
| Input scheme | **Locked:** keyboard only; **no mouse aiming**. Exact keybinds still TBD |
| Code reuse from prior projects | **No — start clean.** Old ship-game HTML is **explicitly excluded** |
| Repo | **None** from this PRD alone |
| Title | Still open in GDD Q1 |

---

## 11. Explicit eng boundaries

- No TTBR work from this PRD.  
- No RunDB work from this PRD.  
- No GitHub repo / CI / production deploy implied by writing this file.  
- Build tickets (if any) come later from Eduardo after Review Notes.

---

## Review Notes

_(Blank for Eduardo / design review. Paste comments, cuts, and approvals below.)_

-

-

-

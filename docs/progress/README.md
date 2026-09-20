# Progress media

Playtest stills and clips. Pixel-art atlas is on main (canvas, nearest-neighbor). M3 chain stills below were captured on greybox; they document **handoff / HUD / banners**, not the shipping art.

## M3 Map 1 chain

Default boot is the six-phase run (`/` or `?run=map1`). Carry lock: **partial refill** (hull +1 / fuel full / ammo 50% of missing). Boss Gate still requires **destroying the guard** to open B.

| File | What it shows |
|------|----------------|
| `m3-chain-spawn.png` | Default chain boot — `MAP 1 · 1/6 DRIFT` |
| `m3-transit-debris.png` | Drift B → `TRANSIT — DEBRIS FIELD` with hull +1 / fuel full / ammo |
| `m3-debris-chain.png` | Same probe in Debris — `MAP 1 · 2/6`, hull refilled to 3 |
| `m3-transit-gravity.png` | Debris B → `TRANSIT — GRAVITY WELL` |
| `m3-gravity-chain.png` | Same probe in Gravity Well — `MAP 1 · 3/6` |
| `m3-run-lost.png` | Hull 0 on Gravity — **PROBE LOST**, hint launches next probe at Drift |
| `m3-death-resets-drift.png` | After R — new probe at Drift `1/6`, full loadout |
| `m3-swarm-chain.png` | Chain Swarm `4/6` |
| `m3-anomaly-chain.png` | Chain Anomaly `5/6`, controls mirrored |
| `m3-boss-sealed.png` | Chain Boss Gate `6/6` **GATE SEALED** — completePhase does not open B |
| `m3-boss-gate-open.png` | Guard destroyed, **GATE OPEN** |
| `m3-map1-recovered.png` | Open B — **MAP 1 — PROBE RECOVERED** (probe at B, no meta screen) |
| `m3-standalone-drift.png` | `?phase=drift` still boots Drift (`DRIFT · M1`, not MAP 1) |
| `m3-standalone-boss.png` | `?phase=boss` still boots sealed Boss Gate (`BOSS GATE · M2.5`) |
| `m3-chain-transitions.mp4` | Three transitions: Drift → Debris → Gravity → Swarm |

## Pixel-art pass

| File | What it shows |
|------|----------------|
| `pixel-probe.png` | Drift spawn — cyan pixel probe at A, steel tiled covers, red Hunter chevrons, Point B beacon |
| `pixel-drift.png` | Full Drift playfield (same beat as `drift-spawn.png`, now pixel) |
| `pixel-debris.png` | Debris Field — chipped pixel slabs, Ambusher + funnel Hunters, pockets, Point A/B |
| `pixel-gravity.png` | Gravity Well — pixel rings + well-core, Gravity Bulwark, hunters, shortcut/long way |
| `pixel-swarm.png` / `pixel-enemies.png` | Swarm — yellow Swarmling darts, CLEAR pocket, PUSH lane, steel pillars |
| `pixel-anomaly.png` | Anomaly — purple Echoes, inverted HUD, WEAVE floor, anomaly-edged covers |
| `pixel-boss-spawn.png` | Boss Gate launch — pixel probe, maroon pillars, GATE SEALED |
| `pixel-boss-bulwark.png` | Gate Bulwark (named variant) + CHARGE TELL, sealed striped wall |
| `pixel-boss-gate.png` | Guard down — wall **OPEN** (cyan ghost frame), GATE OPEN |
| `pixel-phase-compare.png` | Greybox (left) vs pixel (right): Drift top, Boss Gate bottom |
| `pixel-probe.mp4` | Drift: WASD fly, weave covers, Shift dodge, pixel probe |
| `pixel-enemies.mp4` | Swarm: fly into pack, Space fire, Swarmling darts |
| `pixel-boss-bulwark.mp4` | Boss Gate: approach into arena, Gate Bulwark, sealed wall, tells |
| `pixel-phase-compare.mp4` | `?phase=` boots: Drift → Debris → Gravity → Swarm → Anomaly → Boss |

## Earlier phases (already on main)

### M2.5 Boss Gate

Seed `4242` (`?phase=boss&seed=4242`). Win: **destroy the Gate Bulwark to open B**.

| File | What it shows |
|------|----------------|
| `boss-spawn.png` / `boss-approach.png` / `boss-charge-tell.png` / `boss-sweep-tell.png` / `boss-slam-tell.png` / `boss-gate-open.png` / `boss-recovered.png` / `boss-lost.png` | M2.5 greybox stills (pre-pixel) |
| `boss-fight.mp4` | M2.5 greybox fight clip |
| `anomaly-spawn.png` / `anomaly-mirrored.png` / `anomaly-pack.png` / `anomaly-breathe.png` / `anomaly-echo-tell.png` / `anomaly-recovered.png` / `anomaly-lost.png` | Anomaly stills |
| `anomaly-invert.mp4` | Anomaly invert clip |
| `swarm-spawn.png` / `swarm-clear-pocket.png` / `swarm-push.png` / `swarm-heat-ammo.png` / `swarm-recovered.png` / `swarm-lost.png` | Swarm stills |
| `swarm-pressure.mp4` | Swarm A→B pressure clip |
| `gravity_well_layout.png` | Gravity Well at launch |
| `gravity_well_long_way_label.png` | LONG WAY label on the north rim |
| `gravity_well_recover_b_and_horizon_death.mp4` | Gravity recover at B / horizon death |
| `debris-spawn.png` / `debris-pocket.png` / `debris-lost.png` / `debris-recovered.png` | Debris Field stills |
| `drift-spawn.png` / `drift_point_b_recovered_centered.png` / `drift_hull_zero_lost_centered.png` | Drift stills |
| `drift_m1_win_death_restart_with_centered_banners.mp4` | Drift win/death/restart |

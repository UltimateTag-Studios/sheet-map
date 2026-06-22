# Phase 4 — incremental parts (complete)

Full spec: [`camera-fsm-plan.md`](camera-fsm-plan.md). `SHEET_MAP_REBUILD_PHASE = 4`.

Historical incremental guide — all parts landed.

---

## Accepted product behavior (all of phase 4)

**Sheet drag stops pan momentum.** When the map is coasting after a pan and the user moves the sheet, live `setPadding` runs. Mapbox may end pan inertia. We accept this — our code still must not add `jumpTo` / `flyTo` / `map.stop()` on sheet-driven padding. See [`camera-fsm-plan.md` §3.1](camera-fsm-plan.md#31-accepted-sheet-drag-stops-pan-momentum).

---

## Part 4A — Padding sync only ✅

**Frozen** — primitives in `sync-map-padding.ts`, `read-map-padding-from-canvas.ts`, etc.

---

## Part 4B — Anchor reducer ✅

`reduceMapAnchor` + tests.

---

## Part 4C — Pan gesture + anchor commit ✅

Padding (4A) + `moveend` dispatcher + `userGesture` + anchor commit at settle.

---

## Part 4D — `navigateTo` + `navigating` session ✅

Programmatic fly/jump; `beginProgrammaticNavigation`; padding before nav with `realign: false`.

Demo: “Fly to demo point” on `/sheet`.

---

## Part 4E — Full padding matrix + phase complete ✅

`applyMapPadding` realign rules; `padding-anchor.integration.test.ts`; `SHEET_MAP_REBUILD_PHASE = 4`.

**Next:** Phase 5 — [`phase-5-parts.md`](phase-5-parts.md) (follow user, boot fly, GPS, snap-back).

# Phase 4 — incremental parts (verify each before the next)

Full spec: [`camera-fsm-plan.md`](camera-fsm-plan.md). Do **not** bump `SHEET_MAP_REBUILD_PHASE` to `4` until **Part 4E** lands.

Track progress via `SHEET_MAP_PHASE_4_PART` in `src/index.ts`.

---

## Accepted product behavior (all of phase 4)

**Sheet drag stops pan momentum.** When the map is coasting after a pan and the user moves the sheet, live `setPadding` runs. Mapbox may end pan inertia. We accept this — our code still must not add `jumpTo` / `flyTo` / `map.stop()` on sheet-driven padding. See [`camera-fsm-plan.md` §3.1](camera-fsm-plan.md#31-accepted-sheet-drag-stops-pan-momentum).

---

## Part 4A — Padding sync only ✅

**Frozen** — primitives in `sync-map-padding.ts`, `read-map-padding-from-canvas.ts`, etc. Later parts compose these; do not change 4A behavior.

---

## Part 4B — Anchor reducer ✅

**Goal:** `reduceMapAnchor` + tests. No hook wiring.

**You verify:** `reduce-map-anchor.test.ts` passes.

---

## Part 4C — Pan gesture + anchor commit ✅ (current)

**Goal:** `useMapAnchor` (partial): padding (4A primitives) + `moveend` dispatcher + `userGesture` + anchor commit at settle. **No `navigateTo` yet** (4D).

**Demo:** show `session`, anchor lat/lng after pan settles.

**You verify:**

- [ ] Pan map → release → `session` returns `idle`, anchor updates
- [ ] Padding still tracks sheet drag (4A behavior unchanged)
- [ ] Pan coast + sheet drag → coast may stop (accepted — no coalesce/defer)

---

## Part 4D — `navigateTo` + `navigating` session

**Goal:** Programmatic fly/jump; `beginProgrammaticNavigation`; padding before nav with `realign: false`.

**Demo:** dev button or console `navigateTo` — document in screen.

**You verify:**

- [ ] `navigateTo` → `session: navigating` → settles to `idle`
- [ ] Sheet drag during nav → padding + jump to target (duration 0)

---

## Part 4E — Full padding matrix + phase complete

**Goal:** `applyMapPadding` realign rules; `padding-anchor.integration.test.ts`.

**Bump:** `SHEET_MAP_REBUILD_PHASE = 4`, `SHEET_MAP_PHASE_4_PART` removed or set to `5`.

**You verify:** rebuild-phases.md phase 4 done checklist.

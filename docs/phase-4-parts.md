# Phase 4 — incremental parts (verify each before the next)

Full spec: [`camera-fsm-plan.md`](camera-fsm-plan.md). Do **not** bump `SHEET_MAP_REBUILD_PHASE` to `4` until **Part 4E** lands.

Track progress via `SHEET_MAP_PHASE_4_PART` in `src/index.ts`.

---

## Accepted product behavior (all of phase 4)

**Sheet drag stops pan momentum.** When the map is coasting after a pan and the user moves the sheet, live `setPadding` runs. Mapbox may end pan inertia. We accept this — our code still must not add `jumpTo` / `flyTo` / `map.stop()` on sheet-driven padding. See [`camera-fsm-plan.md` §3.1](camera-fsm-plan.md#31-accepted-sheet-drag-stops-pan-momentum).

---

## Part 4A — Padding sync only ✅ (current)

**Goal:** Mapbox `setPadding` tracks live sheet DOM. No anchor session, no `navigateTo`, no camera moves from our code.

| Deliverable | Notes |
| ----------- | ----- |
| `computeMapPadding` | `padding.bottom` from obscured px + chrome |
| `syncMapPadding` | Deduped `setPadding`; `consumePaddingSyncMoveEnd` for later |
| `whenMapStyleReady` | Style load + idle recovery |
| `releaseMapInstanceCameraState` | Clear padding WeakMap on unmount |
| `useMapPaddingSync` | Reads **live DOM at apply time**; skips when unmeasurable |

**Padding model:** no React-state `0` → `setPadding`. `liveSheetObscuredBottomPx` is only a re-sync trigger. Padding tracks live sheet geometry continuously.

**You verify:**

- [ ] Drag sheet → `padding.bottom` matches obscured px (± rounding)
- [ ] Map stays pannable; our code does not `jumpTo` / `flyTo` on padding (4A)
- [ ] Refresh ×3 → no `setPadding { bottom: 0 }` when sheet is measurable
- [ ] Pan coast + sheet drag → coast may stop (accepted)
- [ ] `pnpm --filter @siegetag/sheet-map test` passes

---

## Part 4B — Anchor reducer (pure FSM)

**Goal:** `reduceMapAnchor` + tests. No hook wiring yet.

**You verify:** unit tests only (`reduce-map-anchor.test.ts`).

---

## Part 4C — Pan gesture + anchor commit

**Goal:** `useMapAnchor` (partial): `moveend` dispatcher, `userGesture` session, commit anchor at settle. Padding from 4A merged into same hook.

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

**Goal:** `applySheetPadding` realign rules; `padding-anchor.integration.test.ts`; fold `useMapPaddingSync` into `useMapAnchor`.

**Bump:** `SHEET_MAP_REBUILD_PHASE = 4`, `SHEET_MAP_PHASE_4_PART` removed or set to `5`.

**You verify:** rebuild-phases.md phase 4 done checklist.

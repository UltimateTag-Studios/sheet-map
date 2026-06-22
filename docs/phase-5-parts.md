# Phase 5 — incremental parts (verify each before the next)

Full spec: [`camera-fsm-plan.md`](camera-fsm-plan.md) §2 Rule 1 (boot), Rule 3 (gesture settle), §6. Do **not** bump `SHEET_MAP_REBUILD_PHASE` to `5` until **Part 5E** lands.

Track progress via `SHEET_MAP_PHASE_5_PART` in `src/index.ts`.

Reference implementation (port selectively, do not copy defer/flush): `packages/sheet-map-old/src/camera/`, demo `apps/sheet-map-demo/src/screens/reference/sheet-on-map-screen.tsx`.

---

## Prerequisites (phase 4 — done)

- `useMapAnchor`: padding, sessions, `navigateTo`, single `moveend` dispatcher
- `applyMapPadding`: full matrix (`idle` follow branch exists; not wired yet)
- `map-instance-camera-state`: padding WeakMap release on unmount

---

## Part 5A — Follow reducer (current)

**Goal:** `reduceMapFollow` + tests only. **No hooks.**

| Module | Notes |
| ------ | ----- |
| `camera/follow/state.ts` | `followUser`, `hasBootFlown` |
| `camera/follow/reduce-map-follow.ts` | `startFollowUser`, `stopFollowUser`, `bootFlown`, `resetBoot` |
| `reduce-map-follow.test.ts` | Pure reducer coverage |

**You verify:**

- [ ] `reduce-map-follow.test.ts` passes
- [ ] No changes to `useMapAnchor` yet

---

## Part 5B — `repositionCamera` + per-map boot latches

**Goal:** Instant GPS jump API and boot latch on map instance (separate from React follow state).

| Module | Notes |
| ------ | ----- |
| `reposition-camera.ts` | `jumpTo` only; session stays `idle`; no padding sync |
| `map-instance-camera-state.ts` | Add `hasBootFlownForMapInstance`, `markBootFlownForMapInstance`; release on unmount |
| `map-instance-camera-state.test.ts` | Refresh / unmount clears boot latch |
| `reposition-camera.test.ts` | Does not enter `navigating` |

**You verify:**

- [ ] Unit tests pass
- [ ] `releaseMapInstanceCameraState` clears padding **and** boot latch

---

## Part 5C — Boot fly (`tryBootFly` + minimal `useMapFollowUser`)

**Goal:** One smooth boot fly per map after padding is ready. **No gesture snap-back or GPS tick yet.**

| Module | Notes |
| ------ | ----- |
| `try-boot-fly.ts` | Pure gate: `mapPaddingReady && styleLoaded && userLocation && !hasBootFlownForMapInstance` → `navigateTo` once |
| `use-map-follow-user.ts` | Composes `useMapAnchor`; auto `startFollowUser` when GPS available; calls `tryBootFly` |
| Wire `applyMapPadding` | Pass `followUser` + `followTarget` from hook when following |

**Invariants:**

- Boot runs **only** from `tryBootFly` — never from `syncMapPaddingFromCanvas` or `applyMapPadding`
- Mark boot on **issue** of boot `navigateTo` (WeakMap + `bootFlown` reducer event)
- `onMapInstanceReleased` → `resetBoot` + clear WeakMap (already in 5B)

**Demo:**

- Swap `/sheet` to `useMapFollowUser` + `useDemoUserLocation` (keep manual fly button optional for debug)
- Load / refresh: padding → boot fly → `isFollowFocused` true (blue button in 5E; can log boot in 5C)

**You verify:**

- [ ] Refresh ×5: exactly one boot fly per map instance
- [ ] Strict Mode / remount: boot runs again on fresh map (latch cleared)
- [ ] No stack overflow (boot not triggered from padding path)
- [ ] `use-map-follow-user.test.ts` (boot-once cases) passes

---

## Part 5D — Gesture settle + 40px threshold

**Goal:** Follow release and snap-back fly at pan settle. **No GPS reposition loop yet.**

| Module | Notes |
| ------ | ----- |
| `evaluate-gesture-settle.ts` | Pure: `commitAnchor` \| `releaseFollow` \| `snapBackToUser` |
| `map-user-location-follow.ts` | Distance read vs `centerOffset`; 40px default threshold |
| `use-map-anchor.ts` | Optional `follow` config; `move` threshold during `userGesture`; extend `handleMoveEnd` per spec §7 |

**Behavior:**

- During `userGesture` (incl. momentum): sheet padding → `setPadding` only
- `moveend` + following + ≤40px → `navigateTo` snap-back fly → `navigating`
- `moveend` + following + >40px → `stopFollowUser` + `userGestureSettled` → `idle`
- Not following → existing anchor commit

**You verify:**

- [ ] Pan >40px while following: follow releases, no snap-back fly
- [ ] Pan ≤40px while following: snap-back fly at settle (not on every padding tick)
- [ ] Pan while not following: unchanged phase 4 behavior
- [ ] Tests for `evaluate-gesture-settle.ts`

---

## Part 5E — GPS reposition + UI + phase complete

**Goal:** Live GPS jumps, my-location button, full demo, phase bump.

| Module | Notes |
| ------ | ----- |
| `use-map-follow-user.ts` | GPS `repositionCamera` when `session === idle` only; dedupe by position key |
| `MapUserLocation` + `MapMyLocationButton` | Port from `sheet-map-old/src/canvas/` |
| `use-map-follow-user.test.ts` | GPS jump, my-location uses `navigateTo`, no double boot |
| Demo `/sheet` | Full parity with reference screen |

**You verify:**

- [ ] GPS while following: instant jump (`repositionCamera`), session stays `idle`
- [ ] My-location button: smooth `navigateTo` fly
- [ ] §11 manual checklist in `camera-fsm-plan.md` passes with `VITE_SHEET_MAP_DEBUG=true`
- [ ] All tests pass
- [ ] `SHEET_MAP_REBUILD_PHASE = 5`; remove `SHEET_MAP_PHASE_5_PART`

---

## Part dependency graph

```
5A reduceMapFollow
 └─► 5B repositionCamera + boot latches
      └─► 5C tryBootFly + useMapFollowUser (boot)
           └─► 5D gesture settle + threshold
                └─► 5E GPS + UI + bump
```

---

## What not to do (any 5x part)

- Boot or `navigateTo` from inside `syncMapPaddingFromCanvas`
- Defer/coalesce padding to preserve pan momentum
- GPS updates via `navigateTo` (use `repositionCamera` only)
- Snap-back or threshold checks on every sheet padding tick (settle only)
- Bundle unrelated parts in one PR — land and verify each part before the next

# Phase 5 — incremental parts (verify each before the next)

Full spec: [`camera-fsm-plan.md`](camera-fsm-plan.md) §2 Rule 1 (boot), Rule 3 (gesture settle), §6. **`SHEET_MAP_REBUILD_PHASE = 5`** — phase 5 complete.

Reference implementation: `apps/sheet-map-demo` routes `/sheet` and `/shell` (`MapLayout` + `useRegisterMapRoute`).

---

## User location contract (app layer — not `@siegetag/sheet-map`)

`@siegetag/sheet-map` **never** calls `navigator.geolocation` or Capacitor APIs. It receives `userLocation: { lat, lng, accuracyMeters? } | null` from the app.

| Rule | Behavior |
| ---- | -------- |
| **Boot fly** | Only when `userLocation !== null` + `mapPaddingReady` + style loaded + boot latch clear |
| **Permission denied** | `userLocation` stays `null` → **no boot fly**; map still works (pan, sheet, manual controls) |
| **No fake coords** | No silent fallback city in product code — wait or show UI |
| **Deep link / cold start** | Same as in-app navigation: request location on map mount; boot waits for grant + fix |
| **My-location button** | `navigateTo` fly when coords exist; if denied, show UI — do not assume the system prompt appears again |

### Web demo (`apps/sheet-map-demo`)

- `useDemoUserLocation`: `getCurrentPosition` on mount (+ `watchPosition` for updates).
- On error or deny: leave `location` as `null` (remove Kanarraville fallback when porting from reference).
- Optional dev-only fallback behind an explicit env flag if needed for local testing without GPS.

### Capacitor (`apps/capacitor`)

- Reuse `requestCaptureLocationPermission` + `@capacitor/geolocation` (see `use-map-user-location.ts`, `get-capture-location.ts`).
- `needsSettings: true` → user must enable location in **OS app settings** (not browser chrome); offer Open Settings.
- Denied → `userLocation` undefined → no boot fly.

---

## Prerequisites (phase 4 — done)

- `useMapAnchor`: padding, sessions, `navigateTo`, single `moveend` dispatcher
- `applyMapPadding`: full matrix (`idle` follow branch exists; not wired yet)
- `instance/camera-state`: padding WeakMap release on unmount

---

## Part 5A — Follow reducer ✅

**Goal:** `reduceMapFollow` + tests only. **No hooks.**

| Module | Notes |
| ------ | ----- |
| `camera/follow/state.ts` | `tracking` boolean |
| `camera/follow/reduce-map-follow.ts` | `startTracking`, `stopTracking`, `bootIssued` |
| `reduce-map-follow.test.ts` | Pure reducer coverage |

**You verify:**

- [x] `reduce-map-follow.test.ts` passes
- [x] No changes to `useMapAnchor` yet

---

## Part 5B — Boot latches + movement ✅

**Goal:** Per-map boot latch on map instance; GPS via instant `navigateTo`.

| Module | Notes |
| ------ | ----- |
| `instance/camera-state.ts` | `hasBootIssuedForMapInstance`, `markBootIssuedForMapInstance`; release on unmount |
| `movement/programmatic.ts` | Instant jumps; session stays `idle` when `duration === 0` |

**You verify:**

- [x] Unit tests pass
- [x] `releaseMapInstanceCameraState` clears padding **and** boot latch

---

## Part 5C — Boot fly ✅ (5C-4 + cleanup landed)

**Status:** 5C-4 demo wired to `useMapUserTracking`; camera package reorganized into topic folders (`padding/`, `boot/`, `instance/`, `shared/`, `hooks/`). See [`phase-5c-slices.md`](phase-5c-slices.md).

**5A / 5B do not affect the demo** (reducer + exported helpers only; no `useMapAnchor` changes). Boot uses `navigateTo` (no session gate); padding→boot via explicit `onPaddingReady` → `attemptBoot`.

| Slice | Demo? | Manual verify? |
| ----- | ----- | -------------- |
| 5C-1 Boot config inside `useMapAnchor` | No | No (tests only) |
| 5C-2 `useMapUserTracking` wrapper | No | No (tests only) |
| 5C-3 `MapUserLocation` + geolocation hook | Dot only; camera still `useMapAnchor` | Padding + overlay must still work |
| 5C-4 Swap demo to `useMapUserTracking` | Yes | Full boot + padding checklist |

Do **not** wire `applyMapPadding` follow realign in 5C (that's 5D).

---

## Part 5D — Gesture settle + 40px threshold ✅

**Goal:** Follow release and snap-back fly at pan settle. **No GPS reposition loop yet.**

| Module | Notes |
| ------ | ----- |
| `anchor/resolve-move-end.ts` | Pure moveend branching (5D extends with `evaluate-gesture-settle`) |
| `evaluate-gesture-settle.ts` | Pure: `commitAnchor` \| `releaseFollow` \| `snapBackToUser` |
| `hooks/use-map-user-tracking.ts` | Distance read vs `centerOffset`; threshold via **`trackingReleaseThresholdPx`** option (app default often 40 — not hardcoded in reducer) |
| `hooks/use-map-anchor/listeners.ts` | Wire `resolveMoveEnd` + optional tracking config |

**Threshold:** `trackingReleaseThresholdPx` on `useMapUserTracking` / `useMapAnchor` — consumer-configurable screen pixels; demo default 40.

**Behavior:**

- During `userGesture` (incl. momentum): sheet padding → `setPadding` only
- `moveend` + following + ≤40px → `navigateTo` snap-back fly → `navigating`
- `moveend` + tracking + >40px → `stopTracking` + `userGestureSettled` → `idle`
- Not following → existing anchor commit

**You verify:**

- [x] Pan >40px while following: follow releases, no snap-back fly (unit tests)
- [x] Pan ≤40px while following: snap-back fly at settle (unit tests)
- [x] Pan while not following: unchanged phase 4 behavior (existing tests)
- [x] Tests for `evaluate-gesture-settle.ts`
- [x] Manual: pan + sheet during momentum while following (demo `/sheet`)

---

## Part 5E — GPS reposition + UI + phase complete ✅

**Goal:** Live GPS jumps, my-location button, full demo, phase bump.

| Module | Notes |
| ------ | ----- |
| `hooks/use-map-user-tracking.ts` | GPS instant `navigateTo` when `tracking && session === idle`; dedupe by position key |
| `MapUserLocation` + `MapMyLocationControl` | Default button + injectable `renderButton`; `tracking` = blue when following |
| `hooks/use-map-user-tracking.test.ts` | GPS jump, my-location uses `navigateTo`, no double boot |
| Demo `/sheet` | `MapLayout` shell in `apps/sheet-map-demo` |

**My-location button (web + Capacitor):**

- Coords available → smooth `navigateTo` fly
- No coords → retry permission request; if permanently denied, show settings guidance (Capacitor `needsSettings`; web: browser/site permissions)

**You verify:**

- [x] GPS while tracking: instant `navigateTo({ duration: 0 })`, session stays `idle`
- [x] My-location button: smooth `navigateTo` fly when coords exist (`recenterOnUser`)
- [ ] §11 manual checklist in `camera-fsm-plan.md` passes with `VITE_SHEET_MAP_DEBUG=true`
- [x] All tests pass
- [x] `SHEET_MAP_REBUILD_PHASE = 5`; `SHEET_MAP_PHASE_5_PART` removed

---

## Part 5F — One `anchor`, one `navigateTo` ✅

**Goal:** Single source of truth for map center; trim public API.

| Change | Notes |
| ------ | ----- |
| `anchor` only | Removed `navigationIntent`, `followTarget` padding inputs |
| `navigateTo` only | GPS uses instant `navigateTo`; `flying` session only for `duration > 0` |
| `keepTracking` | Renamed from `retainFollow` |
| `padding/apply.ts` | One rule: sheet moving + not `userGesture` → jump to `anchor` |
| `movement/programmatic.ts` | Padding uses `stopUserMotion: false` |
| Public exports | `useMapUserTracking` + `MapUserTrackingProvider`; `useMapAnchor` internal |

**Manual verify (re-run phase 5 checklist):**

- [ ] Boot fly + padding
- [ ] GPS follow while idle
- [ ] Pan threshold + snap-back
- [ ] Fly to demo point **releases** tracking (gray button); sheet drag does not snap back to user
- [ ] My-location re-enables tracking (blue button)

## Part dependency graph

```
5A reduceMapFollow ✅
 └─► 5B boot latches + movement ✅
      └─► 5C boot fly — see phase-5c-slices.md (5C-1 … 5C-4)
           └─► 5D gesture settle + threshold
                └─► 5E GPS + UI + bump ✅
                     └─► 5F movement layer + unified navigateTo ✅
```

---

## What not to do (any 5x part)

- Boot or `navigateTo` from inside `syncMapPaddingFromCanvas`
- Defer/coalesce padding to preserve pan momentum
- GPS updates via `navigateTo({ duration: 0, keepTracking: true })` when `tracking && session === idle`
- Snap-back or threshold checks on every sheet padding tick (settle only)
- Silent fallback coordinates when location is denied (demo dev flag only if ever)
- Bundle unrelated parts in one PR — land and verify each part before the next

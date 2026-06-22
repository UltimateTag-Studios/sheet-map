# Boot fly — behavior spec and target architecture

**Status:** 5C-4 landed (`SHEET_MAP_PHASE_5_PART = 4`). Parent: [`phase-5c-slices.md`](phase-5c-slices.md), [`camera-fsm-plan.md`](camera-fsm-plan.md) §2 Rule 1.

---

## One-line goal

**Fly the map to the user’s location exactly once per map instance**, as soon as **both** location and padding are ready — **in either order** — without double-fly, stack overflow, or scattered boot triggers.

---

## Product behavior (acceptance criteria)


| #   | Rule                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Once per map instance** — refresh or remount → may boot again; same instance → never twice                                                                                      |
| 2   | **Both gates required** — valid `userLocation` (lat/lng) **and** first successful `setPadding` from live sheet DOM (`mapPaddingReady`)                                            |
| 3   | **Order-independent** — padding-first, location-first, or simultaneous must all boot                                                                                              |
| 4   | **No boot** when location denied/null, padding never measurable, or boot latch already set                                                                                        |
| 5   | **Retry until success or latch** — transient blocks (`navigateTo` false) must retry when the blocker clears; latch only on successful issue |
| 6   | **Issue = navigate issued** — mark map WeakMap latch + follow reducer `bootFlown` when `navigateTo` returns true, not when fly animation ends                                     |
| 7   | **Acyclic** — boot never invoked from inside `syncMapPaddingFromCanvas` / `applyMapPadding` / `applyPaddingBeforeNavigation`                                                      |
| 8   | **MapCanvas contract** — `mapRef` published only on `onLoad` (style ready); unpublish `null` on unmount                                                                           |


**Manual verify (5C-4 sign-off):**

- Refresh ×10 with location granted → one smooth fly every time
- Deny location → no fly, no crash
- “Fly to demo point” still works after boot
- Debug overlay shows which gate blocked boot when it fails

---

## Why the current architecture fails

### Symptom

Tests pass (93+). Demo shows `mapPaddingReady` + user dot in many cases, but **camera does not fly** (or only sometimes).

### Root causes

1. **Implicit boot config (`getTarget()` closure)**
  React cannot see “location became ready.” `bootReady` is computed at render from `boot?.getTarget() != null`, but the **trigger** is a `useEffect` on a derived boolean. Failed attempts (`session !== idle`, `navigateTo` false) are silent; retries depend on effect deps catching the right transition.
2. **State vs ref mismatch on padding**
  Padding sets `mapPaddingReadyRef.current = true` **synchronously** in `refreshMapPaddingFromCanvas`, then `setMapPaddingReady(true)` async. Boot gates on React **state** (`bootReady` uses `mapPaddingReady`). That is usually one frame later — OK — but boot does **not** get a synchronous callback when the ref flips, unlike the old monolith pattern that read `paddingReadyRef` inside `tryBootFly` on every `tryBootFly` identity change.
3. **Old monolith had the same latent bug**
  `useEffect(() => tryBootFly(), [tryBootFly])` with `tryBootFly` deps `[bootEnabled, mapRef, enabled]` — **not** `paddingReady`. Padding-only readiness did not recreate `tryBootFly`. Tests passed because they always paired location arrival with a `tryBootFly` identity change. Production often has **location first, padding second** with stable `bootEnabled`.
4. **Tests ≠ browser timing**
  Harnesses mount `mapRef` immediately, mock style/DOM/sheet fixture together, and run under `act()`. Production races:
  - `MapCanvas` `onLoad` → `setMapRef` (async state)
  - `getCurrentPosition` / `watchPosition` (async)
  - Sheet `onLayoutFrameChange` / DOM measurable (async)
  - Padding reset to `false` on every new `mapRef` before first sync
5. **No observability**
  `tryBootFly` returns `boolean`. Production failures are invisible.
6. **Possible “boot ran but looked like it didn’t”**
  `navigateTo` forces `duration: 0` when `sheetPhase !== idle` (instant jump). User may expect a smooth fly during sheet settle.

---

## Target architecture: one coordinator, two explicit inputs

### Principle


| Module                 | Responsibility                                                | Must NOT                           |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------- |
| **Padding sync**       | Continuous `setPadding` from live DOM; emit `mapPaddingReady` | Call boot, call `navigateTo`       |
| **Follow / app layer** | Geolocation → `userLocation`; derive `bootTarget`             | Own padding or session FSM         |
| **Boot coordinator**   | When `bootTarget ∧ mapPaddingReady ∧ …` → `tryBootFly` once   | Live inside padding pure functions |
| `**tryBootFly`**       | Pure gates + latch + single `navigateTo`                      | Side effects beyond issue          |


```
┌────────────────────────┐     ┌─────────────────────────┐
│ useMapPaddingSync      │     │ useMapFollowUser        │
│ out: mapPaddingReady   │     │ in: userLocation        │
│      mapPaddingReadyRef│     │ out: bootTarget         │
└───────────┬────────────┘     └────────────┬────────────┘
            │                               │
            └──────────────┬────────────────┘
                           ▼
              ┌────────────────────────────┐
              │ useBootFlyCoordinator      │
              │ (inside useMapAnchor)      │
              │ on ANY gate change →       │
              │   tryBootFly (latched)     │
              └────────────────────────────┘
```

### API shape (replace `MapAnchorBootConfig`)

**Delete** `getTarget()` / `enabled` boot object. **Use plain data:**

```typescript
// useMapAnchor options
bootTarget: MapPosition | null;   // from useMapFollowUser when hasUserLocation
onBootIssued?: () => void;        // followDispatch bootFlown
```

`useMapFollowUser` builds `bootTarget` from coords + `followZoom` — no closure indirection.

### Boot coordinator (`use-boot-fly-coordinator.ts`)

Single module; **only** place that calls `tryBootFly` from React.

**Inputs:**

- `mapRef`, `enabled`
- `bootTarget: MapPosition | null`
- `mapPaddingReady` (state) + `mapPaddingReadyRef` (ref)
- `navigateToRef`, `smoothFlyDurationMs`
- `onBootIssued`

**Triggers (both required — order-independent by construction):**

1. **`useLayoutEffect`** — deps: `[bootTarget, mapPaddingReady, mapRef, enabled, …]`
  Run `attemptBoot()` after DOM/state flush when any gate changes.
2. **Padding completion hook** — `padding-sync.ts` calls `onPaddingReady?.()` **after** `mapPaddingReadyRef.current = true`. Composer wires `onPaddingReady: attemptBoot`.
3. **Style load** — if `!map.isStyleLoaded()`, `map.once('load', attemptBoot)` (keep; cleanup on unmount).

**Do not gate boot on session** — boot uses `navigateTo`, which calls `beginProgrammaticNavigation` (`map.stop()` + fly). Same as my-location / demo fly: preempts user pan momentum.

**Do not add:** idle/moveend/resize listeners on the map solely for boot (padding already retries on idle/resize).

### `tryBootFly` — keep pure, add failure reasons

```typescript
export type BootFlyBlockReason =
  | "disabled"
  | "no_target"
  | "no_map"
  | "style_not_loaded"
  | "padding_not_ready"
  | "already_flown"
  | "navigate_rejected";

export type TryBootFlyResult =
  | { issued: true }
  | { issued: false; reason: BootFlyBlockReason };
```

When `mapPaddingDebug` or `VITE_SHEET_MAP_DEBUG`, log every attempt + reason. Demo toolbar can show last block reason.

---

## Timing sequences

### A — Location first, padding second (common in browser)

```
map onLoad → mapRef published
userLocation arrives → bootTarget set
tryBootFly → BLOCK padding_not_ready
sheet DOM measurable → setPadding → mapPaddingReadyRef=true → onPaddingFirstSynced()
tryBootFly → ISSUE navigateTo → latch
```

### B — Padding first, location second

```
setPadding → mapPaddingReady=true
tryBootFly → BLOCK no_target
geolocation → bootTarget set
useLayoutEffect → tryBootFly → ISSUE
```

### C — GPS arrives during user pan

```
both gates true, user is dragging
tryBootFly → navigateTo (map.stop + fly) → latch
session → navigating (same as any programmatic fly)
```

---

## Module layout (after refactor)

```
camera/
  boot/try-boot-fly.ts              # pure gates + latch + result reason
  hooks/use-map-anchor/
    padding-sync.ts                 # onPaddingReady callback
    boot-coordinator.ts             # returns attemptBoot; only boot caller
    use-map-anchor.ts               # wire bootTarget, coordinator, padding
  hooks/use-map-follow-user.ts      # bootTarget + onBootIssued, no boot object
```

`useMapAnchor` **still owns** boot (satisfies phase-5c lesson #2). `useMapFollowUser` only supplies **data**, not a second effect graph.

---

## What we delete

- `MapAnchorBootConfig` with `getTarget()` / `enabled`
- `onBootAttemptRef` / padding→boot ref slot
- Any `attemptBootRef` / padding→boot ref wiring from abandoned attempts
- Extra map listeners for boot-only retries

---

## What stays unchanged

- `instance/camera-state` WeakMap latch + `releaseMapInstanceCameraState`
- Follow reducer `bootFlown` / `resetBoot` (UI `hasBootFlown`)
- `MapCanvas` publish-on-load contract
- `syncMapPaddingFromCanvas` / `applyMapPadding` — no boot inside
- 5D gesture settle — **not** in this work
- Demo gate: `MapUserLocation` only when `mapPaddingReady && userLocation`

---

## Test strategy (close the harness gap)


| Test                                                   | Purpose                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| Existing unit tests on `tryBootFly`                    | Gate matrix with reasons                                               |
| **New:** coordinator calls `onPaddingFirstSynced` path | Location first, padding later **without** `bootTarget` identity change |
| **New:** `MapCanvas` integration                       | `publishMapInstance` only after `emitLoad`; boot after                 |
| **New:** failed `navigateTo` then session idle         | Retry issues fly                                                       |
| Harness: defer `emitLoad` + defer geolocation          | Mirrors production order                                               |


Keep `mountAnchorWithDeferredBootTarget` but drive `**bootTarget` prop** instead of mutating `getTarget`.

---

## Implementation order

1. `**tryBootFly` → `TryBootFlyResult` + debug logging** (no behavior change yet)
2. **Replace `boot` prop with `bootTarget` + `onBootIssued`** at all call sites
3. **Add `useBootFlyCoordinator`** with dual trigger (layout effect + padding callback)
4. **Delete `use-map-anchor-boot.ts`**
5. **Add integration tests** for padding-second path via `onPaddingFirstSynced`
6. **Demo debug line** — show `bootBlockReason` when debug env on
7. **Manual verify ×10** → bump `SHEET_MAP_PHASE_5_PART` to 4

---

## Debug checklist (when it still fails in browser)

With `VITE_SHEET_MAP_DEBUG=true`:

1. Is `mapRef` non-null? (only after map load)
2. Is `mapPaddingReady` true? (`[map-padding-from-canvas] setPadding` log)
3. Is `bootTarget` non-null? (coords in sheet body copy)
4. Last `tryBootFly` reason? (new log)
5. Is `session` `idle` at attempt?
6. Did `navigateTo` return false? (`[map-navigate]` log)
7. Was duration forced to 0? (`sheetPhase` not `idle` → jump not fly)

---

## Decision log


| Choice                               | Rationale                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Keep boot inside `useMapAnchor`      | Phase 5C lessons; single session + `navigateTo` owner                                                       |
| Plain `bootTarget` not `getTarget()` | React-visible input; testable; no closure races                                                             |
| Padding callback + layout effect     | Fixes padding-second without boot inside `syncMapPaddingFromCanvas`                                         |
| No boot from `applyMapPadding`       | Prevents `navigateTo → padding → boot` stack overflow                                                       |
| Edge-trigger optional                | Latch already prevents double; level-trigger on gate changes is enough if coordinator runs on both triggers |



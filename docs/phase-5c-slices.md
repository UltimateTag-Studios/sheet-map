# Phase 5C — boot fly (sliced plan)

**Status:** 5C-4 landed. Shipped public hook: **`useMapUserTracking`** (`hooks/use-map-user-tracking.ts`). Historical slice text below may say `useMapUserTracking` — same hook, renamed at ship.

Parent doc: [`phase-5-parts.md`](phase-5-parts.md). Full spec: [`camera-fsm-plan.md`](camera-fsm-plan.md) §2 Rule 1 (boot).

Reference (port selectively): `packages/sheet-map-old/src/camera/use-map-anchor.ts` (`boot` config + internal `tryBootFly`), `use-map-user-tracking.ts` (→ `use-map-user-tracking.ts`).

---

## Do 5A / 5B affect the demo or what broke?

**No.** Verified by diff `4E..HEAD` (commits `5A`, `5B`):

| Part | Touched at runtime? | Demo / `useMapAnchor`? |
| ---- | ------------------- | ---------------------- |
| **5A** | `camera/follow/*` reducer + tests only | **No** — nothing imports it in app or anchor hook |
| **5B** | `shared/reposition-camera.ts`, boot WeakMap on `instance/camera-state.ts` + tests | **No** — exported but **not called** until 5E GPS loop |

`use-map-anchor.ts`, `apps/sheet-map-demo`, and padding sync are **identical to phase 4E** after reverting the abandoned 5C work.

**What broke** was only the uncommitted 5C attempt:

- Splitting padding sync across two hooks (`syncMapPaddingRef`)
- Removing `useMapAnchor`'s `liveSheetObscuredBottomPx` effects
- Wiring `tracking` into `applyMapPadding` before boot / gesture spec
- Swapping the demo to `useMapUserTracking` before boot was stable

**5A / 5B manual verify:** none required for demo behavior. Verification is `pnpm --filter @siegetag/sheet-map test` only. Keep them unless you want to delete phase 5 library prep entirely.

---

## Lessons (non-negotiable for 5C)

1. **`useMapAnchor` owns padding + boot ordering** — same hook, same effect graph as phase 4. Do not trigger `setPadding` from a sibling hook via refs.
2. **Boot runs only inside `useMapAnchor`** — via optional `boot` config + internal gate (old package pattern). Not from `syncMapPaddingFromCanvas` or `applyMapPadding`.
3. **Do not wire `applyMapPadding` follow realign in 5C** — that is 5D (gesture settle). 5C = boot fly only.
4. **Demo changes last** — prove library + tests before swapping `/sheet`.
5. **No linter suppressions** — see [`.cursor/rules/no_linter_suppressions.mdc`](../../.cursor/rules/no_linter_suppressions.mdc).

---

## Slice overview

```
5C-1  boot config + tryBootFly inside useMapAnchor     (library, tests only)
 └─► 5C-2  useMapUserTracking thin wrapper               (library, tests only)
      └─► 5C-3  MapUserLocation + useDemoUserLocation (visual + app hook, no camera change)
           └─► 5C-4  Wire demo to useMapUserTracking    (manual verify)
```

---

## 5C-1 — Boot gate inside `useMapAnchor`

**Goal:** One-shot boot fly after `mapPaddingReady` + style loaded. **No demo. No `useMapUserTracking`. No follow padding.**

| Module | Action |
| ------ | ------ |
| `use-map-anchor.ts` | Add optional `boot?: MapAnchorBootConfig \| null` (port from `sheet-map-old`) |
| `use-map-anchor.ts` | Internal `tryBootFly`: gate on `paddingReady`, `isStyleLoaded`, `session === idle`, `!hasBootIssuedForMapInstance`, `getTarget()` |
| `use-map-anchor.ts` | On successful boot `navigateTo`: `markBootFlownForMapInstance` + `boot.onIssued()` |
| `use-map-anchor.ts` | `useEffect` on `[tryBootFly]` deps (same as old: padding ready, boot enabled, mapRef) |
| `try-boot-fly.ts` | Optional pure extract for unit tests only; **call site stays in anchor hook** |

**Do not change:**

- `liveSheetObscuredBottomPx` padding effects (keep both existing `useEffect`s)
- `applyMapPadding` follow branch (leave unwired)
- Demo screen

**Automated verify:**

- [x] `use-map-anchor.test.ts` — existing padding/session tests still pass
- [x] New tests: boot flies once when `boot.enabled` + padding ready; skips when latch set; skips when `getTarget()` null
- [x] Hardening: delayed style load, async `getTarget`, no double-boot, remount latch reset
- [x] `padding-anchor.integration.test.ts` unchanged behavior
- [x] `pnpm --filter @siegetag/sheet-map test` exits 0

**Manual verify:** none (demo still `useMapAnchor` without `boot`).

---

## 5C-2 — `useMapUserTracking` (library only)

**Goal:** Compose `useMapAnchor` + `reduceMapFollow` (5A) + boot config (5C-1). **Still no demo.**

| Module | Action |
| ------ | ------ |
| `use-map-user-tracking.ts` | `startTracking` when `userLocation` arrives |
| `use-map-user-tracking.ts` | Pass `boot: { enabled, getTarget, onIssued, durationMs }` into `useMapAnchor` |
| `use-map-user-tracking.ts` | `onMapInstanceReleased` → `resetBoot` reducer event (WeakMap cleared in 5B `releaseMapInstanceCameraState`) |
| `use-map-user-tracking.ts` | **Does not** pass `followUser` / `followTarget` to `applyMapPadding` (5D) |
| `use-map-user-tracking.ts` | **Does not** add padding sync refs or duplicate geometry hooks |

**Automated verify:**

- [x] `use-map-user-tracking.test.ts` — boot once; boot when location arrives async; no boot when `userLocation` null
- [x] `use-map-anchor.test.ts` still pass
- [x] Full package test suite green

**Manual verify:** none.

---

## Monolith cleanup (`useMapAnchor` split + topic folders) — done

Split `camera/hooks/use-map-anchor/` into effect-sized modules; moved primitives into topic folders:

```
camera/
  anchor/          # session FSM + resolve-move-end (5D prep)
  follow/
  padding/         # apply, compute, sync, sync-from-canvas
  boot/            # try-boot-fly
  instance/        # camera-state (per-map latches)
  shared/          # map-position, reposition-camera, when-map-style-ready
  hooks/
    use-map-user-tracking.ts
    use-map-anchor/
      boot-coordinator.ts    # returns attemptBoot; only boot caller
      padding-sync.ts        # onPaddingReady callback (not ref slot)
      navigate.ts
      listeners.ts           # thin: resolveMoveEnd + dispatch
      sheet-settle.ts
      instance-release.ts
      use-map-anchor.ts      # thin composer
  testing/         # harness + index barrel
```

| Module | Responsibility |
| ------ | -------------- |
| `types.ts` | Public option types (+ `trackingReleaseThresholdPx` stub for 5D) |
| `session-refs.ts` | Shared ref bundle for sub-hooks |
| `padding-sync.ts` | Padding state + four sync effects; `onPaddingReady` once |
| `navigate.ts` | `navigateTo` |
| `boot-coordinator.ts` | `attemptBoot` via `tryBootFly` |
| `listeners.ts` | drag/zoom/moveend + bootAnchor |
| `sheet-settle.ts` | Sheet idle → settle navigating |
| `instance-release.ts` | Map instance cleanup (StrictMode-safe) |
| `use-map-anchor.ts` | Thin composer (~120 lines) |

Also: shared test harness `camera/testing/`, `canvas/dot/index.ts` barrel.

**Verify:** 103 tests green, typecheck + lint clean.

---

## 5C-3 — Location dot + demo geolocation hook (no camera wiring)

**Goal:** See user position on map; app supplies coords. **Demo still uses `useMapAnchor` for camera** — only add visual + data hook.

| Module | Action |
| ------ | ------ |
| `canvas/user-location/*` | Port `MapUserLocation` from `sheet-map-old` |
| `apps/.../use-demo-user-location.ts` | `getCurrentPosition` + `watchPosition`; **no** Kanarraville fallback |
| Demo `/sheet` | Render `MapUserLocation` when `userLocation` set; **keep** `useMapAnchor` |

**Automated verify:**

- [x] Package tests still pass (no new camera tests required)

**Manual verify:**

- [ ] Grant location → blue dot appears at GPS
- [ ] Deny location → no dot; map + padding + fly-to-demo unchanged
- [ ] `VITE_SHEET_MAP_DEBUG=true` → `setPadding` log + debug overlay still reliable (phase 4 bar)

**Gate:** Do not proceed to 5C-4 until padding/overlay are solid with dot visible.

---

## 5C-4 — Wire demo to `useMapUserTracking`

**Goal:** Boot fly on load when location granted. **Single swap:** `useMapAnchor` → `useMapUserTracking` with same `liveSheetObscuredBottomPx` / `sheetPhase` props.

| Module | Action |
| ------ | ------ |
| Demo `/sheet` | `useMapUserTracking({ mapRef, userLocation, liveSheetObscuredBottomPx, sheetPhase, mapPaddingDebug })` |
| Demo `/sheet` | Keep manual “Fly to demo point” button |
| `src/index.ts` | `SHEET_MAP_PHASE_5_PART = 4` when manual verify passes |

**Automated verify:**

- [x] Full test suite green
- [x] `pnpm lint:fix` clean

**Manual verify (required):**

- [x] **Padding baseline:** refresh ×3 with debug on → `setPadding` log every time; debug overlay visible; sheet hint not stuck on `(not ready)`
- [x] **Boot:** grant location → exactly **one** smooth fly to blue dot per load
- [x] **Boot:** refresh ×5 → one boot fly per load (not per padding tick)
- [x] **Deny:** location denied → map works; no boot fly; no crash
- [x] **Strict Mode:** navigate away and back → boot can run again on fresh map instance
- [x] **No regressions:** fly-to-demo still works; pan + sheet drag behave as phase 4
- [x] **Not in 5C:** GPS dot tracking map (`instant `navigateTo``) — that's 5E; dot may stay fixed while you pan until 5E

---

## Explicitly deferred (not 5C)

| Item | Part |
| ---- | ---- |
| `applyMapPadding` follow realign during sheet drag | 5D |
| Gesture settle, 40px threshold, snap-back | 5D |
| `instant `navigateTo`` GPS loop | 5E |
| `MapMyLocationButton` | 5E |
| `stopTracking` on manual `navigateTo` away from user | 5D or 5E |

---

## If 5C-4 manual verify fails

1. **Do not** add ref-based padding sync or extra effects — fix ordering inside `useMapAnchor` or boot deps.
2. Revert demo to `useMapAnchor` only; keep 5C-1/5C-2 library code.
3. Document failure mode in this file under **Known issues** before next attempt.

### Known issues

**5C-3 — padding race with early `MapUserLocation` mount (fixed):** Cached geolocation can return before `mapRef` is published and before the first `setPadding`. Mounting `MapUserLocation` inside `MapCanvas` adds style layers during that bootstrap window and intermittently left `mapPaddingReady` false (no debug overlay / no `setPadding` log). **Fix:** demo gates the dot on `mapPaddingReady`; `useMapAnchor` retries padding sync on `idle` + `resize` until ready.

**5C-4 — boot fly (fixed):** Boot coordinator (`boot-coordinator.ts`) gates on `bootTarget` + `mapPaddingReady`. Uses `navigateTo` (no session gate). Padding sync calls `onPaddingReady` → `attemptBoot` once when first `setPadding` succeeds. `tryBootFly` latch prevents double-fly.

---

## After 5C

Update [`phase-5-parts.md`](phase-5-parts.md) part 5C checklist. Continue with **5D** (gesture settle) per parent doc.

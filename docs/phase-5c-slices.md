# Phase 5C — boot fly (sliced plan)

**Status:** 5C-3 complete (location dot + demo geolocation). Next: monolith cleanup, then 5C-4 demo swap.

Parent doc: [`phase-5-parts.md`](phase-5-parts.md). Full spec: [`camera-fsm-plan.md`](camera-fsm-plan.md) §2 Rule 1 (boot).

Track sub-slices via checklist below. Bump `SHEET_MAP_PHASE_5_PART` only when **5C-4** lands and manual verification passes.

Reference (port selectively): `packages/sheet-map-old/src/camera/use-map-anchor.ts` (`boot` config + internal `tryBootFly`), `use-map-follow-user.ts`.

---

## Do 5A / 5B affect the demo or what broke?

**No.** Verified by diff `4E..HEAD` (commits `5A`, `5B`):

| Part | Touched at runtime? | Demo / `useMapAnchor`? |
| ---- | ------------------- | ---------------------- |
| **5A** | `camera/follow/*` reducer + tests only | **No** — nothing imports it in app or anchor hook |
| **5B** | `reposition-camera.ts`, boot WeakMap on `map-instance-camera-state.ts` + tests | **No** — exported but **not called** until 5E GPS loop |

`use-map-anchor.ts`, `apps/sheet-map-demo`, and padding sync are **identical to phase 4E** after reverting the abandoned 5C work.

**What broke** was only the uncommitted 5C attempt:

- Splitting padding sync across two hooks (`syncMapPaddingRef`)
- Removing `useMapAnchor`'s `liveSheetObscuredBottomPx` effects
- Wiring `followUser` into `applyMapPadding` before boot / gesture spec
- Swapping the demo to `useMapFollowUser` before boot was stable

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
 └─► 5C-2  useMapFollowUser thin wrapper               (library, tests only)
      └─► 5C-3  MapUserLocation + useDemoUserLocation (visual + app hook, no camera change)
           └─► 5C-4  Wire demo to useMapFollowUser    (manual verify)
```

---

## 5C-1 — Boot gate inside `useMapAnchor`

**Goal:** One-shot boot fly after `mapPaddingReady` + style loaded. **No demo. No `useMapFollowUser`. No follow padding.**

| Module | Action |
| ------ | ------ |
| `use-map-anchor.ts` | Add optional `boot?: MapAnchorBootConfig \| null` (port from `sheet-map-old`) |
| `use-map-anchor.ts` | Internal `tryBootFly`: gate on `paddingReady`, `isStyleLoaded`, `session === idle`, `!hasBootFlownForMapInstance`, `getTarget()` |
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

## 5C-2 — `useMapFollowUser` (library only)

**Goal:** Compose `useMapAnchor` + `reduceMapFollow` (5A) + boot config (5C-1). **Still no demo.**

| Module | Action |
| ------ | ------ |
| `use-map-follow-user.ts` | `startFollowUser` when `userLocation` arrives |
| `use-map-follow-user.ts` | Pass `boot: { enabled, getTarget, onIssued, durationMs }` into `useMapAnchor` |
| `use-map-follow-user.ts` | `onMapInstanceReleased` → `resetBoot` reducer event (WeakMap cleared in 5B `releaseMapInstanceCameraState`) |
| `use-map-follow-user.ts` | **Does not** pass `followUser` / `followTarget` to `applyMapPadding` (5D) |
| `use-map-follow-user.ts` | **Does not** add padding sync refs or duplicate geometry hooks |

**Automated verify:**

- [x] `use-map-follow-user.test.ts` — boot once; boot when location arrives async; no boot when `userLocation` null
- [x] `use-map-anchor.test.ts` still pass
- [x] Full package test suite green

**Manual verify:** none.

---

## Monolith cleanup (`useMapAnchor` split)

**When:** After **5C-3**, before **5C-4** (demo swap to `useMapFollowUser`).

5C-2 adds a thin wrapper only; 5C-3 adds dot + app geolocation hook. Split effect-sized modules once library surface for 5C is complete, so 5C-4 wires into a smaller anchor hook and manual verify is easier to reason about.

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

## 5C-4 — Wire demo to `useMapFollowUser`

**Goal:** Boot fly on load when location granted. **Single swap:** `useMapAnchor` → `useMapFollowUser` with same `liveSheetObscuredBottomPx` / `sheetPhase` props.

| Module | Action |
| ------ | ------ |
| Demo `/sheet` | `useMapFollowUser({ mapRef, userLocation, liveSheetObscuredBottomPx, sheetPhase, mapPaddingDebug })` |
| Demo `/sheet` | Keep manual “Fly to demo point” button |
| `src/index.ts` | `SHEET_MAP_PHASE_5_PART = 4` when done |

**Automated verify:**

- [ ] Full test suite green
- [ ] `pnpm lint:fix` clean

**Manual verify (required):**

- [ ] **Padding baseline:** refresh ×3 with debug on → `setPadding` log every time; debug overlay visible; sheet hint not stuck on `(not ready)`
- [ ] **Boot:** grant location → exactly **one** smooth fly to blue dot per load
- [ ] **Boot:** refresh ×5 → one boot fly per load (not per padding tick)
- [ ] **Deny:** location denied → map works; no boot fly; no crash
- [ ] **Strict Mode:** navigate away and back → boot can run again on fresh map instance
- [ ] **No regressions:** fly-to-demo still works; pan + sheet drag behave as phase 4
- [ ] **Not in 5C:** GPS dot tracking map (`repositionCamera`) — that's 5E; dot may stay fixed while you pan until 5E

---

## Explicitly deferred (not 5C)

| Item | Part |
| ---- | ---- |
| `applyMapPadding` follow realign during sheet drag | 5D |
| Gesture settle, 40px threshold, snap-back | 5D |
| `repositionCamera` GPS loop | 5E |
| `MapMyLocationButton` | 5E |
| `stopFollowUser` on manual `navigateTo` away from user | 5D or 5E (decide when wiring follow padding) |

---

## If 5C-4 manual verify fails

1. **Do not** add ref-based padding sync or extra effects — fix ordering inside `useMapAnchor` or boot deps.
2. Revert demo to `useMapAnchor` only; keep 5C-1/5C-2 library code.
3. Document failure mode in this file under **Known issues** before next attempt.

### Known issues

**5C-3 — padding race with early `MapUserLocation` mount (fixed):** Cached geolocation can return before `mapRef` is published and before the first `setPadding`. Mounting `MapUserLocation` inside `MapCanvas` adds style layers during that bootstrap window and intermittently left `mapPaddingReady` false (no debug overlay / no `setPadding` log). **Fix:** demo gates the dot on `mapPaddingReady`; `useMapAnchor` retries padding sync on `idle` + `resize` until ready.

---

## After 5C

Update [`phase-5-parts.md`](phase-5-parts.md) part 5C checklist. Continue with **5D** (gesture settle) per parent doc.

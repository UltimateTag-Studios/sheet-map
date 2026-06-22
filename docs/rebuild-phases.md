# Rebuild phases — what to do in each phase

Step-by-step guide for `@siegetag/sheet-map`. Do **one phase at a time**. Do not start the next phase until the current one has **tests + demo proof + manual checklist**.

**Behavior spec (phases 4–5):** [`camera-fsm-plan.md`](camera-fsm-plan.md)

**Reference code (read, do not import):**

| Source | Use for |
| ------ | ------- |
| `packages/sheet-map-old` (`@siegetag/sheet-map-previous`) | Recent rebuild attempt — viewport, camera, demo patterns |
| `packages/sheet-map-old-old` (`@siegetag/sheet-map-old`) | Routes, markers, Capacitor shell |
| `apps/sheet-map-demo/src/screens/reference/` | Demo screens from previous attempt |

---

## How to finish any phase

1. Implement in `packages/sheet-map/src/…`
2. Add or port tests — `pnpm --filter @siegetag/sheet-map test`
3. Export public API from `src/index.ts`
4. Wire demo route in `apps/sheet-map-demo` (replace `PhaseNotReadyScreen` for that route)
5. Manual check in `pnpm dev:sheet-map-demo`
6. Bump `SHEET_MAP_REBUILD_PHASE` in `packages/sheet-map/src/index.ts`
7. `pnpm lint:fix` from repo root

---

## Phase 0 — Package scaffold ✅

**Goal:** Empty package, demo home, docs in place.

**You have:**

- `packages/sheet-map` with `SHEET_MAP_REBUILD_PHASE = 0`
- `docs/camera-fsm-plan.md`, `docs/camera-rules.md`
- Demo home at `/` — other routes show “not implemented”

**Nothing else required.**

---

## Phase 1 — Visible viewport math

**Goal:** Compute the visible map rectangle (sheet + chrome) from live DOM, without Mapbox yet.

### Package (`src/viewport/`)

| Deliverable | Notes |
| ----------- | ----- |
| `resolveMapVisibleViewport` | Canvas geometry + live `.sheet-slide` top only |
| `readLiveSheetObscuredBottomPx` | Distance from canvas bottom to sheet top |
| `readMapCanvasScreenGeometry` | Canvas position/size on screen |
| `useVisibleViewportSync` | Hook for **canvas placeholder** (no `mapRef` yet) |
| `MapVisibleAreaDebug` | Orange dashed crosshair — renders only when `clientRect !== null` |
| Types | `PixelRect`, `MapVisibleViewport`, `SheetSnapHeightsPx`, `MapObscuredInsets` |

**Rules:**

- **Live DOM only** — read `.sheet-slide` under `.sheet-host`. No snap-height fallback at runtime (snap math can disagree with padding and hides “not ready”).
- `resolveMapVisibleViewport` returns `null` when the canvas has zero size or `.sheet-slide` is missing / not measurable.
- `clientRect === null` when resolve returns null or visible width/height is zero — overlay correctly hidden.
- Tests use DOM fixtures (`mountSheetHostFixture`) or pass explicit obscured px to pure math helpers — not snap-only golden rects.

### Tests

| Test file | Covers |
| --------- | ------ |
| `resolve-map-visible-viewport.live-dom.test.ts` | Live sheet slide position |
| `resolve-map-visible-viewport.unmeasurable.test.ts` | Null when no sheet slide or zero canvas |
| `resolve-map-visible-viewport.chrome-insets.test.ts` | Fixed chrome insets (with DOM fixture) |
| `use-visible-viewport-sync.test.ts` | Hook updates when sheet mounts |

Port from `@siegetag/sheet-map-previous` — rewrite, do not re-export.

### Demo

| Route | Screen |
| ----- | ------ |
| `/viewport` | Sheet + **canvas placeholder** + `MapVisibleAreaDebug` |
| `/viewport/tab-bar` | Same with tab bar `bottomChromeReserve` |

Copy starting point: `apps/sheet-map-demo/src/screens/reference/viewport-debug-screen.tsx` — strip `@siegetag/sheet-map` imports; use new exports.

### Done when

- [ ] Crosshair aligns with sheet top (aligned + tab-bar variants)
- [ ] Dragging sheet updates crosshair live
- [ ] Tests pass
- [ ] `SHEET_MAP_REBUILD_PHASE = 1`

---

## Phase 2 — Map canvas

**Goal:** Mapbox GL fills the sheet host. No sheet overlay yet (or sheet below map only for layout).

### Package (`src/canvas/`)

| Deliverable | Notes |
| ----------- | ----- |
| `MapCanvas` | `react-map-gl` wrapper, full-size root class |
| `publishMapInstance` | Publish `mapRef` **on `onLoad` only** (style ready) |
| `reuseMaps` prop | Demo uses `false` |
| `styles/sheet-map.css` | `.sheet-map-canvas-root`, host sizing |

### Tests

| Test | Covers |
| ---- | ------ |
| `map-canvas.test.tsx` | Renders, publishes ref on load |

### Demo

| Route | Screen |
| ----- | ------ |
| `/canvas` | `SheetHost` + `MapCanvas`, pan/zoom |

Reference: `screens/reference/map-canvas-screen.tsx`

### Done when

- [ ] Map fills stage; token from `.env` works
- [ ] `mapRef` null until load (document in code)
- [ ] Tests pass
- [ ] `SHEET_MAP_REBUILD_PHASE = 2`

---

## Phase 3 — Sheet on map

**Goal:** Sheet stacked on map; live obscured height flows to hooks (padding not required yet).

### Package (`src/shell/` + `src/viewport/dom/`)

| Deliverable | Notes |
| ----------- | ----- |
| `MapFrame` | Shell + viewport chrome |
| `MapSheetLayout` | Header/body slots for `@siegetag/sheet` |
| `useLiveSheetObscuredBottomPx` | Live `sheetObscuredBottomPx` + `sheetPhase` / `sheetMotionActive` |
| `useMapVisibleViewportSync` | Same as phase 1 but driven by real `mapRef` |
| `MapVisibleAreaOverlay` | Positions overlay children in visible rect |

### Tests

| Test | Covers |
| ---- | ------ |
| `map-sheet-layout.test.tsx` | Layout structure |
| `use-map-visible-viewport-sync.test.ts` | Sync with map + live sheet |

### Demo

| Route | Screen |
| ----- | ------ |
| `/sheet` | Map + sheet, debug line showing obscured px / center offset |
| `/sheet/tab-bar` | With `bottomChromeReserve` |

Reference: `screens/reference/sheet-on-map-screen.tsx` (camera hooks come in phase 4–5).

### Done when

- [ ] Sheet drag updates obscured px and visible rect
- [ ] Map still pannable under sheet
- [ ] Tests pass
- [ ] `SHEET_MAP_REBUILD_PHASE = 3`

---

## Phase 4 — Padding + anchor (session FSM)

**Goal:** Live `setPadding`, anchor session FSM, programmatic `navigateTo` — **no follow-user yet**.

**Read first:** [`camera-fsm-plan.md`](camera-fsm-plan.md) §2 Rules 2–3, §7–8.

### Package (`src/camera/`)

| Deliverable | Notes |
| ----------- | ----- |
| `reduceMapAnchor` | Sessions: `idle` \| `userGesture` \| `navigating` |
| `syncMapPadding` + `applySheetPadding` | Padding matrix; **no defer/flush** |
| `whenMapStyleReady` | Style load + idle recovery |
| `useMapAnchor` | `navigateTo`, `setAnchor`, padding lifecycle, **single** `moveend` dispatcher |
| `evaluateGestureAtGestureSettle` | Pure settle decision (snap-back calls `navigateTo` in phase 5) |
| `map-instance-camera-state` | Per-map latches; release on unmount |

**Invariants:**

- `syncSheetPadding` and `navigateTo` are **acyclic** (never boot/padding loop).
- Padding `moveend` → `consumePaddingSyncMoveEnd` only.
- During `userGesture` (incl. momentum): `setPadding` only — no camera jump.

### Tests

| Test | Covers |
| ---- | ------ |
| `sync-map-padding.test.ts` | Deduped setPadding |
| `padding-anchor.integration.test.ts` | Padding + session matrix |
| `use-map-anchor.test.ts` | Gesture, navigating, threshold |

### Demo

Extend `/sheet` screens:

- Show `session`, `padding.bottom`, anchor coords
- Optional: `VITE_SHEET_MAP_DEBUG=true` → `[map-padding-sync]` logs
- **No** boot fly yet — manual `navigateTo` or pan-to-settle anchor only

### Done when

- [ ] Padding tracks sheet drag (may log twice: 0 → measured on first load — OK)
- [ ] Pan settles → anchor commits at `idle`
- [ ] `navigateTo` enters `navigating`, jumps while sheet moves
- [ ] Refresh ×5: padding applies reliably
- [ ] Tests pass
- [ ] `SHEET_MAP_REBUILD_PHASE = 4`

---

## Phase 5 — Follow user

**Goal:** Boot fly, GPS reposition, my-location button, 40px snap-back — full camera FSM.

**Read first:** [`camera-fsm-plan.md`](camera-fsm-plan.md) §2 Rule 1 (boot), Rule 3 (gesture settle), §6.

### Package

| Deliverable | Notes |
| ----------- | ----- |
| `reduceMapFollow` | `followUser`, `hasBootFlown` |
| `useMapFollowUser` | Composes `useMapAnchor`; boot config; GPS via `repositionCamera` |
| `repositionCamera` | Instant jump, session stays `idle` |
| `MapUserLocation` + `MapMyLocationButton` | Dot + button; `isFollowFocused` = blue when boot issued |
| `tryBootFly` | Separate from padding sync — after `paddingReady` only |

**Boot order:**

```
style ready → syncSheetPadding → paddingReady → tryBootFly → navigateTo (once per map)
```

### Tests

| Test | Covers |
| ---- | ------ |
| `use-map-follow-user.test.ts` | Boot once, GPS jump, no stack overflow |
| `map-instance-camera-state.test.ts` | Refresh / unmount boot latch |
| Integration | Pan + sheet during momentum; snap-back ≤40px |

### Demo

| Feature | Check |
| ------- | ----- |
| Load / refresh | Padding → boot fly → blue button |
| My-location | Smooth fly via `navigateTo` |
| Pan >40px | Follow releases |
| Pan ≤40px + lift | Snap-back fly |
| GPS while following | Instant jump, not fly |

Reference: `screens/reference/sheet-on-map-screen.tsx`, `use-demo-user-location.ts`

### Done when

- [ ] §11 manual checklist in `camera-fsm-plan.md` passes
- [ ] Tests pass
- [ ] `SHEET_MAP_REBUILD_PHASE = 5`

---

## Phase 6 — Routes, markers, Capacitor parity

**Goal:** Port shell features from `@siegetag/sheet-map-old` so Capacitor can switch packages.

### Package

Port selectively from `packages/sheet-map-old-old`:

| Area | Examples |
| ---- | -------- |
| Layout | `MapLayout`, route registration |
| Markers | `MapMarkers`, selection |
| Routes | `useRegisterMapRoute`, `useMapRouteContext` |
| Gesture | `useTouchClickActivation` for map chrome buttons |

**Do not** port camera defer/flush or duplicate FSM — use phase 4–5 implementation only.

### Tests

Port relevant tests from `sheet-map-old-old` or write new integration tests.

### Demo / product

- Optional demo routes for markers
- Plan Capacitor migration (`apps/capacitor` still on `@siegetag/sheet-map-old` until this phase is verified)

### Done when

- [ ] Capacitor map screens work on `@siegetag/sheet-map`
- [ ] Feature parity checklist agreed with product
- [ ] `SHEET_MAP_REBUILD_PHASE = 6`

---

## Phase summary

| Phase | Name | Demo route(s) | Primary folder |
| ----- | ---- | ------------- | -------------- |
| 0 | Scaffold | `/` | package root |
| 1 | Viewport math | `/viewport`, `/viewport/tab-bar` | `src/viewport/` |
| 2 | Map canvas | `/canvas` | `src/canvas/` |
| 3 | Sheet on map | `/sheet`, `/sheet/tab-bar` | `src/shell/`, `src/viewport/dom/` |
| 4 | Padding + anchor | `/sheet` (+ debug) | `src/camera/` |
| 5 | Follow user | `/sheet` (full) | `src/camera/`, `src/canvas/user-location/` |
| 6 | Routes + markers | Capacitor | `src/shell/`, routes |

---

## What not to do (any phase)

- Import from `@siegetag/sheet-map-previous` in the new package
- Defer/batch padding on momentum `moveend`
- Boot or `navigateTo` from inside `syncSheetPadding`
- `biome-ignore` on effect deps instead of fixing architecture
- Skip tests and jump phases because demo “looks fine once”

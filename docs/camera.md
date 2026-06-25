# Camera and padding

How `@siegetag/sheet-map` drives the Mapbox camera, padding, and follow-user behavior.

## Architecture

Two pure machines with thin adapters:

- **`MapCameraMachine`** — session, tracking, boot, padding phase, navigate effects
- **`MapShellMachine`** — sheet snap, item selection, fly-then-open orchestration

Mapbox listeners and padding DOM sync **dispatch events**; hooks **run effects** (`moveCamera`, `applyPadding`, `releaseTracking`).

## Sessions

| Session | Driver | Typical duration |
| ------- | ------ | ---------------- |
| `idle` | Nobody (at rest) | Between user pans and programmatic moves |
| `userGesture` | User (pan / zoom) | From `dragstart` / `zoomstart` until gesture **fully** settles |
| `flying` | App (animated fly) | From `navigateTo` with `duration > 0` until target reached |

Orthogonal state:

- **Tracking** — `useMapUserTracking().tracking`; machine `tracking: "on" | "off"`
- **Boot** — `boot: "none" | "pending" | "done"` on the camera machine (replaces per-map WeakMap latches)
- **Padding** — `padding.phase: "pending" | "ready"`; `mapPaddingReady` mirrors ready phase

`userGesture` includes momentum: session stays active until `moveend` **and** `map.isMoving()` is false.

## Route enter fly and padding

Inside `MapLayout`, the shell route FSM owns the first fly:

1. Route registers with `useRegisterMapRoute(..., routeKey)` → default `flyToUser`, or `useRouteEnterFly` → `flyToItem`.
2. FSM waits for sheet idle, map padding, and (for user location) `hasUserLocation`.
3. Route entry dispatches `recenterUser` / `selectItem` shell events (with `source: "route"`). Effects call camera `recenterOnUser` or `navigateRequested`. Zoom is resolved in the shell reducer from `cameraSnapshot.anchorZoom` and `defaultEnterFlyZoom`.

`useMapCamera` still supports an explicit `bootRequest` for low-level tests and harnesses; `useMapUserTracking` does not auto-boot.

Padding DOM adapter dispatches `paddingMeasured` when sheet obscured height is readable.

## `navigateTo` (public camera API)

Shell `useMapShell().navigateTo` dispatches a **`navigateTo`** shell event → immediate **`flyToPosition`** effect → camera `navigateTo`. Selection clears unless `preserveTracking: true`.

Low-level camera `navigateTo` translates to `navigateRequested` on the camera machine. Sheet phase forcing jump is decided in the reducer (`resolveNavigateMode`), not in callers.

| Call | Session | Use |
| ---- | ------- | --- |
| `navigateTo`, `duration > 0` | → `flying` → `idle` | Boot, recenter, snap-back, fly to item |
| `navigateTo`, `duration === 0` | stays `idle` | GPS ticks while tracking |

| Option | Default | Meaning |
| ------ | ------- | ------- |
| `duration` | `0` | Fly ms when sheet idle; machine forces jump while sheet moves |
| `preserveTracking` | `false` | Keep follow-user on after the move |

While **`flying`** or **`idle`** and sheet geometry changes: machine emits `applyPadding` with `realign: true` → jump to stored **anchor** (unless `userGesture`).

During **`userGesture`**: padding changes apply **`setPadding` only** — no camera realign from padding effects.

### Gesture settle

On `moveend` when the map is no longer moving:

1. If following and pan moved the center more than `trackingReleaseThresholdPx` (default 40) → release tracking.
2. If following and within threshold → snap-back fly with `preserveTracking: true`.
3. Else → commit anchor and return to `idle`.

## User location (app responsibility)

`@siegetag/sheet-map` does **not** call `navigator.geolocation` or Capacitor APIs. Pass `userLocation: { lat, lng, accuracyMeters? } | null` from the app.

- Camera `recenterOnUser()` → dispatches `recenterRequested`, keeps tracking.
- Shell `recenterUser()` → shell event → `flyToUser` effect when gates open.
- GPS updates while tracking → `gpsFix` event → instant jump while tracking.
- Fly to a map item → shell dispatches `navigateRequested` with `preserveTracking: false`.

Set `config.debug: true` or `VITE_SHEET_MAP_DEBUG=true` for padding, GPS, and `[map-shell]` dispatch/effect console logs.

## Selection + sheet

Shell **`MapShellMachine`** owns sheet geometry and a single **`ShellIntent`**:

| State field | Meaning |
| ----------- | ------- |
| `sheetSnap` | Where the sheet **has arrived** — updates on `sheetSettled` only |
| `sheetTarget` | Where the sheet **is going** — `null` when resting with no in-flight command |
| `sheetPhase` | `resting` \| `dragging` \| `settling` (Sheet `idle` → `resting` at boundary) |
| `cameraSnapshot` | Camera session, padding ready, GPS, anchor zoom |

**Sheet prop:** `sheetTarget ?? sheetSnap`. **Planning:** `snapForPlanning` — in motion use destination, when resting use arrival.

**Gesture destination:** during `dragging` / `settling`, `sheetLayoutFrameChanged` mirrors Sheet `restingSnap` into `sheetTarget`. **Drag-close cancels** stale `awaitGates` intents unless `sheetTarget === "collapsed"` with `openHalfAfterFly` (select-during-dismiss). **`clearSelection` / `recenterUser` / `navigateTo`** cancel in-flight `sheetTarget` without moving `sheetSnap`.

**Arrival commit:** `sheetSettled` commits `sheetSnap` only (no camera effects). **Fly on layout-frame idle** (`sheetPhase` → `resting`): `syncCameraSheetPhase(idle)` then fly when gates pass — so the camera leaves settling and padding realign before navigate. Resting layout frames also commit missed arrivals (`restingSnap !== sheetSnap`) and retry fly.

**Snap-close cancel:** `sheetSnapChangeStarted("collapsed")` cancels stale `awaitGates` intents (same as drag-close) unless select-during-dismiss.

**Collapsed settle (S2):** only preserves `awaitGates` when `intent.sheetTarget === "collapsed"`; otherwise deselect and clear intent. **`halfOpenAfterFlyPending`** tracks collapsed fly-first until half opens (`flying → idle` or jump-fly idle snapshot).

**Items:** every `MapItem` and `selectItem` call requires `{ lat, lng }` — omit unlocated rows from `items` at the app layer.

### Shell events (sheet + camera)

| Event | Source |
| ----- | ------ |
| `sheetLayoutFrameChanged` | Sheet `onLayoutFrameChange` |
| `sheetSettled` | Sheet `onSnapSettled` |
| `sheetSnapChangeStarted` | Sheet `onSnapChange` (settle start) |
| `cameraSnapshotSynced` | Hook `useEffect` when camera session / padding / GPS / anchor zoom change |

Sheet phase changes emit **`syncCameraSheetPhase`** effect → camera `sheetPhaseChanged`.

### Intent phases

`ShellIntent` is a discriminated union:

- **`awaitGates`** — pending camera fly; waits for `sheetPhase === resting`, padding, and `sheetSnap === intent.sheetTarget`
- **`awaitCameraIdleForHalf`** — collapsed select: open half after `cameraSession: flying → idle`

**`emitCameraFlyIfReady`** emits `flyToItem` / `flyToUser` when gates pass.

Padding-before-fly on each navigate is enforced by the **camera machine** (`applyPadding` then `moveCamera` in one effect batch).

| Trigger | Effective snap | `sheetTarget` | Camera | Notes |
| ------- | -------------- | ------------- | ------ | ----- |
| **Item** | collapsed | collapsed | fly when gates open | open half after fly completes |
| **Item** | half | half | fly when gates open | |
| **Item** | full | half | fly after `sheetSnap === half` | fixes reselect-at-full |
| **User location** | any | no change | fly/recenter when gates open | never opens half |
| **Any** | sheet dragged while camera flying | — | jump (padding relign) | camera physics only |

Latest user action **replaces** the prior intent (location mid-fly → item select works).

- Tap map marker or list row → `selectItem`
- Close sheet → `dismissSheet` → deselect
- Location button → `recenterUser` (clears selection, flies to user; sheet unchanged). Visible when `myLocationButton`; **disabled** when `!userLocation || !mapPaddingReady`. Custom slot: `renderMyLocationButton(onPress, tracking, ariaLabel, disabled)`.
- `navigateTo` without `preserveTracking` clears selection via shell reducer

Camera **`navigateRequested`** applies padding before `moveCamera` on each navigate.

## Map instance lifecycle

`mapInstanceReleased` resets camera machine state and bumps `mapGeneration`. Padding moveend suppression lives in machine `padding.suppressNextMoveEnd` only.

## Manual QA checklist

- [ ] Load: padding before fly; location button shows tracking
- [ ] Recenter: smooth fly, no crash
- [ ] Pan + sheet drag while following: padding tracks; snap-back at settle if ≤ threshold
- [ ] Pan > threshold while following: tracking releases
- [ ] Select item (map + list): half sheet, marker highlight, fly
- [ ] Close sheet: deselects (button and drag)

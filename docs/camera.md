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
3. Effects call `recenterOnUser` or `navigateRequested` on the camera machine. Optional `zoom` on the enter-fly entry: explicit value wins; omitted zoom preserves the current map level when set, otherwise the shell `initialZoom` applies.

`useMapCamera` still supports an explicit `bootRequest` for low-level tests and harnesses; `useMapUserTracking` does not auto-boot.

Padding DOM adapter dispatches `paddingMeasured` when sheet obscured height is readable.

## `navigateTo` (public camera API)

Translates to `navigateRequested` on the camera machine. Sheet phase forcing jump is decided in the reducer (`resolveNavigateMode`), not in callers.

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

- `recenterOnUser()` → dispatches `recenterRequested`, keeps tracking.
- GPS updates while tracking → `gpsFix` event → instant jump while tracking.
- Fly to a map item → shell dispatches `navigateRequested` with `preserveTracking: false`.

Set `config.debug: true` or `VITE_SHEET_MAP_DEBUG=true` for padding and GPS console logs.

## Selection + sheet

- Tap map marker or list row → `selectItem` → from collapsed: fly first, open half when camera settles; from half: fly at half; from full: snap to half, then fly.
- Close sheet → `dismissSheet` → deselect.
- `recenterOnUser` and `navigateTo` without `preserveTracking` also clear selection.

## Map instance lifecycle

`mapInstanceReleased` resets camera machine state and bumps `mapGeneration`. Padding moveend suppression lives in machine `padding.suppressNextMoveEnd` only.

## Manual QA checklist

- [ ] Load: padding before fly; location button shows tracking
- [ ] Recenter: smooth fly, no crash
- [ ] Pan + sheet drag while following: padding tracks; snap-back at settle if ≤ threshold
- [ ] Pan > threshold while following: tracking releases
- [ ] Select item (map + list): half sheet, marker highlight, fly
- [ ] Close sheet: deselects (button and drag)

# Camera and padding

How `@siegetag/sheet-map` drives the Mapbox camera, padding, and follow-user behavior.

## Who drives the camera?

| Session | Driver | Typical duration |
| ------- | ------ | ---------------- |
| `idle` | Nobody (at rest) | Between user pans and programmatic moves |
| `userGesture` | User (pan / zoom) | From `dragstart` / `zoomstart` until gesture **fully** settles |
| `flying` | App (animated fly) | From `navigateTo` with `duration > 0` until target reached |

Orthogonal state (not sessions):

- **Tracking** — `useMapUserTracking().tracking`; boot and recenter keep it on; other `navigateTo` calls release it unless `keepTracking: true`.
- **Selection** — shell-owned `selectedItemId`; separate from camera session.
- **Sheet geometry** — `sheetObscuredBottomPx` from `@siegetag/sheet`; camera reacts only.

`userGesture` includes momentum: the session stays active until `moveend` **and** `map.isMoving()` is false.

## Boot and padding

1. When `mapRef` and sheet obscured height exist → sync map padding (`setPadding`).
2. Latch `mapPaddingReady` on first successful padding apply.
3. Boot fly **once per map instance** when padding is ready, style is loaded, and `userLocation` is available.
4. Boot uses `navigateTo` with animation and explicit zoom.

Padding sync and boot are separate steps — boot never runs from inside padding sync.

## `navigateTo` (single public camera API)

| Call | Session | Use |
| ---- | ------- | --- |
| `navigateTo`, `duration > 0` | → `flying` → `idle` | Boot, recenter, snap-back, fly to item |
| `navigateTo`, `duration === 0` | stays `idle` | GPS ticks while tracking |

| Option | Default | Meaning |
| ------ | ------- | ------- |
| `duration` | `0` | Fly ms when sheet idle; forced jump while sheet moves |
| `keepTracking` | `false` | Keep follow-user on after the move |

While **`flying`** or **`idle`** and sheet geometry changes: after `setPadding`, jump to the stored **anchor** (unless `userGesture`).

During **`userGesture`**: sheet/padding changes call **`setPadding` only** — no `jumpTo`, `flyTo`, or `map.stop()` from our code. Mapbox may still end pan inertia when padding changes; that is accepted.

### Gesture settle

On `moveend` when the map is no longer moving:

1. If following and pan moved the center more than `trackingReleaseThresholdPx` (default 40) → release tracking.
2. If following and within threshold → snap-back fly with `keepTracking: true`.
3. Else → commit anchor and return to `idle`.

## User location (app responsibility)

`@siegetag/sheet-map` does **not** call `navigator.geolocation` or Capacitor APIs. Pass `userLocation: { lat, lng, accuracyMeters? } | null` from the app.

- `recenterOnUser()` → animated fly, keeps tracking.
- GPS updates while tracking → instant `navigateTo` (`duration: 0`, `keepTracking: true`).
- Fly to a map item or arbitrary point → `navigateTo` without `keepTracking` releases tracking.

Set `config.debug: true` or `VITE_SHEET_MAP_DEBUG=true` for padding and GPS console logs.

## Selection + sheet

- Tap map marker or list row → `selectItem` → half sheet + fly to item.
- Close sheet (button or drag closed) → `closeSheet` → deselect; no required camera move.
- `recenterOnUser` and `navigateTo` without `keepTracking` also clear selection.

## Map instance lifecycle

Per-map WeakMap latches track padding sync and boot completion. They are cleared when the map unmounts so Strict Mode, HMR, and map swaps do not leave stale “already booted” state.

## Manual QA checklist

- [ ] Load: padding before fly; location button shows tracking
- [ ] Recenter: smooth fly, no crash
- [ ] Pan + sheet drag while following: padding tracks; snap-back at settle if ≤ threshold
- [ ] Pan > threshold while following: tracking releases
- [ ] Select item (map + list): half sheet, marker highlight, fly
- [ ] Close sheet: deselects (button and drag)

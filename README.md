# @siegetag/sheet-map (rebuild)

Fresh implementation of the map + sheet shell. The previous package lives at [`packages/sheet-map-old`](../sheet-map-old) as `@siegetag/sheet-map-old` (reference only — do not extend).

**Product apps** (`apps/capacitor`) stay on `@siegetag/sheet-map-old` until this package reaches parity.

**Demo app** (`apps/sheet-map-demo`) tracks this package and proves each phase before moving on.

## Rebuild phases

Each phase must ship **unit tests + manual check in sheet-map-demo** before the next phase starts.

| Phase | Scope | Done when |
| ----- | ----- | --------- |
| **0** | Package scaffold | This README, empty export, demo home screen |
| **1** | Visible viewport math | Live DOM sheet top + canvas geometry; golden tests for tab-bar inset; debug crosshair overlay |
| **2** | Map canvas | Mapbox canvas fills host; no sheet yet |
| **3** | Sheet on map | `MapFrame` + `@siegetag/sheet`; snap height callbacks |
| **4** | Padding + anchor | Live `map.setPadding()` from sheet geometry; anchor on user pan settle or explicit `setAnchor` / `navigateTo`; no snap camera intents |
| **5** | Follow user | Boot jump after measured heights; 40px snap-back while following; my-location control + dot in demo |
| **6** | Routes + markers | `MapLayout`, `useRegisterMapRoute`, markers — port from old only when 1–5 are green |

## Rules learned from the old package

- Never apply camera from snap-height math alone when the sheet slide is in the DOM — read live `.sheet-slide` top.
- Use **`map.setPadding()`** for live sheet sync — not `offset` on `jumpTo`/`flyTo`.
- Padding never updates anchor; anchor commits on user **`moveend`** when `!map.isMoving()` (includes momentum).
- App navigation calls **`setAnchor`** / **`navigateTo`** explicitly; follow-user boot and my-location button use smooth **`flyTo`** after padding is applied, ongoing GPS uses jump, 40px snap-back on pan.
- Test tab-bar demo geometry (`canvasBottom` above viewport bottom + `bottomChromeReserve`), not only aligned canvas.

## Scripts

```bash
pnpm --filter @siegetag/sheet-map test
pnpm --filter @siegetag/sheet-map build:styles
```

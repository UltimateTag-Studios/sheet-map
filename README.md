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
| **4** | Camera | Single apply path: live offset at rest, snap math only while sheet animates; wait for `map.isStyleLoaded()` |
| **5** | Follow user | Boot fly after measured heights; 40px snap-back; sheet settle jump |
| **6** | Routes + markers | `MapLayout`, `useRegisterMapRoute`, markers — port from old only when 1–5 are green |

## Rules learned from the old package

- Never apply camera from snap-height math alone when the sheet slide is in the DOM — read live `.sheet-slide` top.
- Do not consume a camera intent until Mapbox style is loaded.
- Pan commit only after a **user** gesture; programmatic `moveend` must not clear `followUser`.
- Test tab-bar demo geometry (`canvasBottom` above viewport bottom + `bottomChromeReserve`), not only aligned canvas.

## Scripts

```bash
pnpm --filter @siegetag/sheet-map test
pnpm --filter @siegetag/sheet-map build:styles
```

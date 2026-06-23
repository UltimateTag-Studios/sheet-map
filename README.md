# @siegetag/sheet-map

Fresh rebuild of the map + sheet shell. **Phase 0 — scaffold only.**

| Package folder | npm name | Role |
| -------------- | -------- | ---- |
| `packages/sheet-map` | `@siegetag/sheet-map` | **Active rebuild** (this package) |
| `packages/sheet-map-old` | `@siegetag/sheet-map-previous` | Abandoned rebuild attempt — reference only |
| `packages/sheet-map-old-old` | `@siegetag/sheet-map-old` | Original package — Capacitor still uses this |

**Demo:** `apps/sheet-map-demo` tracks `@siegetag/sheet-map` one phase at a time.

**Spec:** [`docs/camera-fsm-plan.md`](docs/camera-fsm-plan.md) — camera FSM behavior contract.

**Phases (what to do each step):** [`docs/rebuild-phases.md`](docs/rebuild-phases.md)

## Rebuild phases (summary)

| Phase | Scope | Done when |
| ----- | ----- | --------- |
| **0** | Package scaffold | This README, `SHEET_MAP_REBUILD_PHASE = 0`, demo home |
| **1** | Visible viewport math | Live DOM + golden tests; debug crosshair |
| **2** | Map canvas | Mapbox fills host |
| **3** | Sheet on map | `MapFrame` + `@siegetag/sheet` |
| **4** | Padding + anchor | `setPadding`, session FSM, `navigateTo` |
| **5** | Follow user | Boot fly, 40px snap-back, my-location |
| **6** | Routes + markers | Port from `@siegetag/sheet-map-old` when 1–5 are green |

## Mapbox attribution

`MapCanvas` sets `attributionControl={false}` on the underlying Mapbox map. That removes the **text attribution control** (the compact “© Mapbox © OpenStreetMap …” chip). It does **not** remove the **Mapbox wordmark logo** — Mapbox GL JS always adds `LogoControl` separately, and standard Mapbox terms require that logo to stay visible on the map.

Do **not** hide the logo with CSS unless your Mapbox account explicitly allows white‑label maps.

Because the automatic text control is off, **apps using this package must still meet Mapbox and data-provider attribution requirements** — for example in Settings, About, or other app chrome — per [Mapbox attribution guidance](https://docs.mapbox.com/help/dive-deeper/attribution/). The on-map logo alone is not a substitute for every required credit when the text control is disabled.

In the shell (`MapShellContent`), the logo is repositioned on the **map canvas** (not the live viewport overlay): bottom-right, with `bottom` set to the **collapsed sheet height** so it sits in the visible map band when the sheet is collapsed and stays fixed when the sheet opens (it may be covered temporarily).

## Scripts

```bash
pnpm --filter @siegetag/sheet-map test
pnpm --filter @siegetag/sheet-map build:styles
```

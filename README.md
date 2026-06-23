# @siegetag/sheet-map

Mapbox map + bottom sheet shell for React web apps. Composes [`@siegetag/sheet`](../sheet) with live padding sync, follow-user camera, route registration, and item selection.

**Demo:** [`apps/sheet-map-demo`](../../apps/sheet-map-demo) · **Product:** [`apps/capacitor`](../../apps/capacitor) (SiegeTag map tab)

## Install

```json
{
  "dependencies": {
    "@siegetag/sheet": "workspace:*",
    "@siegetag/sheet-map": "workspace:*",
    "mapbox-gl": "^3.24.1",
    "react-map-gl": "^8.1.1",
    "react-router-dom": "^7.0.0"
  }
}
```

Import styles once (after `@siegetag/sheet/styles.css`):

```tsx
import "@siegetag/sheet/styles.css";
import "@siegetag/sheet-map/styles.css";
```

## Quick start

`MapLayout` owns the map, sheet, overlays, and shell state. Child routes register content with `useRegisterMapRoute`.

```tsx
// app map layout (once)
<MapLayout
  accessToken={token}
  userLocation={userLocation}
  config={{ theme: "dark", sheetLayout: { bottomChromeReserve: { reserve: "…", gap: "…" } } }}
>
  <Outlet />
</MapLayout>

// route screen
function InventoryRoute() {
  useRegisterMapRoute({
    items: pins.map(toMapItem),
    header: { eyebrow: "Map", title: "Inventory", countLabel: "12 tags" },
    mapLayers: <MapMarkers id="pins" data={markerGeoJson} />,
    overlay: <MyMapChrome />,
  });
  return null;
}
```

Pass **data** (`items`, `header` props) and optional **`mapLayers`** / **`overlay`**. Use `headerContent` / `body` when a route needs fully custom sheet chrome. See [`apps/capacitor/src/screens/map`](../../apps/capacitor/src/screens/map) for production patterns.

## Shell API

| Export | Role |
| ------ | ---- |
| `MapLayout` | App layout: map + sheet + route store |
| `useRegisterMapRoute` | Publish route items, sheet chrome, map layers |
| `useMapShellContext` | `selectItem`, `closeSheet`, `navigateTo`, `recenterOnUser`, `tracking` |
| `MapShellConfig` | `theme`, `sheetLayout`, `layout`, `debug`, … |
| `MapShellSlots` | Override close button, list rows, markers, overlay |

### Selection

- `selectItem(id, location)` — half sheet + fly to item
- `closeSheet()` — collapse + deselect (also runs when the sheet drag-settles closed)
- List rows and map markers share `items: MapItem[]` for hit testing

### Route chrome

| Field | When |
| ----- | ---- |
| `header` | Data for default / slotted `MapSheetHeader` |
| `headerContent` | Full header replace |
| `body` | Full body replace (default body is `MapSheetList` from `items`) |
| `mapLayers` | GeoJSON layers, trails, custom markers |
| `overlay` | Visible-map overlay (legend, HUD) |
| `collapsedAction` | Top-right when sheet collapsed (e.g. trail back) |
| `resolveFeatureId` + `extraInteractiveLayerIds` | GeoJSON layer press → `selectItem` |

## Config

### `MapShellConfig`

| Field | Role |
| ----- | ---- |
| `theme` | `"light"` \| `"dark"` → Mapbox style + `data-sheet-map-theme` |
| `sheetLayout` | `SheetLayoutConfig` — handle, panel, list, `bottomChromeReserve` |
| `layout` | Overlay geometry — action button, location button, item markers, logo |
| `fixedChromeInsets` | Extra obscured area (top nav, etc.) |
| `debug` | Verbose padding / camera logs |

### Layout tokens (`config.layout`)

```ts
layout: {
  actionButton?: { top?, right?, bottom?, left?, padding? },
  location?: {
    button?: { top?, right?, bottom?, left?, size?, borderRadius? },
    marker?: { size?, hitSize? },
  },
  mapItem?: { marker?: { size?, hitSize?, borderWidth? } },
  logo?: { top?, right?, bottom?, left? },
}
```

CSS vars are set on `.sheet-map-layout`. Export `SHEET_MAP_LAYOUT_VARS` for names. Logo inset is computed from collapsed sheet height — apps should not override `--sheet-map-logo-region-bottom-inset`.

### Theming

Override semantic tokens in app CSS:

```css
.sheet-map-layout[data-sheet-map-theme="dark"] {
  --sheet-map-color-list-item-border-selected: #22d3ee;
}
```

Export `SHEET_MAP_THEME_VARS` for the full catalog.

## Lower-level exports

Use when not using the full shell:

| Area | Examples |
| ---- | -------- |
| Canvas | `MapCanvas`, `MapMarkers`, `MapDotMarkers`, `MapLineLayer`, `mapPointsToGeoJson` |
| Camera | `useMapUserTracking`, `useMapAnchor` |
| Viewport | `useLiveSheetObscuredBottomPx`, `MapVisibleAreaOverlay` |
| Items | `MapItemMarker`, `MapSheetHeader`, `MapSheetList` |

GeoJSON sprite markers use `markerImageId` / `createMarkerImageCanvas`. Shell hit layer for inventory-style markers: `MAP_MARKERS_HIT_LAYER_ID`.

## Camera behavior

See [`docs/camera.md`](docs/camera.md) for padding, boot, `navigateTo`, follow-user, and gesture settle rules.

**Geolocation is app-owned** — pass `userLocation` from your hook; the package never requests GPS itself.

## Scripts

```bash
pnpm --filter @siegetag/sheet-map test
pnpm --filter @siegetag/sheet-map build:styles
```

## Mapbox attribution

`attributionControl={false}` on the internal map — apps must meet Mapbox/data-provider attribution requirements elsewhere. Do not hide the Mapbox logo without account permission.

## License

GNU Affero General Public License v3.0 or later — see [LICENSE](./LICENSE).

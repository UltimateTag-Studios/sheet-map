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

`MapLayout` owns the map, sheet, overlays, and shell state. Child routes register content with `useRegisterMapRoute`. Wire sheet chrome once on `MapLayout` via `slots`.

```tsx
// app map layout (once)
<MapLayout
  accessToken={token}
  userLocation={userLocation}
  config={{ theme: "dark", sheetLayout: { bottomChromeReserve: { reserve: "…", gap: "…" } } }}
  slots={{
    renderSheetHeader: (header) => <MySheetHeader {...header} />,
    renderSheetListLoading: () => <LoadingCopy />,
    renderSheetListEmpty: () => <EmptyCopy />,
    renderSheetBody: (children) => <MySheetBody>{children}</MySheetBody>,
  }}
>
  <Outlet />
</MapLayout>

// route screen
function InventoryRoute() {
  useRegisterMapRoute({
    listStatus: "ready",
    items: pins.map(toMapItem),
    header: { title: "Inventory", subtitle: "12 tags" },
    slots: {
      renderSheetListItem: (item, ctx) => (
        <MyListRow item={item} selected={ctx.selected} onPress={ctx.onPress} />
      ),
    },
    mapLayers: <MapMarkers id="pins" data={markerGeoJson} />,
    overlay: <MyMapChrome />,
  });
  return null;
}
```

Pass **data** (`items`, `header`, `listStatus`) and optional **`mapLayers`** / **`overlay`**. Use `headerContent` / `bodyContent` when a route needs fully custom sheet chrome (escape hatches). See [`apps/capacitor/src/screens/map`](../../apps/capacitor/src/screens/map) for production patterns.

## Shell API

| Export | Role |
| ------ | ---- |
| `MapLayout` | App layout: map + sheet + route store |
| `useRegisterMapRoute` | Publish route items, sheet chrome, map layers |
| `useMapShellContext` | `selectItem`, `closeSheet`, `navigateTo`, `recenterUser`, `tracking`, `sheetSnap` |
| `MapShellConfig` | `theme`, `sheetLayout`, `layout`, `debug`, … |
| `MapShellSlots` | Sheet header/body/list slots, close button, markers, overlay |

### `MapItem<T>` and `MapRouteHeader<T>`

Both use the same shape: common fields plus optional typed `data` for app-specific chrome.

```ts
type MapItem<T = undefined> = {
  id: string;
  location: { lat: number; lng: number };
  title: string;
  subtitle?: string;
  meta?: string;
} & (T extends undefined ? {} : { data: T });

type MapRouteHeader<T = undefined> = {
  title: string;
  subtitle?: string;
} & (T extends undefined ? {} : { data: T });
```

**`MapRouteHeader`** defaults to `title` + optional `subtitle`. Put route-specific header fields (eyebrow, count, badges, …) in `data` and read them in `renderSheetHeader`. See [`apps/capacitor/src/screens/map`](../../apps/capacitor/src/screens/map) for a typed `MapRouteHeader<YourHeaderData>` layout slot.

### `MapItem<T>` list rows

Every list row and map marker shares `items`. **Every item must include `location`** — filter unlocated pins before registering.

### List ordering

`MapSheetList` owns list policy:

- **`half`** + selection → selected item promoted to top
- **`full`** / **`collapsed`** → stable registration order; **`full`** scrolls selected row into view

Route `slots.renderSheetListItem` receives `{ selected, onPress, sheetSnap }`.

### Selection

- `selectItem(id, location)` — half sheet + fly to item
- `closeSheet()` — collapse + deselect (also runs when the sheet drag-settles closed)

### Route chrome

| Field | When |
| ----- | ---- |
| `listStatus` | `"loading"` \| `"empty"` \| `"ready"` — drives body slot pipeline |
| `header` | Data for `renderSheetHeader` (no package default component) |
| `headerContent` | Full header replace (escape hatch) |
| `bodyContent` | Full body replace (escape hatch) |
| `items` | `MapItem[]` for list + default map layers |
| `mapLayers` | GeoJSON layers, trails, custom markers |
| `overlay` | Visible-map overlay (legend, HUD) |
| `collapsedAction` | Top-right when sheet collapsed (e.g. trail back) |
| `resolveFeatureId` + `extraInteractiveLayerIds` | GeoJSON layer press → `selectItem` |

### Layout slots (`MapLayout.slots`)

| Slot | Role |
| ---- | ---- |
| `renderSheetHeader` | `(header: MapRouteHeader) => ReactNode` |
| `renderSheetListLoading` | Loading body content (wrapped in `MapSheetBody`) |
| `renderSheetListEmpty` | Empty body content |
| `renderSheetBody` | Wrap resolved body (e.g. app padding chrome) |
| `renderSheetListItem` | Per-route override via `useRegisterMapRoute({ slots })` |

## Config

### `MapShellConfig`

| Field | Role |
| ----- | ---- |
| `theme` | `"light"` \| `"dark"` → Mapbox style + `data-sheet-map-theme` |
| `sheetLayout` | `SheetLayoutConfig` — handle, panel, list, `bottomChromeReserve` |
| `layout` | Overlay geometry — action button, location button, item markers, logo |
| `fixedChromeInsets` | Extra obscured area (top nav, etc.) |
| `debug` | Verbose padding / camera logs; warns when `header` is set without `renderSheetHeader` |

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
| Items | `MapItemMarker`, `MapSheetList`, `orderSheetListItems` |

GeoJSON sprite markers use `markerImageId` / `createMarkerImageCanvas`. Shell hit layer for inventory-style markers: `MAP_MARKERS_HIT_LAYER_ID`.

## Camera behavior

See [`docs/truth-tables.md`](docs/truth-tables.md) for the full behavior spec (selection, fly gates, padding, sheet × camera). [`docs/camera.md`](docs/camera.md) covers architecture, padding pipeline, and APIs.

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

# @siegetag/sheet-map

Map + sheet shell for React web — rebuild in progress. See [`docs/rebuild-phases.md`](docs/rebuild-phases.md).

**Demo:** `apps/sheet-map-demo` · **Phase:** `SHEET_MAP_REBUILD_PHASE` in package entry.

## Install

```tsx
import "@siegetag/sheet/styles.css";
import "@siegetag/sheet-map/styles.css";
```

## Config (`MapShellConfig`)

| Field | Role |
|-------|------|
| `theme` | `"light" \| "dark"` → `data-sheet-map-theme` + Mapbox style URL |
| `sheetLayout` | `SheetLayoutConfig` geometry (handle, body, list items, tab-bar reserve) |
| `layout` | `MapShellLayout` — overlay chrome geometry (see below) |

## Layout (`config.layout`)

```ts
layout: {
  actionButton?: { top?, right?, bottom?, left?, padding? },
  location?: {
    button?: { top?, right?, bottom?, left?, size?, borderRadius? },  // recenter FAB
    marker?: { size?, hitSize? },  // on-map user marker (default graphic)
  },
  mapItem?: {
    marker?: { size?, hitSize?, borderWidth? },  // default item markers
  },
  logo?: { top?, right?, bottom?, left? },  // within visible map band
}
```

CSS vars are flat on `.sheet-map-layout` (e.g. `--sheet-map-location-button-size`, `--sheet-map-item-marker-size`). Export `SHEET_MAP_LAYOUT_VARS` for names.

**Logo region:** shell sets `--sheet-map-logo-region-bottom-inset` on `.sheet-host` (= collapsed sheet height). Apps must not override it. Logo position vars are relative to that band.

**Mapbox markers:** DOM markers use CSS `var()` directly. Mapbox circle layers read layout vars from `.sheet-map-layout` at runtime (`useMapLayoutMarkerSizes`).

## Theming

`theme` sets `data-sheet-map-theme` on `.sheet-map-layout`. Override tokens in app CSS:

```css
.sheet-map-layout[data-sheet-map-theme="light"] {
  --sheet-map-color-list-item-border-selected: #2563eb;
}
```

Export `SHEET_MAP_THEME_VARS` for the full token catalog (colors, typography).

Custom map markers via slots (`renderMapItem`, `renderMarker`) own their sizing — tokens style the bundled defaults only.

## Scripts

```bash
pnpm --filter @siegetag/sheet-map test
pnpm --filter @siegetag/sheet-map build:styles
```

## Mapbox attribution

`attributionControl={false}` on the map — apps must meet Mapbox/data-provider attribution requirements elsewhere. Do not hide the Mapbox logo without account permission.

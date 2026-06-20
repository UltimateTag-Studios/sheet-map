# @siegetag/sheet-map

Generic Mapbox map + bottom sheet shell for React web apps (react-map-gl + `@siegetag/sheet`).

**In scope:** map canvas, viewport/camera orchestration, map shell routing, generic point markers, and route registration (`useRegisterMapRoute`).

**Out of scope:** product-specific sheet UI (title rows, lists, legends, copy). Apps compose those as custom `header` / `body` / `mapLayers` content. Generic sheet behavior lives in [`@siegetag/sheet`](../sheet/README.md).

## Install (external app via git)

```json
{
  "dependencies": {
    "@siegetag/sheet-map": "github:YOUR_ORG/siegetag#main:packages/sheet-map",
    "@siegetag/sheet": "github:YOUR_ORG/siegetag#main:packages/sheet",
    "mapbox-gl": "^3.24.1",
    "react-map-gl": "^8.1.1"
  }
}
```

Pin to a commit or tag for stability: `#abc1234` or `#v0.1.0`.

Import styles once in your app entry (both packages ship built CSS as `./styles.css`):

```tsx
import "@siegetag/sheet/styles.css";
import "@siegetag/sheet-map/styles.css";
```

## Quick start

```tsx
import { MapLayout, useMapRouteContext, useRegisterMapRoute, MapMarkers } from "@siegetag/sheet-map";
import "@siegetag/sheet/styles.css";
import "@siegetag/sheet-map/styles.css";
import { Route } from "react-router-dom";

function AppMapLayout() {
  const userLocation = useYourGeolocationHook();

  return (
    <MapLayout
      accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      userLocation={userLocation}
    >
      <Route index element={<MyListScreen />} />
      <Route path=":itemId" element={<MyDetailScreen />} />
    </MapLayout>
  );
}

function MyListScreen() {
  const { shell } = useMapRouteContext();

  useRegisterMapRoute({
    mapLayers: <MapMarkers id="points" data={yourGeoJson} />,
    header: <YourHeaderContent />,
    body: <YourBodyContent />,
    onMarkerPress: (markerId) => { /* select item */ },
    isUserLocationFocused: shell.followUser,
    onUserLocationPress: shell.startFollowingUser,
  });

  return null;
}
```

`header` is the **header row** at every snap; `body` is the scroll/drag region below the divider (shell adds handle spacers between them). Style header/body however your app styles UI.

**Do not add `overflow-y-auto` to body content.** `@siegetag/sheet` owns scroll on the body root.

| Zone / snap | Gestures |
|------|-----|
| Handle + header (chrome) | Sheet drag — all snaps, even when body is scrolled at full |
| Body below divider at `collapsed` / `half` | Sheet drag only |
| Body at **live full height** (mid-drag or resting `full`) | Scroll when scrolled; at scroll top, drag down collapses, drag up scrolls |

When the sheet settles to a new snap, body scroll resets to the top.

Collapsed floating tab bar clearance uses header padding while at collapsed height (live during drag). Scroll-end reserve uses body inner padding when `layout.reserveFloatingTabBar` is enabled.

## Configuration (`MapShellConfig`)

See package source [`src/shell/config.ts`](src/shell/config.ts) for full options. Sheet geometry uses `@siegetag/sheet` (`buildSheetStyle`, `halfSnapFraction`, etc.).

## Theming

Override `.sheet`, `.sheet-handle`, and `.sheet-divider` from `@siegetag/sheet/styles.css`. Map-specific header typography uses classes from `@siegetag/sheet-map/styles.css`. See app example [`apps/capacitor/src/screens/map/sheet-map-theme.css`](../../apps/capacitor/src/screens/map/sheet-map-theme.css).

## Build

Tailwind utilities compile to `dist/style.css` on `pnpm install` (`prepare`) or manually:

```bash
pnpm --filter @siegetag/sheet-map build:styles
```

## Standalone sheet

For non-map apps, use `@siegetag/sheet` directly — see [`packages/sheet/README.md`](../sheet/README.md).

# @siegetag/sheet-map

Generic Mapbox map + bottom sheet shell for React web apps (react-map-gl + Vaul).

**In scope:** map canvas, viewport/camera orchestration, bottom sheet behavior (snap points, collapsed drag layering), generic point markers, and route registration (`useRegisterMapRoute`).

**Out of scope:** product-specific sheet UI (title rows, lists, legends, copy). Apps compose those as custom `peek` / `expanded` / `mapLayers` content.

## Install (external app via git)

```json
{
  "dependencies": {
    "@siegetag/sheet-map": "github:YOUR_ORG/siegetag#main:packages/sheet-map",
    "mapbox-gl": "^3.24.1",
    "react-map-gl": "^8.1.1",
    "vaul": "^1.1.2"
  }
}
```

Pin to a commit or tag for stability: `#abc1234` or `#v0.1.0`.

## Quick start

```tsx
import { MapLayout, useMapRouteContext, useRegisterMapRoute, MapMarkers } from "@siegetag/sheet-map";
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
    peek: <YourPeekContent />,
    expanded: <YourExpandedContent />,
    onMarkerPress: (markerId) => { /* select item */ },
    isUserLocationFocused: shell.followUser,
    onUserLocationPress: shell.startFollowingUser,
  });

  return null;
}
```

`peek` and `expanded` are **arbitrary React trees** — style them however your app styles UI. The shell measures peek height at runtime for snap points and map viewport sync.

## Configuration (`MapShellConfig`)

| Option | Default | Description |
|--------|---------|-------------|
| `fixedChromeInsets` | — | Extra obscured map area (tab bar, top nav) in px |
| `collapsedBottomInsetPx` | `0` | Extra pixels below measured peek for collapsed snap |
| `halfSnapFraction` | `0.5` | Vaul fraction snap between collapsed and full |
| `initialZoom` | `15` | Zoom on first camera fly only |
| `smoothFlyDurationMs` | `600` | Duration for smooth flies |
| `followThresholdPx` | `40` | User pan distance before follow stops |
| `debug` | `false` | Show visible-area debug overlay |
| `myLocationAriaLabel` | `"Focus my location"` | A11y label for location button |

### Slots (`MapLayout` `slots` prop)

| Slot | Purpose |
|------|---------|
| `renderMyLocationButton` | Replace default location FAB |
| `renderUserLocation` | Replace default user location marker |
| `renderTokenMissing` | Replace default missing-token UI |

## Behavior (fixed)

- Collapsed snap height is **measured** from handle + peek DOM (ResizeObserver)
- First fly after mount sets `initialZoom`; later flies preserve user zoom
- Tap marker → fly to point + open sheet
- Sheet resize → re-fly with updated center offset
- User pans map → stop following user location

## App responsibilities

Keep in your app (not this package):

- Data fetching (Convex, REST, etc.)
- Geolocation adapter (`useMapUserLocation`)
- Domain GeoJSON and custom map layers (lines, badges, etc.)
- **All sheet content UI** — peek headers, lists, legends, detail flows
- Copy / branding

## Styles

Import `@siegetag/sheet-map` in JS — structural CSS loads automatically. No Tailwind setup required in your app for the shell to work.

**Theming:** override semantic classes in your own stylesheet (plain CSS):

| Class | Element |
|-------|---------|
| `.sheet-map-drawer` | Bottom sheet surface |
| `.sheet-map-drawer-handle` | Drag handle |
| `.sheet-map-expanded-overlay` | Expanded content during collapsed drag |

Example (SiegeTag uses design tokens in app CSS):

```css
.sheet-map-drawer {
  border-radius: var(--radius-lg);
  background: rgb(var(--card) / 0.9);
}
```

Your peek/expanded content uses whatever styling system your app already has.

Rebuild after editing sheet-map locally:

```bash
pnpm --filter @siegetag/sheet-map build:styles
```

## Monorepo workspace

```json
"@siegetag/sheet-map": "workspace:*"
```

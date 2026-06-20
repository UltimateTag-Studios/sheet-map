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

`peek` is the **header row** at every snap; `expanded` is the **body below the divider** (shell adds handle spacers between them). Style peek/expanded however your app styles UI.

**Do not add `overflow-y-auto` to expanded content.** The shell owns scroll:

| Snap | Gestures on content |
|------|---------------------|
| `collapsed`, `half` | Sheet drag only — scroll disabled |
| `full` | Unified scroll (peek + divider + body scroll together) |
| `full` + scrolled to top + swipe down | Sheet drag resumes (collapse / snap down) |

Use padding wrappers (e.g. app `BottomSheetBody`) for spacing only — not an inner scroller. Floating tab bar reserve uses the same bottom padding as `AppScrollArea` (`tabBarScrollAreaPaddingBottom` / `tabBarCollapsedAreaPaddingBottom` from `@siegetag/ui`), driven by `layout.reserveFloatingTabBar`.

## Configuration (`MapShellConfig`)

### Behavior

| Option | Default | Description |
|--------|---------|-------------|
| `fixedChromeInsets` | — | Extra obscured map area (tab bar, top nav) in px |
| `collapsedBottomInsetPx` | `0` | Extra snap inset without DOM (prefer `layout.reserveFloatingTabBar`) |
| `halfSnapFraction` | `0.5` | Vaul fraction snap between collapsed and full |
| `initialZoom` | `15` | Zoom on first camera fly only |
| `smoothFlyDurationMs` | `600` | Duration for smooth flies |
| `followThresholdPx` | `40` | User pan distance before follow stops |
| `debug` | `false` | Show visible-area debug overlay |
| `myLocationAriaLabel` | `"Focus my location"` | A11y label for location button |

### Layout (`config.layout`) — geometry only

Spacing, handle size, floating tab bar reserves. Defaults work out of the box.

| Option | Default | Description |
|--------|---------|-------------|
| `drawerHandleMarginTop` | `0.75rem` | Space above handle bar |
| `drawerHandleBarHeight` | `0.25rem` | Handle pill height |
| `drawerHandleMarginBottom` | `0.75rem` | Gap between handle and your peek content |
| `peekBalanceAdjustPx` | `-7` | Optical trim on handle spacer under peek |
| `reserveFloatingTabBar` | `false` | When true, sheet spacers use `@siegetag/ui` floating tab bar reserves (safe area added in CSS) |

When enabled, collapsed and scroll-end reserves come from `@siegetag/ui` layout helpers — no manual constant imports.

After changing `styles/sheet-map.css`, run `pnpm --filter @siegetag/sheet-map build:styles` so `dist/styles.css` picks up new semantic classes.

```tsx
<MapLayout
  config={{
    layout: {
      reserveFloatingTabBar: true,
    },
  }}
  …
/>
```

### Visual overrides (`config.styles`)

Optional `drawer` / `drawerHandle` `CSSProperties` — escape hatch only. **Prefer theme CSS** (below) for colors and shadows.

### Slots (`MapLayout` `slots` prop)

| Slot | Purpose |
|------|---------|
| `renderMyLocationButton` | Replace default location FAB |
| `renderUserLocation` | Replace default user location marker |
| `renderTokenMissing` | Replace default missing-token UI |

## Behavior (fixed)

- Collapsed snap height is **measured** from handle + your peek + structural spacers (ResizeObserver)
- Below **full** snap, vertical swipes on content move the sheet (no inner scroll)
- At **full** snap, one scroll root wraps peek + divider + body. `useVaulScrollHandoff` toggles Vaul's `data-vaul-no-drag` while scrolled; at scroll top Vaul owns pull-down drag. Drawer uses `scrollLockTimeout={0}`.
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

**Theming:** override semantic `.sheet-map-*` classes in your own stylesheet (plain CSS). All shell visuals — drawer, handle, divider, typography helpers — use the same pattern:

| Class | Element |
|-------|---------|
| `.sheet-map-drawer` | Bottom sheet surface |
| `.sheet-map-drawer-handle` | Drag handle |
| `.sheet-map-divider` | Line between peek and expanded body |
| `.sheet-map-expanded-overlay` | Expanded content during collapsed drag |
| `.sheet-map-peek-eyebrow` | Optional peek label typography |
| `.sheet-map-peek-title` | Optional peek title typography |

Example (SiegeTag uses design tokens in app CSS):

```css
.sheet-map-drawer {
  border-radius: var(--radius-lg);
  background: rgb(var(--card) / 0.9);
}

.sheet-map-divider {
  border-bottom: 1px solid rgb(var(--border) / 0.4);
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

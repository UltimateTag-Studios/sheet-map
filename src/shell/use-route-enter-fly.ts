import { useLayoutEffect, useRef } from "react";

import { useMapRouteContext } from "./map-route-context";
import type { RouteEnterFly } from "./map-shell-machine/route-enter-fly";
import { routeEnterFlyKey } from "./map-shell-machine/route-enter-fly";

/**
 * Declares a non-default enter fly for this route (item select + fly).
 *
 * Routes that only need user location should omit this hook and pass `routeKey` to
 * `useRegisterMapRoute` instead.
 *
 * Pass `null` while async route data is loading. Optional `zoom` on the entry:
 * explicit value is used; omitted zoom preserves the current map level when set,
 * otherwise the shell default applies.
 */
export function useRouteEnterFly(
  routeKey: string,
  entry: RouteEnterFly | null | undefined,
): void {
  const { shell } = useMapRouteContext();
  const { reportRouteEnterFly } = shell;
  const entryKey = routeEnterFlyKey(entry);
  const entryRef = useRef(entry);
  entryRef.current = entry;

  useLayoutEffect(() => {
    reportRouteEnterFly(
      routeKey,
      entryKey === "" ? null : (entryRef.current ?? null),
    );

    return () => {
      reportRouteEnterFly("", null);
    };
  }, [routeKey, entryKey, reportRouteEnterFly]);
}

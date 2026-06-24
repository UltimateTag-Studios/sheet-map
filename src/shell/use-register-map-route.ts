import { useLayoutEffect, useRef } from "react";

import type { MapRouteContent } from "./map-route-context";
import { useMapRouteContext } from "./map-route-context";

const defaultUserLocationEntry = { kind: "userLocation" as const };

/**
 * Publishes route content to the layout store without re-rendering the layout tree.
 *
 * Pass `routeKey` for routes whose enter fly is user location (the default). Routes
 * with a different enter target call `useRouteEnterFly` instead and omit `routeKey`.
 */
export function useRegisterMapRoute(
  content: MapRouteContent,
  routeKey?: string,
) {
  const { routeContentStore, shell } = useMapRouteContext();
  const { reportRouteEnterFly } = shell;
  const contentRef = useRef(content);
  contentRef.current = content;

  useLayoutEffect(() => {
    routeContentStore.setContent(contentRef.current);
  });

  useLayoutEffect(() => {
    return () => {
      routeContentStore.setContent(null);
    };
  }, [routeContentStore]);

  useLayoutEffect(() => {
    if (!routeKey) {
      return;
    }

    reportRouteEnterFly(routeKey, defaultUserLocationEntry);

    return () => {
      reportRouteEnterFly("", null);
    };
  }, [routeKey, reportRouteEnterFly]);
}

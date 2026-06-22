import { useLayoutEffect, useRef } from "react";

import type { MapRouteContent } from "./map-route-context";
import { useMapRouteContext } from "./map-route-context";

/** Publishes route content to the layout store without re-rendering the layout tree. */
export function useRegisterMapRoute(content: MapRouteContent) {
  const { routeContentStore } = useMapRouteContext();
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
}

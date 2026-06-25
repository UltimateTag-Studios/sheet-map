type MapRouteHeaderCore = {
  title: string;
  subtitle?: string;
};

/** Route sheet header data — extend via `data` like {@link MapItem}. */
export type MapRouteHeader<T = undefined> = [T] extends [undefined]
  ? MapRouteHeaderCore
  : MapRouteHeaderCore & { data: T };

/** Accepted on `useRegisterMapRoute({ header })` — plain or with `data`. */
export type MapRouteHeaderRegistration = MapRouteHeaderCore & {
  data?: unknown;
};

import type { SheetSnap } from "@siegetag/sheet";

export type MapItemLocation = {
  lat: number;
  lng: number;
};

type MapItemCore = {
  id: string;
  location: MapItemLocation;
  title: string;
  subtitle?: string;
  meta?: string;
};

export type MapItem<T = undefined> = [T] extends [undefined]
  ? MapItemCore
  : MapItemCore & { data: T };

export type MapSheetListStatus = "loading" | "empty" | "ready";

export type MapSheetListItemContext = {
  selected: boolean;
  onPress: () => void;
  sheetSnap: SheetSnap;
};

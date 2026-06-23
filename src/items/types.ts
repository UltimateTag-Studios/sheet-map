export type MapItemLocation = {
  lat: number;
  lng: number;
};

export type MapItem = {
  id: string;
  location: MapItemLocation | null;
  title: string;
  subtitle?: string;
  meta?: string;
};

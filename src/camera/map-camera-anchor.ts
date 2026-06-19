export type UserCameraMotion = "instant" | "smooth";

export type UserCameraAnchor = {
  kind: "user";
  motion?: UserCameraMotion;
};

export type MapCameraAnchor =
  | UserCameraAnchor
  | { kind: "point"; id: string }
  | null;

export type MapFollowState = {
  followUser: boolean;
  hasBootFlown: boolean;
};

export function createInitialMapFollowState(options: {
  autoFollow?: boolean;
}): MapFollowState {
  return {
    followUser: options.autoFollow ?? false,
    hasBootFlown: false,
  };
}

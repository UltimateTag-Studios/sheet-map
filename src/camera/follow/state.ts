export type MapFollowState = {
  tracking: boolean;
  hasBootFlown: boolean;
};

export function createInitialMapFollowState(options: {
  tracking?: boolean;
}): MapFollowState {
  return {
    tracking: options.tracking ?? false,
    hasBootFlown: false,
  };
}

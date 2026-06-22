export type MapFollowState = {
  tracking: boolean;
};

export function createInitialMapFollowState(options: {
  tracking?: boolean;
}): MapFollowState {
  return {
    tracking: options.tracking ?? false,
  };
}

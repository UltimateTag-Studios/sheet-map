import { Component, type ReactNode } from "react";

type MapScreenErrorBoundaryState = {
  error: Error | null;
};

export class MapScreenErrorBoundary extends Component<
  { children: ReactNode },
  MapScreenErrorBoundaryState
> {
  public state: MapScreenErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(
    error: Error,
  ): MapScreenErrorBoundaryState {
    return { error };
  }

  public render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="relative min-h-0 flex-1 px-4 py-6">
          <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--error))]/40 bg-[rgb(var(--card))]/90 p-4">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--error))]">
              Map Runtime Error
            </p>
            <p className="mt-2 font-data text-sm text-[rgb(var(--foreground))]">
              {this.state.error.message}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

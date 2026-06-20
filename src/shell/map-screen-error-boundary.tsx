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
        <div className="sheet-map-error-boundary">
          <div className="sheet-map-error-card">
            <p className="sheet-map-error-title">Map Runtime Error</p>
            <p className="sheet-map-error-message">
              {this.state.error.message}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

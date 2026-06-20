export type MapLoadingStateProps = {
  message: string;
  className?: string;
};

export function MapLoadingState({
  message,
  className = "",
}: MapLoadingStateProps) {
  return (
    <div
      className={`sheet-map-loading${className ? ` ${className}` : ""}`.trim()}
    >
      <div className="sheet-map-loading-card">
        <div className="sheet-map-loading-spinner" aria-hidden="true" />
        <p className="sheet-map-loading-message">{message}</p>
      </div>
    </div>
  );
}

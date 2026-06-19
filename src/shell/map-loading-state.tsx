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
      className={`flex min-h-full flex-1 items-center justify-center p-6 ${className}`.trim()}
    >
      <div className="mx-auto w-full max-w-sm rounded-lg border border-white/10 bg-neutral-900/90 p-6 text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-neutral-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

export type MyLocationIconProps = {
  size?: number;
  className?: string;
};

export function MyLocationIcon({
  size = 24,
  className = "",
}: MyLocationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="12" cy="12" r="3.25" fill="currentColor" />
      <path
        d="M12 3.5v3.25M12 17.25V20.5M3.5 12h3.25M17.25 12H20.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="7.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

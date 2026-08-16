export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="13" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="9" y="9" width="3" height="12" rx="0.5" fill="currentColor" opacity="0.75" />
      <rect x="14" y="4" width="3" height="17" rx="0.5" fill="currentColor" />
      <path
        d="M2.5 18.5L8 12L12 15L18.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 6H18.5V11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

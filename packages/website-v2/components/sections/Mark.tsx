/** Sherwood's mark: a broadhead arrow through a ring. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 29 25.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M29 3l-2.2 7.4-5.2-5.2z" fill="currentColor" />
      <path d="M3 29l1-4.6M3 29l4.6-1M6 26l1-4.6M6 26l4.6-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Infinite ticker. Pure CSS; pauses on hover; reduced motion stops it (globals.css). */
export function Marquee({ items, className }: { items: readonly string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap">
          <span>{t}</span>
          <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden className="text-accent">
            <path d="M0 5h28M24 1l6 4-6 4M0 1l3 4-3 4M5 1l3 4-3 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`mask-fade-x group flex overflow-hidden ${className ?? ""}`}>
      <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

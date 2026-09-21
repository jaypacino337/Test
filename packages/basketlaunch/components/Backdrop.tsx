/**
 * Page backdrop: two slow-drifting colour blooms, a fine grid, a film grain
 * and a vignette. Fixed and inert, so it costs nothing but depth.
 */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-grid" />
      <div className="aurora aurora-lime" />
      <div className="aurora aurora-iris" />
      <div className="absolute inset-0 bg-vignette" />
      <div className="absolute inset-0 bg-grain opacity-[0.045] mix-blend-overlay" />
    </div>
  );
}

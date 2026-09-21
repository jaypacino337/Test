import { pct } from "@/lib/format";

export function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={`num inline-flex items-center gap-1 text-sm ${up ? "text-lime-400" : "text-rose-400"} ${className}`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {pct(Math.abs(value))}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="panel px-4 py-3.5">
      <div className="label">{label}</div>
      <div className={`num mt-1.5 text-xl ${accent ? "text-lime-400" : "text-mist-100"}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-mist-500">{sub}</div> : null}
    </div>
  );
}

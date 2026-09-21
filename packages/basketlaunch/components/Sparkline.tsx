interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  /** Stretch to the container width instead of holding the fixed pixel width. */
  fluid?: boolean;
}

/** Minimal inline sparkline — no chart library, just a path. */
export function Sparkline({
  values,
  width = 128,
  height = 36,
  positive = true,
  fluid = false,
}: SparklineProps) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const stroke = positive ? "#C2F24E" : "#FF6B85";
  const id = `spark-${positive ? "up" : "down"}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={fluid ? undefined : width}
      height={height}
      preserveAspectRatio={fluid ? "none" : undefined}
      className={fluid ? "block w-full" : "block"}
      style={fluid ? { height } : undefined}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points.join(" ")} ${width},${height}`} fill={`url(#${id})`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

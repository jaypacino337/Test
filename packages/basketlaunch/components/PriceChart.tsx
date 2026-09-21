"use client";

import { useMemo, useState } from "react";
import { price as fmtPrice } from "@/lib/format";

interface PriceChartProps {
  values: number[];
  height?: number;
}

/** Hand-rolled area chart with a hover crosshair — keeps the bundle dependency-free. */
export function PriceChart({ values, height = 260 }: PriceChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;

  const { path, area, min, max, points } = useMemo(() => {
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;
    const step = width / Math.max(values.length - 1, 1);
    const coords = values.map((value, index) => ({
      x: index * step,
      y: height - ((value - lo) / span) * (height - 28) - 14,
      value,
    }));
    return {
      min: lo,
      max: hi,
      points: coords,
      path: coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" "),
      area:
        `M0 ${height} ` +
        coords.map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ") +
        ` L${width} ${height} Z`,
    };
  }, [values, height]);

  const active = hover === null ? null : points[Math.min(hover, points.length - 1)];
  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? "#C2F24E" : "#FF6B85";

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Basket price history"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          setHover(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.2, 0.4, 0.6, 0.8].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2={width}
            y1={height * fraction}
            y2={height * fraction}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 6"
          />
        ))}

        <path d={area} fill="url(#chart-fill)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />

        {active ? (
          <g>
            <line x1={active.x} x2={active.x} y1="0" y2={height} stroke="rgba(255,255,255,0.22)" />
            <circle cx={active.x} cy={active.y} r="4.5" fill={stroke} stroke="#05070B" strokeWidth="2" />
          </g>
        ) : null}
      </svg>

      <div className="pointer-events-none absolute right-3 top-2 text-right">
        <div className="num text-sm text-mist-100">{fmtPrice(active ? active.value : values[values.length - 1])}</div>
        <div className="label mt-0.5">{active ? "hovered" : "last"}</div>
      </div>
      <div className="pointer-events-none absolute left-3 top-2 label">
        high {fmtPrice(max)} · low {fmtPrice(min)}
      </div>
    </div>
  );
}

"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * The hero's signature piece: volleys of arrows arc in along flight paths and
 * thud into a target, leaving a gold dashed trail and an impact ring. Pure SVG,
 * no WebGL. Pauses off-screen; with reduced motion it renders the landed state.
 */
const CX = 430;
const CY = 270;
const RINGS = [
  { r: 168, fill: "#0f1d16" },
  { r: 134, fill: "#ece4d2" },
  { r: 104, fill: "#1d3a2c" },
  { r: 74, fill: "#ece4d2" },
  { r: 44, fill: "#2a5340" },
  { r: 16, fill: "#c9a24a" },
];
const VOLLEYS = [
  [
    { start: 120, dx: -10, dy: -18 },
    { start: 300, dx: 14, dy: 8 },
    { start: 470, dx: -4, dy: 26 },
  ],
  [
    { start: 60, dx: 4, dy: -4 },
    { start: 240, dx: -22, dy: 14 },
    { start: 420, dx: 20, dy: -22 },
  ],
];

function flightPath(startY: number, dx: number, dy: number) {
  const ex = CX + dx;
  const ey = CY + dy;
  return `M -90 ${startY} Q ${CX * 0.42} ${Math.min(startY, ey) - 190} ${ex} ${ey}`;
}

function Arrow({ d, delay, run, onLand }: { d: string; delay: number; run: boolean; onLand?: () => void }) {
  const path = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const body = useRef<SVGGElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const [landed, setLanded] = useState(!run);

  const place = (p: number) => {
    const el = path.current;
    const g = body.current;
    if (!el || !g) return;
    const len = el.getTotalLength();
    const at = el.getPointAtLength(len * p);
    const ahead = el.getPointAtLength(Math.min(len, len * p + 1));
    const behind = el.getPointAtLength(Math.max(0, len * p - 1));
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
    g.setAttribute("transform", `translate(${at.x} ${at.y}) rotate(${angle})`);
    if (trail.current) trail.current.style.strokeDashoffset = `${len * (1 - p)}`;
  };

  useEffect(() => {
    const el = path.current;
    if (!el) return;
    const len = el.getTotalLength();
    if (trail.current) trail.current.style.strokeDasharray = `${len}`;
    if (!run) {
      place(1);
      return;
    }
    place(0);
    const flight = animate(0, 1, {
      duration: 1.05,
      delay,
      ease: [0.33, 0, 0.2, 1],
      onUpdate: place,
      onComplete: () => {
        setLanded(true);
        onLand?.();
        if (ring.current) animate(ring.current, { r: [2, 34], opacity: [0.9, 0] }, { duration: 0.8, ease: "easeOut" });
        if (body.current) {
          const base = body.current.getAttribute("transform") ?? "";
          animate(0, 1, {
            duration: 0.55,
            onUpdate: (t) => body.current?.setAttribute("transform", `${base} rotate(${Math.sin(t * Math.PI * 5) * (1 - t) * 4})`),
          });
        }
      },
    });
    return () => flight.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, run]);

  const end = d.split(" ").slice(-2).map(Number);
  return (
    <g>
      <path ref={path} d={d} fill="none" stroke="none" />
      <path
        ref={trail}
        d={d}
        fill="none"
        stroke="#c9a24a"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ opacity: landed ? 0.18 : 0.55, transition: "opacity 1.2s" }}
      />
      <circle ref={ring} cx={end[0]} cy={end[1]} r="2" fill="none" stroke="#c9a24a" strokeWidth="1.5" opacity="0" />
      <g ref={body}>
        {/* tip at the origin, pointing +x; the head is buried slightly in the target on landing */}
        <line x1="-96" y1="0" x2="-4" y2="0" stroke="#ece4d2" strokeWidth="3" strokeLinecap="round" />
        <path d="M 6 0 L -10 -6 L -7 0 L -10 6 Z" fill="#c9a24a" />
        <path d="M -96 0 L -84 -9 L -70 -9 L -80 0 Z" fill="#3f7a59" />
        <path d="M -96 0 L -84 9 L -70 9 L -80 0 Z" fill="#a5a891" />
      </g>
    </g>
  );
}

export function Volley({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { margin: "120px" });
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [landedCount, setLandedCount] = useState(0);
  const set = VOLLEYS[round % VOLLEYS.length];
  const animated = !reduce;

  useEffect(() => {
    if (!animated || !inView || landedCount < set.length) return;
    const t = setTimeout(() => {
      setLandedCount(0);
      setRound((r) => r + 1);
    }, 2600);
    return () => clearTimeout(t);
  }, [animated, inView, landedCount, set.length]);

  return (
    <div ref={wrap} className={className}>
      <svg viewBox="0 0 640 540" className="h-full w-full overflow-visible" role="img" aria-label="Arrows flying into an archery target">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9a24a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#c9a24a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r="250" fill="url(#glow)" />
        <g className="origin-center animate-sway" style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}>
          {/* stand */}
          <path d={`M ${CX - 70} ${CY + 150} L ${CX - 120} ${CY + 270} M ${CX + 70} ${CY + 150} L ${CX + 120} ${CY + 270} M ${CX} ${CY + 160} L ${CX} ${CY + 275}`} stroke="#22392d" strokeWidth="10" strokeLinecap="round" />
          {RINGS.map((ring) => (
            <circle key={ring.r} cx={CX} cy={CY} r={ring.r} fill={ring.fill} stroke="#08120d" strokeWidth="2" />
          ))}
          {[134, 104, 74, 44].map((r) => (
            <circle key={`g${r}`} cx={CX} cy={CY} r={r - 15} fill="none" stroke="#08120d" strokeOpacity="0.18" strokeWidth="1" />
          ))}
        </g>
        {(inView || !animated) &&
          set.map((a, i) => (
            <Arrow
              key={`${round}-${i}`}
              d={flightPath(a.start, a.dx, a.dy)}
              delay={0.25 + i * 0.38}
              run={animated}
              onLand={() => setLandedCount((n) => n + 1)}
            />
          ))}
      </svg>
    </div>
  );
}

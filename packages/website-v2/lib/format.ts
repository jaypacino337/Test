export const fmtSol = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: n < 10 ? 3 : 2, maximumFractionDigits: n < 10 ? 3 : 2 })} SOL`;
export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtUsd = (n: number) =>
  n >= 1 ? `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n)}` : `$${n.toPrecision(3)}`;
export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
export const dash = <T,>(v: T | null | undefined, f: (x: T) => string) => (v === null || v === undefined ? "—" : f(v));

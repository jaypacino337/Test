export function usd(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return "$0";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 10_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits })}`;
}

export function price(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (value >= 1) return `$${value.toFixed(3)}`;
  if (value >= 0.001) return `$${value.toFixed(5)}`;
  return `$${value.toExponential(2)}`;
}

export function sol(value: number, digits = 2): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: digits })} SOL`;
}

export function pct(value: number, digits = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function compact(value: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

/**
 * Token amounts, which span from billions of meme-coin units down to fractions
 * of a SOL. `compact` alone rounds anything under ~0.005 to "0", so small
 * balances and cross-pair rates need real precision.
 */
export function quantity(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1000) return compact(value);
  if (abs >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (abs >= 0.000001) return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
  return value.toExponential(2);
}

/** 7Fq2…9xKd — the usual truncated-pubkey treatment. */
export function shortAddress(address: string, lead = 4, tail = 4): string {
  if (address.length <= lead + tail) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function timeAgo(timestamp: number, now: number): string {
  const seconds = Math.max(1, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

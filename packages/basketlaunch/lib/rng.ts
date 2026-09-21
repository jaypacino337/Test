/**
 * Tiny deterministic PRNG (mulberry32) so the demo universe is identical on the
 * server render and the first client render — otherwise React hydration would
 * complain about every price on the page.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded geometric random walk — used for sparklines and price history. */
export function randomWalk(seed: string, points: number, start: number, vol: number): number[] {
  const rand = mulberry32(hashSeed(seed));
  const series: number[] = [];
  let value = start;
  for (let i = 0; i < points; i += 1) {
    value = Math.max(value * (1 + (rand() - 0.48) * vol), start * 0.15);
    series.push(value);
  }
  return series;
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

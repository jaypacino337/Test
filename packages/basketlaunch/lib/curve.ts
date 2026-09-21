/**
 * Constant-product bonding curve with virtual reserves — the familiar
 * launchpad shape: price starts low, rises with every buy, and the basket
 * "graduates" to a real AMM pool once enough SOL has come in.
 *
 * All maths here is pure and unit-testable; the UI only ever renders quotes.
 */

export const TOTAL_SUPPLY = 1_000_000_000;
export const VIRTUAL_SOL = 30;
export const VIRTUAL_TOKENS = 1_073_000_000;
export const GRADUATION_SOL = 85;
/** 1% taken on both sides of a trade. */
export const FEE_BPS = 100;
/** Share of the fee routed to the basket's rebalance vault (the rest: creator + LP). */
export const VAULT_FEE_SHARE = 0.4;

export interface CurveState {
  /** Real SOL paid into the curve so far. */
  realSol: number;
  /** Tokens already sold out of the curve. */
  tokensSold: number;
}

export interface Quote {
  /** SOL in (buy) or SOL out (sell), after fees. */
  sol: number;
  /** Tokens out (buy) or tokens in (sell). */
  tokens: number;
  fee: number;
  vaultCut: number;
  avgPrice: number;
  priceBefore: number;
  priceAfter: number;
  priceImpact: number;
  next: CurveState;
}

function reserves(state: CurveState) {
  return {
    solReserve: VIRTUAL_SOL + state.realSol,
    tokenReserve: VIRTUAL_TOKENS - state.tokensSold,
  };
}

/** Spot price in SOL per token. */
export function spotPrice(state: CurveState): number {
  const { solReserve, tokenReserve } = reserves(state);
  return tokenReserve <= 0 ? Infinity : solReserve / tokenReserve;
}

/** Fully-diluted market cap of the basket token, in SOL. */
export function marketCapSol(state: CurveState): number {
  return spotPrice(state) * TOTAL_SUPPLY;
}

export function graduationProgress(state: CurveState): number {
  return Math.min(1, state.realSol / GRADUATION_SOL);
}

export function hasGraduated(state: CurveState): boolean {
  return state.realSol >= GRADUATION_SOL;
}

export function quoteBuy(state: CurveState, solIn: number): Quote {
  const priceBefore = spotPrice(state);
  if (!(solIn > 0)) return emptyQuote(state, priceBefore);

  const fee = (solIn * FEE_BPS) / 10_000;
  const netSol = solIn - fee;
  const { solReserve, tokenReserve } = reserves(state);
  const k = solReserve * tokenReserve;
  const tokensOut = tokenReserve - k / (solReserve + netSol);
  const capped = Math.min(tokensOut, tokenReserve * 0.999);

  const next: CurveState = {
    realSol: state.realSol + netSol,
    tokensSold: state.tokensSold + capped,
  };
  const priceAfter = spotPrice(next);

  return {
    sol: solIn,
    tokens: capped,
    fee,
    vaultCut: fee * VAULT_FEE_SHARE,
    avgPrice: capped > 0 ? netSol / capped : 0,
    priceBefore,
    priceAfter,
    priceImpact: priceBefore > 0 ? (priceAfter - priceBefore) / priceBefore : 0,
    next,
  };
}

export function quoteSell(state: CurveState, tokensIn: number): Quote {
  const priceBefore = spotPrice(state);
  if (!(tokensIn > 0)) return emptyQuote(state, priceBefore);

  const sellable = Math.min(tokensIn, state.tokensSold);
  const { solReserve, tokenReserve } = reserves(state);
  const k = solReserve * tokenReserve;
  const grossSol = Math.min(solReserve - k / (tokenReserve + sellable), state.realSol);
  const fee = (grossSol * FEE_BPS) / 10_000;
  const netSol = grossSol - fee;

  const next: CurveState = {
    realSol: Math.max(0, state.realSol - grossSol),
    tokensSold: Math.max(0, state.tokensSold - sellable),
  };
  const priceAfter = spotPrice(next);

  return {
    sol: netSol,
    tokens: sellable,
    fee,
    vaultCut: fee * VAULT_FEE_SHARE,
    avgPrice: sellable > 0 ? netSol / sellable : 0,
    priceBefore,
    priceAfter,
    priceImpact: priceBefore > 0 ? (priceAfter - priceBefore) / priceBefore : 0,
    next,
  };
}

function emptyQuote(state: CurveState, priceBefore: number): Quote {
  return {
    sol: 0,
    tokens: 0,
    fee: 0,
    vaultCut: 0,
    avgPrice: 0,
    priceBefore,
    priceAfter: priceBefore,
    priceImpact: 0,
    next: state,
  };
}

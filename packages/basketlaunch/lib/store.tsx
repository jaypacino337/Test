"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Basket, SOL_USD, Trade, seedBaskets, seedTrades } from "./baskets";
import { CurveState, quoteBuy, quoteSell, spotPrice } from "./curve";
import { hashSeed, mulberry32 } from "./rng";
import { TOKENS, fakeAddress } from "./tokens";

const STORAGE_KEY = "basketlaunch.beta.v1";
const TICK_MS = 2000;

export interface Position {
  slug: string;
  tokens: number;
  /** Total SOL spent, net of sells — the cost basis. */
  costSol: number;
}

interface Wallet {
  address: string;
  connected: boolean;
  solBalance: number;
}

interface PersistedState {
  wallet: Wallet;
  positions: Position[];
  localBaskets: Basket[];
  curveOverrides: Record<string, CurveState>;
}

interface StoreValue extends PersistedState {
  baskets: Basket[];
  trades: Trade[];
  prices: Record<string, number>;
  now: number;
  solUsd: number;
  ready: boolean;
  connect: () => void;
  disconnect: () => void;
  buy: (slug: string, solIn: number) => void;
  sell: (slug: string, tokensIn: number) => void;
  launch: (draft: Omit<Basket, "creator" | "mint" | "createdAt" | "holders" | "vault">) => void;
  positionFor: (slug: string) => Position | undefined;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/**
 * Fixed epoch for the server render and the first client pass, so the two
 * hydrate identically. Once mounted we swap in the real clock (see `epoch`),
 * which keeps "launched 3d ago" honest instead of drifting with the calendar.
 */
const BOOT = 1_758_000_000_000;

function initialWallet(): Wallet {
  return { address: fakeAddress("demo-wallet"), connected: false, solBalance: 24.5 };
}

function initialPersisted(): PersistedState {
  return { wallet: initialWallet(), positions: [], localBaskets: [], curveOverrides: {} };
}

function basePrices(): Record<string, number> {
  return Object.fromEntries(TOKENS.map((token) => [token.symbol, token.spot]));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedState>(initialPersisted);
  const [prices, setPrices] = useState<Record<string, number>>(basePrices);
  const [trades, setTrades] = useState<Trade[]>(() => seedTrades(seedBaskets(BOOT), BOOT));
  const [now, setNow] = useState(BOOT);
  const [epoch, setEpoch] = useState(BOOT);
  const [ready, setReady] = useState(false);
  const tickRef = useRef(0);

  // Hydrate from localStorage after mount — never during render, so the
  // server-rendered markup and the first client pass stay identical.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        setPersisted({ ...initialPersisted(), ...parsed });
      }
    } catch {
      // Private mode / blocked storage: the demo just starts fresh.
    }
    const mountedAt = Date.now();
    setEpoch(mountedAt);
    setNow(mountedAt);
    setTrades(seedTrades(seedBaskets(mountedAt), mountedAt));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Ignore quota or privacy errors — persistence is a nicety here.
    }
  }, [persisted, ready]);

  // The market sim: nudge every component price, then print a random trade.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      const rand = mulberry32(hashSeed(`tick-${tick}`));

      setPrices((current) => {
        const next: Record<string, number> = {};
        for (const token of TOKENS) {
          const last = current[token.symbol] ?? token.spot;
          const drift = (rand() - 0.5) * token.vol * 0.22;
          next[token.symbol] = Math.max(last * (1 + drift), token.spot * 0.2);
        }
        return next;
      });

      setNow(Date.now());

      if (tick % 2 === 0) {
        setTrades((current) => {
          const pool = current.length ? current : [];
          const slugs = Array.from(new Set(pool.map((trade) => trade.basket)));
          if (!slugs.length) return current;
          const slug = slugs[Math.floor(rand() * slugs.length)];
          const side = rand() > 0.45 ? "buy" : "sell";
          const solAmount = Number((0.08 + rand() * 4.2).toFixed(2));
          const trade: Trade = {
            id: `live-${tick}`,
            basket: slug,
            side,
            sol: solAmount,
            tokens: solAmount * 3_200_000 * (0.6 + rand()),
            trader: fakeAddress(`live-trader-${tick}`),
            at: Date.now(),
          };
          return [trade, ...pool].slice(0, 40);
        });
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [ready]);

  const baskets = useMemo(() => {
    const seeded = seedBaskets(epoch).map((basket) => ({
      ...basket,
      curve: persisted.curveOverrides[basket.slug] ?? basket.curve,
    }));
    const local = persisted.localBaskets.map((basket) => ({
      ...basket,
      curve: persisted.curveOverrides[basket.slug] ?? basket.curve,
    }));
    return [...local, ...seeded];
  }, [epoch, persisted.curveOverrides, persisted.localBaskets]);

  const recordTrade = useCallback(
    (slug: string, side: "buy" | "sell", solAmount: number, tokens: number, wallet: string) => {
      setTrades((current) =>
        [
          {
            id: `me-${Date.now()}`,
            basket: slug,
            side,
            sol: solAmount,
            tokens,
            trader: wallet,
            at: Date.now(),
          },
          ...current,
        ].slice(0, 40),
      );
    },
    [],
  );

  const buy = useCallback(
    (slug: string, solIn: number) => {
      setPersisted((state) => {
        const basket = findBasket(state, slug);
        if (!basket || solIn <= 0 || solIn > state.wallet.solBalance) return state;
        const curve = state.curveOverrides[slug] ?? basket.curve;
        const quote = quoteBuy(curve, solIn);
        if (quote.tokens <= 0) return state;

        recordTrade(slug, "buy", solIn, quote.tokens, state.wallet.address);
        return {
          ...state,
          wallet: { ...state.wallet, solBalance: state.wallet.solBalance - solIn },
          curveOverrides: { ...state.curveOverrides, [slug]: quote.next },
          positions: upsertPosition(state.positions, slug, quote.tokens, solIn),
        };
      });
    },
    [recordTrade],
  );

  const sell = useCallback(
    (slug: string, tokensIn: number) => {
      setPersisted((state) => {
        const basket = findBasket(state, slug);
        const position = state.positions.find((entry) => entry.slug === slug);
        if (!basket || !position || tokensIn <= 0) return state;
        const tokens = Math.min(tokensIn, position.tokens);
        const curve = state.curveOverrides[slug] ?? basket.curve;
        const quote = quoteSell(curve, tokens);
        if (quote.sol <= 0) return state;

        const share = position.tokens > 0 ? tokens / position.tokens : 1;
        recordTrade(slug, "sell", quote.sol, tokens, state.wallet.address);
        return {
          ...state,
          wallet: { ...state.wallet, solBalance: state.wallet.solBalance + quote.sol },
          curveOverrides: { ...state.curveOverrides, [slug]: quote.next },
          positions: state.positions
            .map((entry) =>
              entry.slug === slug
                ? {
                    ...entry,
                    tokens: entry.tokens - tokens,
                    costSol: entry.costSol * (1 - share),
                  }
                : entry,
            )
            .filter((entry) => entry.tokens > 1e-6),
        };
      });
    },
    [recordTrade],
  );

  const launch = useCallback<StoreValue["launch"]>((draft) => {
    setPersisted((state) => ({
      ...state,
      localBaskets: [
        {
          ...draft,
          creator: state.wallet.address,
          mint: fakeAddress(`${draft.slug}-${Date.now()}`),
          createdAt: Date.now(),
          holders: 1,
          vault: 0,
          local: true,
        },
        ...state.localBaskets,
      ],
    }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...persisted,
      baskets,
      trades,
      prices,
      now,
      solUsd: SOL_USD,
      ready,
      connect: () =>
        setPersisted((state) => ({ ...state, wallet: { ...state.wallet, connected: true } })),
      disconnect: () =>
        setPersisted((state) => ({ ...state, wallet: { ...state.wallet, connected: false } })),
      buy,
      sell,
      launch,
      positionFor: (slug: string) => persisted.positions.find((entry) => entry.slug === slug),
      reset: () => setPersisted(initialPersisted()),
    }),
    [persisted, baskets, trades, prices, now, ready, buy, sell, launch],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function findBasket(state: PersistedState, slug: string): Basket | undefined {
  return (
    state.localBaskets.find((basket) => basket.slug === slug) ??
    seedBaskets(BOOT).find((basket) => basket.slug === slug)
  );
}

function upsertPosition(
  positions: Position[],
  slug: string,
  tokens: number,
  costSol: number,
): Position[] {
  const existing = positions.find((entry) => entry.slug === slug);
  if (!existing) return [...positions, { slug, tokens, costSol }];
  return positions.map((entry) =>
    entry.slug === slug
      ? { ...entry, tokens: entry.tokens + tokens, costSol: entry.costSol + costSol }
      : entry,
  );
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>");
  return context;
}

/** Live basket price in SOL, honouring any trades made this session. */
export function livePriceSol(basket: Basket): number {
  return spotPrice(basket.curve);
}

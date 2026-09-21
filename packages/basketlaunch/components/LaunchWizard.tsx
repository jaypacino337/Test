"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Component } from "@/lib/baskets";
import { GRADUATION_SOL, TOTAL_SUPPLY, VIRTUAL_SOL, spotPrice } from "@/lib/curve";
import { SOL_USD } from "@/lib/baskets";
import { compact, price } from "@/lib/format";
import { SECTOR_LABELS, Sector, TOKENS, TOKEN_BY_SYMBOL } from "@/lib/tokens";
import { useStore } from "@/lib/store";

const MAX_SLEEVES = 8;
const STEPS = ["Identity", "Composition", "Review"] as const;

export function LaunchWizard() {
  const router = useRouter();
  const { baskets, launch, wallet, connect } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [tagline, setTagline] = useState("");
  const [sector, setSector] = useState<Sector>("memes");
  const [components, setComponents] = useState<Component[]>([]);

  const totalWeight = components.reduce((sum, entry) => sum + entry.weight, 0);
  const slug = useMemo(() => uniqueSlug(name, baskets.map((basket) => basket.slug)), [name, baskets]);

  const tickerTaken = baskets.some(
    (basket) => basket.ticker.toUpperCase() === ticker.trim().toUpperCase(),
  );

  const identityOk =
    name.trim().length >= 3 && ticker.trim().length >= 2 && !tickerTaken && tagline.trim().length >= 10;
  const compositionOk = components.length >= 2 && Math.round(totalWeight) === 100;

  function toggleToken(symbol: string) {
    setComponents((current) => {
      const exists = current.find((entry) => entry.symbol === symbol);
      if (exists) return current.filter((entry) => entry.symbol !== symbol);
      if (current.length >= MAX_SLEEVES) return current;
      return [...current, { symbol, weight: 0 }];
    });
  }

  function setWeight(symbol: string, weight: number) {
    setComponents((current) =>
      current.map((entry) =>
        entry.symbol === symbol ? { ...entry, weight: Math.max(0, Math.min(100, weight)) } : entry,
      ),
    );
  }

  function equalize() {
    setComponents((current) => {
      if (!current.length) return current;
      const base = Math.floor(100 / current.length);
      const remainder = 100 - base * current.length;
      return current.map((entry, index) => ({
        ...entry,
        weight: base + (index < remainder ? 1 : 0),
      }));
    });
  }

  function deploy() {
    if (!identityOk || !compositionOk || !wallet.connected) return;
    launch({
      slug,
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      tagline: tagline.trim(),
      sector,
      components,
      curve: { realSol: 0, tokensSold: 0 },
    });
    router.push(`/basket/${slug}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="panel min-w-0 p-6">
        <ol className="flex items-center gap-2">
          {STEPS.map((title, index) => (
            <li key={title} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={`num grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  index <= step ? "bg-lime-400 text-ink-900" : "border border-white/12 text-mist-700"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`truncate text-sm ${index === step ? "text-mist-100" : "text-mist-700"}`}
              >
                {title}
              </span>
              {index < STEPS.length - 1 ? (
                <span className={`h-px flex-1 ${index < step ? "bg-lime-400/50" : "bg-white/10"}`} />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-7">
          {step === 0 ? (
            <div className="space-y-5">
              <Field label="Basket name" hint="Shown everywhere. 3 characters or more.">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value.slice(0, 32))}
                  placeholder="Long Tail Majors"
                  className="field"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Ticker"
                  hint={tickerTaken ? "That ticker is already live." : "2–6 characters, uppercase."}
                  error={tickerTaken}
                >
                  <input
                    value={ticker}
                    onChange={(event) =>
                      setTicker(event.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6))
                    }
                    placeholder="TAIL"
                    className="field num"
                  />
                </Field>

                <Field label="Sector" hint="Used for filtering on explore.">
                  <select
                    value={sector}
                    onChange={(event) => setSector(event.target.value as Sector)}
                    className="field"
                  >
                    {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                      <option key={key} value={key} className="bg-ink-800">
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Thesis" hint="One line on why this basket exists.">
                <textarea
                  value={tagline}
                  onChange={(event) => setTagline(event.target.value.slice(0, 140))}
                  rows={3}
                  placeholder="Eight small caps, evenly weighted, rebalanced every epoch."
                  className="field resize-none"
                />
                <span className="num mt-1 block text-right text-[11px] text-mist-700">
                  {tagline.length}/140
                </span>
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-mist-100">
                    Pick your sleeves
                  </h3>
                  <p className="mt-1 text-xs text-mist-500">
                    2–{MAX_SLEEVES} tokens. Weights must add up to exactly 100%.
                  </p>
                </div>
                <button onClick={equalize} disabled={!components.length} className="btn-ghost px-4 py-2">
                  Equalise weights
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TOKENS.map((token) => {
                  const selected = components.some((entry) => entry.symbol === token.symbol);
                  const full = components.length >= MAX_SLEEVES && !selected;
                  return (
                    <button
                      key={token.symbol}
                      onClick={() => toggleToken(token.symbol)}
                      disabled={full}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-35 ${
                        selected
                          ? "border-lime-400/60 bg-lime-400/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25"
                      }`}
                    >
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm"
                        style={{ backgroundColor: `${token.tint}1f`, color: token.tint }}
                        aria-hidden
                      >
                        {token.glyph}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-mist-100">
                          {token.symbol}
                        </span>
                        <span className="block truncate text-[11px] text-mist-500">{token.name}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {components.length ? (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="label">Weights</span>
                    <span
                      className={`num text-sm ${
                        Math.round(totalWeight) === 100 ? "text-lime-400" : "text-amber-400"
                      }`}
                    >
                      {totalWeight.toFixed(0)}% / 100%
                    </span>
                  </div>

                  {components.map((component) => (
                    <div key={component.symbol} className="flex items-center gap-3">
                      <span className="num w-14 shrink-0 text-sm text-mist-100">
                        {component.symbol}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={component.weight}
                        onChange={(event) => setWeight(component.symbol, Number(event.target.value))}
                        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-lime-400"
                        aria-label={`${component.symbol} weight`}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={component.weight}
                        onChange={(event) => setWeight(component.symbol, Number(event.target.value))}
                        className="num w-16 shrink-0 rounded-lg border border-white/10 bg-ink-800/70 px-2 py-1 text-right text-sm text-mist-100 outline-none focus:border-lime-400/60"
                        aria-label={`${component.symbol} weight value`}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-base font-semibold text-mist-100">
                  Review and deploy
                </h3>
                <p className="mt-1 text-xs text-mist-500">
                  Nothing is broadcast — this beta mints the basket into your browser only.
                </p>
              </div>

              <dl className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-ink-800/40 px-4">
                <Summary label="Name" value={name.trim() || "—"} />
                <Summary label="Ticker" value={ticker ? `$${ticker}` : "—"} />
                <Summary label="Sector" value={SECTOR_LABELS[sector]} />
                <Summary label="URL" value={`/basket/${slug}`} />
                <Summary
                  label="Sleeves"
                  value={components.map((entry) => `${entry.symbol} ${entry.weight}%`).join(" · ") || "—"}
                />
                <Summary label="Supply" value={`${compact(TOTAL_SUPPLY)} ${ticker || "tokens"}`} />
                <Summary
                  label="Start price"
                  value={price(spotPrice({ realSol: 0, tokensSold: 0 }) * SOL_USD)}
                />
                <Summary label="Graduates at" value={`${GRADUATION_SOL} SOL raised`} />
                <Summary label="Virtual liquidity" value={`${VIRTUAL_SOL} SOL`} />
              </dl>

              {wallet.connected ? (
                <button onClick={deploy} disabled={!identityOk || !compositionOk} className="btn-primary w-full py-3 text-base">
                  Deploy basket
                </button>
              ) : (
                <button onClick={connect} className="btn-primary w-full py-3 text-base">
                  Connect wallet to deploy
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-white/[0.06] pt-5">
          <button
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="btn-ghost px-5 py-2"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((current) => current + 1)}
              disabled={step === 0 ? !identityOk : !compositionOk}
              className="btn-primary px-6 py-2"
            >
              Continue
            </button>
          ) : null}
        </div>
      </div>

      <LivePreview
        name={name}
        ticker={ticker}
        tagline={tagline}
        components={components}
        totalWeight={totalWeight}
      />
    </div>
  );
}

function LivePreview({
  name,
  ticker,
  tagline,
  components,
  totalWeight,
}: {
  name: string;
  ticker: string;
  tagline: string;
  components: Component[];
  totalWeight: number;
}) {
  const stops = (() => {
    if (!components.length) return "rgba(255,255,255,0.08) 0% 100%";
    let cursor = 0;
    return components
      .map((component) => {
        const tint = TOKEN_BY_SYMBOL[component.symbol]?.tint ?? "#7E8B9E";
        const from = cursor;
        cursor += totalWeight > 0 ? (component.weight / totalWeight) * 100 : 0;
        return `${tint} ${from}% ${cursor}%`;
      })
      .join(", ");
  })();

  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="panel p-5">
        <span className="label">Live preview</span>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(${stops})` }}
            aria-hidden
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-900 font-display text-xs font-semibold text-mist-100">
              {(ticker || "??").slice(0, 2)}
            </span>
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold text-mist-100">
              {name.trim() || "Untitled basket"}
            </div>
            <div className="num text-xs text-mist-500">${ticker || "TICKER"}</div>
          </div>
        </div>

        <p className="mt-3 min-h-[2.5rem] text-xs leading-relaxed text-mist-500">
          {tagline.trim() || "Your thesis shows up here."}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {components.length ? (
            components.map((component) => (
              <span key={component.symbol} className="chip px-2 py-0.5 text-[11px]">
                {component.symbol}
                <span className="num text-mist-500">{component.weight}%</span>
              </span>
            ))
          ) : (
            <span className="chip px-2 py-0.5 text-[11px] text-mist-700">no sleeves yet</span>
          )}
        </div>

        <ul className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-xs text-mist-500">
          <Check ok={name.trim().length >= 3}>Name is at least 3 characters</Check>
          <Check ok={ticker.trim().length >= 2}>Ticker is set</Check>
          <Check ok={tagline.trim().length >= 10}>Thesis written</Check>
          <Check ok={components.length >= 2}>At least 2 sleeves</Check>
          <Check ok={Math.round(totalWeight) === 100}>Weights total 100%</Check>
        </ul>
      </div>
    </aside>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-lime-300" : "text-mist-700"}`}>
      <span aria-hidden>{ok ? "✓" : "○"}</span>
      {children}
    </li>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? (
        <span className={`mt-1 block text-[11px] ${error ? "text-rose-400" : "text-mist-700"}`}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd className="num max-w-[60%] text-right text-sm text-mist-100">{value}</dd>
    </div>
  );
}

function uniqueSlug(name: string, taken: string[]): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-basket";
  if (!taken.includes(base)) return base;
  let suffix = 2;
  while (taken.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

# Sherwood: style recipe

**Direction:** dark forest editorial. It reads like an old almanac printed in a wood, deliberately unlike the glassy neon of Jay's other coin sites.

| token | hex | use |
|---|---|---|
| `bg` | `#08120d` | page (near-black forest) |
| `surface` / `raised` | `#0f1d16` / `#142820` | cards, ticker band |
| `line` | `#22392d` | 1px editorial rules, grid gaps |
| `fg` | `#ece4d2` | bone/ivory type |
| `muted` | `#a5a891` | lichen, secondary text |
| `brand` / `moss` | `#3f7a59` / `#2a5340` | greens (LP leg, fletching, live dot) |
| `accent` | `#c9a24a` | the **only** gold: CTAs, italics, trails, kickers |

- **Type:** Fraunces (display serif, gold italic for the one emphasised word per heading), Inter (body), JetBrains Mono (kickers, numbers, addresses).
- **Layout:** editorial grid with a 180px kicker column, hairline rules between rows, a drop cap in the hero, Roman numerals for the loop.
- **Signature motion ("wow"):** `components/fx/Volley.tsx`. Arrows arc in along flight paths, leave a gold dashed trail, thud into a swaying target with an impact ring and a quiver. It repeats while in view and pauses off-screen. `FlightLine.tsx` draws a gold flight path with an arrow riding it as you scroll through "the loop".
- **Motion pass:** word-rise headline, fade-up/un-blur reveals, tilted serif marquee, count-up stats, cursor spotlight cards, magnetic CTAs, scroll progress, Lenis smooth scroll, flash-in ledger rows. All of it respects reduced motion.
- **Data rule:** stats come from `lib/stats.ts` (Supabase → bot API → DexScreener); null renders "—".

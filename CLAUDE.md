# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AlkansyaPH is a personal Philippine stock (PSE) portfolio tracker, built with Expo + React Native + Expo Router. Core loop: open app → see total portfolio value/performance → browse PSE stocks and news → add/adjust holdings → value updates.

The project is being built in phases (raw idea → core function → core loop → accessory features → surface-area check → retention hook → shippable MVP). **We are currently in Phase 1: front-end/UI prototype only.** There is no backend — auth and all data are mocked/in-memory (see Architecture below). Do not wire up a real backend, database, or market-data API unless explicitly asked; when that phase does start, per-user data isolation must be enforced server-side, never just in the UI.

## Commands

```bash
npm start          # expo start — dev server + QR code for Expo Go
npm run web         # expo start --web
npm run android      # expo start --android
npm run ios          # expo start --ios
npm run lint         # expo lint (ESLint, flat config via eslint-config-expo)
npx tsc --noEmit      # typecheck (not wired as an npm script, but the standard check)
npx expo-doctor       # validate Expo project/dependency health
```

There is no test runner configured (no Jest/Vitest) — don't assume a `test` script exists.

After any dependency-affecting or route-structure change, restart the dev server and re-run `npx tsc --noEmit` + `npm run lint` + `npx expo-doctor` — this project has hit real issues that only show up that way (see Gotchas).

## Architecture

**Routing.** Expo Router, file-based, rooted at `src/app` (SDK auto-detects `src/` as the app root — no metro.config override needed). Path alias `@/*` → `src/*` (see `tsconfig.json`).

- `src/app/_layout.tsx` — root layout. Wraps everything in `ThemePreferenceProvider` → `AuthProvider` → `PortfolioProvider`, then gates the whole tree with `Stack.Protected guard={...}`: unauthenticated users only ever see the `(auth)` group; authenticated users see `(tabs)` plus the modal/detail routes below. This is the auth flow's entire enforcement point right now (client-side only — fine for a mock, not for real auth).
- `(auth)/` — `login.tsx`, `signup.tsx`. No real backend; `AuthProvider` (`src/context/auth-context.tsx`) accepts any non-empty email/password after a fake delay.
- `(tabs)/` — the 4 primary surfaces: `index.tsx` (Portfolio/home), `stocks.tsx`, `news.tsx`, `settings.tsx`. Tab bar is a custom-styled `Tabs` from `expo-router` (not `unstable-native-tabs` — that was swapped out early for cross-platform/web styling control).
- `add-holding.tsx`, `edit-holding/[id].tsx` — root-level modals (`presentation: 'modal'`) for the add/increase/decrease/remove-holding flows.
- `stock/[symbol].tsx` — root-level push route (not a modal) for the per-stock detail page (own price graph + index stats + add/update CTA).

**State.** Two React contexts hold all app state (no Redux/Zustand):
- `AuthProvider` (`src/context/auth-context.tsx`) — `user`, `isAuthenticated`, `login/signup/logout`. In-memory only, resets on reload.
- `PortfolioProvider` (`src/context/portfolio-context.tsx`) — owns the raw `Holding[]` and derives `holdingsWithMarketData` (each holding joined against `src/data/stocks.ts` for live price/gain/loss) plus portfolio-wide totals. `addHolding`/`increaseHolding`/`decreaseHolding`/`removeHolding` are the only mutation paths — screens should go through `usePortfolio()`, never mutate holdings directly.
- `ThemePreferenceProvider` (`src/context/theme-preference-context.tsx`) — resolves `system`/`light`/`dark` preference against the OS scheme. `useTheme()` (`src/hooks/use-theme.ts`) is the *only* place color tokens should come from (`Colors.light`/`Colors.dark` in `src/constants/theme.ts`); styles pull colors inline (`{ color: theme.text }`) rather than through wrapper components.

**Real backend (Supabase)** — despite the Phase framing above, auth and data are no longer mocked; this section is out of date relative to Phase 1 and reflects the actual current state. Project ref `zraunfstpbgqbckeaofs`, client at `src/lib/supabase.ts`, credentials in `.env` (gitignored). Tables: `public.stocks` (~294 PSE-listed common-equity tickers seeded from phisix, RLS public-read), `public.holdings` (per-user, RLS via `auth.uid()`), `public.stock_price_history` (append-only, written by the scraper), `public.news_articles` (RLS public-read). No `profiles` table — `name` comes from `auth.users.user_metadata`.
- `src/hooks/use-stocks.ts` — React Query hook reading `public.stocks`, same `getStockBySymbol()` lookup shape the old mock had. Only the original ~30 PSEi-heavy tickers have `sector`/`float_million`/`market_cap_billion`/`index_weight_percent` populated (curated by hand); the rest are phisix-only and read back with `sector` falling back to `'Uncategorized'` client-side rather than fabricating a PSE sector classification.
- `src/hooks/use-news.ts` — reads `public.news_articles`, synced daily from PH business RSS feeds by the `sync-news` Edge Function.
- Live prices come from the `sync-stock-quotes` Edge Function (phisix API, not PSE Edge — see git history / project memory for why), scheduled via `pg_cron` during PSE market hours, gated by `src/utils/market-hours.ts`'s `isPseMarketOpen()` logic (re-implemented server-side).
- There is no PSEi composite index value anywhere in the app (no free/legitimate live source was ever found) — don't add one back without a real data source.

Any future real market-data or news integration should extend these hooks/functions rather than reintroducing a mock data layer.

**Charts** are hand-rolled SVG (`src/components/performance-graph.tsx`, via `react-native-svg`) — a smoothed line + gradient-fill area, no charting library. Two hooks feed it real data from `stock_price_history`, both returning the same `{ range, setRange, points, changeAmount, changePercent, isPositive, isLoading }` shape:
- `src/hooks/use-stock-history.ts` — a single symbol's real daily price history.
- `src/hooks/use-portfolio-history.ts` — portfolio value history. There's no transaction/quantity-history ledger in this app (see "Uncommitted Shares" below), so this approximates historical value as *current* holding quantities × historical daily price per symbol, forward-filling gaps and falling back to the live price before a symbol's earliest recorded history. Treat this as a documented simplification, not a bug, when extending it.

**Component layout:** `src/components/ui/` = generic, content-agnostic primitives (`primary-button`, `avatar-badge`, `change-pill`, `detail-grid`, `search-bar`, `segmented-control`, `market-status-badge`, etc.). `src/components/` (flat) = feature-specific composites that know about stocks/holdings/news (`holding-row`, `stock-row`, `news-card`, `performance-card`, `screen-header`). New reusable, domain-agnostic UI goes in `ui/`; anything that imports from `@/lib` or `@/context` goes flat.

**Formatting:** always use `src/utils/format.ts` (`formatCurrency`, `formatSignedPercent`, `formatShares`, `formatMarketCap`, etc.) instead of ad hoc `toFixed`/`toLocaleString` — the ₱ currency formatting in particular has a real rendering gotcha (see below).

**Market hours:** `src/utils/market-hours.ts` (`isPseMarketOpen`) computes real PSE trading hours (Mon–Fri, 9:30 AM–3:30 PM) in the `Asia/Manila` timezone specifically, independent of device timezone. `useMarketStatus()` polls it every 30s; `MarketStatusBadge` is the UI. Does not account for PH market holidays.

## Gotchas

- **Pinned to Expo SDK 54** (`react` 19.1.0, `react-native` 0.81.5) — intentionally, because the team's Expo Go app only supports up to SDK 54. Don't bump `expo`/`react`/`react-native`/`react-native-*` without checking that constraint first; if you do, use `npx expo install --fix` afterward, not manual version bumps.
- **Route types can go stale.** `.expo/types/router.d.ts` is generated and gitignored. Adding a new route directory has, at least once, produced bogus `Href` types (phantom routes pointing at `../components/...` etc.) until the dev server was restarted. If `tsc` complains about a `router.push()` path that clearly exists as a file under `src/app/`, delete `.expo/types/router.d.ts` and restart `npm start`.
- **`expo-env.d.ts` must exist** for `tsc` to know about `*.css` imports and CSS-module types (it's generated by Expo CLI on first run / gitignored). If it's missing, `tsc` fails on `@/global.css` and `.module.css` imports with `Cannot find module` errors — recreate it with a single line: `/// <reference types="expo/types" />`.
- **Never use `fontWeight: '800'` or `'900'`.** On Chrome/Windows (Segoe UI), those weights aren't natively available and get synthetically bolded, which visibly corrupts the ₱ (peso sign, U+20B1) glyph so it overlaps the next character. Confirmed via screenshot diffing — `'700'` is the max safe weight app-wide.
- **Use `boxShadow` (string or array), not `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`** — the legacy shadow props are deprecated under React Native Web on this RN version and log console warnings.
- **`react-native-worklets` is a separate dependency from `react-native-reanimated`** at this SDK/version — both are pinned explicitly in `package.json`; don't remove one assuming the other bundles it.
- **"Uncommitted Shares"** on the holding-details grid is always equal to Total Shares — there's no order/execution system in this app, so nothing is ever actually "committed" to a pending order. That's a deliberate simplification reflecting product scope, not a bug to fix.
- React Compiler is enabled (`app.json` → `experiments.reactCompiler`), so manual `useMemo`/`useCallback` are a style choice, not strictly required for new code — but plenty of existing code uses them explicitly and there's no push to remove them.

## Testing changes

There's no automated test suite. The established way to verify UI changes in this repo (used throughout its history) is: `npx tsc --noEmit` + `npm run lint` + `npx expo-doctor`, then actually run the dev server and drive it in a real browser (Chrome, via Playwright against `http://localhost:8081`) or Expo Go — screenshot and check for console/page errors rather than assuming a change "should work."

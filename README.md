# AlkansyaPH

A simple personal finance app for tracking a Philippine stock (PSE) portfolio — built with [Expo](https://expo.dev), [Expo Router](https://docs.expo.dev/router/introduction/), and React Native.

The core loop: open the app → see total portfolio value and performance → browse PSE stocks and market news → add or adjust a holding → value updates.

This is intentionally **not** a trading platform, brokerage, or professional trading terminal — just a fast way to answer "what do I own, what's it worth, and how is it doing."

## Status

**Phase 1: front-end/UI prototype.** Authentication and all data (stocks, prices, holdings, news, the PSEi index) are mocked/in-memory — there is no backend yet. Nothing here should be treated as real market data or a real account system. See [CLAUDE.md](CLAUDE.md) for the full phased build plan and architecture notes.

## Features

- **Portfolio** — total value, all-time gain/loss, a performance graph (1W/1M/3M/1Y), and a holdings list with per-holding gain/loss
- **Stocks** — PSEi index chart, searchable list of PSE-listed stocks, and a per-stock detail page with its own price graph and index stats (float, index weight, market cap)
- **News** — Philippine stock market news cards that link out to the original source
- **Settings** — profile, account info, light/dark/system appearance toggle
- **Holdings** — add, increase, decrease, or remove a position, with a brokerage-style detail breakdown (portfolio %, market/average price, market value, gain/loss)
- A live market-open/closed indicator based on actual PSE trading hours (Mon–Fri, 9:30 AM–3:30 PM, Asia/Manila)

## Getting started

```bash
npm install
npm start
```

This starts the Expo dev server and prints a QR code — scan it with [Expo Go](https://expo.dev/go) on your phone (same Wi-Fi network as your computer), or press `w` for web / `a` for Android / `i` for iOS.

> This project is pinned to **Expo SDK 54**. Make sure your Expo Go app supports SDK 54 or newer.

Other commands:

```bash
npm run web         # open directly in a browser
npm run android      # open in an Android emulator/device
npm run ios          # open in an iOS simulator/device
npm run lint         # ESLint
npx tsc --noEmit      # typecheck
npx expo-doctor       # validate project/dependency health
```

## Tech stack

- [Expo](https://expo.dev) (SDK 54) + [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing
- React Native + React Native Web (runs on iOS, Android, and web)
- TypeScript
- Hand-rolled SVG charts (`react-native-svg`) — no charting library
- React Context for state (auth, portfolio, theme) — no Redux/Zustand

## Project structure

```
src/
  app/            # Expo Router routes ((auth), (tabs), modals, stock detail)
  components/      # feature components (holding-row, stock-row, news-card, ...)
  components/ui/    # generic reusable primitives (buttons, badges, inputs, ...)
  context/         # AuthProvider, PortfolioProvider, ThemePreferenceProvider
  data/            # mock stocks, holdings, news, PSEi index, performance-series generator
  hooks/           # useTheme, useRangeSeries, useMarketStatus, ...
  constants/        # color tokens, spacing, radii
  utils/           # currency/percent/date formatting, PSE market-hours logic
```

See [CLAUDE.md](CLAUDE.md) for a deeper architecture walkthrough and known gotchas.

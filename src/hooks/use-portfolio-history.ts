import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { HoldingWithMarketData } from '@/context/portfolio-context';
import { supabase } from '@/lib/supabase';
import { PerformanceRange, PortfolioPoint } from '@/types';

const RANGE_DAYS: Record<Exclude<PerformanceRange, '1D'>, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

// Extra lookback so the first visible day can still be forward-filled from the
// most recent known price instead of showing a gap.
const LOOKBACK_BUFFER_DAYS = 30;

type HistoryRow = { symbol: string; captured_at: string; price: number | string };

function todayStartIso(): string {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

async function fetchHistoryForSymbols(symbols: string[], sinceIso: string): Promise<HistoryRow[]> {
  if (symbols.length === 0) return [];
  const { data, error } = await supabase
    .from('stock_price_history')
    .select('symbol, captured_at, price')
    .in('symbol', symbols)
    .gte('captured_at', sinceIso)
    .order('captured_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HistoryRow[];
}

// 1D needs the raw intraday ticks rather than one point per day --
// sync-stock-quotes writes a stock_price_history row every ~15 min during
// market hours, all symbols in a given sync run sharing the exact same
// captured_at (computed once per invocation), so aligning across symbols by
// that timestamp is exact. Purchase date isn't gated intraday since we only
// know the purchase *date*, not a time -- a holding bought today counts for
// all of today's ticks.
function computeIntradayPortfolioPoints(
  holdings: HoldingWithMarketData[],
  rows: HistoryRow[],
): PortfolioPoint[] {
  if (holdings.length === 0) return [];

  const bySymbolTick = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const tickMap = bySymbolTick.get(row.symbol) ?? new Map<string, number>();
    tickMap.set(row.captured_at, Number(row.price));
    bySymbolTick.set(row.symbol, tickMap);
  }

  const ticks = Array.from(
    new Set(Array.from(bySymbolTick.values()).flatMap((tickMap) => Array.from(tickMap.keys()))),
  ).sort();

  if (ticks.length === 0) return [];

  const lastKnown = new Map<string, number>();
  return ticks.map((tick) => {
    let total = 0;
    for (const holding of holdings) {
      const priceAtTick = bySymbolTick.get(holding.symbol)?.get(tick);
      if (priceAtTick !== undefined) lastKnown.set(holding.symbol, priceAtTick);
      const price = lastKnown.get(holding.symbol) ?? holding.stock.price;
      total += price * holding.quantity;
    }
    return { date: tick, value: total };
  });
}

// There's no transaction/quantity-history ledger in this app (see CLAUDE.md's
// "Uncommitted Shares" note), so a true historical portfolio value can't be
// computed. This approximates it as (current holding quantities) x (historical
// price per day) -- the standard simplification for this data shape -- forward-
// filling each symbol's price across days it wasn't scraped, and falling back to
// the live price for days before any history exists at all for that symbol.
//
// The visible range is clamped so it never starts before the earliest
// purchase date across current holdings (a 1Y view for a position bought
// last month should show one month, not a fabricated year), and each
// holding only contributes to the total from its own purchase date onward
// -- so buying a second position partway through the visible window shows
// up as a real step up in the line, not a flat backward projection.
function computePortfolioPoints(
  holdings: HoldingWithMarketData[],
  rows: HistoryRow[],
  range: Exclude<PerformanceRange, '1D'>,
): PortfolioPoint[] {
  if (holdings.length === 0) return [];

  const bySymbolDay = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const day = row.captured_at.slice(0, 10);
    const dayMap = bySymbolDay.get(row.symbol) ?? new Map<string, number>();
    dayMap.set(day, Number(row.price));
    bySymbolDay.set(row.symbol, dayMap);
  }

  const rangeCutoffDay = new Date();
  rangeCutoffDay.setDate(rangeCutoffDay.getDate() - RANGE_DAYS[range]);
  const rangeCutoff = rangeCutoffDay.toISOString().slice(0, 10);
  const earliestPurchase = holdings.reduce(
    (earliest, holding) => (holding.purchasedAt < earliest ? holding.purchasedAt : earliest),
    holdings[0].purchasedAt,
  );
  const cutoff = rangeCutoff > earliestPurchase ? rangeCutoff : earliestPurchase;
  const today = new Date().toISOString().slice(0, 10);

  const lastKnown = new Map<string, number>();
  for (const [symbol, dayMap] of bySymbolDay.entries()) {
    const priorDays = Array.from(dayMap.keys())
      .filter((day) => day < cutoff)
      .sort();
    const seedDay = priorDays[priorDays.length - 1];
    if (seedDay) lastKnown.set(symbol, dayMap.get(seedDay) as number);
  }

  const visibleDays = Array.from(
    new Set(Array.from(bySymbolDay.values()).flatMap((dayMap) => Array.from(dayMap.keys()))),
  )
    .filter((day) => day >= cutoff && day <= today)
    .sort();

  if (visibleDays.length === 0) return [];

  return visibleDays.map((day) => {
    let total = 0;
    for (const holding of holdings) {
      if (day < holding.purchasedAt) continue; // not owned yet on this day
      const priceToday = bySymbolDay.get(holding.symbol)?.get(day);
      if (priceToday !== undefined) lastKnown.set(holding.symbol, priceToday);
      const price = lastKnown.get(holding.symbol) ?? holding.stock.price;
      total += price * holding.quantity;
    }
    return { date: `${day}T00:00:00.000Z`, value: total };
  });
}

export function usePortfolioHistory(
  holdings: HoldingWithMarketData[],
  initialRange: PerformanceRange = '1M',
) {
  const [range, setRange] = useState<PerformanceRange>(initialRange);

  const symbols = useMemo(() => Array.from(new Set(holdings.map((h) => h.symbol))).sort(), [holdings]);
  const symbolsKey = symbols.join(',');

  const sinceIso = useMemo(() => {
    if (range === '1D') return todayStartIso();
    const since = new Date();
    since.setDate(since.getDate() - (RANGE_DAYS[range] + LOOKBACK_BUFFER_DAYS));
    return since.toISOString();
  }, [range]);

  const query = useQuery({
    queryKey: ['portfolio-history', symbolsKey, range],
    queryFn: () => fetchHistoryForSymbols(symbols, sinceIso),
    enabled: symbols.length > 0,
    staleTime: range === '1D' ? 60_000 : 5 * 60_000,
  });

  const points = useMemo(() => {
    if (range === '1D') return computeIntradayPortfolioPoints(holdings, query.data ?? []);
    return computePortfolioPoints(holdings, query.data ?? [], range);
  }, [holdings, query.data, range]);

  const currentTotal = useMemo(
    () => holdings.reduce((sum, holding) => sum + holding.currentValue, 0),
    [holdings],
  );

  const { changeAmount, changePercent, isPositive } = useMemo(() => {
    const first = points[0]?.value ?? currentTotal;
    const last = points[points.length - 1]?.value ?? currentTotal;
    const amount = last - first;
    const percent = first > 0 ? (amount / first) * 100 : 0;
    return { changeAmount: amount, changePercent: percent, isPositive: amount >= 0 };
  }, [points, currentTotal]);

  return { range, setRange, points, changeAmount, changePercent, isPositive, isLoading: query.isLoading };
}

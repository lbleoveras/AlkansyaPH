import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { HoldingWithMarketData } from '@/context/portfolio-context';
import { supabase } from '@/lib/supabase';
import { PerformanceRange, PortfolioPoint } from '@/types';

const RANGE_DAYS: Record<PerformanceRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

// Extra lookback so the first visible day can still be forward-filled from the
// most recent known price instead of showing a gap.
const LOOKBACK_BUFFER_DAYS = 30;

type HistoryRow = { symbol: string; captured_at: string; price: number | string };

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

// There's no transaction/quantity-history ledger in this app (see CLAUDE.md's
// "Uncommitted Shares" note), so a true historical portfolio value can't be
// computed. This approximates it as (current holding quantities) x (historical
// price per day) -- the standard simplification for this data shape -- forward-
// filling each symbol's price across days it wasn't scraped, and falling back to
// the live price for days before any history exists at all for that symbol.
function computePortfolioPoints(
  holdings: HoldingWithMarketData[],
  rows: HistoryRow[],
  range: PerformanceRange,
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
  const cutoff = rangeCutoffDay.toISOString().slice(0, 10);
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
    const since = new Date();
    since.setDate(since.getDate() - (RANGE_DAYS[range] + LOOKBACK_BUFFER_DAYS));
    return since.toISOString();
  }, [range]);

  const query = useQuery({
    queryKey: ['portfolio-history', symbolsKey, range],
    queryFn: () => fetchHistoryForSymbols(symbols, sinceIso),
    enabled: symbols.length > 0,
    staleTime: 5 * 60_000,
  });

  const points = useMemo(
    () => computePortfolioPoints(holdings, query.data ?? [], range),
    [holdings, query.data, range],
  );

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

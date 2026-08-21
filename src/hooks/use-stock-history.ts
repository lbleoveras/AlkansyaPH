import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { PerformanceRange, PortfolioPoint } from '@/types';

const RANGE_DAYS: Record<Exclude<PerformanceRange, '1D'>, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

type HistoryRow = { captured_at: string; price: number | string };

function bucketByDay(rows: HistoryRow[]): PortfolioPoint[] {
  const byDay = new Map<string, PortfolioPoint>();
  for (const row of rows) {
    const day = row.captured_at.slice(0, 10);
    byDay.set(day, { date: row.captured_at, value: Number(row.price) });
  }
  return Array.from(byDay.values());
}

// Every other range shows one point per calendar day (the day's closing
// price). 1D needs the raw intraday ticks -- sync-stock-quotes writes one
// stock_price_history row every ~15 min during market hours, all sharing the
// exact same captured_at within a given sync run since it's computed once
// per invocation.
function todayStartIso(): string {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

async function fetchStockHistory(symbol: string, range: PerformanceRange): Promise<PortfolioPoint[]> {
  if (range === '1D') {
    const { data, error } = await supabase
      .from('stock_price_history')
      .select('captured_at, price')
      .eq('symbol', symbol)
      .gte('captured_at', todayStartIso())
      .order('captured_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as HistoryRow[]).map((row) => ({
      date: row.captured_at,
      value: Number(row.price),
    }));
  }

  const since = new Date();
  since.setDate(since.getDate() - RANGE_DAYS[range]);

  const { data, error } = await supabase
    .from('stock_price_history')
    .select('captured_at, price')
    .eq('symbol', symbol)
    .gte('captured_at', since.toISOString())
    .order('captured_at', { ascending: true });
  if (error) throw error;
  return bucketByDay((data ?? []) as HistoryRow[]);
}

export function useStockHistory(
  symbol: string | undefined,
  currentPrice: number,
  initialRange: PerformanceRange = '1M',
) {
  const [range, setRange] = useState<PerformanceRange>(initialRange);

  const query = useQuery({
    queryKey: ['stock-history', symbol, range],
    queryFn: () => fetchStockHistory(symbol as string, range),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });

  const points = useMemo(() => query.data ?? [], [query.data]);

  const { changeAmount, changePercent, isPositive } = useMemo(() => {
    const first = points[0]?.value ?? currentPrice;
    const last = points[points.length - 1]?.value ?? currentPrice;
    const amount = last - first;
    const percent = first > 0 ? (amount / first) * 100 : 0;
    return { changeAmount: amount, changePercent: percent, isPositive: amount >= 0 };
  }, [points, currentPrice]);

  return { range, setRange, points, changeAmount, changePercent, isPositive, isLoading: query.isLoading };
}

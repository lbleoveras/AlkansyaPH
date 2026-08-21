import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { supabase } from '@/lib/supabase';
import { Stock } from '@/types';

const badgeColors = [
  '#2E7D32',
  '#1565C0',
  '#C2410C',
  '#6D28D9',
  '#B91C1C',
  '#0F766E',
  '#A16207',
  '#BE185D',
  '#4338CA',
  '#15803D',
];

type StockRow = {
  symbol: string;
  company_name: string;
  sector: string | null;
  price: number | string;
  change_amount: number | string;
  change_percent: number | string;
  float_million: number | string | null;
  market_cap_billion: number | string | null;
  index_weight_percent: number | string | null;
};

function mapRowToStock(row: StockRow, index: number): Stock {
  const changePercent = Number(row.change_percent);
  const indexWeightPercent = Number(row.index_weight_percent ?? 0);
  const idxPointChange = Math.round(((indexWeightPercent * changePercent) / 15) * 100) / 100;

  return {
    symbol: row.symbol,
    companyName: row.company_name,
    sector: row.sector ?? 'Uncategorized',
    price: Number(row.price),
    changeAmount: Number(row.change_amount),
    changePercent,
    color: badgeColors[index % badgeColors.length],
    floatMillion: Number(row.float_million ?? 0),
    marketCapBillion: Number(row.market_cap_billion ?? 0),
    indexWeightPercent,
    idxPointChange,
  };
}

async function fetchStocks(): Promise<Stock[]> {
  const { data, error } = await supabase.from('stocks').select('*').order('symbol');
  if (error) throw error;
  return (data ?? []).map(mapRowToStock);
}

export function useStocks() {
  const query = useQuery({
    queryKey: ['stocks'],
    queryFn: fetchStocks,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const stocks = useMemo(() => query.data ?? [], [query.data]);

  const getStockBySymbol = useMemo(() => {
    const bySymbol = new Map(stocks.map((stock) => [stock.symbol, stock]));
    return (symbol: string) => bySymbol.get(symbol);
  }, [stocks]);

  return {
    stocks,
    getStockBySymbol,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

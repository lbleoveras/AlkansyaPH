import { useQuery } from '@tanstack/react-query';

import { CurrencyCode } from '@/context/currency-context';

const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest?base=PHP&symbols=USD,EUR,JPY,SGD';

type RatesResponse = { rates: Record<Exclude<CurrencyCode, 'PHP'>, number> };

async function fetchRates(): Promise<RatesResponse['rates']> {
  const response = await fetch(FRANKFURTER_URL);
  if (!response.ok) throw new Error(`Failed to fetch exchange rates: HTTP ${response.status}`);
  const data = (await response.json()) as RatesResponse;
  return data.rates;
}

// PHP -> currency rates, refreshed hourly (exchange rates don't move fast
// enough to justify polling more often than the stock-price data does).
export function useExchangeRates() {
  const query = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: fetchRates,
    staleTime: 60 * 60_000,
  });

  return { rates: query.data, isLoading: query.isLoading };
}

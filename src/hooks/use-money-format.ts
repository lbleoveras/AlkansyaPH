import { useMemo } from 'react';

import { CURRENCY_SYMBOLS, useCurrencyPreference } from '@/context/currency-context';
import { useExchangeRates } from '@/hooks/use-exchange-rate';

// All holdings/prices are stored and entered in PHP -- that's the only
// currency PSE stocks actually trade in. This hook only affects DISPLAY:
// it converts a PHP amount to the user's chosen currency using a live rate
// before formatting. Falls back to showing plain PHP (rate 1, ₱ symbol)
// until the rate has loaded, rather than ever pairing a foreign symbol with
// an unconverted number.
export function useMoneyFormat() {
  const { currency } = useCurrencyPreference();
  const { rates } = useExchangeRates();

  const liveRate = currency === 'PHP' ? 1 : rates?.[currency];
  const rate = liveRate ?? 1;
  const symbol = liveRate ? CURRENCY_SYMBOLS[currency] : CURRENCY_SYMBOLS.PHP;

  return useMemo(() => {
    const convert = (phpValue: number) => phpValue * rate;

    const formatCurrency = (value: number) =>
      `${symbol}${convert(value).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const formatSignedCurrency = (value: number) => {
      const sign = value >= 0 ? '+' : '-';
      return `${sign}${symbol}${Math.abs(convert(value)).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    const formatMarketCap = (billions: number) =>
      `${symbol}${convert(billions).toLocaleString('en-PH', { maximumFractionDigits: 1 })}B`;

    return { formatCurrency, formatSignedCurrency, formatMarketCap };
  }, [rate, symbol]);
}

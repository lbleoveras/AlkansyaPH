import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, use, useEffect, useMemo, useState } from 'react';

export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'JPY' | 'SGD';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  SGD: 'S$',
};

const STORAGE_KEY = 'alkansyaph.currency';

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function isCurrencyCode(value: string | null): value is CurrencyCode {
  return !!value && value in CURRENCY_SYMBOLS;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('PHP');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isCurrencyCode(stored)) setCurrencyState(stored);
      })
      .catch(() => {});
  }, []);

  const setCurrency = (next: CurrencyCode) => {
    setCurrencyState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo(() => ({ currency, setCurrency }), [currency]);

  return <CurrencyContext value={value}>{children}</CurrencyContext>;
}

export function useCurrencyPreference() {
  const context = use(CurrencyContext);
  if (!context) {
    throw new Error('useCurrencyPreference must be used within a CurrencyProvider');
  }
  return context;
}

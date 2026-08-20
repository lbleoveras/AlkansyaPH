import { createContext, ReactNode, use, useCallback, useMemo, useState } from 'react';

import { getStockBySymbol } from '@/data/stocks';
import { initialHoldings } from '@/data/holdings';
import { Holding, Stock } from '@/types';

export type HoldingWithMarketData = Holding & {
  stock: Stock;
  currentValue: number;
  costBasis: number;
  gainAmount: number;
  gainPercent: number;
};

type PortfolioContextValue = {
  holdings: Holding[];
  holdingsWithMarketData: HoldingWithMarketData[];
  totalValue: number;
  totalCostBasis: number;
  totalGainAmount: number;
  totalGainPercent: number;
  getHoldingBySymbol: (symbol: string) => Holding | undefined;
  addHolding: (symbol: string, quantity: number, averagePrice: number) => void;
  increaseHolding: (id: string, amount: number) => void;
  decreaseHolding: (id: string, amount: number) => void;
  removeHolding: (id: string) => void;
};

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);

  const holdingsWithMarketData = useMemo<HoldingWithMarketData[]>(() => {
    return holdings
      .map((holding) => {
        const stock = getStockBySymbol(holding.symbol);
        if (!stock) return null;
        const currentValue = stock.price * holding.quantity;
        const costBasis = holding.averagePrice * holding.quantity;
        const gainAmount = currentValue - costBasis;
        const gainPercent = costBasis > 0 ? (gainAmount / costBasis) * 100 : 0;
        return { ...holding, stock, currentValue, costBasis, gainAmount, gainPercent };
      })
      .filter((holding): holding is HoldingWithMarketData => holding !== null)
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [holdings]);

  const totalValue = useMemo(
    () => holdingsWithMarketData.reduce((sum, holding) => sum + holding.currentValue, 0),
    [holdingsWithMarketData],
  );
  const totalCostBasis = useMemo(
    () => holdingsWithMarketData.reduce((sum, holding) => sum + holding.costBasis, 0),
    [holdingsWithMarketData],
  );
  const totalGainAmount = totalValue - totalCostBasis;
  const totalGainPercent = totalCostBasis > 0 ? (totalGainAmount / totalCostBasis) * 100 : 0;

  const getHoldingBySymbol = useCallback(
    (symbol: string) => holdings.find((holding) => holding.symbol === symbol),
    [holdings],
  );

  const addHolding = useCallback((symbol: string, quantity: number, averagePrice: number) => {
    setHoldings((current) => {
      const existing = current.find((holding) => holding.symbol === symbol);
      if (existing) {
        const combinedQuantity = existing.quantity + quantity;
        const combinedCost = existing.averagePrice * existing.quantity + averagePrice * quantity;
        return current.map((holding) =>
          holding.id === existing.id
            ? { ...holding, quantity: combinedQuantity, averagePrice: combinedCost / combinedQuantity }
            : holding,
        );
      }
      const stock = getStockBySymbol(symbol);
      return [
        ...current,
        {
          id: `h${Date.now()}`,
          symbol,
          quantity,
          averagePrice: averagePrice || stock?.price || 0,
          createdAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const increaseHolding = useCallback((id: string, amount: number) => {
    setHoldings((current) =>
      current.map((holding) =>
        holding.id === id ? { ...holding, quantity: holding.quantity + amount } : holding,
      ),
    );
  }, []);

  const decreaseHolding = useCallback((id: string, amount: number) => {
    setHoldings((current) =>
      current
        .map((holding) =>
          holding.id === id
            ? { ...holding, quantity: Math.max(0, holding.quantity - amount) }
            : holding,
        )
        .filter((holding) => holding.quantity > 0),
    );
  }, []);

  const removeHolding = useCallback((id: string) => {
    setHoldings((current) => current.filter((holding) => holding.id !== id));
  }, []);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      holdings,
      holdingsWithMarketData,
      totalValue,
      totalCostBasis,
      totalGainAmount,
      totalGainPercent,
      getHoldingBySymbol,
      addHolding,
      increaseHolding,
      decreaseHolding,
      removeHolding,
    }),
    [
      holdings,
      holdingsWithMarketData,
      totalValue,
      totalCostBasis,
      totalGainAmount,
      totalGainPercent,
      getHoldingBySymbol,
      addHolding,
      increaseHolding,
      decreaseHolding,
      removeHolding,
    ],
  );

  return <PortfolioContext value={value}>{children}</PortfolioContext>;
}

export function usePortfolio() {
  const context = use(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

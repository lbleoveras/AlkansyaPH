import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, use, useCallback, useMemo } from 'react';

import { useAuth } from '@/context/auth-context';
import { useStocks } from '@/hooks/use-stocks';
import { supabase } from '@/lib/supabase';
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
  isLoading: boolean;
  isError: boolean;
  getHoldingBySymbol: (symbol: string) => Holding | undefined;
  addHolding: (symbol: string, quantity: number, averagePrice: number, purchasedAt: string) => Promise<void>;
  increaseHolding: (id: string, amount: number) => Promise<void>;
  decreaseHolding: (id: string, amount: number) => Promise<void>;
  removeHolding: (id: string) => Promise<void>;
};

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

type HoldingRow = {
  id: string;
  symbol: string;
  quantity: number | string;
  average_price: number | string;
  purchased_at: string;
  created_at: string;
};

function mapRowToHolding(row: HoldingRow): Holding {
  return {
    id: row.id,
    symbol: row.symbol,
    quantity: Number(row.quantity),
    averagePrice: Number(row.average_price),
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
  };
}

async function fetchHoldings(userId: string): Promise<Holding[]> {
  const { data, error } = await supabase
    .from('holdings')
    .select('id, symbol, quantity, average_price, purchased_at, created_at')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(mapRowToHolding);
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { getStockBySymbol } = useStocks();

  const queryKey = useMemo(() => ['holdings', userId] as const, [userId]);

  const holdingsQuery = useQuery({
    queryKey,
    queryFn: () => fetchHoldings(userId as string),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const holdings = useMemo(() => holdingsQuery.data ?? [], [holdingsQuery.data]);

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
  }, [holdings, getStockBySymbol]);

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

  const setHoldingsCache = useCallback(
    (updater: (current: Holding[]) => Holding[]) => {
      queryClient.setQueryData<Holding[]>(queryKey, (current) => updater(current ?? []));
    },
    [queryClient, queryKey],
  );

  const snapshotAndCancel = useCallback(async () => {
    await queryClient.cancelQueries({ queryKey });
    return queryClient.getQueryData<Holding[]>(queryKey);
  }, [queryClient, queryKey]);

  const rollback = useCallback(
    (previous: Holding[] | undefined) => {
      if (previous) queryClient.setQueryData(queryKey, previous);
    },
    [queryClient, queryKey],
  );

  const settle = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Each mutation's variables are fully resolved by its wrapper callback
  // *before* mutate() is called, from the hook's own reactive `holdings`
  // state -- not re-derived inside onMutate/mutationFn from
  // queryClient.getQueryData(). React Query runs onMutate before
  // mutationFn, so if both independently read the query cache to compute
  // "existing holding + amount", mutationFn would see onMutate's own
  // optimistic write and double-apply the change (or, for a brand-new
  // symbol, find onMutate's optimistic placeholder row and try to UPDATE
  // its client-side `optimistic-...` id, which isn't a real uuid).
  type AddHoldingArgs =
    | { kind: 'insert'; symbol: string; quantity: number; averagePrice: number; purchasedAt: string }
    | { kind: 'update'; id: string; quantity: number; averagePrice: number };

  const addHoldingMutation = useMutation({
    mutationFn: async (args: AddHoldingArgs) => {
      if (!userId) throw new Error('Not signed in');
      if (args.kind === 'update') {
        const { error } = await supabase
          .from('holdings')
          .update({ quantity: args.quantity, average_price: args.averagePrice })
          .eq('id', args.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('holdings').insert({
        user_id: userId,
        symbol: args.symbol,
        quantity: args.quantity,
        average_price: args.averagePrice,
        purchased_at: args.purchasedAt,
      });
      if (error) throw error;
    },
    onMutate: async (args) => {
      const previous = await snapshotAndCancel();
      setHoldingsCache((current) => {
        if (args.kind === 'update') {
          return current.map((holding) =>
            holding.id === args.id
              ? { ...holding, quantity: args.quantity, averagePrice: args.averagePrice }
              : holding,
          );
        }
        return [
          ...current,
          {
            id: `optimistic-${Date.now()}`,
            symbol: args.symbol,
            quantity: args.quantity,
            averagePrice: args.averagePrice,
            purchasedAt: args.purchasedAt,
            createdAt: new Date().toISOString(),
          },
        ];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
    onSettled: settle,
  });

  const increaseHoldingMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase.from('holdings').update({ quantity }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, quantity }) => {
      const previous = await snapshotAndCancel();
      setHoldingsCache((current) =>
        current.map((holding) => (holding.id === id ? { ...holding, quantity } : holding)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
    onSettled: settle,
  });

  const decreaseHoldingMutation = useMutation({
    mutationFn: async ({ id, nextQuantity }: { id: string; nextQuantity: number }) => {
      if (nextQuantity === 0) {
        const { error } = await supabase.from('holdings').delete().eq('id', id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('holdings').update({ quantity: nextQuantity }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, nextQuantity }) => {
      const previous = await snapshotAndCancel();
      setHoldingsCache((current) =>
        current
          .map((holding) => (holding.id === id ? { ...holding, quantity: nextQuantity } : holding))
          .filter((holding) => holding.quantity > 0),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
    onSettled: settle,
  });

  const removeHoldingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('holdings').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const previous = await snapshotAndCancel();
      setHoldingsCache((current) => current.filter((holding) => holding.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => rollback(context?.previous),
    onSettled: settle,
  });

  const addHolding = useCallback(
    (symbol: string, quantity: number, averagePrice: number, purchasedAt: string) => {
      const existing = holdings.find((holding) => holding.symbol === symbol);
      if (existing) {
        const combinedQuantity = existing.quantity + quantity;
        const combinedCost = existing.averagePrice * existing.quantity + averagePrice * quantity;
        return addHoldingMutation.mutateAsync({
          kind: 'update',
          id: existing.id,
          quantity: combinedQuantity,
          averagePrice: combinedCost / combinedQuantity,
        });
      }
      const stock = getStockBySymbol(symbol);
      return addHoldingMutation.mutateAsync({
        kind: 'insert',
        symbol,
        quantity,
        averagePrice: averagePrice || stock?.price || 0,
        purchasedAt,
      });
    },
    [holdings, getStockBySymbol, addHoldingMutation],
  );
  const increaseHolding = useCallback(
    (id: string, amount: number) => {
      const holding = holdings.find((item) => item.id === id);
      if (!holding) return Promise.resolve();
      return increaseHoldingMutation.mutateAsync({ id, quantity: holding.quantity + amount });
    },
    [holdings, increaseHoldingMutation],
  );
  const decreaseHolding = useCallback(
    (id: string, amount: number) => {
      const holding = holdings.find((item) => item.id === id);
      if (!holding) return Promise.resolve();
      const nextQuantity = Math.max(0, holding.quantity - amount);
      return decreaseHoldingMutation.mutateAsync({ id, nextQuantity });
    },
    [holdings, decreaseHoldingMutation],
  );
  const removeHolding = useCallback(
    (id: string) => removeHoldingMutation.mutateAsync(id),
    [removeHoldingMutation],
  );

  const value = useMemo<PortfolioContextValue>(
    () => ({
      holdings,
      holdingsWithMarketData,
      totalValue,
      totalCostBasis,
      totalGainAmount,
      totalGainPercent,
      isLoading: holdingsQuery.isLoading,
      isError: holdingsQuery.isError,
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
      holdingsQuery.isLoading,
      holdingsQuery.isError,
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

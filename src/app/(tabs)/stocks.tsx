import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { StockRow } from '@/components/stock-row';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SearchBar } from '@/components/ui/search-bar';
import { Radii, Spacing } from '@/constants/theme';
import { useRefreshAll } from '@/hooks/use-refresh-all';
import { useStocks } from '@/hooks/use-stocks';
import { useTheme } from '@/hooks/use-theme';
import { formatTimeOfDay } from '@/utils/format';

export default function StocksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { stocks, isLoading } = useStocks();
  const { refreshing, onRefresh } = useRefreshAll();
  const [query, setQuery] = useState('');

  const filteredStocks = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    if (!normalized) return stocks;
    return stocks.filter(
      (stock) =>
        stock.symbol.includes(normalized) || stock.companyName.toUpperCase().includes(normalized),
    );
  }, [query, stocks]);

  const lastUpdated = useMemo(() => {
    if (stocks.length === 0) return null;
    const latest = stocks.reduce(
      (max, stock) => (stock.updatedAt > max ? stock.updatedAt : max),
      stocks[0].updatedAt,
    );
    return formatTimeOfDay(latest);
  }, [stocks]);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader title="Stocks" />

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search PSE stocks" />
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {filteredStocks.length} PSE-listed {filteredStocks.length === 1 ? 'stock' : 'stocks'}
        </Text>
        {lastUpdated && (
          <Text style={[styles.count, { color: theme.textSecondary }]}>Updated at {lastUpdated}</Text>
        )}
      </View>

      {filteredStocks.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          {isLoading ? 'Loading stocks…' : `No stocks match "${query}".`}
        </Text>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {filteredStocks.map((stock, index) => (
            <View
              key={stock.symbol}
              style={index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border } : undefined}>
              <StockRow stock={stock} onPress={() => router.push(`/stock/${stock.symbol}`)} />
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
  card: {
    borderRadius: Radii.large,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarBadge } from '@/components/ui/avatar-badge';
import { ChangePill } from '@/components/ui/change-pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SearchBar } from '@/components/ui/search-bar';
import { TextField } from '@/components/ui/text-field';
import { Radii, Spacing } from '@/constants/theme';
import { usePortfolio } from '@/context/portfolio-context';
import { useStocks } from '@/hooks/use-stocks';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/format';

export default function AddHoldingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const { addHolding } = usePortfolio();
  const { stocks, getStockBySymbol } = useStocks();

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(
    params.symbol ? params.symbol.toUpperCase() : null,
  );
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [purchasedAt, setPurchasedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const selectedStock = selectedSymbol ? getStockBySymbol(selectedSymbol) : undefined;

  const filteredStocks = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    if (!normalized) return stocks;
    return stocks.filter(
      (stock) =>
        stock.symbol.includes(normalized) || stock.companyName.toUpperCase().includes(normalized),
    );
  }, [query, stocks]);

  const parsedQuantity = Number(quantity);
  const parsedAveragePrice = averagePrice.trim() ? Number(averagePrice) : selectedStock?.price ?? 0;
  const estimatedCost = parsedQuantity > 0 ? parsedQuantity * parsedAveragePrice : 0;

  const handleSubmit = () => {
    if (!selectedStock) return;
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError('Enter a valid number of shares.');
      return;
    }
    if (!Number.isFinite(parsedAveragePrice) || parsedAveragePrice < 0) {
      setError('Enter a valid average price.');
      return;
    }
    const purchasedDate = new Date(purchasedAt);
    const today = new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchasedAt) || Number.isNaN(purchasedDate.getTime()) || purchasedAt > today) {
      setError('Enter a valid purchase date (YYYY-MM-DD), not in the future.');
      return;
    }
    setError('');
    addHolding(selectedStock.symbol, Math.round(parsedQuantity), parsedAveragePrice, purchasedAt).catch(() => {});
    router.back();
  };

  return (
      <ScreenContainer contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Add Holding</Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Close"
            style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="close" size={18} color={theme.text} />
          </Pressable>
        </View>

        {!selectedStock ? (
          <>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search PSE stocks" autoFocus />
            <View style={styles.pickerList}>
              {filteredStocks.map((stock) => (
                <Pressable
                  key={stock.symbol}
                  onPress={() => setSelectedSymbol(stock.symbol)}
                  style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.6 }]}>
                  <AvatarBadge label={stock.symbol} color={stock.color} size={38} symbol={stock.symbol} />
                  <View style={styles.pickerInfo}>
                    <Text style={[styles.pickerSymbol, { color: theme.text }]}>{stock.symbol}</Text>
                    <Text style={[styles.pickerCompany, { color: theme.textSecondary }]} numberOfLines={1}>
                      {stock.companyName}
                    </Text>
                  </View>
                  <Text style={[styles.pickerPrice, { color: theme.text }]}>
                    {formatCurrency(stock.price)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => setSelectedSymbol(null)}
              style={[styles.selectedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <AvatarBadge label={selectedStock.symbol} color={selectedStock.color} size={48} symbol={selectedStock.symbol} />
              <View style={styles.pickerInfo}>
                <Text style={[styles.pickerSymbol, { color: theme.text }]}>{selectedStock.symbol}</Text>
                <Text style={[styles.pickerCompany, { color: theme.textSecondary }]} numberOfLines={1}>
                  {selectedStock.companyName}
                </Text>
              </View>
              <View style={styles.selectedPriceCol}>
                <Text style={[styles.pickerPrice, { color: theme.text }]}>
                  {formatCurrency(selectedStock.price)}
                </Text>
                <ChangePill percent={selectedStock.changePercent} />
              </View>
            </Pressable>
            <Text style={[styles.changeLink, { color: theme.tint }]} onPress={() => setSelectedSymbol(null)}>
              Choose a different stock
            </Text>

            <View style={styles.form}>
              <TextField
                label="Number of shares"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g. 100"
                keyboardType="numeric"
              />
              <TextField
                label={`Average price per share (optional, defaults to ${formatCurrency(selectedStock.price)})`}
                value={averagePrice}
                onChangeText={setAveragePrice}
                placeholder={selectedStock.price.toFixed(2)}
                keyboardType="numeric"
              />
              <TextField
                label="Date purchased"
                value={purchasedAt}
                onChangeText={setPurchasedAt}
                placeholder="YYYY-MM-DD"
                error={error || undefined}
              />

              <View style={[styles.summaryRow, { borderColor: theme.border }]}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Estimated cost</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {formatCurrency(estimatedCost)}
                </Text>
              </View>

              <PrimaryButton label="Add to Portfolio" onPress={handleSubmit} />
            </View>
          </>
        )}
      </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerList: {
    marginTop: Spacing.three,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pickerInfo: {
    flex: 1,
    gap: 2,
  },
  pickerSymbol: {
    fontSize: 15,
    fontWeight: '700',
  },
  pickerCompany: {
    fontSize: 12,
  },
  pickerPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.three,
  },
  selectedPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  form: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});

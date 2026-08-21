import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PerformanceGraph } from '@/components/performance-graph';
import { AvatarBadge } from '@/components/ui/avatar-badge';
import { ChangePill } from '@/components/ui/change-pill';
import { DetailGrid } from '@/components/ui/detail-grid';
import { MarketStatusBadge } from '@/components/ui/market-status-badge';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Radii, Spacing } from '@/constants/theme';
import { usePortfolio } from '@/context/portfolio-context';
import { useMoneyFormat } from '@/hooks/use-money-format';
import { useStockHistory } from '@/hooks/use-stock-history';
import { useStocks } from '@/hooks/use-stocks';
import { useTheme } from '@/hooks/use-theme';
import { PerformanceRange } from '@/types';
import {
  formatChartPointLabel,
  formatFloat,
  formatPercent,
  formatShares,
  formatSignedPercent,
  formatSignedPoints,
} from '@/utils/format';

const RANGES: PerformanceRange[] = ['1D', '1W', '1M', '3M', '1Y'];

export default function StockDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const { getHoldingBySymbol, holdingsWithMarketData } = usePortfolio();
  const { getStockBySymbol, isLoading } = useStocks();
  const { formatCurrency, formatMarketCap, formatSignedCurrency } = useMoneyFormat();

  const stock = getStockBySymbol(symbol?.toUpperCase() ?? '');
  const holding = stock ? getHoldingBySymbol(stock.symbol) : undefined;
  const holdingDetail = holding
    ? holdingsWithMarketData.find((item) => item.id === holding.id)
    : undefined;

  const { range, setRange, points, changeAmount, changePercent, isPositive } = useStockHistory(
    stock?.symbol,
    stock?.price ?? 0,
  );

  if (!stock) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Back"
            style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isLoading ? 'Loading…' : 'Stock not found'}
          </Text>
          <View style={styles.backButton} />
        </View>
      </ScreenContainer>
    );
  }

  const color = isPositive ? theme.positive : theme.negative;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Back"
          style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{stock.symbol}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.identityRow}>
        <AvatarBadge label={stock.symbol} color={stock.color} size={52} symbol={stock.symbol} />
        <View style={styles.identityInfo}>
          <Text style={[styles.company, { color: theme.text }]} numberOfLines={2}>
            {stock.companyName}
          </Text>
          <Text style={[styles.sector, { color: theme.textSecondary }]}>{stock.sector}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: theme.text }]}>{formatCurrency(stock.price)}</Text>
        <Text style={[styles.priceChange, { color: stock.changeAmount >= 0 ? theme.positive : theme.negative }]}>
          {formatSignedCurrency(stock.changeAmount)}
        </Text>
        <ChangePill percent={stock.changePercent} size="medium" />
      </View>

      {holdingDetail && (
        <Pressable
          onPress={() => router.push(`/edit-holding/${holdingDetail.id}`)}
          style={[styles.ownedBanner, { backgroundColor: theme.tintSoft }]}>
          <Ionicons name="checkmark-circle" size={16} color={theme.tint} />
          <Text style={[styles.ownedText, { color: theme.tint }]}>
            You own {formatShares(holdingDetail.quantity)} · view holding
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.tint} />
        </Pressable>
      )}

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.chartHeaderText, { color: theme.text }]}>Price Performance</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.changeAmount, { color }]}>{formatSignedCurrency(changeAmount)}</Text>
          <Text style={[styles.changePercent, { color }]}>{formatSignedPercent(changePercent)}</Text>
        </View>
        <View style={styles.statusRow}>
          <MarketStatusBadge />
        </View>
        <PerformanceGraph
          points={points}
          color={color}
          formatValue={formatCurrency}
          formatPointLabel={(point) => formatChartPointLabel(point.date, range)}
          labelColor={theme.text}
          tooltipBackground={theme.card}
          tooltipBorder={theme.border}
        />
        <View style={styles.rangeRow}>
          <SegmentedControl options={RANGES} value={range} onChange={setRange} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Index Details</Text>
        <DetailGrid
          items={[
            { label: 'Float', value: formatFloat(stock.floatMillion) },
            { label: '%Total (Idx Weight)', value: formatPercent(stock.indexWeightPercent) },
            {
              label: 'Idx-Chg',
              value: formatSignedPoints(stock.idxPointChange),
              color: stock.idxPointChange >= 0 ? theme.positive : theme.negative,
            },
            { label: 'Market Cap', value: formatMarketCap(stock.marketCapBillion) },
          ]}
        />
      </View>

      <View style={styles.section}>
        <PrimaryButton
          label={holdingDetail ? 'Update Holding' : 'Add to Portfolio'}
          onPress={() => router.push(`/add-holding?symbol=${stock.symbol}`)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  identityInfo: {
    flex: 1,
    gap: 2,
  },
  company: {
    fontSize: 17,
    fontWeight: '700',
  },
  sector: {
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '700',
  },
  ownedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    marginBottom: Spacing.three,
  },
  ownedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartHeaderText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  changeAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  changePercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    marginBottom: -Spacing.one,
  },
  rangeRow: {
    marginTop: Spacing.one,
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PerformanceGraph } from '@/components/performance-graph';
import { MarketStatusBadge } from '@/components/ui/market-status-badge';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Radii, Spacing } from '@/constants/theme';
import { useRangeSeries } from '@/hooks/use-range-series';
import { useTheme } from '@/hooks/use-theme';
import { PerformanceRange } from '@/types';
import { formatSignedCurrency, formatSignedPercent } from '@/utils/format';

const RANGES: PerformanceRange[] = ['1W', '1M', '3M', '1Y'];

export function PerformanceCard({ totalValue }: { totalValue: number }) {
  const theme = useTheme();
  const { range, setRange, points, changeAmount, changePercent, isPositive } =
    useRangeSeries(totalValue);

  const color = isPositive ? theme.positive : theme.negative;

  const axisLabels = useMemo(() => {
    if (points.length === 0) return [];
    const count = Math.min(4, points.length);
    const indices = Array.from({ length: count }, (_, i) =>
      Math.round((i / (count - 1 || 1)) * (points.length - 1)),
    );
    const unique = Array.from(new Set(indices));
    return unique.map((index) => {
      const date = new Date(points[index].date);
      return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    });
  }, [points]);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLabel}>
          <Ionicons name="trending-up-outline" size={18} color={theme.tint} />
          <Text style={[styles.headerText, { color: theme.text }]}>Performance</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <Text style={[styles.changeAmount, { color }]}>{formatSignedCurrency(changeAmount)}</Text>
        <Text style={[styles.changePercent, { color }]}>{formatSignedPercent(changePercent)}</Text>
      </View>

      <View style={styles.statusRow}>
        <MarketStatusBadge />
      </View>

      <PerformanceGraph points={points} color={color} />

      {axisLabels.length > 0 && (
        <View style={styles.axisRow}>
          {axisLabels.map((label, index) => (
            <Text key={`${label}-${index}`} style={[styles.axisLabel, { color: theme.textSecondary }]}>
              {label}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.rangeRow}>
        <SegmentedControl options={RANGES} value={range} onChange={setRange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  changeAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  changePercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    marginBottom: -Spacing.one,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.one,
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  rangeRow: {
    marginTop: Spacing.one,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PerformanceGraph } from '@/components/performance-graph';
import { MarketStatusBadge } from '@/components/ui/market-status-badge';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Radii, Spacing } from '@/constants/theme';
import { useRangeSeries } from '@/hooks/use-range-series';
import { useTheme } from '@/hooks/use-theme';
import { PerformanceRange } from '@/types';
import { formatSignedPercent, formatSignedPoints } from '@/utils/format';

const RANGES: PerformanceRange[] = ['1W', '1M', '3M', '1Y'];

export function MarketIndexCard({ name, value }: { name: string; value: number }) {
  const theme = useTheme();
  const { range, setRange, points, changeAmount, changePercent, isPositive } = useRangeSeries(value);

  const color = isPositive ? theme.positive : theme.negative;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Ionicons name="stats-chart" size={18} color={theme.tint} />
        <Text style={[styles.headerText, { color: theme.text }]}>{name}</Text>
      </View>

      <View style={styles.statRow}>
        <Text style={[styles.value, { color: theme.text }]}>
          {value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[styles.changeAmount, { color }]}>{formatSignedPoints(changeAmount)}</Text>
        <Text style={[styles.changePercent, { color }]}>{formatSignedPercent(changePercent)}</Text>
      </View>

      <View style={styles.statusRow}>
        <MarketStatusBadge />
      </View>

      <PerformanceGraph points={points} color={color} height={110} />

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
    marginBottom: Spacing.three,
  },
  headerRow: {
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
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  changeAmount: {
    fontSize: 14,
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
});

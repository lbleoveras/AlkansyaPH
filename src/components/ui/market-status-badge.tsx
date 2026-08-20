import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useMarketStatus } from '@/hooks/use-market-status';
import { useTheme } from '@/hooks/use-theme';

export function MarketStatusBadge() {
  const theme = useTheme();
  const isOpen = useMarketStatus();
  const dotColor = isOpen ? theme.positive : theme.negative;

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {isOpen ? 'Market Open' : 'Market Closed'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

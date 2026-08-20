import { StyleSheet, Text, View } from 'react-native';

import { ChangePill } from '@/components/ui/change-pill';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatSignedCurrency } from '@/utils/format';

type PortfolioHeroProps = {
  totalValue: number;
  gainAmount: number;
  gainPercent: number;
};

export function PortfolioHero({ totalValue, gainAmount, gainPercent }: PortfolioHeroProps) {
  const theme = useTheme();
  const isPositive = gainAmount >= 0;
  const color = isPositive ? theme.positive : theme.negative;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Total Portfolio Value</Text>
      <Text style={[styles.value, { color: theme.text }]}>{formatCurrency(totalValue)}</Text>
      <View style={styles.changeRow}>
        <Text style={[styles.changeAmount, { color }]}>{formatSignedCurrency(gainAmount)}</Text>
        <ChangePill percent={gainPercent} size="medium" />
        <Text style={[styles.caption, { color: theme.textSecondary }]}>all-time</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  changeAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
  },
});

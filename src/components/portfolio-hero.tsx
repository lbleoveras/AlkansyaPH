import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChangePill } from '@/components/ui/change-pill';
import { Spacing } from '@/constants/theme';
import { usePrivacy } from '@/context/privacy-context';
import { useMoneyFormat } from '@/hooks/use-money-format';
import { useTheme } from '@/hooks/use-theme';

type PortfolioHeroProps = {
  totalValue: number;
  gainAmount: number;
  gainPercent: number;
};

const MASK = '••••••';

export function PortfolioHero({ totalValue, gainAmount, gainPercent }: PortfolioHeroProps) {
  const theme = useTheme();
  const { formatCurrency, formatSignedCurrency } = useMoneyFormat();
  const { hideNumbers, toggleHideNumbers } = usePrivacy();
  const isPositive = gainAmount >= 0;
  const color = isPositive ? theme.positive : theme.negative;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Total Portfolio Value</Text>
        <Pressable
          onPress={toggleHideNumbers}
          hitSlop={8}
          accessibilityLabel={hideNumbers ? 'Show portfolio numbers' : 'Hide portfolio numbers'}>
          <Ionicons
            name={hideNumbers ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color={theme.textSecondary}
          />
        </Pressable>
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{hideNumbers ? MASK : formatCurrency(totalValue)}</Text>
      <View style={styles.changeRow}>
        <Text style={[styles.changeAmount, { color }]}>
          {hideNumbers ? MASK : formatSignedCurrency(gainAmount)}
        </Text>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
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

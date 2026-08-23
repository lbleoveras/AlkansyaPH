import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChangePill } from '@/components/ui/change-pill';
import { AvatarBadge } from '@/components/ui/avatar-badge';
import { Spacing } from '@/constants/theme';
import { HoldingWithMarketData } from '@/context/portfolio-context';
import { usePrivacy } from '@/context/privacy-context';
import { useMoneyFormat } from '@/hooks/use-money-format';
import { useTheme } from '@/hooks/use-theme';
import { formatShares } from '@/utils/format';

type HoldingRowProps = {
  holding: HoldingWithMarketData;
  onPress: () => void;
};

const MASK = '••••••';

export function HoldingRow({ holding, onPress }: HoldingRowProps) {
  const theme = useTheme();
  const { formatCurrency } = useMoneyFormat();
  const { hideNumbers } = usePrivacy();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <AvatarBadge label={holding.symbol} color={holding.stock.color} symbol={holding.symbol} />
      <View style={styles.info}>
        <Text style={[styles.symbol, { color: theme.text }]}>{holding.symbol}</Text>
        <Text style={[styles.shares, { color: theme.textSecondary }]}>
          {formatShares(holding.quantity)}
        </Text>
      </View>
      <View style={styles.values}>
        <Text style={[styles.value, { color: theme.text }]}>
          {hideNumbers ? MASK : formatCurrency(holding.currentValue)}
        </Text>
        <ChangePill percent={holding.gainPercent} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  symbol: {
    fontSize: 15,
    fontWeight: '700',
  },
  shares: {
    fontSize: 13,
  },
  values: {
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarBadge } from '@/components/ui/avatar-badge';
import { ChangePill } from '@/components/ui/change-pill';
import { Spacing } from '@/constants/theme';
import { useMoneyFormat } from '@/hooks/use-money-format';
import { useTheme } from '@/hooks/use-theme';
import { Stock } from '@/types';

type StockRowProps = {
  stock: Stock;
  onPress: () => void;
};

export function StockRow({ stock, onPress }: StockRowProps) {
  const theme = useTheme();
  const { formatCurrency } = useMoneyFormat();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <AvatarBadge label={stock.symbol} color={stock.color} />
      <View style={styles.info}>
        <Text style={[styles.symbol, { color: theme.text }]}>{stock.symbol}</Text>
        <Text style={[styles.company, { color: theme.textSecondary }]} numberOfLines={1}>
          {stock.companyName}
        </Text>
      </View>
      <View style={styles.values}>
        <Text style={[styles.price, { color: theme.text }]}>{formatCurrency(stock.price)}</Text>
        <ChangePill percent={stock.changePercent} />
      </View>
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
  company: {
    fontSize: 13,
  },
  values: {
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
});

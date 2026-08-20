import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSignedPercent } from '@/utils/format';

type ChangePillProps = {
  percent: number;
  size?: 'small' | 'medium';
};

export function ChangePill({ percent, size = 'small' }: ChangePillProps) {
  const theme = useTheme();
  const isPositive = percent >= 0;
  const color = isPositive ? theme.positive : theme.negative;
  const backgroundColor = isPositive ? theme.positiveSoft : theme.negativeSoft;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor },
        size === 'medium' && styles.pillMedium,
      ]}>
      <Ionicons
        name={isPositive ? 'caret-up' : 'caret-down'}
        size={size === 'medium' ? 12 : 10}
        color={color}
      />
      <Text style={[styles.label, { color }, size === 'medium' && styles.labelMedium]}>
        {formatSignedPercent(percent)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  pillMedium: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelMedium: {
    fontSize: 14,
  },
});

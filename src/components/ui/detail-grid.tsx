import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DetailGridItem = {
  label: string;
  value: string;
  color?: string;
};

type DetailGridProps = {
  items: DetailGridItem[];
  style?: StyleProp<ViewStyle>;
};

export function DetailGrid({ items, style }: DetailGridProps) {
  const theme = useTheme();

  return (
    <View style={[styles.grid, { backgroundColor: theme.card, borderColor: theme.border }, style]}>
      {items.map((item) => (
        <View key={item.label} style={styles.cell}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{item.label}</Text>
          <Text style={[styles.value, { color: item.color ?? theme.text }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.two,
  },
  cell: {
    width: '50%',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
});

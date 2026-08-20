import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[
              styles.segment,
              selected && {
                backgroundColor: theme.card,
                boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
              },
            ]}>
            <Text
              style={[
                styles.label,
                { color: selected ? theme.text : theme.textSecondary },
                selected && styles.labelSelected,
              ]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radii.pill,
    padding: 4,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two - 2,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSelected: {
    fontWeight: '700',
  },
});

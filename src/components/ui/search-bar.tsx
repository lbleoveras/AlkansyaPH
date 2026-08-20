import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search', autoFocus }: SearchBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <Ionicons name="search" size={18} color={theme.iconMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.iconMuted}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoCorrect={false}
        style={[styles.input, { color: theme.text }]}
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={theme.iconMuted}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    outlineWidth: 0,
  },
});

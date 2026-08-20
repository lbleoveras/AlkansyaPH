import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthMark({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: theme.tint }]}>
        <Ionicons name="trending-up" size={26} color="#FFFFFF" />
      </View>
      <Text style={[styles.appName, { color: theme.text }]}>AlkansyaPH</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.five,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: Radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});

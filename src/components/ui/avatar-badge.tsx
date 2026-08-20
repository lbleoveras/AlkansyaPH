import { StyleSheet, Text, View } from 'react-native';

type AvatarBadgeProps = {
  label: string;
  color: string;
  size?: number;
};

export function AvatarBadge({ label, color, size = 44 }: AvatarBadgeProps) {
  const initials = label
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}>
      <Text style={[styles.label, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

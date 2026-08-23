import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Radii, Spacing } from '@/constants/theme';
import { useAppLock } from '@/context/app-lock-context';
import { useTheme } from '@/hooks/use-theme';

export function AppLockScreen() {
  const theme = useTheme();
  const { unlock } = useAppLock();
  const triedOnMount = useRef(false);

  useEffect(() => {
    if (triedOnMount.current) return;
    triedOnMount.current = true;
    void unlock();
  }, [unlock]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: theme.tintSoft }]}>
          <Ionicons name="lock-closed" size={32} color={theme.tint} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>AlkansyaPH is locked</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Use your fingerprint, face, or device passcode to continue.
        </Text>
        <PrimaryButton label="Unlock" onPress={() => void unlock()} style={styles.button} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.five,
  },
  button: {
    width: '100%',
  },
});

import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useAppUpdateCheck } from '@/hooks/use-app-update-check';
import { useTheme } from '@/hooks/use-theme';
import { getDismissedUpdateVersion, setDismissedUpdateVersion } from '@/lib/update-banner-memory';

export function UpdateBanner() {
  const theme = useTheme();
  const { updateAvailable, latestVersion, downloadUrl } = useAppUpdateCheck();
  const [dismissedVersion, setDismissedVersionState] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    getDismissedUpdateVersion().then(setDismissedVersionState);
  }, []);

  if (!updateAvailable || !latestVersion || !downloadUrl) return null;
  if (dismissedVersion === latestVersion) return null;

  const handleDismiss = () => {
    setDismissedVersionState(latestVersion);
    void setDismissedUpdateVersion(latestVersion);
  };

  const handleUpdate = () => {
    if (Platform.OS === 'web') {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    WebBrowser.openBrowserAsync(downloadUrl);
  };

  return (
    <Pressable
      onPress={handleUpdate}
      style={[styles.banner, { backgroundColor: theme.tint }]}
      accessibilityRole="button">
      <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
      <View style={styles.textGroup}>
        <Text style={styles.title}>A new version is available</Text>
        <Text style={styles.subtitle}>Version {latestVersion} is ready -- tap to download</Text>
      </View>
      <Pressable onPress={handleDismiss} hitSlop={8} accessibilityLabel="Dismiss update notice">
        <Ionicons name="close" size={18} color="#FFFFFF" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radii.medium,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
});

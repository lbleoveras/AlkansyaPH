import { ReactNode } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /** When provided, adds pull-to-refresh to the screen's scroll view. */
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function ScreenContainer({
  children,
  scrollable = true,
  contentContainerStyle,
  refreshing,
  onRefresh,
}: ScreenContainerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const paddingTop = Platform.OS === 'web' ? Spacing.four : insets.top + Spacing.two;
  const paddingBottom = insets.bottom + BottomTabInset + Spacing.four;

  if (!scrollable) {
    return (
      <View
        style={[
          styles.flex,
          { backgroundColor: theme.background, paddingTop, paddingBottom },
        ]}>
        <View style={styles.inner}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop, paddingBottom }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={theme.tint} />
        ) : undefined
      }>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
});

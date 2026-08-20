import { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
};

export function ScreenContainer({
  children,
  scrollable = true,
  contentContainerStyle,
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
      showsVerticalScrollIndicator={false}>
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

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B0E12',
    background: '#F5F6F8',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#6B7280',
    card: '#FFFFFF',
    border: '#E7E8EC',
    tint: '#1FAE5C',
    tintSoft: '#E4F7EA',
    positive: '#1B9E4B',
    positiveSoft: '#E4F7EA',
    negative: '#E1483C',
    negativeSoft: '#FDEAEA',
    iconMuted: '#9AA1AC',
  },
  dark: {
    text: '#F5F6F8',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#9AA1AC',
    card: '#17181B',
    border: '#2A2C31',
    tint: '#3ECB74',
    tintSoft: 'rgba(62, 203, 116, 0.16)',
    positive: '#3ECB74',
    positiveSoft: 'rgba(62, 203, 116, 0.16)',
    negative: '#F17064',
    negativeSoft: 'rgba(241, 112, 100, 0.16)',
    iconMuted: '#6B6F76',
  },
} as const;

export const BrandGradient = ['#B7F17C', '#4CAF50'] as const;

export const Radii = {
  small: 12,
  medium: 18,
  large: 24,
  pill: 999,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

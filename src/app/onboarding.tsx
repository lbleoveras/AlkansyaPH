import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useOnboarding } from '@/context/onboarding-context';
import { useTheme } from '@/hooks/use-theme';

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

function buildSlides(firstName: string | undefined): Slide[] {
  return [
    {
      icon: 'hand-left-outline',
      title: firstName ? `Welcome, ${firstName}` : 'Welcome',
      body: 'AlkansyaPH helps you track your Philippine stock portfolio in one place -- real prices, real performance, no spreadsheets.',
    },
    {
      icon: 'pie-chart-outline',
      title: 'See your portfolio at a glance',
      body: 'The Portfolio tab shows your total value, today’s move, and a performance graph you can scrub through by range -- from 1 day up to 1 year.',
    },
    {
      icon: 'trending-up-outline',
      title: 'Browse and add PSE stocks',
      body: 'Search any PSE-listed stock in the Stocks tab, check its price and index details, then add it to your portfolio with your purchase price and date.',
    },
    {
      icon: 'notifications-outline',
      title: 'Stay on top of big moves',
      body: 'The News tab keeps you updated on PH market headlines, and the bell icon alerts you when one of your holdings moves sharply in a day.',
    },
    {
      icon: 'settings-outline',
      title: 'Make it yours',
      body: 'Head to Settings to choose your display currency, change your password, or manage your account -- your holdings always stay entered in PHP.',
    },
  ];
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const { width } = Dimensions.get('window');

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const slides = useMemo(() => buildSlides(firstName), [firstName]);
  const isLast = index === slides.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex !== index) setIndex(nextIndex);
  };

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.skipRow}>
          <Text
            style={[styles.skipText, { color: theme.textSecondary }]}
            onPress={completeOnboarding}
            suppressHighlighting>
            Skip
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.tintSoft }]}>
                <Ionicons name={item.icon} size={40} color={theme.tint} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? theme.tint : theme.border },
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <PrimaryButton label={isLast ? 'Get Started' : 'Next'} onPress={handleNext} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    padding: Spacing.two,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
});

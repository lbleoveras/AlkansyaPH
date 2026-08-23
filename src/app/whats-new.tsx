import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Radii, Spacing } from '@/constants/theme';
import { useWhatsNew } from '@/context/whats-new-context';
import { useTheme } from '@/hooks/use-theme';

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  demo?: 'hideNumbers' | 'gainLoss';
};

const SLIDES: Slide[] = [
  {
    icon: 'sparkles-outline',
    title: "What's new in AlkansyaPH",
    body: 'A batch of updates focused on security and clarity -- here\'s what changed.',
  },
  {
    icon: 'finger-print-outline',
    title: 'App Lock',
    body: 'Lock the app with your fingerprint, face, or device passcode. Turn it on anytime in Settings → Security.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Real gain/loss chart',
    body: 'The Portfolio chart now plots your actual unrealized gain or loss, not raw value -- buying a new holding no longer looks like a fake spike.',
    demo: 'gainLoss',
  },
  {
    icon: 'eye-off-outline',
    title: 'Hide your numbers',
    body: 'Tap the eye icon next to your Total Portfolio Value to mask it from view. Try it below.',
    demo: 'hideNumbers',
  },
  {
    icon: 'images-outline',
    title: 'Real logos, real photos',
    body: 'Stocks show their real company logo, and news articles show their real photo -- plus pull down on any screen to refresh, and see exactly when prices last updated.',
  },
];

function GainLossDemo() {
  const theme = useTheme();
  return (
    <View style={styles.demoCard}>
      <View style={styles.demoRow}>
        <Text style={[styles.demoLabel, { color: theme.textSecondary }]}>Before</Text>
        <Text style={[styles.demoValue, { color: theme.positive }]}>+₱15,743.00 (+107%)</Text>
      </View>
      <View style={styles.demoRow}>
        <Text style={[styles.demoLabel, { color: theme.textSecondary }]}>After</Text>
        <Text style={[styles.demoValue, { color: theme.positive }]}>+₱240.00 (+1.6%)</Text>
      </View>
      <Text style={[styles.demoCaption, { color: theme.textSecondary }]}>
        Same portfolio -- the old number just counted the new money you added as if it were profit.
      </Text>
    </View>
  );
}

function HideNumbersDemo() {
  const theme = useTheme();
  const [hidden, setHidden] = useState(false);
  return (
    <Pressable onPress={() => setHidden((v) => !v)} style={styles.demoCard}>
      <View style={styles.demoRow}>
        <Text style={[styles.demoLabel, { color: theme.textSecondary }]}>Total Portfolio Value</Text>
        <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={16} color={theme.textSecondary} />
      </View>
      <Text style={[styles.demoBigValue, { color: theme.text }]}>{hidden ? '••••••' : '₱30,664.50'}</Text>
      <Text style={[styles.demoCaption, { color: theme.textSecondary }]}>Tap this card to try it</Text>
    </Pressable>
  );
}

export default function WhatsNewScreen() {
  const theme = useTheme();
  const { completeWhatsNew } = useWhatsNew();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const { width } = Dimensions.get('window');

  const isLast = index === SLIDES.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex !== index) setIndex(nextIndex);
  };

  const handleNext = () => {
    if (isLast) {
      completeWhatsNew();
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
            onPress={completeWhatsNew}
            suppressHighlighting>
            Skip
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.tintSoft }]}>
                <Ionicons name={item.icon} size={36} color={theme.tint} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{item.body}</Text>
              {item.demo === 'gainLoss' && <GainLossDemo />}
              {item.demo === 'hideNumbers' && <HideNumbersDemo />}
            </View>
          )}
        />

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
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
          <PrimaryButton label={isLast ? 'Got it' : 'Next'} onPress={handleNext} />
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
    width: 84,
    height: 84,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  demoCard: {
    width: '100%',
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.25)',
    gap: Spacing.one,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  demoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  demoBigValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  demoCaption: {
    fontSize: 11,
    marginTop: Spacing.one,
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

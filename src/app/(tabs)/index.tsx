import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HoldingRow } from '@/components/holding-row';
import { PerformanceCard } from '@/components/performance-card';
import { PortfolioHero } from '@/components/portfolio-hero';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SectionHeader } from '@/components/ui/section-header';
import { Radii, Spacing } from '@/constants/theme';
import { usePortfolio } from '@/context/portfolio-context';
import { useTheme } from '@/hooks/use-theme';

export default function PortfolioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { holdingsWithMarketData, totalValue, totalGainAmount, totalGainPercent } = usePortfolio();

  return (
    <ScreenContainer>
      <ScreenHeader title="Portfolio" />

      <PortfolioHero
        totalValue={totalValue}
        gainAmount={totalGainAmount}
        gainPercent={totalGainPercent}
      />

      <View style={styles.section}>
        <PerformanceCard holdings={holdingsWithMarketData} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Holdings"
          actionLabel="Add"
          onActionPress={() => router.push('/add-holding')}
        />

        {holdingsWithMarketData.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.tintSoft }]}>
              <Ionicons name="pie-chart-outline" size={26} color={theme.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No holdings yet</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              Add a Philippine stock to start tracking your portfolio.
            </Text>
            <PrimaryButton
              label="Add your first holding"
              onPress={() => router.push('/add-holding')}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {holdingsWithMarketData.map((holding, index) => (
              <View
                key={holding.id}
                style={index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }}>
                <HoldingRow
                  holding={holding}
                  onPress={() => router.push(`/edit-holding/${holding.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.four,
  },
  card: {
    borderRadius: Radii.large,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.one,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  emptyButton: {
    alignSelf: 'stretch',
  },
});

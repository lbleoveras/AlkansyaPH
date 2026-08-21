import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarBadge } from '@/components/ui/avatar-badge';
import { ChangePill } from '@/components/ui/change-pill';
import { DetailGrid } from '@/components/ui/detail-grid';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { Radii, Spacing } from '@/constants/theme';
import { usePortfolio } from '@/context/portfolio-context';
import { useTheme } from '@/hooks/use-theme';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatShares,
  formatSignedCurrency,
  formatSignedPercent,
} from '@/utils/format';

const QUICK_ADJUSTMENTS = [-50, -10, 10, 50];

export default function EditHoldingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { holdingsWithMarketData, totalValue, increaseHolding, decreaseHolding, removeHolding, isLoading } =
    usePortfolio();

  const holding = holdingsWithMarketData.find((item) => item.id === id);
  const [quantityInput, setQuantityInput] = useState(String(holding?.quantity ?? 0));
  const [error, setError] = useState('');

  if (!holding) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {isLoading ? 'Loading…' : 'Holding not found'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Close"
            style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="close" size={18} color={theme.text} />
          </Pressable>
        </View>
        {!isLoading && (
          <Text style={{ color: theme.textSecondary }}>
            This holding may have already been removed.
          </Text>
        )}
      </ScreenContainer>
    );
  }

  const parsedQuantity = Number(quantityInput);
  const projectedValue = Number.isFinite(parsedQuantity)
    ? Math.max(0, parsedQuantity) * holding.stock.price
    : 0;

  const applyDelta = (delta: number) => {
    const current = Number(quantityInput) || 0;
    const next = Math.max(0, current + delta);
    setQuantityInput(String(next));
  };

  const handleSave = () => {
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setError('Enter a valid number of shares.');
      return;
    }
    const rounded = Math.round(parsedQuantity);
    const delta = rounded - holding.quantity;

    if (rounded <= 0) {
      removeHolding(holding.id).catch(() => {});
    } else if (delta > 0) {
      increaseHolding(holding.id, delta).catch(() => {});
    } else if (delta < 0) {
      decreaseHolding(holding.id, Math.abs(delta)).catch(() => {});
    }
    router.back();
  };

  const handleRemove = () => {
    removeHolding(holding.id).catch(() => {});
    router.back();
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Holding Details</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Close"
          style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AvatarBadge label={holding.symbol} color={holding.stock.color} size={48} />
        <View style={styles.summaryInfo}>
          <Text style={[styles.symbol, { color: theme.text }]}>{holding.symbol}</Text>
          <Text style={[styles.company, { color: theme.textSecondary }]} numberOfLines={1}>
            {holding.stock.companyName}
          </Text>
        </View>
        <View style={styles.summaryValueCol}>
          <Text style={[styles.currentValue, { color: theme.text }]}>
            {formatCurrency(holding.currentValue)}
          </Text>
          <ChangePill percent={holding.gainPercent} />
        </View>
      </View>

      <DetailGrid
        style={styles.detailGrid}
        items={[
          {
            label: 'Portfolio %',
            value: formatPercent(totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0),
          },
          { label: 'Market Price', value: formatCurrency(holding.stock.price) },
          { label: 'Average Price', value: formatCurrency(holding.averagePrice) },
          { label: 'Total Shares', value: formatNumber(holding.quantity) },
          { label: 'Uncommitted Shares', value: formatNumber(holding.quantity) },
          { label: 'Market Value', value: formatCurrency(holding.currentValue) },
          {
            label: 'Gain/Loss',
            value: formatSignedCurrency(holding.gainAmount),
            color: holding.gainAmount >= 0 ? theme.positive : theme.negative,
          },
          {
            label: '%Gain/Loss',
            value: formatSignedPercent(holding.gainPercent),
            color: holding.gainAmount >= 0 ? theme.positive : theme.negative,
          },
        ]}
      />

      <View style={styles.form}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Adjust Shares</Text>
        <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
          Currently {formatShares(holding.quantity)}
        </Text>
        <TextField
          label="Number of shares"
          value={quantityInput}
          onChangeText={setQuantityInput}
          keyboardType="numeric"
          error={error || undefined}
        />

        <View style={styles.chipRow}>
          {QUICK_ADJUSTMENTS.map((delta) => (
            <Pressable
              key={delta}
              onPress={() => applyDelta(delta)}
              style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.chipLabel, { color: theme.text }]}>
                {delta > 0 ? `+${delta}` : delta}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.summaryRow, { borderColor: theme.border }]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>New value</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(projectedValue)}</Text>
        </View>

        <PrimaryButton label="Save Changes" onPress={handleSave} />
        <PrimaryButton label="Remove Holding" variant="danger" onPress={handleRemove} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.three,
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '700',
  },
  company: {
    fontSize: 12,
  },
  summaryValueCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  currentValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailGrid: {
    marginTop: Spacing.three,
  },
  form: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  formSubtitle: {
    fontSize: 13,
    marginTop: -Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});

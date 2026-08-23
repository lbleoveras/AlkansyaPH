import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { AvatarBadge } from '@/components/ui/avatar-badge';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Radii, Spacing } from '@/constants/theme';
import { useAppLock } from '@/context/app-lock-context';
import { useAuth } from '@/context/auth-context';
import { CurrencyCode, useCurrencyPreference } from '@/context/currency-context';
import { ThemePreference, useThemePreference } from '@/context/theme-preference-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/format';

const APPEARANCE_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
const CURRENCY_OPTIONS: CurrencyCode[] = ['PHP', 'USD', 'EUR', 'JPY', 'SGD'];

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name={icon} size={16} color={theme.textSecondary} />
      </View>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const { currency, setCurrency } = useCurrencyPreference();
  const { enabled: lockEnabled, isAvailable: lockAvailable, setEnabled: setLockEnabled } = useAppLock();

  const memberSince = user?.createdAt ? formatDate(user.createdAt) : '—';

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" />

      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AvatarBadge label={user?.name ?? 'You'} color={theme.tint} size={56} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.text }]}>{user?.name ?? 'Investor'}</Text>
          <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <InfoRow icon="calendar-outline" label="Member since" value={memberSince} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={() => router.push('/change-password')}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
            </View>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            onPress={() => router.push('/delete-account')}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}>
            <View style={[styles.infoIcon, { backgroundColor: theme.negativeSoft }]}>
              <Ionicons name="trash-outline" size={16} color={theme.negative} />
            </View>
            <Text style={[styles.infoLabel, { color: theme.negative }]}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Security" />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.toggleRow}>
            <View style={[styles.infoIcon, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="finger-print-outline" size={16} color={theme.textSecondary} />
            </View>
            <View style={styles.toggleTextGroup}>
              <Text style={[styles.infoLabel, { color: theme.text }]}>App Lock</Text>
              <Text style={[styles.toggleSubtext, { color: theme.textSecondary }]}>
                {lockAvailable
                  ? 'Require your fingerprint, face, or device passcode to open the app.'
                  : 'Unavailable -- set up a fingerprint, face, or passcode lock on your device first.'}
              </Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={(next) => void setLockEnabled(next)}
              disabled={!lockAvailable}
              trackColor={{ false: theme.border, true: theme.tint }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Preferences" />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.preferenceLabel, { color: theme.textSecondary }]}>Appearance</Text>
          <SegmentedControl options={APPEARANCE_OPTIONS} value={preference} onChange={setPreference} />
          <Text style={[styles.preferenceLabel, { color: theme.textSecondary }, styles.preferenceSpacing]}>
            Currency (display only -- holdings are always tracked in PHP)
          </Text>
          <SegmentedControl options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
        </View>
      </View>

      <View style={styles.section}>
        <PrimaryButton label="Log Out" variant="danger" onPress={() => { void logout(); }} />
      </View>

      <Text style={[styles.version, { color: theme.textSecondary }]}>
        AlkansyaPH v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
  },
  section: {
    marginTop: Spacing.four,
  },
  card: {
    borderRadius: Radii.large,
    borderWidth: 1,
    padding: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two - 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two - 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 2,
  },
  toggleSubtext: {
    fontSize: 12,
    lineHeight: 16,
  },
  preferenceSpacing: {
    marginTop: Spacing.three,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '50%',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.five,
  },
});

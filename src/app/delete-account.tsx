import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const CONFIRM_PHRASE = 'DELETE';

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { deleteAccount, isSubmitting } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== CONFIRM_PHRASE) {
      setError(`Type ${CONFIRM_PHRASE} to confirm.`);
      return;
    }
    setError('');
    try {
      await deleteAccount();
      router.dismissAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Delete Account</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Close"
          style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.warningCard, { backgroundColor: theme.negativeSoft }]}>
        <Ionicons name="warning-outline" size={22} color={theme.negative} />
        <Text style={[styles.warningText, { color: theme.negative }]}>
          This permanently deletes your account, all your holdings, and your notification
          settings. This cannot be undone.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label={`Type ${CONFIRM_PHRASE} to confirm`}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={CONFIRM_PHRASE}
          autoCapitalize="characters"
          error={error || undefined}
        />
        <PrimaryButton
          label="Permanently Delete My Account"
          variant="danger"
          onPress={() => {
            void handleDelete();
          }}
          loading={isSubmitting}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
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
  warningCard: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  form: {
    gap: Spacing.three,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMark } from '@/components/auth-mark';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Enter your email to continue.');
      return;
    }
    setError('');
    setIsSending(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 24 })}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Back"
            style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.centerRow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {sent ? (
              <>
                <View style={[styles.iconCircle, { backgroundColor: theme.tintSoft }]}>
                  <Ionicons name="mail-outline" size={30} color={theme.tint} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Check your email</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  If an account exists for {email.trim()}, we&apos;ve sent a link to reset your password.
                  Tap it on this device to continue.
                </Text>
                <Link href="/(auth)/login" asChild>
                  <PrimaryButton label="Back to Login" onPress={() => router.replace('/(auth)/login')} style={styles.submit} />
                </Link>
              </>
            ) : (
              <>
                <AuthMark title="Reset your password" subtitle="We'll email you a link to set a new one" />
                <View style={styles.form}>
                  <TextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@email.com"
                    keyboardType="email-address"
                    error={error || undefined}
                  />
                  <PrimaryButton
                    label="Send Reset Link"
                    onPress={handleSend}
                    loading={isSending}
                    style={styles.submit}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRow: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
  },
  form: {
    width: '100%',
    gap: Spacing.three,
  },
  submit: {
    marginTop: Spacing.two,
    width: '100%',
  },
});

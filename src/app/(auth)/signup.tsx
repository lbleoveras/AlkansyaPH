import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMark } from '@/components/auth-mark';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { rememberEmail } from '@/lib/auth-memory';

const MIN_PASSWORD_LENGTH = 8;

export default function SignupScreen() {
  const theme = useTheme();
  const { signup, resendVerificationEmail, isSubmitting } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState(''); // honeypot -- real users never see or fill this
  const [error, setError] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSignup = async () => {
    if (website.trim()) {
      // Bot filled the hidden field. Fail generically -- don't reveal the trap.
      setError('Something went wrong. Please try again.');
      return;
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Fill in all fields to create your account.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setError('');
    try {
      const trimmedEmail = email.trim();
      const { needsEmailConfirmation } = await signup(name.trim(), trimmedEmail, password);
      await rememberEmail(trimmedEmail);
      if (needsEmailConfirmation) setPendingVerificationEmail(trimmedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      await resendVerificationEmail(pendingVerificationEmail);
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  if (pendingVerificationEmail) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.centerRow}>
            <View style={[styles.content, styles.verifyContent]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.tintSoft }]}>
                <Ionicons name="mail-unread-outline" size={30} color={theme.tint} />
              </View>
              <Text style={[styles.verifyTitle, { color: theme.text }]}>Verify your email</Text>
              <Text style={[styles.verifySubtitle, { color: theme.textSecondary }]}>
                We sent a verification link to{'\n'}
                <Text style={{ fontWeight: '700', color: theme.text }}>{pendingVerificationEmail}</Text>.
                Tap it to verify your account -- you&apos;ll be brought right back here to finish setting up.
              </Text>
              <PrimaryButton
                label={resendState === 'sent' ? 'Email Sent' : 'Resend Email'}
                onPress={handleResend}
                loading={resendState === 'sending'}
                disabled={resendState === 'sent'}
                style={styles.submit}
              />
              <Link href="/(auth)/login" style={styles.backToLoginLink}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Back to login</Text>
              </Link>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 24 })}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.centerRow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <AuthMark title="Create your account" subtitle="Start tracking your PH stock portfolio" />

            <View style={styles.form}>
              <TextField label="Full name" value={name} onChangeText={setName} placeholder="Juan Dela Cruz" />
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                keyboardType="email-address"
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                secureTextEntry
                error={error || undefined}
              />
              <TextInput
                value={website}
                onChangeText={setWebsite}
                style={styles.honeypot}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                tabIndex={-1}
                autoComplete="off"
                autoCorrect={false}
              />
              <PrimaryButton
                label="Create Account"
                onPress={handleSignup}
                loading={isSubmitting}
                style={styles.submit}
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={{ color: theme.textSecondary }}>Already have an account? </Text>
              <Link href="/(auth)/login">
                <Text style={{ color: theme.tint, fontWeight: '700' }}>Log in</Text>
              </Link>
            </View>
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
    justifyContent: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  honeypot: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  submit: {
    marginTop: Spacing.two,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  verifyContent: {
    width: '100%',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  verifySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
  },
  backToLoginLink: {
    marginTop: Spacing.three,
    alignSelf: 'center',
  },
});

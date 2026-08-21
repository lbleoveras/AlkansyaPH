import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMark } from '@/components/auth-mark';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { rememberEmail } from '@/lib/auth-memory';

export default function SignupScreen() {
  const theme = useTheme();
  const { signup, isSubmitting } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Fill in all fields to create your account.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    try {
      const trimmedEmail = email.trim();
      await signup(name.trim(), trimmedEmail, password);
      await rememberEmail(trimmedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.centerRow}>
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
                placeholder="At least 6 characters"
                secureTextEntry
                error={error || undefined}
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
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
    flex: 1,
  },
  form: {
    gap: Spacing.three,
  },
  submit: {
    marginTop: Spacing.two,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
});

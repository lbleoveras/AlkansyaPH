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

export default function LoginScreen() {
  const theme = useTheme();
  const { login, isSubmitting } = useAuth();
  const [email, setEmail] = useState('juan.delacruz@email.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError('');
    try {
      await login(email.trim(), password);
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
            <AuthMark title="Welcome back" subtitle="Log in to check your portfolio" />

            <View style={styles.form}>
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
                placeholder="••••••••"
                secureTextEntry
                error={error || undefined}
              />
              <PrimaryButton
                label="Log In"
                onPress={handleLogin}
                loading={isSubmitting}
                style={styles.submit}
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={{ color: theme.textSecondary }}>Don&apos;t have an account? </Text>
              <Link href="/(auth)/signup">
                <Text style={{ color: theme.tint, fontWeight: '700' }}>Sign up</Text>
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

import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMark } from '@/components/auth-mark';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getRememberedEmail, rememberEmail } from '@/lib/auth-memory';

export default function LoginScreen() {
  const theme = useTheme();
  const { login, isSubmitting } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isReturningDevice, setIsReturningDevice] = useState(false);

  useEffect(() => {
    getRememberedEmail().then((stored) => {
      if (stored) {
        setEmail(stored);
        setIsReturningDevice(true);
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError('');
    try {
      const trimmedEmail = email.trim();
      await login(trimmedEmail, password);
      await rememberEmail(trimmedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

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
            <AuthMark
              title={isReturningDevice ? 'Welcome back' : 'Welcome'}
              subtitle="Log in to check your portfolio"
            />

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
              <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
                <Text style={{ color: theme.tint, fontWeight: '600', fontSize: 13 }}>Forgot password?</Text>
              </Link>
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.two,
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

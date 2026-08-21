import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

// The email-verification and password-reset links both point at a real
// path (this one, and reset-password.tsx) rather than a bare custom-scheme
// URL with no matching route -- on web that 404s before the page (and its
// deep-link listener) ever loads, and on native it'd otherwise be an
// unmatched route. The actual session exchange happens in AuthProvider's
// Linking listener, which runs regardless of what's on screen.
//
// This screen is deliberately reachable regardless of auth state (see
// _layout.tsx), which means it has no guard of its own to redirect it away
// once the session lands -- unlike reset-password/onboarding, nothing does
// that automatically here, so it navigates itself back to "/" once
// authenticated and lets the root layout's guards take it from there.
// If authentication doesn't happen within a few seconds (an expired or
// already-used link), show that instead of spinning forever.
const TIMEOUT_MS = 8000;

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  if (timedOut && !isAuthenticated) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.center}>
          <Text style={[styles.title, { color: theme.text }]}>Link expired</Text>
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            This verification link is no longer valid. Try signing up again, or resend the email
            from the signup screen.
          </Text>
          <Link href="/(auth)/login" style={styles.link}>
            <Text style={{ color: theme.tint, fontWeight: '700' }}>Back to login</Text>
          </Link>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.text, { color: theme.textSecondary }]}>Verifying your email…</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    marginTop: 8,
  },
});

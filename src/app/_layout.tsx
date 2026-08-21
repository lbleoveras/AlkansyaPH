import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { CurrencyProvider } from '@/context/currency-context';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { PortfolioProvider } from '@/context/portfolio-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { registerForPushNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/query-client';
import { asyncStoragePersister } from '@/lib/query-persister';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isInitializing, isPasswordRecovery, user } = useAuth();
  const { needsOnboarding } = useOnboarding();

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing]);

  useEffect(() => {
    if (user) {
      void registerForPushNotifications(user.id);
    }
  }, [user]);

  if (isInitializing) {
    return null;
  }

  const isRecovering = isAuthenticated && isPasswordRecovery;
  const isOnboarding = isAuthenticated && !isPasswordRecovery && needsOnboarding;
  const isMainApp = isAuthenticated && !isPasswordRecovery && !needsOnboarding;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isRecovering}>
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={isOnboarding}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isMainApp}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-holding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-holding/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="change-password" options={{ presentation: 'modal' }} />
        <Stack.Screen name="delete-account" options={{ presentation: 'modal' }} />
        <Stack.Screen name="stock/[symbol]" />
      </Stack.Protected>
      {/* Always reachable, regardless of auth state -- this is the direct
          target of the email-verification deep link, tapped while still
          unauthenticated. Deliberately declared last: React Navigation
          treats the first-declared screen as the stack's initial route, and
          this must never win that over the (auth) group above. The actual
          session exchange happens in AuthProvider's Linking listener; this
          screen just needs to exist so the link has somewhere valid to land
          while that resolves. */}
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <ThemePreferenceProvider>
        <CurrencyProvider>
          <AuthProvider>
            <OnboardingProvider>
              <PortfolioProvider>
                <RootNavigator />
              </PortfolioProvider>
            </OnboardingProvider>
          </AuthProvider>
        </CurrencyProvider>
      </ThemePreferenceProvider>
    </PersistQueryClientProvider>
  );
}

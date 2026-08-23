import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppLockScreen } from '@/components/app-lock-screen';
import { AppLockProvider, useAppLock } from '@/context/app-lock-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { CurrencyProvider } from '@/context/currency-context';
import { NotificationsProvider } from '@/context/notifications-context';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { PortfolioProvider } from '@/context/portfolio-context';
import { PrivacyProvider } from '@/context/privacy-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { registerForPushNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/query-client';
import { asyncStoragePersister } from '@/lib/query-persister';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isInitializing, isPasswordRecovery, user } = useAuth();
  const { needsOnboarding } = useOnboarding();
  const { isLoadingPreference: isLoadingLockPreference, enabled: lockEnabled, isLocked } = useAppLock();

  useEffect(() => {
    if (!isInitializing && !isLoadingLockPreference) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing, isLoadingLockPreference]);

  useEffect(() => {
    if (user) {
      void registerForPushNotifications(user.id);
    }
  }, [user]);

  if (isInitializing || isLoadingLockPreference) {
    return null;
  }

  const isRecovering = isAuthenticated && isPasswordRecovery;
  const isOnboarding = isAuthenticated && !isPasswordRecovery && needsOnboarding;
  const isMainApp = isAuthenticated && !isPasswordRecovery && !needsOnboarding;

  // Checked before anything else renders -- fully replaces the navigator
  // rather than overlaying it, so a locked session can't be bypassed by
  // reaching an already-mounted screen underneath.
  if (isMainApp && lockEnabled && isLocked) {
    return <AppLockScreen />;
  }

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
            <AppLockProvider>
              <OnboardingProvider>
                <PortfolioProvider>
                  <NotificationsProvider>
                    <PrivacyProvider>
                      <RootNavigator />
                    </PrivacyProvider>
                  </NotificationsProvider>
                </PortfolioProvider>
              </OnboardingProvider>
            </AppLockProvider>
          </AuthProvider>
        </CurrencyProvider>
      </ThemePreferenceProvider>
    </PersistQueryClientProvider>
  );
}

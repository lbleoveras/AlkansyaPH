import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { PortfolioProvider } from '@/context/portfolio-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { queryClient } from '@/lib/query-client';
import { asyncStoragePersister } from '@/lib/query-persister';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing]);

  if (isInitializing) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-holding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-holding/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="stock/[symbol]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <ThemePreferenceProvider>
        <AuthProvider>
          <PortfolioProvider>
            <RootNavigator />
          </PortfolioProvider>
        </AuthProvider>
      </ThemePreferenceProvider>
    </PersistQueryClientProvider>
  );
}

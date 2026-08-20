import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { PortfolioProvider } from '@/context/portfolio-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
    <ThemePreferenceProvider>
      <AuthProvider>
        <PortfolioProvider>
          <RootNavigator />
        </PortfolioProvider>
      </AuthProvider>
    </ThemePreferenceProvider>
  );
}

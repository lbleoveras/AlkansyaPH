import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, ReactNode, use, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { getAppLockEnabled, setAppLockEnabled } from '@/lib/app-lock-memory';

type AppLockContextValue = {
  isLoadingPreference: boolean;
  enabled: boolean;
  isAvailable: boolean;
  isLocked: boolean;
  setEnabled: (next: boolean) => Promise<void>;
  unlock: () => Promise<boolean>;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

// Fails closed: isLocked starts true and only flips once we've actually
// confirmed the stored preference is off, so there's never a frame where
// content is visible before we know whether it should be.
export function AppLockProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isLoadingPreference, setIsLoadingPreference] = useState(true);
  const [enabled, setEnabledState] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const wasAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    (async () => {
      const [storedEnabled, hasHardware, isEnrolled] = await Promise.all([
        getAppLockEnabled(),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      const available = hasHardware && isEnrolled;
      setIsAvailable(available);
      // If biometrics/passcode got removed from the device after this was
      // turned on, don't strand the user locked out with no way to unlock.
      const effectiveEnabled = storedEnabled && available;
      setEnabledState(effectiveEnabled);
      setIsLocked(effectiveEnabled);
      setIsLoadingPreference(false);
    })();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (enabled && nextState !== 'active') {
        setIsLocked(true);
      }
    });
    return () => subscription.remove();
  }, [enabled]);

  useEffect(() => {
    // Re-arm on sign-out so a different account signing into the same
    // device afterward doesn't inherit an already-unlocked session.
    if (wasAuthenticated.current && !isAuthenticated && enabled) {
      setIsLocked(true);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, enabled]);

  const setEnabled = async (next: boolean) => {
    await setAppLockEnabled(next);
    setEnabledState(next);
    if (!next) setIsLocked(false);
  };

  const unlock = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock AlkansyaPH',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppLockContext value={{ isLoadingPreference, enabled, isAvailable, isLocked, setEnabled, unlock }}>
      {children}
    </AppLockContext>
  );
}

export function useAppLock() {
  const context = use(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}

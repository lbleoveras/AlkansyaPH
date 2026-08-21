import { createContext, ReactNode, use, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { consumeOnboardingPending } from '@/lib/onboarding-memory';

type OnboardingContextValue = {
  needsOnboarding: boolean;
  completeOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setNeedsOnboarding(false);
      return;
    }
    let cancelled = false;
    consumeOnboardingPending(user.email).then((pending) => {
      if (!cancelled) setNeedsOnboarding(pending);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return (
    <OnboardingContext value={{ needsOnboarding, completeOnboarding: () => setNeedsOnboarding(false) }}>
      {children}
    </OnboardingContext>
  );
}

export function useOnboarding() {
  const context = use(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

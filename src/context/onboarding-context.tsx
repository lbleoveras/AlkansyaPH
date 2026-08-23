import { createContext, ReactNode, use, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { consumeOnboardingPending } from '@/lib/onboarding-memory';

type OnboardingContextValue = {
  needsOnboarding: boolean;
  /** Whether *this session's* sign-in was a fresh signup, once determined
   * (null until the async check resolves). Unlike needsOnboarding, this
   * doesn't reset back to false once onboarding completes -- it's the
   * single authoritative answer to "was this a fresh signup," which
   * WhatsNewProvider needs so it doesn't independently re-check the same
   * consumed flag and race this provider's own read of it. */
  wasFreshSignup: boolean | null;
  completeOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [wasFreshSignup, setWasFreshSignup] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setNeedsOnboarding(false);
      setWasFreshSignup(null);
      return;
    }
    let cancelled = false;
    consumeOnboardingPending(user.email).then((pending) => {
      if (cancelled) return;
      setNeedsOnboarding(pending);
      setWasFreshSignup(pending);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return (
    <OnboardingContext
      value={{ needsOnboarding, wasFreshSignup, completeOnboarding: () => setNeedsOnboarding(false) }}>
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

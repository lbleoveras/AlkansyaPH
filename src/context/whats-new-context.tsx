import Constants from 'expo-constants';
import { createContext, ReactNode, use, useEffect, useState } from 'react';

import { useOnboarding } from '@/context/onboarding-context';
import { getLastSeenAppVersion, setLastSeenAppVersion } from '@/lib/whats-new-memory';

type WhatsNewContextValue = {
  needsWhatsNew: boolean;
  completeWhatsNew: () => void;
};

const WhatsNewContext = createContext<WhatsNewContextValue | null>(null);

const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

// Shows the "what's new" carousel when upgrading from a previously recorded
// version to a different one. A brand-new signup has no prior version to
// compare against either, but must NOT be treated the same as an existing
// user upgrading from a pre-tracking build (which also has no prior version
// recorded, since this tracking mechanism is itself new) -- disambiguated
// via OnboardingProvider's wasFreshSignup, which is the single authoritative
// read of the pending-onboarding flag. (Deliberately not an independent
// peek at that same flag here -- two separate async reads of one
// consumed-on-read value would race against whichever fires first.)
export function WhatsNewProvider({ children }: { children: ReactNode }) {
  const { wasFreshSignup } = useOnboarding();
  const [needsWhatsNew, setNeedsWhatsNew] = useState(false);

  useEffect(() => {
    if (wasFreshSignup === null) return; // not yet determined
    (async () => {
      const lastSeen = await getLastSeenAppVersion();
      if (lastSeen && lastSeen !== currentVersion) {
        setNeedsWhatsNew(true);
      } else if (!lastSeen && !wasFreshSignup) {
        setNeedsWhatsNew(true);
      } else if (!lastSeen) {
        await setLastSeenAppVersion(currentVersion);
      }
    })();
  }, [wasFreshSignup]);

  const completeWhatsNew = () => {
    setNeedsWhatsNew(false);
    void setLastSeenAppVersion(currentVersion);
  };

  return <WhatsNewContext value={{ needsWhatsNew, completeWhatsNew }}>{children}</WhatsNewContext>;
}

export function useWhatsNew() {
  const context = use(WhatsNewContext);
  if (!context) {
    throw new Error('useWhatsNew must be used within a WhatsNewProvider');
  }
  return context;
}

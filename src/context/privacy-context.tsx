import { createContext, ReactNode, use, useEffect, useState } from 'react';

import { getHideNumbers, setHideNumbers } from '@/lib/privacy-memory';

type PrivacyContextValue = {
  hideNumbers: boolean;
  toggleHideNumbers: () => void;
};

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hideNumbers, setHideNumbersState] = useState(false);

  useEffect(() => {
    getHideNumbers().then(setHideNumbersState);
  }, []);

  const toggleHideNumbers = () => {
    setHideNumbersState((current) => {
      const next = !current;
      void setHideNumbers(next);
      return next;
    });
  };

  return <PrivacyContext value={{ hideNumbers, toggleHideNumbers }}>{children}</PrivacyContext>;
}

export function usePrivacy() {
  const context = use(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}

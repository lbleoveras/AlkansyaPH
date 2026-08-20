import { createContext, ReactNode, use, useMemo, useState } from 'react';

import { User } from '@/types';

type AuthContextValue = {
  isAuthenticated: boolean;
  user: User | null;
  isSubmitting: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      user,
      isSubmitting,
      async login(email: string, _password: string) {
        setIsSubmitting(true);
        try {
          await delay(600);
          const name = email.split('@')[0] || 'Investor';
          setUser({ name: name.charAt(0).toUpperCase() + name.slice(1), email });
        } finally {
          setIsSubmitting(false);
        }
      },
      async signup(name: string, email: string, _password: string) {
        setIsSubmitting(true);
        try {
          await delay(600);
          setUser({ name, email });
        } finally {
          setIsSubmitting(false);
        }
      },
      logout() {
        setUser(null);
      },
    }),
    [user, isSubmitting],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, use, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { User } from '@/types';

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: User | null;
  isSubmitting: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: Session | null): User | null {
  if (!session?.user) return null;
  const { id, email, user_metadata: metadata } = session.user;
  const name = (metadata?.name as string | undefined) || email?.split('@')[0] || 'Investor';
  return { id, email: email ?? '', name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(userFromSession(session));
      setIsInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(userFromSession(session));
      if (event === 'SIGNED_OUT') {
        // Prevent the next user on this device from seeing a flash of the
        // previous user's persisted holdings before the RLS-scoped refetch lands.
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      isInitializing,
      user,
      isSubmitting,
      async login(email: string, password: string) {
        setIsSubmitting(true);
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } finally {
          setIsSubmitting(false);
        }
      },
      async signup(name: string, email: string, password: string) {
        setIsSubmitting(true);
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
          if (error) throw error;
        } finally {
          setIsSubmitting(false);
        }
      },
      async logout() {
        await supabase.auth.signOut();
      },
    }),
    [user, isInitializing, isSubmitting],
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

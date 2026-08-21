import { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { createContext, ReactNode, use, useEffect, useMemo, useState } from 'react';

import { parseAuthDeepLink } from '@/lib/auth-deep-link';
import { unregisterPushNotifications } from '@/lib/notifications';
import { markOnboardingPending } from '@/lib/onboarding-memory';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

type SignupResult = { needsEmailConfirmation: boolean };

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isPasswordRecovery: boolean;
  user: User | null;
  isSubmitting: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<SignupResult>;
  resendVerificationEmail: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  completePasswordReset: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: Session | null): User | null {
  if (!session?.user) return null;
  const { id, email, created_at: createdAt, user_metadata: metadata } = session.user;
  const name = (metadata?.name as string | undefined) || email?.split('@')[0] || 'Investor';
  return { id, email: email ?? '', name, createdAt };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

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
        setIsPasswordRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    // RN doesn't auto-detect the session tokens Supabase's hosted auth
    // pages redirect back with (that's a web-only `detectSessionInUrl`
    // behavior) -- parse the incoming deep link ourselves and establish the
    // session by hand. A `type=recovery` link additionally flips
    // isPasswordRecovery so the root layout can route to the "set a new
    // password" screen instead of treating this as a normal sign-in.
    async function consume(url: string | null) {
      if (!url) return;
      const parsed = parseAuthDeepLink(url);
      if (!parsed) return;
      const { error } = await supabase.auth.setSession({
        access_token: parsed.accessToken,
        refresh_token: parsed.refreshToken,
      });
      if (error) return;
      if (parsed.kind === 'recovery') setIsPasswordRecovery(true);
    }

    Linking.getInitialURL().then(consume);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void consume(url);
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: user !== null,
      isInitializing,
      isPasswordRecovery,
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
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name }, emailRedirectTo: Linking.createURL('verify-email') },
          });
          if (error) throw error;
          await markOnboardingPending(email);
          return { needsEmailConfirmation: !data.session };
        } finally {
          setIsSubmitting(false);
        }
      },
      async resendVerificationEmail(email: string) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: Linking.createURL('verify-email') },
        });
        if (error) throw error;
      },
      async requestPasswordReset(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: Linking.createURL('reset-password'),
        });
        if (error) throw error;
      },
      async completePasswordReset(newPassword: string) {
        setIsSubmitting(true);
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          // The recovery session itself is the one that just proved
          // ownership of the new password -- only force *other* devices
          // (e.g. one still signed in with the old password) to re-auth.
          await supabase.auth.signOut({ scope: 'others' });
          setIsPasswordRecovery(false);
        } finally {
          setIsSubmitting(false);
        }
      },
      async logout() {
        if (user) {
          await unregisterPushNotifications(user.id);
        }
        await supabase.auth.signOut();
      },
      async changePassword(currentPassword: string, newPassword: string) {
        setIsSubmitting(true);
        try {
          if (!user?.email) throw new Error('Not signed in');
          const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
          });
          if (verifyError) throw new Error('Current password is incorrect.');
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          // Force every other signed-in device to re-authenticate; only this
          // session (the one that just proved the new password) stays live.
          await supabase.auth.signOut({ scope: 'others' });
        } finally {
          setIsSubmitting(false);
        }
      },
      async deleteAccount() {
        setIsSubmitting(true);
        try {
          // Cascades to holdings/push_tokens/price_alerts_sent server-side --
          // nothing left to clean up locally once this succeeds.
          const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
          if (error) throw error;
          await supabase.auth.signOut();
        } finally {
          setIsSubmitting(false);
        }
      },
    }),
    [user, isInitializing, isSubmitting, isPasswordRecovery],
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

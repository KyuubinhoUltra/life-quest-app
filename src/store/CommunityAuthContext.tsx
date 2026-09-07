import type { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/services/supabase';

type Ctx = {
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const CommunityAuthContext = createContext<Ctx | null>(null);

export function CommunityAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      session,
      loading,
      signUp: async (email, password, username) => {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        return error?.message ?? null;
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading]
  );

  return <CommunityAuthContext.Provider value={value}>{children}</CommunityAuthContext.Provider>;
}

export function useCommunityAuth(): Ctx {
  const ctx = useContext(CommunityAuthContext);
  if (!ctx) throw new Error('useCommunityAuth must be used within CommunityAuthProvider');
  return ctx;
}

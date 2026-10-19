import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, supabase } from "./supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | Error | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  changePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  refreshSession: () => Promise<Session | null>;
};

const SupabaseAuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | Error | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const client = getSupabaseClient();

    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      setSession(data.session);
      setError(sessionError);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setError(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const configurationError = new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      setError(configurationError);
      return { error: configurationError as AuthError };
    }

    const result = await supabase.auth.signInWithPassword({ email, password });
    setError(result.error);
    if (result.data.session) setSession(result.data.session);
    return { error: result.error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      const configurationError = new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      setError(configurationError);
      return { error: configurationError as AuthError };
    }

    const result = await supabase.auth.signOut();
    setError(result.error);
    if (!result.error) setSession(null);
    return { error: result.error };
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    if (!supabase) {
      const configurationError = new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      setError(configurationError);
      return { error: configurationError as AuthError };
    }

    const result = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    });
    setError(result.error);
    if (result.data.user) {
      const nextUser = result.data.user;
      setSession((current) => (current ? { ...current, user: nextUser } : current));
    }
    return { error: result.error };
  }, []);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return null;
    }

    setLoading(true);
    const result = await supabase.auth.refreshSession();
    setSession(result.data.session);
    setError(result.error);
    setLoading(false);
    return result.data.session;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      error,
      signIn,
      signOut,
      changePassword,
      refreshSession,
    }),
    [changePassword, error, loading, refreshSession, session, signIn, signOut],
  );

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  }
  return context;
}

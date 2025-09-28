import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
// ⚠️ Adjust the import path if your supabase client lives elsewhere
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Initial hydration + subscription to auth events ---
  useEffect(() => {
    let mounted = true;

    // 1) Hydrate from current client session (fast, client-side)
    (async () => {
      try {
        let { data } = await supabase.auth.getSession();
        let nextSession = data?.session ?? null;

        // Auto–create anonymous session for visitors
        if (!nextSession) {
          await supabase.auth.signInAnonymously(); // may include CAPTCHA later
          ({ data } = await supabase.auth.getSession());
          nextSession = data?.session ?? null;
        }
        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      } catch (err) {
        console.error('[AuthContext] getSession error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // 2) Subscribe to auth state changes (SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / etc.)
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const isAnon = !!session && getIsAnonymous(session);
  const isLoggedIn = !!user && !isAnon; // use this for protected pages
  const isAuthenticated = isLoggedIn;   // keep old name if your app expects it
  
  // --- Robust logout that handles 401/403 gracefully ---
  const logout = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      // If there is no current session, consider the user logged out
      if (!data?.session) {
        setUser(null);
        setSession(null);
        return { error: null };
      }

      const { error } = await supabase.auth.signOut({ scope: 'local' });
      // Known behavior: logout endpoint can return 401/403 if token already invalid/rotated
      if (!error || error?.status === 401 || error?.status === 403) {
        setUser(null);
        setSession(null);
        return { error: null };
      }

      // Any other error: surface to caller
      console.error('[AuthContext] signOut error:', error);
      return { error };
    } catch (err) {
      console.error('[AuthContext] logout threw:', err);
      // Treat unexpected exceptions as success for UX (state is cleared below)
      setUser(null);
      setSession(null);
      return { error: null };
    }
  };

  function getIsAnonymous(s) {
    try {
      const token = s?.access_token;
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload?.is_anonymous === true;
    } catch {
      return false;
    }
  }

  // Ensure there's *some* auth user (normal or anonymous)
  async function ensureAuthUid() {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u?.id) return u.id;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user.id;
  }
  const value = useMemo(
    () => ({ user, session, loading, isAuthenticated, isAnon, isLoggedIn, ensureAuthUid, logout }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

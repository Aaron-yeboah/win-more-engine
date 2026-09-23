import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isVip: boolean;
  refreshAccess: (userId?: string) => Promise<{ isAdmin: boolean; isVip: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);

  const loadAccess = async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false);
      setIsVip(false);
      return { isAdmin: false, isVip: false };
    }
    const [{ data: roles }, { data: membership }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("vip_memberships").select("active, approved_at").eq("user_id", userId).maybeSingle(),
    ]);
    const nextIsAdmin = Boolean(roles?.some((item) => item.role === "admin"));
    
    // VIP membership is active only for 1 hour (3600000 ms) after approval
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const approvedAtMs = membership?.approved_at ? new Date(membership.approved_at).getTime() : 0;
    const nextIsVip = Boolean(membership?.active && Date.now() - approvedAtMs < ONE_HOUR_MS);

    setIsAdmin(nextIsAdmin);
    setIsVip(nextIsVip);
    return { isAdmin: nextIsAdmin, isVip: nextIsVip };
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadAccess(data.session?.user.id);
      if (mounted) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      window.setTimeout(() => void loadAccess(nextSession?.user.id).finally(() => setLoading(false)), 0);
    });

    // Periodically re-check access every 30 seconds to automatically expire 1-hour VIP sessions
    const interval = window.setInterval(() => {
      if (session?.user?.id) {
        void loadAccess(session.user.id);
      }
    }, 30000);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    isAdmin,
    isVip,
    refreshAccess: (userId?: string) => loadAccess(userId ?? session?.user.id),
    signOut: async () => { await supabase.auth.signOut(); },
  }), [session, loading, isAdmin, isVip]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

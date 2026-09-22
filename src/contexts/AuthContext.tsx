import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isVip: boolean;
  refreshAccess: () => Promise<void>;
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
      return;
    }
    const [{ data: roles }, { data: membership }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("vip_memberships").select("active").eq("user_id", userId).maybeSingle(),
    ]);
    setIsAdmin(Boolean(roles?.some((item) => item.role === "admin")));
    setIsVip(Boolean(membership?.active));
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
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    isAdmin,
    isVip,
    refreshAccess: () => loadAccess(session?.user.id),
    signOut: async () => { await supabase.auth.signOut(); },
  }), [session, loading, isAdmin, isVip]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

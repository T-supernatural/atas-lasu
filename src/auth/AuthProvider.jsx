import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

async function getProfile(user) {
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  return data ?? { role: "user", full_name: user.user_metadata?.full_name ?? null };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    let alive = true;
    async function update(session) {
      const nextUser = session?.user ?? null;
      const nextProfile = await getProfile(nextUser);
      if (alive) { setUser(nextUser); setProfile(nextProfile); }
    }
    supabase.auth.getSession().then(({ data }) => update(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { update(session); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const loading = user === undefined || profile === undefined;
  const role = profile?.role === "admin" ? "admin" : "member";
  return <AuthContext.Provider value={{ user, profile, role, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

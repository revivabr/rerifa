import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export function useAdminSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { 
      setSession(null); 
      setIsAdmin(false);
      return; 
    }

    const checkAdmin = async (currentSession: Session | null) => {
      if (!currentSession) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('auth_user_id', currentSession.user.id)
        .maybeSingle();
      
      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      checkAdmin(data.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      checkAdmin(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Retornamos null se não houver sessão OU se não for admin
  if (session === null || isAdmin === false) return null;
  // Retornamos undefined enquanto carrega
  if (session === undefined || isAdmin === null) return undefined;
  
  return session;
}

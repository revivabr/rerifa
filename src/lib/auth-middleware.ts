import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";

// Admin sign-in uses this project's client and its reviva-rifa-auth session.
// The generated attacher reads a different client's storage key.
export const attachProjectAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error("Não foi possível verificar sua sessão. Entre novamente no painel.");
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
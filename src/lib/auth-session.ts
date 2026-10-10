import { supabase } from "@/lib/supabase";

export async function projectAuthHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Não foi possível verificar sua sessão. Entre novamente no painel.");
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
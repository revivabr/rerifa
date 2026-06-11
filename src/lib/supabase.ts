import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Em SSR ou quando faltar config, devolve um stub para não quebrar build.
function makeStub(): SupabaseClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler: ProxyHandler<any> = {
    get() {
      return () =>
        Promise.resolve({
          data: null,
          error: { message: "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env" },
        });
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({}, handler) as any;
}

export const supabase: SupabaseClient =
  isSupabaseConfigured && typeof window !== "undefined"
    ? createClient(url!, anonKey!, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: "reviva-rifa-auth" },
      })
    : makeStub();

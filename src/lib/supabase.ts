import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co") as string;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder") as string;

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes("placeholder") && anonKey !== "placeholder");

// Em SSR ou quando faltar config, devolve um stub para não quebrar build.
function makeStub(): SupabaseClient {
  const errorResult = {
    data: null,
    error: { message: "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env" },
  };
  // Proxy that is chainable AND thenable, so any chain like
  // supabase.from('x').select('*').eq(...).single() resolves to an error.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeChain = (): any => {
    const fn: any = () => makeChain();
    return new Proxy(fn, {
      get(_t, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => unknown) => resolve(errorResult);
        }
        if (prop === "catch" || prop === "finally") {
          return () => makeChain();
        }
        return makeChain();
      },
      apply() {
        return makeChain();
      },
    });
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return makeChain() as any;
}

export const supabase: SupabaseClient =
  isSupabaseConfigured
    ? createClient(url!, anonKey!, {
        auth: { 
          persistSession: true, 
          autoRefreshToken: true, 
          storageKey: "reviva-rifa-auth",
          detectSessionInUrl: true 
        },
      })
    : makeStub();

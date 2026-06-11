import { isSupabaseConfigured } from "@/lib/supabase";

export function SetupNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="border-b border-warning/40 bg-warning/15 text-warning-foreground">
      <div className="mx-auto max-w-6xl px-4 py-2.5 text-center text-sm">
        ⚙️ <strong>Configuração pendente:</strong> defina <code>VITE_SUPABASE_URL</code> e{" "}
        <code>VITE_SUPABASE_ANON_KEY</code> em <code>.env</code> e rode a migração em{" "}
        <code>supabase/migrations/001_init.sql</code> no seu projeto Supabase.
      </div>
    </div>
  );
}

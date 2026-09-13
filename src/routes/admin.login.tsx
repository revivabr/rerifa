import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoColor from "@/assets/logo-reviva-color.png.asset.json";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) { toast.error("Supabase não configurado"); return; }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) { 
        toast.error(error.message); 
        setLoading(false);
        return; 
      }
      
      toast.success("Login realizado com sucesso! Redirecionando...");
      
      // Pequeno delay para garantir que o estado da sessão seja propagado
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-card">
        <div className="text-center">
          <img src={logoColor.url} alt="Reviva Brasil" className="mx-auto h-16 w-auto" />
          <h1 className="mt-4 text-2xl font-black text-primary">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse para gerenciar as campanhas</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-white text-base font-bold shadow-premium hover:bg-primary/90 transition-all" size="lg">
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

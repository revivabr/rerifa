import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Ticket, Trophy, Crown, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const session = useAdminSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/admin/login";
  const isDraw = pathname.startsWith("/admin/draw/");

  useEffect(() => {
    // console.log("[AdminLayout] Session state:", { session, isLogin });
    if (session === null && !isLogin) {
      // console.log("[AdminLayout] No session, redirecting to login");
      navigate({ to: "/admin/login" });
    }
  }, [session, isLogin, navigate]);

  if (isLogin || isDraw) return <Outlet />;

  if (session === undefined) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (session === null) return null;

  const links = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/campaigns", icon: Ticket, label: "Campanhas" },
    { to: "/admin/draw", icon: Trophy, label: "Sorteador" },
    { to: "/admin/ranking", icon: Crown, label: "Ranking" },
  ];

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 md:flex-row md:gap-6">
      <nav className="-mx-3 flex gap-1 overflow-x-auto border-b border-border px-3 pb-3 md:hidden" aria-label="Navegação administrativa">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={cn(
            "flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition",
            pathname.startsWith(l.to) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}>
            <l.icon className="h-4 w-4" /> {l.label}
          </Link>
        ))}
        <Button onClick={signOut} variant="ghost" className="min-h-11 shrink-0 px-3 text-xs text-destructive">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </nav>
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-20 space-y-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              pathname.startsWith(l.to) ? "bg-primary text-white shadow-premium font-bold" : "text-muted-foreground hover:bg-secondary hover:text-primary"
            )}>
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
          <Button onClick={signOut} variant="ghost" className="mt-4 w-full justify-start px-3 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1"><Outlet /></div>
    </div>
  );
}

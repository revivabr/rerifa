import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Ticket, Trophy, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  ];

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
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
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          ><LogOut className="h-4 w-4" /> Sair</button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1"><Outlet /></div>
    </div>
  );
}

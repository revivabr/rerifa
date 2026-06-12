import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, formatDateBR } from "@/lib/format";
import { Ticket, DollarSign, Users, TrendingUp, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ active: 0, finished: 0, raised: 0, sold: 0, buyers: 0 });
  const [recent, setRecent] = useState<{ id: string; name: string; status: string; sold: number; total: number; raised: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: camps } = await supabase.from("campaigns").select("id,name,status,number_quantity");
      const all = camps ?? [];
      const active = all.filter((c: { status: string }) => c.status === "active").length;
      const finished = all.filter((c: { status: string }) => ["finished","drawn"].includes(c.status)).length;
      const { data: paid } = await supabase.from("orders").select("amount,buyer_id").eq("status", "paid");
      const raised = (paid ?? []).reduce((s: number, o: { amount: number }) => s + Number(o.amount), 0);
      const buyers = new Set((paid ?? []).map((o: { buyer_id: string }) => o.buyer_id)).size;
      const { count: sold } = await supabase.from("raffle_numbers").select("*", { head: true, count: "exact" }).eq("status", "sold");
      setStats({ active, finished, raised, sold: sold ?? 0, buyers });

      const recentData = await Promise.all(all.slice(0, 8).map(async (c: { id: string; name: string; status: string; number_quantity: number }) => {
        const { count: soldC } = await supabase.from("raffle_numbers").select("*", { head: true, count: "exact" }).eq("campaign_id", c.id).eq("status", "sold");
        const { data: ordsC } = await supabase.from("orders").select("amount").eq("campaign_id", c.id).eq("status", "paid");
        const raisedC = (ordsC ?? []).reduce((s: number, o: { amount: number }) => s + Number(o.amount), 0);
        return { id: c.id, name: c.name, status: c.status, sold: soldC ?? 0, total: c.number_quantity, raised: raisedC };
      }));
      setRecent(recentData);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral das campanhas</p>
        </div>
        <Link to="/admin/campaigns/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:scale-[1.02] transition">
          <Plus className="h-4 w-4" /> Nova campanha
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Ticket} label="Campanhas ativas" value={String(stats.active)} />
        <StatCard icon={DollarSign} label="Total arrecadado" value={formatBRL(stats.raised)} />
        <StatCard icon={TrendingUp} label="Números vendidos" value={String(stats.sold)} />
        <StatCard icon={Users} label="Compradores" value={String(stats.buyers)} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border p-5"><h2 className="font-bold text-primary">Campanhas recentes</h2></div>
        <div className="divide-y divide-border">
          {recent.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma campanha ainda.</p>}
          {recent.map(c => {
            const pct = c.total > 0 ? Math.round((c.sold / c.total) * 100) : 0;
            return (
              <Link key={c.id} to="/admin/campaigns/$id" params={{ id: c.id }} className="flex items-center gap-4 p-5 transition hover:bg-secondary/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold text-foreground">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.sold}/{c.total} vendidos · {pct}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Arrecadado</p>
                  <p className="font-bold text-primary">{formatBRL(c.raised)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-gradient-primary p-2.5 text-primary-foreground"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-black text-primary">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:     { label: "Rascunho",  cls: "bg-muted text-muted-foreground" },
    active:    { label: "Ativa",     cls: "bg-success/15 text-success" },
    paused:    { label: "Pausada",   cls: "bg-warning/15 text-warning-foreground" },
    finished:  { label: "Encerrada", cls: "bg-secondary text-primary" },
    drawn:     { label: "Sorteada",  cls: "bg-gold/20 text-gold-foreground" },
    cancelled: { label: "Cancelada", cls: "bg-destructive/15 text-destructive" },
  };
  const it = map[status] ?? map.draft;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${it.cls}`}>{it.label}</span>;
}

export { formatDateBR };

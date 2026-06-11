import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, formatDateBR } from "@/lib/format";
import { StatusBadge } from "./admin.dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/campaigns/$id")({
  component: CampaignAdmin,
});

type Campaign = { id: string; name: string; slug: string; status: string; banner_url: string | null; number_quantity: number; number_price: number; goal_amount: number | null; start_date: string; end_date: string };
type OrderRow = { id: string; status: string; amount: number; quantity: number; created_at: string; buyer: { name: string; whatsapp: string; email: string | null } | null };

function CampaignAdmin() {
  const { id } = Route.useParams();
  const [c, setC] = useState<Campaign | null>(null);
  const [stats, setStats] = useState({ sold: 0, reserved: 0, available: 0, raised: 0, buyers: 0 });
  const [orders, setOrders] = useState<OrderRow[]>([]);

  async function load() {
    const { data: camp } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
    if (!camp) return;
    setC(camp as Campaign);
    const [{ count: sold }, { count: reserved }, { count: available }] = await Promise.all([
      supabase.from("raffle_numbers").select("*", { head: true, count: "exact" }).eq("campaign_id", id).eq("status", "sold"),
      supabase.from("raffle_numbers").select("*", { head: true, count: "exact" }).eq("campaign_id", id).eq("status", "reserved"),
      supabase.from("raffle_numbers").select("*", { head: true, count: "exact" }).eq("campaign_id", id).eq("status", "available"),
    ]);
    const { data: paid } = await supabase.from("orders").select("amount,buyer_id").eq("campaign_id", id).eq("status", "paid");
    const raised = (paid ?? []).reduce((s: number, o: { amount: number }) => s + Number(o.amount), 0);
    const buyers = new Set((paid ?? []).map((o: { buyer_id: string }) => o.buyer_id)).size;
    setStats({ sold: sold ?? 0, reserved: reserved ?? 0, available: available ?? 0, raised, buyers });

    const { data: ords } = await supabase.from("orders")
      .select("id,status,amount,quantity,created_at,buyer:buyers(name,whatsapp,email)")
      .eq("campaign_id", id).order("created_at", { ascending: false }).limit(30);
    setOrders((ords ?? []) as unknown as OrderRow[]);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel(`admin-campaign-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "raffle_numbers", filter: `campaign_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `campaign_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setStatus(status: string) {
    const { error } = await supabase.from("campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status atualizado"); load(); }
  }

  async function confirmPayment(orderId: string) {
    const { data, error } = await supabase.rpc("confirm_order_payment", { p_order_id: orderId });
    if (error) { toast.error(error.message); return; }
    const r = data as { ok: boolean; error?: string };
    if (!r.ok) { toast.error(r.error ?? "Erro"); return; }
    toast.success("Pagamento confirmado!");
    load();
  }

  async function cancelOrder(orderId: string) {
    const { error } = await supabase.from("orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    await supabase.from("raffle_numbers").update({ status: "available", reserved_until: null, current_order_id: null, buyer_id: null })
      .eq("current_order_id", orderId);
    toast.success("Pedido cancelado");
    load();
  }

  if (!c) return <p className="text-muted-foreground">Carregando…</p>;
  const pct = Math.round((stats.sold / c.number_quantity) * 100);

  return (
    <div className="space-y-6">
      <Link to="/admin/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Voltar</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-primary">{c.name}</h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="text-sm text-muted-foreground">/{c.slug} · {formatDateBR(c.start_date)} → {formatDateBR(c.end_date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/campanha/$slug" params={{ slug: c.slug }} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary">
            Ver pública <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {c.status !== "active" && <Button onClick={() => setStatus("active")} size="sm" className="bg-success">Ativar</Button>}
          {c.status === "active" && <Button onClick={() => setStatus("paused")} size="sm" variant="outline">Pausar</Button>}
          {c.status !== "finished" && <Button onClick={() => setStatus("finished")} size="sm" variant="outline">Encerrar</Button>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Vendidos" value={`${stats.sold}/${c.number_quantity}`} sub={`${pct}%`} />
        <Stat label="Reservados" value={String(stats.reserved)} />
        <Stat label="Disponíveis" value={String(stats.available)} />
        <Stat label="Arrecadado" value={formatBRL(stats.raised)} sub={c.goal_amount ? `meta ${formatBRL(c.goal_amount)}` : undefined} />
        <Stat label="Compradores" value={String(stats.buyers)} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border p-5"><h2 className="font-bold text-primary">Pedidos</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Comprador</th><th className="p-3">Contato</th><th className="p-3">Qtd</th><th className="p-3">Valor</th><th className="p-3">Status</th><th className="p-3">Data</th><th className="p-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>}
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-secondary/30">
                  <td className="p-3 font-medium">{o.buyer?.name ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{o.buyer?.whatsapp}{o.buyer?.email ? ` · ${o.buyer.email}` : ""}</td>
                  <td className="p-3 tabular-nums">{o.quantity}</td>
                  <td className="p-3 font-bold text-primary">{formatBRL(o.amount)}</td>
                  <td className="p-3"><OrderStatus status={o.status} /></td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDateBR(o.created_at)}</td>
                  <td className="p-3 text-right">
                    {o.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => confirmPayment(o.id)} title="Confirmar pagamento">
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => cancelOrder(o.id)} title="Cancelar">
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black text-primary">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "Pendente",  cls: "bg-warning/15 text-warning-foreground" },
    paid:      { label: "Pago",      cls: "bg-success/15 text-success" },
    expired:   { label: "Expirado",  cls: "bg-muted text-muted-foreground" },
    cancelled: { label: "Cancelado", cls: "bg-destructive/15 text-destructive" },
    refunded:  { label: "Reembolsado", cls: "bg-muted text-muted-foreground" },
  };
  const it = map[status] ?? map.pending;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${it.cls}`}>{it.label}</span>;
}

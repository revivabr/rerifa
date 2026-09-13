import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, formatDateBR } from "@/lib/format";
import { StatusBadge } from "./admin.dashboard";
import { Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/campaigns/")({
  component: CampaignsList,
});

type Campaign = { id: string; name: string; slug: string; status: string; number_quantity: number; number_price: number; end_date: string };

function CampaignsList() {
  const [items, setItems] = useState<Campaign[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      setItems((data ?? []) as Campaign[]);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-primary">Campanhas</h1>
          <p className="text-sm text-muted-foreground">{items.length} campanha(s) cadastrada(s)</p>
        </div>
        <Link to="/admin/campaigns/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:scale-[1.02] transition">
          <Plus className="h-4 w-4" /> Nova
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Nome</th><th className="p-4">Status</th><th className="p-4">Números</th><th className="p-4">Preço</th><th className="p-4">Encerra</th><th className="p-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma campanha. Crie a primeira!</td></tr>}
            {items.map(c => (
              <tr key={c.id} className="transition hover:bg-secondary/30">
                <td className="p-4 font-semibold">
                  <Link to="/admin/campaigns/$id" params={{ id: c.id }} className="hover:text-primary hover:underline">{c.name}</Link>
                  <p className="text-xs font-normal text-muted-foreground">/{c.slug}</p>
                </td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
                <td className="p-4 tabular-nums">{c.number_quantity}</td>
                <td className="p-4 font-bold text-primary">{formatBRL(c.number_price)}</td>
                <td className="p-4">{formatDateBR(c.end_date)}</td>
                <td className="p-4 text-right">
                  <Link to="/campanha/$slug" params={{ slug: c.slug }} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Ver <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, ChevronRight, Calendar } from "lucide-react";
import { formatDateBR } from "@/lib/format";

export const Route = createFileRoute("/admin/draw/")({
  component: DrawCampaignList,
});

type Campaign = {
  id: string;
  name: string;
  slug: string;
  status: string;
  number_quantity: number;
  end_date: string;
  banner_url: string | null;
};

function DrawCampaignList() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id,name,slug,status,number_quantity,end_date,banner_url")
        .eq("status", "active")
        .order("end_date", { ascending: true });
      setItems((data ?? []) as Campaign[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gold to-gold-glow flex items-center justify-center shadow-premium">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-primary">Sorteador</h1>
          <p className="text-sm text-muted-foreground">Escolha a campanha para iniciar o sorteio</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Nenhuma campanha ativa no momento.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              to="/admin/draw/$id"
              params={{ id: c.id }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-premium transition hover:scale-[1.02] hover:border-gold"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-secondary">
                {c.banner_url ? (
                  <img src={c.banner_url} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <Trophy className="h-12 w-12 text-white/40" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-foreground line-clamp-1">{c.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Encerra {formatDateBR(c.end_date)}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-muted-foreground">{c.number_quantity} números</span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:text-gold">
                    Sortear <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

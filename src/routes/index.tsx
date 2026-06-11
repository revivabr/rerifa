import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatBRL, formatDateBR } from "@/lib/format";
import { Heart, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reviva Brasil — Rifa Solidária" },
      { name: "description", content: "Participe das rifas solidárias da Associação Reviva Brasil e apoie nossos projetos sociais." },
    ],
  }),
  component: HomePage,
});

type Campaign = {
  id: string; name: string; slug: string; description: string | null; banner_url: string | null;
  status: string; number_quantity: number; number_price: number;
  start_date: string; end_date: string; goal_amount: number | null;
};

function HomePage() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [soldByCampaign, setSoldByCampaign] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) { setCampaigns([]); return; }
    (async () => {
      const { data } = await supabase
        .from("campaigns").select("*")
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Campaign[];
      setCampaigns(list);
      const counts: Record<string, number> = {};
      await Promise.all(list.map(async (c) => {
        const { count } = await supabase.from("raffle_numbers").select("*", { count: "exact", head: true })
          .eq("campaign_id", c.id).eq("status", "sold");
        counts[c.id] = count ?? 0;
      }));
      setSoldByCampaign(counts);
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px, 60px 60px"
        }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <Heart className="h-3.5 w-3.5" /> Solidariedade que transforma
            </span>
            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              Sua rifa, <br/>nossa missão.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-primary-foreground/90">
              Participe das campanhas da <strong>Associação Reviva Brasil</strong> e ajude a restaurar vidas
              através dos nossos projetos sociais. Escolha seu número, pague com PIX e torça pelo prêmio.
            </p>
            <a href="#campanhas" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary-foreground px-6 py-3.5 text-sm font-bold text-primary shadow-elegant transition hover:scale-[1.02]">
              Ver campanhas ativas <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Campaigns */}
      <section id="campanhas" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-primary md:text-4xl">Campanhas ativas</h2>
            <p className="mt-2 text-muted-foreground">Escolha uma campanha e participe agora mesmo.</p>
          </div>
        </div>

        {campaigns === null && <SkeletonGrid />}
        {campaigns && campaigns.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card p-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-accent" />
            <p className="mt-4 text-lg font-semibold text-foreground">Nenhuma campanha ativa no momento</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSupabaseConfigured
                ? "Volte em breve — novas campanhas estão a caminho."
                : "Configure o Supabase e cadastre uma campanha pelo painel admin."}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns?.map((c) => {
            const sold = soldByCampaign[c.id] ?? 0;
            const pct = Math.round((sold / c.number_quantity) * 100);
            return (
              <Link key={c.id} to="/campanha/$slug" params={{ slug: c.slug }} className="group block">
                <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition group-hover:-translate-y-1 group-hover:shadow-card">
                  <div className="relative aspect-video w-full bg-gradient-sand">
                    {c.banner_url ? (
                      <img src={c.banner_url} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-accent-foreground/40">
                        <Heart className="h-16 w-16" />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-success px-3 py-1 text-xs font-bold uppercase tracking-wider text-success-foreground">
                      {c.status === "active" ? "Ativa" : "Pausada"}
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    <h3 className="text-xl font-bold text-foreground">{c.name}</h3>
                    {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="flex items-baseline justify-between pt-2">
                      <span className="text-2xl font-black text-primary">{formatBRL(c.number_price)}</span>
                      <span className="text-xs text-muted-foreground">por número</span>
                    </div>
                    <div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>{sold} de {c.number_quantity} vendidos</span>
                        <span className="font-semibold text-primary">{pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>Sorteio até {formatDateBR(c.end_date)}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:gap-2 transition-all">
                        Participar <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1,2,3].map(i => (
        <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-2 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============= Full file contents =============

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatBRL } from "@/lib/format";
import { Heart, Ticket, Sparkles, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Campaign = {
  id: string; name: string; slug: string; description: string | null; banner_url: string | null;
  status: string; number_quantity: number; number_price: number;
};

function HomePage() {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setActiveCampaign(data as Campaign);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-sand/10">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-24 text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold backdrop-blur">
            <Zap className="h-4 w-4 text-gold" />
            <span>Associação Reviva Brasil</span>
          </div>
          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Sorteio Solidário: <br/>
            <span className="text-gold">Transforme Vidas!</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            Sua participação é fundamental para continuarmos transformando realidades. Escolha seus números e boa sorte!
          </p>
          <div className="mt-10">
            {loading ? (
              <div className="h-14 w-48 animate-pulse rounded-full bg-white/20 mx-auto" />
            ) : activeCampaign ? (
              <Link 
                to="/campanha/$slug" 
                params={{ slug: activeCampaign.slug }} 
                className="inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 text-lg font-black text-primary transition hover:scale-105 hover:bg-white"
              >
                <Ticket className="h-5 w-5" />
                Participar Agora
              </Link>
            ) : (
              <div className="rounded-2xl bg-white/10 p-6 text-white/60">
                Nenhuma campanha ativa no momento.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto -mt-16 max-w-5xl px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Heart, label: "Apoio Social", desc: "100% da verba para projetos" },
            { icon: Users, label: "Transparência", desc: "Sorteio auditado e justo" },
            { icon: Sparkles, label: "Prêmios Incríveis", desc: "Participe e concorra" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 rounded-3xl bg-white p-6 shadow-xl">
              <div className="rounded-2xl bg-secondary p-3 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-primary">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-20 border-t border-border bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 text-center">
            <p className="text-sm text-muted-foreground mb-6">Projetos em andamento:</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
                {/* logos */}
            </div>
        </div>
      </footer>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatBRL } from "@/lib/format";
import { Heart, Ticket, Sparkles, Zap, Users, ArrowRight } from "lucide-react";
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
        .maybeSingle();
      setActiveCampaign(data as Campaign);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-sand/5">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-24 text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex animate-bounce items-center gap-2 rounded-full bg-gold px-4 py-1 text-sm font-black text-primary shadow-lg">
            <Zap className="h-4 w-4" />
            <span>PARTICIPE E GANHE!</span>
          </div>
          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Sua Chance de <br/>
            <span className="text-gold italic">Brilhar!</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            A Associação Reviva Brasil convida você a participar da nossa rifa solidária. 
            Prêmios incríveis enquanto você ajuda quem mais precisa.
          </p>
        </div>
      </section>

      {/* Campaign Feature */}
      <section className="mx-auto -mt-16 max-w-5xl px-4 pb-20">
        <div className="grid gap-8">
            {loading ? (
                <div className="h-[400px] w-full animate-pulse rounded-[2.5rem] bg-white shadow-xl" />
            ) : activeCampaign ? (
                <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all hover:shadow-primary/5">
                    <div className="flex flex-col md:flex-row">
                        <div className="relative aspect-video w-full md:w-1/2">
                            {activeCampaign.banner_url ? (
                                <img 
                                    src={activeCampaign.banner_url} 
                                    alt={activeCampaign.name} 
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-sand/20 text-accent">
                                    <Sparkles className="h-20 w-20" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4 rounded-full bg-success px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                                CAMPANHA ATIVA
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col justify-center p-8 md:p-12">
                            <h2 className="text-3xl font-black text-primary md:text-4xl">
                                {activeCampaign.name}
                            </h2>
                            <p className="mt-4 text-muted-foreground leading-relaxed">
                                {activeCampaign.description || "Participe da nossa rifa solidária e ajude a Associação Reviva Brasil a continuar seus projetos sociais."}
                            </p>
                            
                            <div className="mt-8 flex items-baseline gap-2">
                                <span className="text-4xl font-black text-primary">
                                    {formatBRL(activeCampaign.number_price)}
                                </span>
                                <span className="text-sm font-bold text-muted-foreground">por número</span>
                            </div>

                            <Link 
                                to="/campanha/$slug" 
                                params={{ slug: activeCampaign.slug }} 
                                className="group mt-10 inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-lg font-black text-white transition-all hover:scale-[1.02] hover:bg-primary-glow"
                            >
                                <Ticket className="h-6 w-6" />
                                ESCOLHER MEUS NÚMEROS
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-white p-20 text-center shadow-xl">
                    <Sparkles className="h-16 w-16 text-accent mb-6" />
                    <h2 className="text-2xl font-bold text-primary">Nenhuma campanha ativa</h2>
                    <p className="mt-2 text-muted-foreground">Novas oportunidades de ajudar e ganhar surgirão em breve!</p>
                </div>
            )}

            {/* Icons row */}
            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { icon: Heart, label: "Ação Social", desc: "Verba para projetos" },
                    { icon: Users, label: "Comunidade", desc: "Sorteios transparentes" },
                    { icon: Sparkles, label: "Prêmios", desc: "Muitas chances de ganhar" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-3xl bg-white/50 p-6 backdrop-blur-sm border border-white">
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
        </div>
      </section>
    </div>
  );
}

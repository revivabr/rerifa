import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatBRL } from "@/lib/format";
import { Ticket, Sparkles, Zap, ArrowRight, Trophy, Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Campaign = {
  id: string; name: string; slug: string; description: string | null; banner_url: string | null;
  status: string; number_quantity: number; number_price: number;
};

const USER_BANNER = "https://wogunbzijppmeuleitjq.supabase.co/storage/v1/object/public/temp-images/56681184-dd25-4b69-871a-4047c7b5c9cc.jpg";

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
    <div className="min-h-screen bg-sand">
      {/* Hero "Alegre" */}
      <section className="relative overflow-hidden bg-primary px-4 pt-16 pb-32 text-white md:pt-24 md:pb-40">
        <div className="absolute inset-0 bg-pattern-cubes opacity-10" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-success/20 blur-3xl animate-pulse" />
        
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex animate-bounce items-center gap-2 rounded-full bg-gradient-gold px-6 py-2 text-sm font-black text-primary shadow-gold">
            <Trophy className="h-4 w-4" />
            <span>SHOW DE PRÊMIOS REVIVA BRASIL</span>
          </div>
          
          <h1 className="text-5xl font-black leading-tight tracking-tight md:text-8xl">
            Sua Sorte <br/>
            <span className="text-gold italic drop-shadow-sm">Começa Aqui!</span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-xl font-medium text-white/90 md:text-2xl">
            Participe da nossa rifa solidária e concorra a prêmios incríveis enquanto transforma vidas com a Associação Reviva Brasil.
          </p>
        </div>
      </section>

      {/* Main Action Area */}
      <section className="relative mx-auto -mt-24 max-w-5xl px-4 pb-20">
        <div className="grid gap-8">
            {loading ? (
                <div className="h-[500px] w-full animate-pulse rounded-[3rem] bg-white shadow-2xl" />
            ) : activeCampaign ? (
                <div className="group relative overflow-hidden rounded-[3rem] bg-white shadow-2xl transition-all duration-500 hover:shadow-primary/20">
                    <div className="flex flex-col lg:flex-row">
                        {/* Banner Image / Arte do Usuário */}
                        <div className="relative aspect-[16/10] w-full lg:w-1/2">
                            <img 
                                src={activeCampaign.banner_url || USER_BANNER} 
                                alt={activeCampaign.name} 
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                            <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full bg-success px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                                <Sparkles className="h-4 w-4" />
                                CAMPANHA DO MOMENTO
                            </div>
                        </div>

                        {/* Campaign Details - "Cheerful & Action Oriented" */}
                        <div className="flex flex-1 flex-col justify-center bg-white p-8 md:p-12">
                            <div className="mb-4 flex items-center gap-2 text-gold">
                                <Star className="h-5 w-5 fill-current" />
                                <Star className="h-5 w-5 fill-current" />
                                <Star className="h-5 w-5 fill-current" />
                                <Star className="h-5 w-5 fill-current" />
                                <Star className="h-5 w-5 fill-current" />
                            </div>
                            
                            <h2 className="text-4xl font-black text-primary md:text-5xl lg:text-6xl">
                                {activeCampaign.name}
                            </h2>
                            
                            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                                {activeCampaign.description || "Não perca a chance de ganhar e ajudar! Cada número comprado é um passo a mais para nossos projetos sociais."}
                            </p>
                            
                            <div className="mt-10 flex flex-wrap items-center gap-6">
                                <div className="rounded-3xl bg-secondary px-8 py-4 text-center">
                                    <span className="block text-xs font-black uppercase tracking-widest text-primary/60">Apenas</span>
                                    <span className="text-4xl font-black text-primary">
                                        {formatBRL(activeCampaign.number_price)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-muted-foreground">Sorteio Garantido</span>
                                    <span className="text-sm font-black text-success flex items-center gap-1">
                                        <ShieldCheck className="h-4 w-4" /> 100% Transparente
                                    </span>
                                </div>
                            </div>

                            <Link 
                                to="/campanha/$slug" 
                                params={{ slug: activeCampaign.slug }} 
                                hash="escolher-numeros"
                                className="group mt-10 inline-flex items-center justify-center gap-4 rounded-2xl bg-gradient-gold px-10 py-6 text-xl font-black text-primary shadow-gold transition-all hover:scale-[1.03] hover:shadow-gold-glow active:scale-95"
                            >
                                <Ticket className="h-7 w-7" />
                                QUERO MEUS NÚMEROS AGORA!
                                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center overflow-hidden rounded-[3rem] bg-white p-12 text-center shadow-2xl md:p-24">
                    <div className="mb-8 rounded-full bg-secondary p-8 text-primary animate-float">
                        <Sparkles className="h-20 w-20" />
                    </div>
                    <h2 className="text-3xl font-black text-primary md:text-4xl">Estamos preparando <br/>o próximo show!</h2>
                    <p className="mt-4 max-w-md text-lg text-muted-foreground">
                        Em breve teremos novas campanhas com prêmios imperdíveis. Fique de olho!
                    </p>
                </div>
            )}

            {/* Features Row - Visualmente mais "alegre" */}
            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { icon: Zap, label: "Rápido & Fácil", desc: "Escolha e pague via PIX", color: "bg-gold/10 text-gold" },
                    { icon: Trophy, label: "Prêmios Reais", desc: "Sorteios auditados", color: "bg-success/10 text-success" },
                    { icon: Sparkles, label: "Faça o Bem", desc: "Toda verba vai para projetos", color: "bg-primary/10 text-primary" },
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-4 rounded-[2rem] bg-white/80 p-8 text-center shadow-soft backdrop-blur-sm transition-transform hover:-translate-y-1">
                        <div className={cn("rounded-2xl p-4", item.color)}>
                            <item.icon className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-primary">{item.label}</h3>
                            <p className="mt-1 font-medium text-muted-foreground">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
}

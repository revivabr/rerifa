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

const USER_BANNER = "/placeholder.svg";

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
    <div className="min-h-screen bg-sand selection:bg-primary/5">
      {/* Premium Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 pt-24 pb-32">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/50 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Show de Prêmios Reviva Brasil</span>
          </div>
          
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-primary md:text-8xl">
            Onde a Sorte <br/>
            <span className="bg-gradient-premium bg-clip-text text-transparent italic opacity-90">Encontra a Solidariedade</span>
          </h1>
          
          <p className="mx-auto mt-10 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
            Participe das nossas rifas exclusivas e concorra a prêmios extraordinários enquanto apoia os projetos sociais da Associação Reviva Brasil.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a 
              href="#campanhas"
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-bold tracking-wide text-white transition-all duration-500 hover:bg-primary/90 hover:shadow-premium active:scale-95"
            >
              Ver Campanhas Ativas
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* Campaign Highlight */}
      <section id="campanhas" className="relative mx-auto -mt-20 max-w-7xl px-6 pb-32">
        <div className="grid gap-12">
            {loading ? (
                <div className="h-[600px] w-full animate-pulse rounded-3xl bg-white shadow-premium" />
            ) : activeCampaign ? (
                <div className="group relative overflow-hidden rounded-3xl bg-white shadow-premium transition-all duration-700 hover:shadow-2xl">
                    <div className="flex flex-col lg:flex-row">
                        {/* High-end Product Visual */}
                        <div className="relative aspect-[4/3] w-full lg:w-[55%]">
                            <div className="absolute inset-0 bg-black/5" />
                            <img 
                                src={activeCampaign.banner_url || USER_BANNER} 
                                alt={activeCampaign.name} 
                                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
                            />
                            <div className="absolute top-8 left-8">
                                <div className="flex items-center gap-2 rounded-full glass-morphism px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary shadow-glass">
                                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                    Campanha Ativa
                                </div>
                            </div>
                        </div>

                        {/* Sophisticated Content */}
                        <div className="flex flex-1 flex-col justify-between p-10 lg:p-16">
                            <div>
                                <div className="mb-6 flex items-center gap-1 text-gold">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-current opacity-80" />
                                    ))}
                                </div>
                                
                                <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">
                                    {activeCampaign.name}
                                </h2>
                                
                                <p className="mt-8 text-lg leading-relaxed text-muted-foreground/80">
                                    {activeCampaign.description || "Uma oportunidade única de transformar vidas enquanto busca seus sonhos. Participe e faça parte desta corrente do bem."}
                                </p>
                            </div>
                            
                            <div className="mt-12 space-y-10">
                                <div className="flex items-end gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Valor do Bilhete</span>
                                        <span className="mt-1 text-4xl font-extrabold tracking-tight text-primary">
                                            {formatBRL(activeCampaign.number_price)}
                                        </span>
                                    </div>
                                    <div className="mb-1 flex h-12 w-[1px] bg-black/[0.05]" />
                                    <div className="mb-1 flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Status</span>
                                        <span className="mt-1 text-xs font-bold text-success flex items-center gap-1.5">
                                            <ShieldCheck className="h-4 w-4" /> Verificado
                                        </span>
                                    </div>
                                </div>

                                <Link 
                                    to="/campanha/$slug" 
                                    params={{ slug: activeCampaign.slug }} 
                                    hash="escolher-numeros"
                                    className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl bg-primary py-6 text-sm font-bold tracking-widest text-white transition-all duration-500 hover:bg-primary/95 hover:shadow-lg active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                                    <Ticket className="h-5 w-5 opacity-80" />
                                    PARTICIPAR AGORA
                                    <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-20 text-center shadow-premium">
                    <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary">
                        <Sparkles className="h-10 w-10 opacity-40" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary">Próximas Campanhas em Breve</h2>
                    <p className="mt-4 max-w-md text-muted-foreground">
                        Estamos curando prêmios exclusivos para você. Siga-nos para ser o primeiro a saber.
                    </p>
                </div>
            )}

            {/* Features Row - Minimalist & Balanced */}
            <div className="grid gap-8 md:grid-cols-3">
                {[
                    { icon: Zap, label: "Processo Instantâneo", desc: "Pagamento via PIX com baixa automática e segura." },
                    { icon: Trophy, label: "Transparência Total", desc: "Sorteios realizados com base na Loteria Federal." },
                    { icon: Sparkles, label: "Impacto Social", desc: "Contribua diretamente para os projetos da Reviva Brasil." },
                ].map((item, i) => (
                    <div key={i} className="group flex flex-col items-start gap-6 rounded-3xl bg-white/40 p-10 transition-all duration-500 hover:bg-white hover:shadow-premium">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-white">
                            <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary">{item.label}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
}

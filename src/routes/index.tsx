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
    <div className="min-h-screen bg-sand selection:bg-primary/10">
      {/* Cinematic Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gold/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative mx-auto max-w-6xl text-center stagger-in">
          <div className="mb-12 inline-flex items-center gap-3 rounded-full border border-primary/5 bg-white/40 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70 backdrop-blur-md shadow-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            <span>Show de Prêmios Reviva Brasil</span>
          </div>
          
          <h1 className="text-6xl font-extrabold tracking-tight text-primary md:text-9xl lg:leading-[0.95]">
            Sua Sorte <br/>
            <span className="font-light italic text-primary/40">Transforma</span> Vidas
          </h1>
          
          <p className="mx-auto mt-12 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground/80 md:text-xl md:px-12">
            Experiência exclusiva de rifas solidárias. Concilie a busca pelos seus sonhos com o apoio direto a causas extraordinárias.
          </p>

          <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <a 
              href="#campanhas"
              className="group relative inline-flex items-center gap-4 rounded-full bg-primary px-10 py-5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-700 hover:bg-primary/90 hover:scale-[1.02] hover:shadow-premium active:scale-95"
            >
              Explorar Campanhas
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1.5" />
            </a>
            <button className="text-xs font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-colors py-5 px-10">
              Como Funciona
            </button>
          </div>
        </div>
      </section>

      {/* Bento Grid Featured Campaign */}
      <section id="campanhas" className="relative mx-auto max-w-7xl px-6 pb-40">
        <div className="stagger-in">
            {loading ? (
                <div className="h-[650px] w-full animate-pulse rounded-[2.5rem] bg-white shadow-premium" />
            ) : activeCampaign ? (
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-white shadow-premium transition-all duration-1000 hover:shadow-2xl">
                    <div className="flex flex-col lg:flex-row">
                        {/* Imagem de Alta Definição */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden lg:w-[60%]">
                            <div className="absolute inset-0 z-10 bg-gradient-to-r from-white/10 to-transparent lg:from-white/20" />
                            <img 
                                src={activeCampaign.banner_url || USER_BANNER} 
                                alt={activeCampaign.name} 
                                className="h-full w-full object-cover transition-transform duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110"
                            />
                            <div className="absolute top-10 left-10 z-20">
                                <div className="flex items-center gap-3 rounded-full glass-morphism px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-glass">
                                    <Sparkles className="h-3 w-3" />
                                    Destaque do Mês
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo Editorial */}
                        <div className="flex flex-1 flex-col justify-between p-12 lg:p-20">
                            <div>
                                <div className="mb-8 flex gap-1 text-gold/40">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-current" />
                                    ))}
                                </div>
                                
                                <h2 className="text-5xl font-bold leading-tight text-primary md:text-6xl tracking-tighter">
                                    {activeCampaign.name}
                                </h2>
                                
                                <p className="mt-10 text-lg leading-relaxed text-muted-foreground font-medium">
                                    {activeCampaign.description || "Uma curadoria exclusiva de prêmios onde cada participação é um investimento no futuro social do Brasil."}
                                </p>
                            </div>
                            
                            <div className="mt-16 space-y-12">
                                <div className="grid grid-cols-2 gap-12 border-t border-black/[0.03] pt-12">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Investimento</span>
                                        <div className="text-3xl font-bold tracking-tight text-primary">
                                            {formatBRL(activeCampaign.number_price)}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Autenticidade</span>
                                        <div className="flex items-center gap-2 text-xs font-bold text-success">
                                            <ShieldCheck className="h-4 w-4" /> 100% Verificado
                                        </div>
                                    </div>
                                </div>

                                <Link 
                                    to="/campanha/$slug" 
                                    params={{ slug: activeCampaign.slug }} 
                                    hash="escolher-numeros"
                                    className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl bg-primary py-7 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-700 hover:shadow-2xl active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                    <Ticket className="h-4 w-4 opacity-50" />
                                    Garantir Participação
                                    <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-white p-24 text-center shadow-premium">
                    <div className="mb-12 flex h-24 w-24 items-center justify-center rounded-full bg-primary/[0.02] text-primary/20">
                        <Sparkles className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Novos Lançamentos em Breve</h2>
                    <p className="mt-6 max-w-sm text-muted-foreground font-medium leading-relaxed">
                        Estamos preparando uma nova coleção de prêmios exclusivos. Ative as notificações para ser o primeiro a saber.
                    </p>
                </div>
            )}
        </div>

        {/* Triple Feature Section */}
        <div className="mt-32 grid gap-12 md:grid-cols-3 stagger-in">
            {[
                { icon: Zap, label: "Velocidade Digital", desc: "Processamento via PIX com liquidação em tempo real." },
                { icon: Trophy, label: "Ética no Sorteio", desc: "Resultados baseados na Loteria Federal brasileira." },
                { icon: Sparkles, label: "Legado Social", desc: "Toda arrecadação líquida é reinvestida em projetos sociais." },
            ].map((item, i) => (
                <div key={i} className="group flex flex-col items-start gap-8 rounded-[2rem] bg-white/30 p-12 transition-all duration-700 hover:bg-white hover:shadow-premium border border-transparent hover:border-black/[0.02]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.03] text-primary transition-all duration-700 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                        <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-primary tracking-tight">{item.label}</h3>
                        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground/70 font-medium">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}


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
      
      if (data) {
        let campaignData = data as Campaign;
        // Handle banner_url with signed URL as fallback
        if (campaignData.banner_url && campaignData.banner_url.includes('/storage/v1/object/public/')) {
          const path = campaignData.banner_url.split('/public/')[1].split('/').slice(1).join('/');
          const bucket = campaignData.banner_url.split('/public/')[1].split('/')[0];
          const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
          if (signedData) {
            campaignData = { ...campaignData, banner_url: signedData.signedUrl };
          }
        }
        setActiveCampaign(campaignData);
      }
      
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-primary/10">
      {/* Cinematic Hero - Texture & Gradient */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 pt-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
        
        <div className="relative mx-auto max-w-6xl text-center stagger-in">
          <div className="mb-12 inline-flex items-center gap-3 rounded-full border border-primary/10 bg-white/60 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-primary backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Show de Prêmios Reviva Brasil</span>
          </div>
          
          <h1 className="text-7xl font-extrabold tracking-tighter text-primary md:text-[120px] lg:leading-[0.9]">
            Sua Sorte <br/>
            <span className="font-light italic text-primary/30">Transforma</span> Vidas
          </h1>
          
          <p className="mx-auto mt-12 max-w-2xl text-lg font-medium leading-relaxed text-slate-600 md:text-xl">
            Sua jornada solidária começa aqui. Participe de nossas rifas exclusivas e ajude projetos sociais que mudam realidades.
          </p>

          <div className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <a 
              href="#campanhas"
              className="group relative inline-flex items-center gap-4 rounded-full bg-primary px-12 py-6 text-xs font-bold uppercase tracking-widest text-white transition-all duration-500 hover:bg-primary/90 hover:scale-[1.02] hover:shadow-2xl active:scale-95"
            >
              Ver Campanhas Ativas
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Featured Campaign - Different Background Section */}
      <section id="campanhas" className="relative mx-auto max-w-7xl px-6 py-24 bg-stone-50 rounded-[3rem] my-12 border border-black/[0.03]">
        <div className="stagger-in">
            {loading ? (
                <div className="h-[600px] w-full animate-pulse rounded-[2.5rem] bg-white shadow-xl" />
            ) : activeCampaign ? (
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
                    <div className="flex flex-col lg:flex-row">
                        <div className="relative aspect-[16/10] w-full lg:w-[55%]">
                            <img 
                                src={activeCampaign.banner_url || USER_BANNER} 
                                alt={activeCampaign.name} 
                                className="h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                            />
                        </div>
                        <div className="flex flex-1 flex-col justify-center p-16">
                            <h2 className="text-5xl font-bold text-primary tracking-tighter">{activeCampaign.name}</h2>
                            <p className="mt-8 text-slate-600 font-medium leading-relaxed">{activeCampaign.description}</p>
                            
                            <div className="mt-12 flex gap-8">
                                <div className="p-6 bg-stone-100 rounded-2xl w-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Valor da Cota</span>
                                    <p className="text-2xl font-black text-primary mt-1">{formatBRL(activeCampaign.number_price)}</p>
                                </div>
                            </div>

                            <Link 
                                to="/campanha/$slug" 
                                params={{ slug: activeCampaign.slug }} 
                                className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-gold py-6 text-xs font-bold uppercase tracking-widest text-white hover:bg-gold-glow transition-all hover:shadow-lg active:scale-[0.98]"
                            >
                                <Ticket className="h-4 w-4" />
                                Participar Agora
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-white p-24 text-center shadow-premium">
                    <div className="mb-12 flex h-24 w-24 items-center justify-center rounded-full bg-primary/[0.02] text-primary/20">
                        <Sparkles className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary tracking-tight">Novos Lançamentos em Breve</h2>
                </div>
            )}
        </div>
      </section>

      {/* Features Grid - Clean white section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
             {[
                { icon: Zap, label: "Rapidez", desc: "Processamento via PIX instantâneo." },
                { icon: Trophy, label: "Transparência", desc: "Sorteios auditáveis e seguros." },
                { icon: Sparkles, label: "Legado", desc: "Recursos 100% voltados a projetos." },
            ].map((item, i) => (
                <div key={i} className="p-10 rounded-[2rem] bg-gradient-to-br from-white to-stone-50 border border-black/[0.05] hover:border-primary/20 transition-all duration-500 hover:shadow-lg">
                    <item.icon className="h-8 w-8 text-primary mb-6" />
                    <h3 className="text-xl font-bold text-primary mb-3">{item.label}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}


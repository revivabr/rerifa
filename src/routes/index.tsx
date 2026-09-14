import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatBRL } from "@/lib/format";
import { Ticket, Sparkles, Zap, ArrowRight, Trophy, ShieldCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import bannerRifa from "@/assets/banner-rifa-solidaria.jpeg.asset.json";
import type { PromotionTier } from "@/lib/promotions";
import { ShareButtons } from "@/components/ShareButtons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rifa Solidária | Associação Reviva Brasil" },
      { name: "description", content: "Participe das campanhas solidárias da Associação Reviva Brasil e ajude a transformar vidas." },
      { property: "og:title", content: "Rifa Solidária | Associação Reviva Brasil" },
      { property: "og:description", content: "Participe das campanhas solidárias da Associação Reviva Brasil e ajude a transformar vidas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type Campaign = {
  id: string; name: string; slug: string; description: string | null; banner_url: string | null;
  status: string; number_quantity: number; number_price: number; end_date: string;
};

const USER_BANNER = "/placeholder.svg";

function HomePage() {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [promotions, setPromotions] = useState<PromotionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id,name,slug,description,banner_url,status,number_quantity,number_price,end_date,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        let campaignData = data as Campaign;
        if (campaignData.banner_url && campaignData.banner_url.includes('/storage/v1/object/public/')) {
          const path = campaignData.banner_url.split('/public/')[1].split('/').slice(1).join('/');
          const bucket = campaignData.banner_url.split('/public/')[1].split('/')[0];
          const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
          if (signedData) {
            campaignData = { ...campaignData, banner_url: signedData.signedUrl };
          }
        }
        setActiveCampaign(campaignData);

        const { data: promotionRows } = await supabase
          .from("campaign_promotions")
          .select("id,quantity,promotional_price,active")
          .eq("campaign_id", campaignData.id)
          .eq("active", true)
          .order("quantity");
        setPromotions((promotionRows ?? []).map((p) => ({ ...p, promotional_price: Number(p.promotional_price) })));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5efe1] via-white to-[#faf7f0]">
      {/* Banner Rifa Solidária */}
      <section className="px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
          <img
            src={bannerRifa.url}
            alt="Rifa Solidária - Associação Reviva Brasil"
            className="block h-auto w-full"
          />
        </div>
      </section>

      {/* Hero Section with Dynamic Background */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:min-h-[85vh] lg:pt-20 bg-gradient-to-br from-[#faf7f0] via-white to-[#eef3ec]">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-20" />
        
        <div className="relative mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          <div className="stagger-in space-y-8 text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/10">
              <Sparkles className="h-3 w-3" />
              Institucional e Filantrópico
            </div>
            
            <h1 className="text-4xl font-black text-primary sm:text-5xl md:text-7xl lg:text-8xl leading-[0.95]">
              Sorte é poder <br/>
              <span className="bg-gradient-to-r from-primary via-primary/80 to-gold bg-clip-text text-transparent italic font-serif inline-block pr-2">Transformar</span>&nbsp;Vidas.
            </h1>
            
            <p className="max-w-xl text-lg font-medium text-slate-600/90 leading-relaxed">
              Participe de nossas ações entre amigos e ajude a financiar projetos sociais que mudam a realidade de centenas de pessoas.{" "}
              <a href="https://revivabrasil.com.br" target="_blank" rel="noopener noreferrer" className="underline decoration-primary/30 hover:decoration-primary text-primary hover:text-primary/80 transition-colors">
                Para nos conhecer melhor acesse: revivabrasil.com.br
              </a>
            </p>

            <div className="flex flex-col gap-5 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              <a 
                href="#campanhas"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 active:scale-95 sm:px-8 sm:py-5"
              >
                Explorar Campanhas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <div className="flex -space-x-3 items-center sm:ml-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="h-full w-full object-cover" />
                    </div>
                ))}
                <span className="ml-6 text-xs font-bold text-slate-400">+5k participando</span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block stagger-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative z-10 animate-float">
                <div className="overflow-hidden rounded-[2.5rem] bg-white p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-black/[0.03]">
                    <img 
                        src="https://storage.googleapis.com/gpt-engineer-file-uploads/IcY9jDHnjbOIMxxCXj63oYoUfo13/social-images/social-1781186933088-banner1.webp" 
                        alt="Reviva Banner" 
                        className="rounded-[2rem] h-[500px] w-full object-cover"
                    />
                </div>
                {/* Floating Elements */}
                <div className="absolute -right-8 -top-8 bg-gold p-6 rounded-3xl shadow-xl animate-float" style={{ animationDelay: '-1s' }}>
                    <Ticket className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -left-12 bottom-12 bg-white p-6 rounded-3xl shadow-xl border border-black/[0.03] animate-float" style={{ animationDelay: '-2s' }}>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ganhador</p>
                            <p className="text-sm font-bold text-primary">Joaquim Silva</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Section - Textured Background */}
       <section id="campanhas" className="relative overflow-hidden bg-gradient-to-b from-[#eef3ec] via-[#f5efe1] to-white py-14 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="mb-10 text-center sm:mb-16">
                 <h2 className="text-3xl font-black text-primary sm:text-4xl">Campanhas em Destaque</h2>
                <div className="mt-4 h-1.5 w-24 bg-gold mx-auto rounded-full" />
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="h-[400px] animate-pulse rounded-3xl bg-white shadow-sm" />
                    <div className="h-[400px] animate-pulse rounded-3xl bg-white shadow-sm" />
                </div>
            ) : activeCampaign ? (
                 <div className="group relative mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-700 hover:shadow-primary/5 sm:rounded-[2.5rem]">
                    <div className="flex flex-col">
                         <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                            <img 
                                 src={activeCampaign.banner_url ? `/api/public/campaign-image/${encodeURIComponent(activeCampaign.slug)}` : USER_BANNER} 
                                alt={activeCampaign.name} 
                                 className="h-full w-full object-contain"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                        </div>
                         <div className="flex flex-col items-center p-5 text-center sm:p-8 lg:p-12">
                            <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
                                <Trophy className="h-4 w-4" />
                                Prêmio Principal
                            </div>
                             <h2 className="text-2xl font-black leading-tight text-primary sm:text-4xl">{activeCampaign.name}</h2>
                             <p className="mt-4 max-w-3xl whitespace-pre-line font-medium leading-relaxed text-slate-600">{activeCampaign.description}</p>

                             {promotions.length > 0 && (
                                 <div className="mt-6 w-full" aria-label="Promoções da campanha">
                                     <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Ofertas por quantidade</p>
                                     <div className="flex flex-wrap justify-center gap-2">
                                         {promotions.map((promotion) => {
                                             const regularTotal = Number(activeCampaign.number_price) * promotion.quantity;
                                             const savings = regularTotal - Number(promotion.promotional_price);
                                             return (
                                                 <div key={promotion.id ?? promotion.quantity} className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-primary">
                                                     <p className="text-sm font-black">{promotion.quantity} números por {formatBRL(promotion.promotional_price)}</p>
                                                     {savings > 0 && <p className="mt-0.5 text-[10px] font-bold text-success">Economize {formatBRL(savings)}</p>}
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             )}
                            
                             <div className="mt-8 flex w-full max-w-3xl flex-col items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
                                 <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Valor da Cota</span>
                                        <p className="text-3xl font-black text-primary mt-1">{formatBRL(activeCampaign.number_price)}</p>
                                    </div>
                                    <div className="animated-border-gold">
                                        <Link 
                                            to="/campanha/$slug" 
                                            params={{ slug: activeCampaign.slug }} 
                                             className="slow-pulse flex min-h-12 items-center justify-center gap-2 rounded-[0.85rem] bg-gradient-to-br from-gold to-gold-glow px-8 py-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-gold/20 transition-all hover:brightness-110 active:scale-95"
                                        >
                                            Participar
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                                
                                 <div className="flex w-full flex-col items-center justify-center gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compartilhe:</span>
                                    <ShareButtons
                                        campaignName={activeCampaign.name}
                                        slug={activeCampaign.slug}
                                        price={Number(activeCampaign.number_price)}
                                        endDate={activeCampaign.end_date}
                                        shortDescription={activeCampaign.description}
                                        promotions={promotions}
                                        bannerUrl={activeCampaign.banner_url}
                                        size="compact"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-[2.5rem] bg-white p-20 text-center shadow-xl border border-black/[0.02]">
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                        <Heart className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary">Nenhuma campanha ativa no momento.</h2>
                    <p className="mt-2 text-slate-500 font-medium">Fique atento para nossos próximos lançamentos!</p>
                </div>
            )}
        </div>
      </section>

      {/* Features - White Background with Cards */}
       <section className="bg-gradient-to-b from-white via-[#faf7f0] to-[#f5efe1] py-14 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: Zap, label: "Rapidez", desc: "Pagamento e liberação automática via PIX. Sem burocracia.", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: ShieldCheck, label: "Segurança", desc: "Resultados baseados na Loteria Federal brasileira.", color: "text-green-500", bg: "bg-green-50" },
                    { icon: Trophy, label: "Transparência", desc: "Auditoria completa e destinação social garantida.", color: "text-gold", bg: "bg-amber-50" },
                ].map((item, i) => (
                     <div key={i} className="group rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-500 hover:border-primary/10 hover:shadow-2xl hover:shadow-primary/5 sm:p-8 lg:rounded-[2.5rem] lg:p-10">
                        <div className={cn("mb-8 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", item.bg)}>
                            <item.icon className={cn("h-8 w-8", item.color)} />
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-4">{item.label}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
}

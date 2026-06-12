import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatBRL } from "@/lib/format";
import { Ticket, Sparkles, Zap, ArrowRight, Trophy, ShieldCheck, Heart, Share2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import bannerRifa from "@/assets/banner-rifa-solidaria.jpeg.asset.json";

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
  const [copied, setCopied] = useState(false);

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
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-6 pb-12 pt-20 bg-gradient-to-br from-[#faf7f0] via-white to-[#eef3ec]">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-20" />
        
        <div className="relative mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          <div className="stagger-in space-y-8 text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/10">
              <Sparkles className="h-3 w-3" />
              Institucional e Filantrópico
            </div>
            
            <h1 className="text-5xl font-black tracking-tight text-primary md:text-7xl lg:text-8xl leading-[0.9]">
              Sorte é poder <br/>
              <span className="bg-gradient-to-r from-primary via-primary/80 to-gold bg-clip-text text-transparent italic font-serif inline-block pr-2">Transformar</span>&nbsp;Vidas.
            </h1>
            
            <p className="max-w-xl text-lg font-medium text-slate-600/90 leading-relaxed">
              Participe de nossas ações entre amigos e ajude a financiar projetos sociais que mudam a realidade de centenas de pessoas.{" "}
              <a href="https://revivabrasil.com.br" target="_blank" rel="noopener noreferrer" className="underline decoration-primary/30 hover:decoration-primary text-primary hover:text-primary/80 transition-colors">
                Para nos conhecer melhor acesse: revivabrasil.com.br
              </a>
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a 
                href="#campanhas"
                className="group inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-5 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 active:scale-95"
              >
                Explorar Campanhas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <div className="flex -space-x-3 items-center ml-4">
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
      <section id="campanhas" className="py-24 bg-gradient-to-b from-[#eef3ec] via-[#f5efe1] to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-16 text-center">
                <h2 className="text-4xl font-black text-primary tracking-tight">Campanhas em Destaque</h2>
                <div className="mt-4 h-1.5 w-24 bg-gold mx-auto rounded-full" />
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="h-[400px] animate-pulse rounded-3xl bg-white shadow-sm" />
                    <div className="h-[400px] animate-pulse rounded-3xl bg-white shadow-sm" />
                </div>
            ) : activeCampaign ? (
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all duration-700 hover:shadow-primary/5">
                    <div className="flex flex-col lg:flex-row">
                        <div className="relative aspect-[16/10] w-full lg:w-1/2 overflow-hidden">
                            <img 
                                src={activeCampaign.banner_url || USER_BANNER} 
                                alt={activeCampaign.name} 
                                className="h-full w-full object-cover transition-transform duration-[3s] group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                        </div>
                        <div className="flex flex-1 flex-col justify-center p-8 lg:p-12">
                            <div className="inline-flex mb-4 text-gold font-bold text-xs uppercase tracking-widest gap-2 items-center">
                                <Trophy className="h-4 w-4" />
                                Prêmio Principal
                            </div>
                            <h2 className="text-4xl font-black text-primary tracking-tight leading-tight">{activeCampaign.name}</h2>
                            <p className="mt-4 text-slate-600 font-medium leading-relaxed line-clamp-4">{activeCampaign.description}</p>
                            
                            <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Valor da Cota</span>
                                        <p className="text-3xl font-black text-primary mt-1">{formatBRL(activeCampaign.number_price)}</p>
                                    </div>
                                    <div className="animated-border-gold">
                                        <Link 
                                            to="/campanha/$slug" 
                                            params={{ slug: activeCampaign.slug }} 
                                            className="slow-pulse flex items-center gap-2 rounded-[0.85rem] bg-gradient-to-br from-gold to-gold-glow px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-gold/20 transition-all hover:brightness-110 active:scale-95"
                                        >
                                            Participar
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compartilhe:</span>
                                    <CompactShareButtons campaign={activeCampaign} copied={copied} setCopied={setCopied} />
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
      <section className="py-24 bg-gradient-to-b from-white via-[#faf7f0] to-[#f5efe1]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: Zap, label: "Rapidez", desc: "Pagamento e liberação automática via PIX. Sem burocracia.", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: ShieldCheck, label: "Segurança", desc: "Resultados baseados na Loteria Federal brasileira.", color: "text-green-500", bg: "bg-green-50" },
                    { icon: Trophy, label: "Transparência", desc: "Auditoria completa e destinação social garantida.", color: "text-gold", bg: "bg-amber-50" },
                ].map((item, i) => (
                    <div key={i} className="group p-10 rounded-[2.5rem] border border-slate-100 bg-white transition-all duration-500 hover:border-primary/10 hover:shadow-2xl hover:shadow-primary/5">
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

function CompactShareButtons({ campaign, copied, setCopied }: { campaign: Campaign; copied: boolean; setCopied: (v: boolean) => void }) {
  const url = `https://rifa.revivabrasil.com.br/campanha/${campaign.slug}`;
  const message = `🎟️ Rifa Solidária - ${campaign.name}\n💰 Cota: ${formatBRL(campaign.number_price)}\n\nGaranta seus números:\n${url}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-transform hover:scale-110"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M19.05 4.91A10 10 0 0 0 4.1 18.36L3 22l3.74-1.08a10 10 0 0 0 4.78 1.22h.01a10 10 0 0 0 7.52-17.23ZM11.54 20.3h-.01a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-2.22.64.66-2.17-.2-.31a8.3 8.3 0 1 1 6.3 3.18Zm4.55-6.22c-.25-.13-1.47-.73-1.7-.81-.23-.08-.4-.13-.56.13-.16.25-.64.81-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.24a7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48a.92.92 0 0 0-.67.31 2.8 2.8 0 0 0-.88 2.08c0 1.22.9 2.4 1.02 2.57.13.16 1.77 2.7 4.28 3.78.6.26 1.06.42 1.43.54.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.11-.23-.18-.48-.31Z"/></svg>
      </a>
      <button
        type="button"
        onClick={copyToClipboard}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-white shadow-md transition-transform hover:scale-110"
        aria-label="Copiar link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

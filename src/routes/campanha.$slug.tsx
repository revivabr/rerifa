import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, padNumber, formatCalendarDateBR } from "@/lib/format";
import { ShieldCheck, FileText, Calendar, Gift, Info, Sparkles, ArrowRight, Ticket, Star, X } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { BuyerModal } from "@/components/BuyerModal";
import { SellerRanking } from "@/components/SellerRanking";
import { ShareCampaign } from "@/components/ShareCampaign";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calculateCampaignPrice, type PromotionTier } from "@/lib/promotions";
import { getCampaignNumberAvailability } from "@/lib/api/order.functions";
import { buildCampaignShareMessage } from "@/lib/share";


type CampaignMeta = {
  name: string;
  shortDescription: string | null;
  bannerUrl: string | null;
  price: number;
  endDate: string;
  promotions: { quantity: number; promotional_price: number }[];
};

function bannerVersion(bannerUrl: string): string {
  let hash = 2166136261;
  for (let index = 0; index < bannerUrl.length; index += 1) {
    hash ^= bannerUrl.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export const Route = createFileRoute("/campanha/$slug")({
  loader: async ({ params }): Promise<CampaignMeta | null> => {
    const { data: c } = await supabase
      .from("campaigns")
      .select("id,name,slug,short_description,banner_url,number_price,end_date")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!c) return null;

    const bannerUrl = c.banner_url as string | null;

    const { data: promotionRows } = await supabase
      .from("campaign_promotions")
      .select("quantity,promotional_price")
      .eq("campaign_id", c.id)
      .eq("active", true)
      .order("quantity");

    return {
      name: c.name,
      shortDescription: c.short_description,
      bannerUrl,
      price: Number(c.number_price),
      endDate: c.end_date,
      promotions: (promotionRows ?? []).map((p) => ({ quantity: p.quantity, promotional_price: Number(p.promotional_price) })),
    };
  },
  head: ({ params, loaderData }) => {
    const fallbackTitle = "Rifa Solidária | Associação Reviva Brasil";
    const fallbackDescription = "Escolha seus números, participe da Rifa Solidária e ajude a transformar vidas.";

    if (!loaderData) {
      return { meta: [
        { title: fallbackTitle },
        { name: "description", content: fallbackDescription },
        { property: "og:title", content: fallbackTitle },
        { property: "og:description", content: fallbackDescription },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ] };
    }

    const title = `${loaderData.name} | Rifa Solidária Reviva Brasil`;
    const description = buildCampaignShareMessage({
      campaignName: loaderData.name,
      slug: params.slug,
      price: loaderData.price,
      endDate: loaderData.endDate,
      shortDescription: loaderData.shortDescription,
      promotions: loaderData.promotions,
    });
    const campaignUrl = `https://rifa.revivabrasil.com.br/campanha/${encodeURIComponent(params.slug)}`;
    const campaignImageUrl = loaderData.bannerUrl
      ? `https://rifa.revivabrasil.com.br/api/public/campaign-image/${encodeURIComponent(params.slug)}?v=${bannerVersion(loaderData.bannerUrl)}`
      : null;

    const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: campaignUrl },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ];

    if (campaignImageUrl) {
      meta.push({ property: "og:image", content: campaignImageUrl });
      meta.push({ property: "og:image:secure_url", content: campaignImageUrl });
      meta.push({ property: "og:image:width", content: "1200" });
      meta.push({ property: "og:image:height", content: "675" });
      meta.push({ property: "og:image:alt", content: `Banner oficial da campanha ${loaderData.name}` });
      meta.push({ name: "twitter:image", content: campaignImageUrl });
    }

    return {
      meta,
      links: [{ rel: "canonical", href: campaignUrl }],
    };
  },
  component: CampaignPage,
});

type Campaign = {
  id: string; name: string; slug: string; description: string | null; short_description: string | null; banner_url: string | null;
  prize_description: string | null; prize_image_1: string | null; prize_image_2: string | null;
  status: string; number_quantity: number; number_price: number;
  start_date: string; end_date: string; goal_amount: number | null;
  regulation_url: string | null;
  regulation_text: string | null;
};
type RaffleNumber = { number: number; status: "available" | "reserved" | "sold" | "cancelled" | "winner"; reserved_until?: string };
type Prize = { id: string; title: string; description: string | null; image_url: string | null; position: number };

function CampaignPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const getCampaignNumberAvailabilityFn = useServerFn(getCampaignNumberAvailability);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [promotions, setPromotions] = useState<PromotionTier[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from("campaigns")
        .select("id,name,slug,description,short_description,banner_url,prize_description,prize_image_1,prize_image_2,status,number_quantity,number_price,start_date,end_date,goal_amount,regulation_url,regulation_text")
        .eq("slug", slug)
        .maybeSingle();
      if (!c) { setLoading(false); return; }
      
      let campaignData = c as Campaign;

      async function signIfStorage(url: string | null): Promise<string | null> {
        if (!url || !url.includes('/storage/v1/object/public/')) return url;
        const path = url.split('/public/')[1].split('/').slice(1).join('/');
        const bucket = url.split('/public/')[1].split('/')[0];
        const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
        return signedData?.signedUrl ?? url;
      }

      const [signedBanner, signedPrize1, signedPrize2] = await Promise.all([
        signIfStorage(campaignData.banner_url),
        signIfStorage(campaignData.prize_image_1),
        signIfStorage(campaignData.prize_image_2),
      ]);
      campaignData = { ...campaignData, banner_url: signedBanner, prize_image_1: signedPrize1, prize_image_2: signedPrize2 };

      setCampaign(campaignData);
      
      const [nums, { data: promotionRows }] = await Promise.all([
        getCampaignNumberAvailabilityFn({ data: { campaignId: c.id } }),
        supabase.from("campaign_promotions").select("id,quantity,promotional_price,active").eq("campaign_id", c.id).eq("active", true).order("quantity"),
      ]);
      setNumbers((nums ?? []) as RaffleNumber[]);
      setPromotions((promotionRows ?? []).map(p => ({ ...p, promotional_price: Number(p.promotional_price) })));

      const { data: pz } = await supabase.from("campaign_prizes").select("*").eq("campaign_id", c.id).order("position");
      
      // Handle prize images as well
      const prizesWithSignedUrls = await Promise.all((pz ?? []).map(async (p) => {
        if (p.image_url && p.image_url.includes('/storage/v1/object/public/')) {
          const path = p.image_url.split('/public/')[1].split('/').slice(1).join('/');
          const bucket = p.image_url.split('/public/')[1].split('/')[0];
          const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
          if (signedData) return { ...p, image_url: signedData.signedUrl };
        }
        return p;
      }));
      
      setPrizes(prizesWithSignedUrls as Prize[]);
      setLoading(false);

      channel = supabase.channel(`raffle-${c.id}`);
      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "raffle_numbers", filter: `campaign_id=eq.${c.id}` },
          (payload) => {
            setNumbers((prev) => {
              const next = [...prev];
              const row = (payload.new ?? payload.old) as any;
              const idx = next.findIndex(n => n.number === row.number);
              if (idx >= 0 && payload.new) {
                const newRow = payload.new as any;
                next[idx] = { 
                  number: row.number, 
                  status: newRow.status 
                };
              }
              return next;
            });
          })
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [getCampaignNumberAvailabilityFn, slug]);

  const price = useMemo(() => calculateCampaignPrice(Number(campaign?.number_price ?? 0), selected.size, promotions), [selected, campaign, promotions]);
  const sold = useMemo(() => numbers.filter(n => n.status === "sold").length, [numbers]);
  const pct = campaign ? Math.round((sold / campaign.number_quantity) * 100) : 0;

  function toggle(n: number, status: RaffleNumber["status"]) {
    if (status !== "available") return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }

  async function handleSubmit(form: { name: string; email: string; whatsapp: string; sellerName: string }) {
    if (!campaign) return;
    setSubmitting(true);
    const nums = [...selected].sort((a,b) => a-b);
    type ReserveNumbersClient = {
      rpc: (name: "reserve_numbers", args: {
        p_campaign_id: string;
        p_numbers: number[];
        p_buyer_name: string;
        p_buyer_email: string;
        p_buyer_whatsapp: string;
        p_buyer_cpf: null;
        p_seller_name: string;
      }) => ReturnType<typeof supabase.rpc>;
    };
    const reserveClient = supabase as unknown as ReserveNumbersClient;
    const { data, error } = await reserveClient.rpc("reserve_numbers", {
      p_campaign_id: campaign.id,
      p_numbers: nums,
      p_buyer_name: form.name,
      p_buyer_email: form.email,
      p_buyer_whatsapp: form.whatsapp,
      p_buyer_cpf: null,
      p_seller_name: form.sellerName,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const result = data as { ok: boolean; error?: string; order_id?: string };
    if (!result.ok) { toast.error(result.error ?? "Erro ao reservar"); return; }
    toast.success("Números reservados!");
    if (!result.order_id) { toast.error("Não foi possível abrir o pagamento."); return; }
    navigate({ to: "/checkout/$orderId", params: { orderId: result.order_id } });
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!campaign) return <div className="mx-auto max-w-6xl px-4 py-20 text-center">Campanha não encontrada</div>;

  return (
    <div className="min-h-screen bg-white selection:bg-primary/10">
      <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.03] pointer-events-none" />
      <div className="relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-16 space-y-8 md:space-y-10">
        {/* 1) Banner 16:9 — largura total */}
        <div className="rounded-[2rem] md:rounded-[2.5rem] border border-black/[0.05] bg-white p-2 md:p-3 shadow-2xl">
          <button
            type="button"
            onClick={() => setShowBanner(true)}
            className="relative block aspect-video w-full overflow-hidden rounded-[1.5rem] bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:rounded-[2rem]"
            aria-label="Ampliar imagem da campanha"
          >
            <img src={campaign.banner_url || "/placeholder.svg"} alt={campaign.name} className="h-full w-full object-contain" />
          </button>
        </div>

        <Dialog open={showBanner} onOpenChange={setShowBanner}>
          <DialogContent
            showCloseButton={false}
            className="w-[96vw] max-w-5xl border-none bg-transparent p-0 shadow-none sm:rounded-2xl"
          >
            <DialogTitle className="sr-only">{campaign.name}</DialogTitle>
            <img
              src={campaign.banner_url || "/placeholder.svg"}
              alt={campaign.name}
              className="max-h-[85vh] w-full rounded-2xl object-contain"
            />
            <DialogClose className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* 2) Dois cards lado a lado: Descrição da campanha | Descrição do prêmio */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          {/* Descrição da campanha */}
          <div className="rounded-[2rem] border border-black/[0.05] bg-white p-6 md:p-8 shadow-2xl flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">Descrição da campanha</span>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-primary leading-tight">{campaign.name}</h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground flex-1">
              {campaign.short_description || campaign.description || ""}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <StatCard icon={<Gift className="h-4 w-4" />} label="Cota" value={formatBRL(campaign.number_price)} />
              <StatCard icon={<Calendar className="h-4 w-4" />} label="Sorteio" value={formatCalendarDateBR(campaign.end_date)} />
            </div>
          </div>

          {/* Descrição do prêmio */}
          <div className="rounded-[2rem] border border-black/[0.05] bg-white p-6 md:p-8 shadow-2xl flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Descrição do prêmio</span>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-primary leading-tight">Prêmio</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground flex-1">
              {campaign.prize_description || "Detalhes do prêmio em breve."}
            </p>
            {(campaign.prize_image_1 || campaign.prize_image_2) && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[campaign.prize_image_1, campaign.prize_image_2].map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100 border border-black/[0.04]">
                    {src ? (
                      <img src={src} alt={`Foto ${i + 1} do prêmio`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground/50">Foto {i + 1}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3) Escolha seus números — largura total */}
        <section id="escolher-numeros">
          <div className="relative overflow-hidden rounded-[2rem] border border-black/[0.05] bg-white p-4 shadow-2xl sm:p-6 md:rounded-[2.5rem] md:p-12">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Ticket className="h-64 w-64 rotate-12" />
            </div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-1">Escolha seus números</h2>
              <p className="text-sm text-muted-foreground mb-6">Toque para selecionar. Reserva de 3 minutos.</p>

              {promotions.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2" aria-label="Ofertas promocionais">
                  {promotions.map(promotion => {
                    const active = promotion.quantity === selected.size;
                    return (
                      <div key={promotion.id ?? promotion.quantity} className={cn("rounded-xl border px-3 py-2 text-sm transition-colors", active ? "border-gold bg-gold/10 text-primary shadow-sm" : "border-primary/15 bg-primary/5 text-primary")}>
                        <span className="font-black">{promotion.quantity} números por {formatBRL(promotion.promotional_price)}</span>
                        {active && <span className="ml-2 text-xs font-bold text-success">Oferta ativada</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-5 gap-1.5 min-[380px]:grid-cols-6 sm:grid-cols-8 sm:gap-2 md:grid-cols-10 lg:grid-cols-12">
                {numbers.map(n => {
                  const status = selected.has(n.number) ? "selected" : n.status;
                  return (
                    <button
                      key={n.number}
                      onClick={() => toggle(n.number, n.status)}
                      disabled={n.status !== "available"}
                      className={cn(
                        "relative aspect-square min-w-0 rounded-lg font-bold tabular-nums transition-all duration-300 text-xs sm:rounded-xl sm:text-sm",
                        "border border-black/[0.05]",
                        status === "available" && "bg-secondary text-primary hover:bg-primary/10",
                        status === "selected" && "bg-primary text-white scale-105 shadow-lg",
                        status === "reserved" && "bg-black/[0.03] text-black/20 cursor-not-allowed",
                        status === "sold" && "bg-black/[0.05] text-black/20 cursor-not-allowed",
                      )}
                    >
                      {padNumber(n.number, campaign.number_quantity)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 4) Convite para compartilhar */}
        <ShareCampaign
          campaignName={campaign.name}
          slug={campaign.slug}
          price={Number(campaign.number_price)}
          endDate={campaign.end_date}
          shortDescription={campaign.short_description}
          promotions={promotions}
          bannerUrl={campaign.banner_url}
        />

        {/* 5) Ranking de vendedores abaixo do grid */}
        <SellerRanking campaignId={campaign.id} />

        {selected.size > 0 && (
          <div className="fixed bottom-3 left-3 right-3 z-50 flex items-center justify-center sm:bottom-6 sm:left-6 sm:right-6">
            <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-black/[0.03] bg-white p-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] sm:rounded-3xl sm:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{selected.size} selecionados</p>
                {price.promotion && <p className="text-xs font-semibold text-muted-foreground line-through">{formatBRL(price.listAmount)}</p>}
                <p className="text-xl font-black text-primary sm:text-2xl">{formatBRL(price.amount)}</p>
                {price.promotion && <p className="text-[10px] font-bold text-success">Você economiza {formatBRL(price.savings)}</p>}
              </div>
              <Button onClick={() => setShowModal(true)} className="h-12 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground shadow-premium sm:h-14 sm:rounded-2xl sm:px-8 sm:text-sm">PAGAR AGORA</Button>
            </div>
          </div>
        )}

        <BuyerModal open={showModal} onOpenChange={setShowModal} onSubmit={handleSubmit} submitting={submitting} total={price.amount} listTotal={price.listAmount} count={selected.size} />
      </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-4">
      <div className="text-primary opacity-60">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-primary">{value}</p>
      </div>
    </div>
  );
}

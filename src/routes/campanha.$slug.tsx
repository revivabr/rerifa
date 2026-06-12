import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, padNumber, formatDateBR } from "@/lib/format";
import { ShieldCheck, FileText, Calendar, Gift, Info, Sparkles, ArrowRight, Ticket, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { BuyerModal } from "@/components/BuyerModal";
import { SellerRanking } from "@/components/SellerRanking";
import { ShareCampaign } from "@/components/ShareCampaign";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/campanha/$slug")({
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

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("campaigns").select("*").eq("slug", slug).maybeSingle();
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
      
      const { data: nums } = await supabase.from("raffle_numbers").select("number,status").eq("campaign_id", c.id).order("number");
      setNumbers((nums ?? []) as RaffleNumber[]);

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
  }, [slug]);

  const total = useMemo(() => (campaign ? selected.size * Number(campaign.number_price) : 0), [selected, campaign]);
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
    const { data, error } = await supabase.rpc("reserve_numbers", {
      p_campaign_id: campaign.id,
      p_numbers: nums,
      p_buyer_name: form.name,
      p_buyer_email: form.email,
      p_buyer_whatsapp: form.whatsapp,
      p_seller_name: form.sellerName,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const result = data as { ok: boolean; error?: string; order_id?: string };
    if (!result.ok) { toast.error(result.error ?? "Erro ao reservar"); return; }
    toast.success("Números reservados!");
    navigate({ to: "/checkout/$orderId", params: { orderId: result.order_id! } });
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
          <div className="relative aspect-video overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-stone-100">
            <img src={campaign.banner_url || "/placeholder.svg"} alt={campaign.name} className="h-full w-full object-cover" />
          </div>
        </div>

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
              <StatCard icon={<Calendar className="h-4 w-4" />} label="Sorteio" value={formatDateBR(campaign.end_date)} />
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
          <div className="rounded-[2rem] md:rounded-[2.5rem] border border-black/[0.05] bg-white p-6 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Ticket className="h-64 w-64 rotate-12" />
            </div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-1">Escolha seus números</h2>
              <p className="text-sm text-muted-foreground mb-6">Toque para selecionar. Reserva de 3 minutos.</p>

              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(56px, 1fr))` }}>
                {numbers.map(n => {
                  const status = selected.has(n.number) ? "selected" : n.status;
                  return (
                    <button
                      key={n.number}
                      onClick={() => toggle(n.number, n.status)}
                      disabled={n.status !== "available"}
                      className={cn(
                        "relative aspect-square rounded-xl font-bold tabular-nums transition-all duration-300 text-sm",
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
        />

        {/* 5) Ranking de vendedores abaixo do grid */}
        <SellerRanking campaignId={campaign.id} />

        {selected.size > 0 && (
          <div className="fixed bottom-6 left-6 right-6 z-50 flex items-center justify-center">
            <div className="flex w-full max-w-xl items-center justify-between rounded-3xl bg-white p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-black/[0.03]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{selected.size} selecionados</p>
                <p className="text-2xl font-black text-primary">{formatBRL(total)}</p>
              </div>
              <Button onClick={() => setShowModal(true)} className="h-14 px-8 rounded-2xl bg-primary text-white font-black shadow-premium">PAGAR AGORA</Button>
            </div>
          </div>
        )}

        <BuyerModal open={showModal} onOpenChange={setShowModal} onSubmit={handleSubmit} submitting={submitting} total={total} count={selected.size} />
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

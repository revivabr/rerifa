import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, padNumber, formatDateBR } from "@/lib/format";
import { Heart, ShieldCheck, FileText, Calendar, Gift, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { BuyerModal } from "@/components/BuyerModal";
import { SellerRanking } from "@/components/SellerRanking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campanha/$slug")({
  component: CampaignPage,
});

type Campaign = {
  id: string; name: string; slug: string; description: string | null; banner_url: string | null;
  status: string; number_quantity: number; number_price: number;
  start_date: string; end_date: string; goal_amount: number | null;
  regulation_url: string | null;
  regulation_text: string | null;
};
type RaffleNumber = { number: number; status: "available" | "reserved" | "sold" | "cancelled" | "winner"; reserved_until: string | null };
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
      setCampaign(c as Campaign);
      const { data: nums } = await supabase.from("raffle_numbers").select("number,status,reserved_until").eq("campaign_id", c.id).order("number");
      setNumbers((nums ?? []) as RaffleNumber[]);
      const { data: pz } = await supabase.from("campaign_prizes").select("*").eq("campaign_id", c.id).order("position");
      setPrizes((pz ?? []) as Prize[]);
      setLoading(false);

      // Realtime - create channel and subscribe only once
      channel = supabase.channel(`raffle-${c.id}-${Math.random().toString(36).slice(2, 8)}`);
      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "raffle_numbers", filter: `campaign_id=eq.${c.id}` },
          (payload) => {
            setNumbers((prev) => {
              const next = [...prev];
              const row = (payload.new ?? payload.old) as RaffleNumber;
              const idx = next.findIndex(n => n.number === row.number);
              if (idx >= 0 && payload.new) next[idx] = { number: row.number, status: (payload.new as RaffleNumber).status };
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
    toast.success("Números reservados! Realize o pagamento.");
    navigate({ to: "/checkout/$orderId", params: { orderId: result.order_id! } });
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">Carregando campanha…</div>;
  if (!campaign) return <div className="mx-auto max-w-6xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Campanha não encontrada</h1></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-elegant">
        <div className="relative aspect-[21/9] w-full bg-muted md:aspect-[3/1]">
          {campaign.banner_url ? (
            <img 
              src={campaign.banner_url} 
              alt={campaign.name} 
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-accent-foreground/20">
              <Heart className="h-20 w-20 animate-pulse" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
          <div className="absolute bottom-4 left-6 right-6 md:hidden">
            <h1 className="text-2xl font-black text-white line-clamp-2">{campaign.name}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft">
            <div className="hidden md:block mb-4">
               <h1 className="text-4xl font-black text-primary leading-tight">{campaign.name}</h1>
            </div>
            
            {campaign.description && (
              <div className="prose prose-sand max-w-none text-muted-foreground">
                <p className="text-lg leading-relaxed">{campaign.description}</p>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard icon={<Gift className="h-5 w-5" />} label="Cota" value={formatBRL(campaign.number_price)} />
              <StatCard icon={<Calendar className="h-5 w-5" />} label="Sorteio" value={formatDateBR(campaign.end_date)} />
              <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Status" value={campaign.status === "active" ? "Disponível" : "Finalizado"} />
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-muted-foreground uppercase tracking-wider">Progresso de vendas</span>
                <span className="text-primary">{pct}%</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-secondary/50 p-1 shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-hover shadow-lg transition-all duration-1000 ease-out" 
                  style={{ width: `${pct}%` }} 
                />
              </div>
              <p className="text-right text-xs text-muted-foreground italic">
                {sold} de {campaign.number_quantity} números vendidos
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6">
              {campaign.regulation_text ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-white">
                      <FileText className="h-4 w-4" /> Ver Regulamento
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl rounded-[2rem]">
                    <DialogHeader className="border-b border-border pb-4">
                      <DialogTitle className="text-2xl font-black text-primary">Regulamento</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-sm md:prose-base prose-sand mt-6 max-w-none dark:prose-invert prose-p:text-foreground prose-headings:text-primary prose-strong:text-primary prose-li:text-foreground">
                      <ReactMarkdown>{campaign.regulation_text}</ReactMarkdown>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : campaign.regulation_url && (
                <a href={campaign.regulation_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-white">
                  <FileText className="h-4 w-4" /> Ver Regulamento
                </a>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Início em {formatDateBR(campaign.start_date)}</span>
              </div>
            </div>
          </section>

          {prizes.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-primary">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                Prêmios Principais
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {prizes.map((p, idx) => (
                  <div key={p.id} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:shadow-elegant">
                    <div className="relative aspect-video overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                          <Gift className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-1 text-xs font-black text-primary shadow-sm backdrop-blur-sm">
                        {idx + 1}º PRÊMIO
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{p.title}</h3>
                      {p.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <div className="sticky top-8 space-y-8">
            <SellerRanking campaignId={campaign.id} />
            
            <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-hover p-6 text-white shadow-elegant">
              <h3 className="text-xl font-black">Participe Agora!</h3>
              <p className="mt-2 text-sm opacity-90">Escolha seus números da sorte abaixo e concorra a prêmios incríveis.</p>
              <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">A partir de</p>
                  <p className="text-2xl font-black">{formatBRL(campaign.number_price)}</p>
                </div>
                <a href="#escolher-numeros" className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-primary shadow-lg transition hover:bg-sand hover:scale-105">
                  Quero Ganhar
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16" id="escolher-numeros">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-black text-primary">Escolha seus números</h2>
            <p className="mt-2 text-muted-foreground">Toque nos números desejados. Os números selecionados serão reservados por 90 segundos.</p>
          </div>
          <Legend />
        </div>

        <div className="rounded-[2.5rem] border border-border bg-card p-4 shadow-elegant md:p-8">
          <div className="grid gap-2 md:gap-3"
               style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${campaign.number_quantity > 200 ? 56 : 72}px, 1fr))` }}>
            {numbers.map(n => {
              const isSelected = selected.has(n.number);
              const isExpired = n.status === 'reserved' && n.reserved_until && new Date(n.reserved_until).getTime() < Date.now();
              const effectiveStatus = isExpired ? 'available' : n.status;
              const status = isSelected ? "selected" : effectiveStatus;
              return (
                <button
                  key={n.number}
                  onClick={() => toggle(n.number, n.status)}
                  disabled={n.status !== "available"}
                  className={cn(
                    "relative aspect-square rounded-2xl text-base font-black tabular-nums transition-all duration-300",
                    "border-2 outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
                    status === "available" && "border-secondary bg-white text-foreground hover:border-primary hover:bg-secondary hover:scale-110",
                    status === "selected"  && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg z-10",
                    status === "reserved"  && "cursor-not-allowed border-accent/20 bg-accent/10 text-accent-foreground/40",
                    status === "sold"      && "cursor-not-allowed border-transparent bg-muted/50 text-muted-foreground/30",
                    status === "winner"    && "border-gold bg-gold text-gold-foreground shadow-elegant animate-bounce",
                  )}
                >
                  {padNumber(n.number, campaign.number_quantity)}
                  {status === "sold" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <div className="h-[2px] w-4/5 rotate-45 bg-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-success/10 p-4 text-sm font-bold text-success border border-success/20">
        <ShieldCheck className="h-5 w-5" />
        <span>Garantia de segurança: Seus números são confirmados imediatamente após o PIX.</span>
      </div>

      {/* Selection Summary */}
      {selected.size > 0 && (
        <div className="sticky bottom-6 z-40 mt-12 px-4">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-primary/30 bg-white/80 p-5 shadow-2xl backdrop-blur-xl md:p-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selecionados ({selected.size})</p>
                  <p className="mt-0.5 line-clamp-1 max-w-[200px] text-lg font-black tabular-nums text-primary md:max-w-md">
                    {[...selected].sort((a,b)=>a-b).map(n => padNumber(n, campaign.number_quantity)).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-8 md:w-auto">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total a pagar</p>
                  <p className="text-3xl font-black text-primary">{formatBRL(total)}</p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl bg-gradient-to-r from-primary to-primary-hover px-10 py-4 text-base font-black text-white shadow-xl transition hover:scale-105 hover:shadow-primary/20 active:scale-95"
                >
                  PAGAR AGORA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BuyerModal
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        total={total}
        count={selected.size}
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-secondary/30 p-4 border border-border/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-lg font-black text-primary">{value}</p>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Livre", cls: "border-secondary bg-white" },
    { label: "Seu", cls: "border-primary bg-primary" },
    { label: "Reservado", cls: "border-accent/20 bg-accent/10" },
    { label: "Vendido", cls: "bg-muted/50 border-transparent" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white px-5 py-3 text-xs font-bold text-muted-foreground shadow-sm">
      {items.map(i => (
        <span key={i.label} className="inline-flex items-center gap-2">
          <span className={cn("h-4 w-4 rounded-md border-2", i.cls)} /> {i.label}
        </span>
      ))}
    </div>
  );
}

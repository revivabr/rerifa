import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, padNumber, formatDateBR } from "@/lib/format";
import { ShieldCheck, FileText, Calendar, Gift, Info, Sparkles, ArrowRight, Ticket, Star } from "lucide-react";
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
      setCampaign(c as Campaign);
      const { data: nums } = await supabase.from("raffle_numbers").select("number,status,reserved_until").eq("campaign_id", c.id).order("number");
      setNumbers((nums ?? []).map(n => ({
        ...n,
        status: (n.status === "reserved" && n.reserved_until && new Date(n.reserved_until).getTime() < Date.now()) 
          ? "available" 
          : n.status
      })) as RaffleNumber[]);
      const { data: pz } = await supabase.from("campaign_prizes").select("*").eq("campaign_id", c.id).order("position");
      setPrizes((pz ?? []) as Prize[]);
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
                const isExpired = newRow.status === "reserved" && newRow.reserved_until && new Date(newRow.reserved_until).getTime() < Date.now();
                next[idx] = { 
                  number: row.number, 
                  status: isExpired ? "available" : newRow.status 
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
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-12">
          {/* Main Campaign Section */}
          <div className="rounded-3xl border border-black/[0.03] bg-white p-2 shadow-premium">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-secondary">
               <img src={campaign.banner_url || "/placeholder.svg"} className="h-full w-full object-cover" />
            </div>
            <div className="p-8 md:p-10">
                <h1 className="text-4xl font-extrabold text-primary md:text-5xl">{campaign.name}</h1>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{campaign.description}</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <StatCard icon={<Gift />} label="Cota" value={formatBRL(campaign.number_price)} />
                  <StatCard icon={<Calendar />} label="Sorteio" value={formatDateBR(campaign.end_date)} />
                </div>
            </div>
          </div>

          {/* Prizes */}
          {prizes.length > 0 && (
            <section>
              <h2 className="mb-8 text-2xl font-bold text-primary">Prêmios</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {prizes.map((p, idx) => (
                  <div key={p.id} className="overflow-hidden rounded-3xl bg-white shadow-premium">
                    <div className="aspect-video bg-muted"><img src={p.image_url || "/placeholder.svg"} className="h-full w-full object-cover" /></div>
                    <div className="p-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gold">{idx+1}º Prêmio</span>
                        <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            <SellerRanking campaignId={campaign.id} />
        </div>
      </div>

      <section className="mt-20" id="escolher-numeros">
        <h2 className="text-3xl font-bold text-primary mb-2">Escolha seus números</h2>
        <p className="text-muted-foreground mb-8">Toque para selecionar. Reserva de 3 minutos.</p>
        
        <div className="rounded-3xl border border-black/[0.03] bg-white p-6 md:p-10 shadow-premium">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(60px, 1fr))` }}>
            {numbers.map(n => {
              const status = selected.has(n.number) ? "selected" : n.status;
              return (
                <button
                  key={n.number}
                  onClick={() => toggle(n.number, n.status)}
                  disabled={n.status !== "available"}
                  className={cn(
                    "relative aspect-square rounded-xl font-bold tabular-nums transition-all duration-300",
                    "border border-black/[0.05]",
                    status === "available" && "bg-secondary text-primary hover:bg-primary/10",
                    status === "selected"  && "bg-primary text-white scale-105 shadow-lg",
                    status === "reserved"  && "bg-black/[0.03] text-black/20 cursor-not-allowed",
                    status === "sold"      && "bg-black/[0.05] text-black/20 cursor-not-allowed",
                  )}
                >
                  {padNumber(n.number, campaign.number_quantity)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-50 flex items-center justify-center">
          <div className="flex w-full max-w-xl items-center justify-between rounded-3xl bg-white p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-black/[0.03]">
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{selected.size} selecionados</p>
                <p className="text-2xl font-black text-primary">{formatBRL(total)}</p>
             </div>
             <Button onClick={() => setShowModal(true)} className="h-14 px-8 rounded-2xl bg-primary font-bold shadow-premium">PAGAR AGORA</Button>
          </div>
        </div>
      )}
      
      <BuyerModal open={showModal} onOpenChange={setShowModal} onSubmit={handleSubmit} submitting={submitting} total={total} count={selected.size} />
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
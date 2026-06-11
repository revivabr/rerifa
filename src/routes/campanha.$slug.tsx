import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatBRL, padNumber, formatDateBR } from "@/lib/format";
import { Heart, ShieldCheck, FileText, Calendar, Gift } from "lucide-react";
import { BuyerModal } from "@/components/BuyerModal";
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
};
type RaffleNumber = { number: number; status: "available" | "reserved" | "sold" | "cancelled" | "winner" };
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
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("campaigns").select("*").eq("slug", slug).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCampaign(c as Campaign);
      const { data: nums } = await supabase.from("raffle_numbers").select("number,status").eq("campaign_id", c.id).order("number");
      setNumbers((nums ?? []) as RaffleNumber[]);
      const { data: pz } = await supabase.from("campaign_prizes").select("*").eq("campaign_id", c.id).order("position");
      setPrizes((pz ?? []) as Prize[]);
      setLoading(false);

      // Realtime
      const ch = supabase.channel(`raffle-${c.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "raffle_numbers", filter: `campaign_id=eq.${c.id}` },
          (payload) => {
            setNumbers((prev) => {
              const next = [...prev];
              const row = (payload.new ?? payload.old) as RaffleNumber;
              const idx = next.findIndex(n => n.number === row.number);
              if (idx >= 0 && payload.new) next[idx] = { number: row.number, status: (payload.new as RaffleNumber).status };
              return next;
            });
          }).subscribe();
      return () => { supabase.removeChannel(ch); };
    })();
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

  async function handleSubmit(form: { name: string; email: string; whatsapp: string }) {
    if (!campaign) return;
    setSubmitting(true);
    const nums = [...selected].sort((a,b) => a-b);
    const { data, error } = await supabase.rpc("reserve_numbers", {
      p_campaign_id: campaign.id,
      p_numbers: nums,
      p_buyer_name: form.name,
      p_buyer_email: form.email,
      p_buyer_whatsapp: form.whatsapp,
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
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="relative aspect-video w-full bg-gradient-sand">
          {campaign.banner_url ? (
            <img src={campaign.banner_url} alt={campaign.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-accent-foreground/30">
              <Heart className="h-24 w-24" />
            </div>
          )}
        </div>
        <div className="space-y-5 p-6 md:p-8">
          <h1 className="text-3xl font-black text-primary md:text-4xl">{campaign.name}</h1>
          {campaign.description && <p className="text-base leading-relaxed text-muted-foreground">{campaign.description}</p>}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatBox label="Valor por número" value={formatBRL(campaign.number_price)} />
            <StatBox label="Total de números" value={String(campaign.number_quantity)} />
            <StatBox label="Vendidos" value={`${sold} (${pct}%)`} />
          </div>

          <div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDateBR(campaign.start_date)} — {formatDateBR(campaign.end_date)}</span>
            {campaign.regulation_url && (
              <a href={campaign.regulation_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                <FileText className="h-4 w-4" /> Regulamento
              </a>
            )}
          </div>
        </div>
      </article>

      {prizes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 inline-flex items-center gap-2 text-2xl font-bold text-primary"><Gift className="h-6 w-6" /> Prêmios</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prizes.map(p => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                {p.image_url && <img src={p.image_url} alt={p.title} className="mb-3 aspect-video w-full rounded-xl object-cover" />}
                <h3 className="font-bold text-foreground">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Escolha seus números</h2>
            <p className="text-sm text-muted-foreground">Toque nos números desejados. Confirme depois de selecionar.</p>
          </div>
          <Legend />
        </div>

        <div className="rounded-3xl border border-border bg-card p-3 shadow-soft md:p-5">
          <div className="grid gap-1.5"
               style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${campaign.number_quantity > 200 ? 52 : 64}px, 1fr))` }}>
            {numbers.map(n => {
              const isSelected = selected.has(n.number);
              const status = isSelected ? "selected" : n.status;
              return (
                <button
                  key={n.number}
                  onClick={() => toggle(n.number, n.status)}
                  disabled={n.status !== "available"}
                  className={cn(
                    "aspect-square rounded-xl text-sm font-bold tabular-nums transition",
                    "border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    status === "available" && "border-secondary bg-card text-foreground hover:border-primary hover:bg-secondary",
                    status === "selected"  && "border-primary bg-primary text-primary-foreground scale-[1.04] shadow-soft",
                    status === "reserved"  && "cursor-not-allowed border-accent/40 bg-accent/30 text-accent-foreground/70",
                    status === "sold"      && "cursor-not-allowed border-transparent bg-muted text-muted-foreground/60 line-through",
                    status === "winner"    && "border-gold bg-gold text-gold-foreground shadow-elegant",
                  )}
                >{padNumber(n.number, campaign.number_quantity)}</button>
              );
            })}
          </div>
        </div>
      </section>

      <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-success" /> Os números só são confirmados após o pagamento PIX.
      </p>

      {/* Selection Summary */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-30 mt-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-card p-4 shadow-elegant">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selecionados ({selected.size})</p>
                <p className="mt-1 line-clamp-1 max-w-md text-sm font-bold tabular-nums text-primary">
                  {[...selected].sort((a,b)=>a-b).map(n => padNumber(n, campaign.number_quantity)).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="text-2xl font-black text-primary">{formatBRL(total)}</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="rounded-xl bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:scale-[1.02]"
              >Continuar</button>
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

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-primary">{value}</p>
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Disponível", cls: "border-secondary bg-card" },
    { label: "Selecionado", cls: "border-primary bg-primary" },
    { label: "Reservado", cls: "border-accent/40 bg-accent/30" },
    { label: "Vendido", cls: "bg-muted" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map(i => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className={cn("h-3.5 w-3.5 rounded border-2", i.cls)} /> {i.label}
        </span>
      ))}
    </div>
  );
}

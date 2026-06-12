import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatBRL, padNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Clock, Loader2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getOrGeneratePix } from "@/lib/api/payment.functions";
import { getOrderPublic, cancelOrder } from "@/lib/api/order.functions";


export const Route = createFileRoute("/checkout/$orderId")({
  component: CheckoutPage,
});

type Order = {
  id: string; campaign_id: string; status: string; amount: number; quantity: number;
  pix_qr_code: string | null; pix_copy_paste: string | null; expires_at: string | null;
  seller_name: string | null;
};

function CheckoutPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [campaignName, setCampaignName] = useState<string>("");
  const [campaignSlug, setCampaignSlug] = useState<string>("");
  const [buyerName, setBuyerName] = useState<string>("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [remaining, setRemaining] = useState<number>(0);
  const [loadingPix, setLoadingPix] = useState(true);
  const [pixError, setPixError] = useState<string | null>(null);
  const [realPixData, setRealPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOrder = async () => {
      const o = await getOrderPublic({ data: { orderId } });
      if (cancelled || !o) return;
      setOrder({
        id: o.id, campaign_id: o.campaign_id, status: o.status,
        amount: o.amount, quantity: o.quantity,
        pix_qr_code: o.pix_qr_code, pix_copy_paste: o.pix_copy_paste, expires_at: o.expires_at,
        seller_name: o.seller_name,
      });
      setCampaignName(o.campaign_name);
      setCampaignSlug(o.campaign_slug);
      setBuyerName(o.buyer_name);
      setNumbers(o.numbers);
      if (o.status === "paid") {
        toast.success("Pagamento confirmado!");
        setTimeout(() => navigate({ to: "/confirmacao/$orderId", params: { orderId } }), 800);
      }
    };
    fetchOrder();
    const poll = setInterval(fetchOrder, 4000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [orderId, navigate]);

  useEffect(() => {
    const fetchPix = async () => {
      try {
        const result = await getOrGeneratePix({ data: { orderId } });
        if (result.qr_code && result.qr_code_base64) {
          setRealPixData({ qr_code: result.qr_code, qr_code_base64: result.qr_code_base64 });
        }
        setLoadingPix(false);
      } catch (err: any) {
        setPixError("Erro ao gerar PIX. Tente novamente.");
        setLoadingPix(false);
      }
    };
    fetchPix();
  }, [orderId]);

  useEffect(() => {
    if (!order?.expires_at) return;
    const tick = () => {
      const ms = new Date(order.expires_at!).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [order?.expires_at]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  function copy() {
    if (!realPixData?.qr_code) return;
    navigator.clipboard.writeText(realPixData.qr_code);
    toast.success("Código PIX copiado!");
  }

  async function handleCancel() {
    try {
      setLoadingPix(true);
      const res = await cancelOrder({ data: { orderId } });
      if (res.ok) {
        toast.success("Pedido cancelado e números liberados.");
        navigate({ to: "/campanha/$slug", params: { slug: campaignSlug } });
      } else {
        toast.error(res.error || "Erro ao cancelar pedido.");
        setLoadingPix(false);
      }
    } catch (err) {
      toast.error("Erro ao cancelar pedido.");
      setLoadingPix(false);
    }
  }

  if (!order) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/30" /></div>;


  if (remaining === 0 && order.status === "pending") {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive opacity-50" />
        <h1 className="mt-6 text-2xl font-bold text-primary">Reserva expirada</h1>
        <p className="mt-2 text-muted-foreground text-sm">O tempo para pagamento acabou e os números foram liberados.</p>
        <Link to="/campanha/$slug" params={{ slug: campaignSlug }} className="mt-8 inline-flex h-12 items-center rounded-xl bg-primary px-8 font-black text-white shadow-premium transition-all hover:bg-primary/90 active:scale-95">
          Tentar novamente
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="mx-auto max-w-xl px-6 py-12 relative z-10">
      <div className="overflow-hidden rounded-3xl bg-white shadow-premium">
        <div className="bg-primary p-8 text-white relative">
          <button 
            onClick={handleCancel}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Cancelar e liberar números"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Checkout Seguro</p>
          <h1 className="mt-2 text-4xl font-black">{formatBRL(order.amount)}</h1>
          <p className="mt-1 text-sm font-medium opacity-80">{campaignName}</p>
        </div>


        <div className="p-8 space-y-8">
          <div className={cn(
            "flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold",
            remaining < 60 ? "bg-destructive/5 text-destructive" : "bg-primary/5 text-primary"
          )}>
            <Clock className="h-4 w-4" />
            <span>Expira em <span className="tabular-nums">{mm}:{ss}</span></span>
          </div>

          <div className="flex flex-col items-center">
            {loadingPix ? (
               <div className="flex h-[280px] w-[280px] items-center justify-center rounded-3xl bg-secondary/50">
                 <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
               </div>
            ) : realPixData ? (
               <div className="rounded-3xl border border-black/[0.03] bg-white p-6 shadow-sm">
                  <img 
                    src={`data:image/png;base64,${realPixData.qr_code_base64}`} 
                    alt="QR Code PIX" 
                    className="h-[240px] w-[240px]"
                  />
               </div>
            ) : (
              <div className="flex h-[280px] w-[280px] flex-col items-center justify-center rounded-3xl bg-destructive/5 p-6 text-center text-destructive">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="mt-4 text-xs font-bold leading-tight">{pixError}</p>
              </div>
            )}
            <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Escaneie o QR Code no seu banco</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ou copie o código</p>
            <div className="flex gap-3">
              <div className="flex-1 truncate rounded-2xl bg-secondary/50 px-5 py-4 text-xs font-medium text-primary">
                {loadingPix ? "Gerando..." : (realPixData?.qr_code || "—")}
              </div>
              <Button onClick={copy} variant="outline" className="h-12 w-12 shrink-0 rounded-2xl border-black/[0.05] bg-white hover:bg-secondary"><Copy className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.03] bg-white p-6 space-y-3 text-sm">
            <Row label="Comprador" value={buyerName} />
            <Row label="Quantidade" value={order.quantity} />
            <Row label="Total" value={<span className="font-bold text-primary">{formatBRL(order.amount)}</span>} />
          </div>

          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-success animate-pulse">Aguardando confirmação de pagamento...</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-primary font-bold">{value}</span>
    </div>
  );
}
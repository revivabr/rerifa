import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatBRL, padNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getOrGeneratePix } from "@/lib/api/payment.functions";
import { getOrderPublic } from "@/lib/api/order.functions";

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
      setBuyerName(o.buyer_name);
      setNumbers(o.numbers);
      if (o.status === "paid") {
        toast.success("Pagamento confirmado!");
        setTimeout(() => navigate({ to: "/confirmacao/$orderId", params: { orderId } }), 800);
      }
    };
    fetchOrder();
    // Polling no lugar de realtime (RLS restringe leitura direta)
    const poll = setInterval(fetchOrder, 4000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [orderId, navigate]);

  useEffect(() => {
    const fetchPix = async () => {
      try {
        const result = await getOrGeneratePix({ data: { orderId } });
        if (result.qr_code && result.qr_code_base64) {
          setRealPixData({
            qr_code: result.qr_code,
            qr_code_base64: result.qr_code_base64
          });
        }
        setLoadingPix(false);
      } catch (err: any) {
        console.error("Erro ao obter PIX:", err);
        setPixError("Não foi possível gerar o código PIX. Tente novamente em instantes.");
        setLoadingPix(false);
      }
    };

    fetchPix();
  }, [orderId]);

  // Countdown
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

  if (!order) return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;

  if (order.status === "paid") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-primary">Pagamento confirmado!</h1>
        <Link to="/confirmacao/$orderId" params={{ orderId }} className="mt-6 inline-block text-primary underline">Ver confirmação</Link>
      </div>
    );
  }

  if (remaining === 0 && order.status === "pending") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold text-primary">Reserva expirada</h1>
        <p className="mt-2 text-muted-foreground">O tempo para pagamento acabou e os números foram liberados.</p>
        <Link to="/campanha/$slug" params={{ slug: campaignName.toLowerCase().replace(/\s+/g, '-') }} className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:scale-105">
          Tentar novamente
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <p className="text-xs uppercase tracking-wider opacity-80">Pagamento PIX</p>
          <h1 className="mt-1 text-2xl font-black">{formatBRL(order.amount)}</h1>
          <p className="mt-1 text-sm opacity-90">{campaignName}</p>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <div className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
            remaining < 60 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning-foreground"
          )}>
            <Clock className="h-4 w-4" />
            Reserva expira em <span className="tabular-nums">{mm}:{ss}</span>
          </div>

          <div className="flex flex-col items-center">
            {loadingPix ? (
               <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl bg-muted">
                 <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
               </div>
            ) : pixError ? (
              <div className="flex h-[280px] w-[280px] flex-col items-center justify-center rounded-2xl bg-destructive/10 p-6 text-center text-destructive">
                <AlertCircle className="mb-2 h-10 w-10" />
                <p className="text-xs font-bold uppercase">Erro no Pagamento</p>
                <p className="mt-1 text-[10px] leading-tight">{pixError}</p>
                <Button variant="outline" size="sm" className="mt-4 h-8 text-[10px]" onClick={() => window.location.reload()}>Recarregar</Button>
              </div>
            ) : realPixData ? (
              <img 
                src={`data:image/png;base64,${realPixData.qr_code_base64}`} 
                alt="QR Code PIX" 
                className="rounded-2xl border-4 border-secondary p-2" 
                width={280} 
                height={280} 
              />
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">Abra o app do seu banco e escaneie o QR Code</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ou copie o código PIX</p>
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs">
                {loadingPix ? "Gerando código..." : (realPixData?.qr_code || "Indisponível")}
              </code>
              <Button onClick={copy} variant="outline" size="icon" className="shrink-0" disabled={!realPixData}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl bg-secondary p-4 text-sm">
            <Row label="Comprador" value={buyerName || "—"} />
            {order.seller_name && <Row label="Vendedor" value={order.seller_name} />}
            <Row label="Números" value={numbers.map(n => padNumber(n, 1000)).join(", ")} />
            <Row label="Quantidade" value={String(order.quantity)} />
            <Row label="Total" value={<strong className="text-primary">{formatBRL(order.amount)}</strong>} />
          </div>

          <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            <strong className="text-foreground">Aguardando pagamento…</strong>
            <br />Após o pagamento, a confirmação é automática. Esta página atualiza sozinha.
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

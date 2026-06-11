import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { formatBRL, padNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/$orderId")({
  component: CheckoutPage,
});

type Order = {
  id: string; campaign_id: string; status: string; amount: number; quantity: number;
  pix_qr_code: string | null; pix_copy_paste: string | null; expires_at: string | null;
};

function CheckoutPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [campaignName, setCampaignName] = useState<string>("");
  const [buyerName, setBuyerName] = useState<string>("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(0);

  // MOCK PIX payload — substitua quando integrar provedor real
  const pixPayload = useMemo(() => {
    if (!order) return "";
    return `00020126360014BR.GOV.BCB.PIX0114REVIVA-${order.id.slice(0,8)}5204000053039865406${order.amount.toFixed(2)}5802BR5917Reviva Brasil6009SAO PAULO62070503***6304ABCD`;
  }, [order]);

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!o) return;
      setOrder(o as Order);
      const { data: c } = await supabase.from("campaigns").select("name").eq("id", (o as Order).campaign_id).maybeSingle();
      if (c) setCampaignName(c.name as string);
      const { data: b } = await supabase.from("order_numbers").select("number").eq("order_id", orderId).order("number");
      setNumbers((b ?? []).map((r: { number: number }) => r.number));
      const { data: buyer } = await supabase.from("buyers").select("name").eq("id", (o as { buyer_id: string }).buyer_id ?? "").maybeSingle();
      if (buyer) setBuyerName(buyer.name as string);

      // Realtime listen to order status
      const ch = supabase.channel(`order-${orderId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
          (payload) => {
            const next = payload.new as Order;
            setOrder(next);
            if (next.status === "paid") {
              toast.success("Pagamento confirmado!");
              setTimeout(() => navigate({ to: "/confirmacao/$orderId", params: { orderId } }), 800);
            }
          }).subscribe();
      return () => { supabase.removeChannel(ch); };
    })();
  }, [orderId, navigate]);

  useEffect(() => {
    if (!pixPayload) return;
    QRCode.toDataURL(pixPayload, { width: 280, margin: 1, color: { dark: "#1F3D2B", light: "#FFFFFF" } })
      .then(setQrDataUrl).catch(() => {});
  }, [pixPayload]);

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
    navigator.clipboard.writeText(pixPayload);
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <p className="text-xs uppercase tracking-wider opacity-80">Pagamento PIX</p>
          <h1 className="mt-1 text-2xl font-black">{formatBRL(order.amount)}</h1>
          <p className="mt-1 text-sm opacity-90">{campaignName}</p>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-warning/15 px-4 py-2 text-sm font-semibold text-warning-foreground">
            <Clock className="h-4 w-4" />
            Reserva expira em <span className="tabular-nums">{mm}:{ss}</span>
          </div>

          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code PIX" className="rounded-2xl border-4 border-secondary p-2" width={280} height={280} />
            ) : (
              <div className="h-[280px] w-[280px] animate-pulse rounded-2xl bg-muted" />
            )}
            <p className="mt-3 text-xs text-muted-foreground">Abra o app do seu banco e escaneie o QR Code</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ou copie o código PIX</p>
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs">{pixPayload}</code>
              <Button onClick={copy} variant="outline" size="icon" className="shrink-0"><Copy className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl bg-secondary p-4 text-sm">
            <Row label="Comprador" value={buyerName || "—"} />
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

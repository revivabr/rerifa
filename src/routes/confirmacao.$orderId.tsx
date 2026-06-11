import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatBRL, padNumber } from "@/lib/format";
import { CheckCircle2, Heart } from "lucide-react";
import { getOrderPublic } from "@/lib/api/order.functions";

export const Route = createFileRoute("/confirmacao/$orderId")({
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { orderId } = Route.useParams();
  const [data, setData] = useState<{ campaign: string; slug: string; amount: number; numbers: number[]; buyer: string } | null>(null);

  useEffect(() => {
    (async () => {
      const o = await getOrderPublic({ data: { orderId } });
      if (!o) return;
      setData({
        campaign: o.campaign_name,
        slug: o.campaign_slug,
        amount: o.amount,
        numbers: o.numbers,
        buyer: o.buyer_name,
      });
    })();
  }, [orderId]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-primary">Participação confirmada!</h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          Obrigado por apoiar a <strong className="text-foreground">Associação Reviva Brasil</strong>
          <Heart className="h-4 w-4 fill-destructive text-destructive" />
        </p>

        {data && (
          <div className="mt-8 space-y-3 rounded-2xl bg-secondary p-5 text-left text-sm">
            <Row label="Campanha" value={data.campaign} />
            <Row label="Comprador" value={data.buyer} />
            <Row label="Números confirmados" value={<span className="tabular-nums font-bold text-primary">{data.numbers.map(n => padNumber(n, 1000)).join(", ")}</span>} />
            <Row label="Valor pago" value={<strong className="text-primary">{formatBRL(data.amount)}</strong>} />
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">Guarde esta confirmação. Você pode tirar um print desta tela.</p>

        {data?.slug && (
          <Link to="/campanha/$slug" params={{ slug: data.slug }} className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            Voltar para campanha
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

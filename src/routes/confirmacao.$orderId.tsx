import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatBRL, padNumber } from "@/lib/format";
import { CheckCircle2, Heart, ArrowLeft } from "lucide-react";
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

  if (!data) return <div className="flex min-h-[50vh] items-center justify-center">...</div>;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="overflow-hidden rounded-3xl bg-white shadow-premium">
        <div className="bg-success/5 p-12 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm border border-success/10">
                <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h1 className="mt-8 text-3xl font-bold text-primary">Participação Confirmada</h1>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
                Sua contribuição transforma vidas <Heart className="h-3.5 w-3.5 fill-success text-success" />
            </p>
        </div>

        <div className="p-8 md:p-12 space-y-8">
            <div className="space-y-4 rounded-2xl border border-black/[0.03] bg-white p-6 text-sm">
                <Row label="Campanha" value={data.campaign} />
                <Row label="Comprador" value={data.buyer} />
                <Row label="Números" value={<span className="font-bold text-primary">{data.numbers.map(n => padNumber(n, 1000)).join(", ")}</span>} />
                <Row label="Valor" value={<span className="font-bold text-primary">{formatBRL(data.amount)}</span>} />
            </div>

            <p className="text-center text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                Guarde esta confirmação · Obrigado pelo apoio
            </p>

            <Link 
                to="/campanha/$slug" 
                params={{ slug: data.slug }} 
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-sm font-bold text-white shadow-premium transition-all hover:bg-primary/90 active:scale-95"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Campanha
            </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1 border-b border-black/[0.03] last:border-0 last:pb-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-right text-primary font-bold max-w-[60%]">{value}</span>
    </div>
  );
}
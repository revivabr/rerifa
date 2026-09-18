import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { formatBRL, padNumber } from "@/lib/format";
import { AlertCircle, CheckCircle2, Heart, ArrowLeft, Sparkles, Download, Ticket } from "lucide-react";
import { getOrderPublic } from "@/lib/api/order.functions";
import { ReceiptTicket, type ReceiptData } from "@/components/ReceiptTicket";
import { buildCampaignShareMessage } from "@/lib/share";
import type { PromotionTier } from "@/lib/promotions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/confirmacao/$orderId")({
  head: () => ({
    meta: [
      { title: "Compra confirmada — Reviva Brasil" },
      { name: "description", content: "Confirmação da participação, números da sorte e comprovante da Rifa Solidária Reviva Brasil." },
      { property: "og:title", content: "Compra confirmada — Reviva Brasil" },
      { property: "og:description", content: "Confira seus números da sorte e gere o comprovante da sua participação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmationPage,
});

function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#2B4BEB", "#F5C518", "#16A34A", "#F97316", "#EC4899"];
  const end = Date.now() + 1800;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 160, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors });
}

function ConfirmationPage() {
  const { orderId } = Route.useParams();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [shareMessage, setShareMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [notPaid, setNotPaid] = useState(false);
  const fired = useRef(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const o = await getOrderPublic({ data: { orderId } });
      if (!o) return;
      if (o.status !== "paid") {
        setSlug(o.campaign_slug);
        setNotPaid(true);
        return;
      }
      setSlug(o.campaign_slug);
      setShareMessage(buildCampaignShareMessage({
        campaignName: o.campaign_name,
        slug: o.campaign_slug,
        price: o.campaign_number_price,
        endDate: o.campaign_end_date,
        shortDescription: o.campaign_short_description,
        promotions: (o.campaign_promotions ?? []) as PromotionTier[],
      }));
      setReceipt({
        orderId: o.id,
        campaignName: o.campaign_name,
        bannerUrl: o.campaign_banner,
        buyerName: o.buyer_name,
        buyerWhatsapp: o.buyer_whatsapp,
        numbers: o.numbers,
        numberTotal: o.campaign_number_quantity,
        amount: o.amount,
        paidAt: o.paid_at,
      });
    })();
  }, [orderId]);

  useEffect(() => {
    if (receipt && !fired.current) {
      fired.current = true;
      fireConfetti();
      setTimeout(fireConfetti, 600);
    }
  }, [receipt]);

  async function renderToBlob(): Promise<{ blob: Blob; dataUrl: string } | null> {
    if (!ticketRef.current) return null;
    const dataUrl = await toPng(ticketRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return { blob, dataUrl };
  }

  async function handleReceipt() {
    if (!receipt) return;
    setGenerating(true);
    try {
      const result = await renderToBlob();
      if (!result) throw new Error("Falha ao gerar o bilhete");
      const fileName = `bilhete-${receipt.campaignName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${receipt.orderId.slice(0, 8)}.png`;
      const file = new File([result.blob], fileName, { type: "image/png" });

      const canShareFile =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: `Rifa ${receipt.campaignName} da Associação Reviva Brasil`,
            text: shareMessage,
          });
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }

      const a = document.createElement("a");
      a.href = result.dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Bilhete baixado!");
    } catch (e: any) {
      console.error(e);
      toast.error("Não foi possível gerar o bilhete. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  if (notPaid) return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <AlertCircle className="h-10 w-10 text-warning" />
      <h1 className="mt-4 text-2xl font-black text-primary">Pagamento ainda não confirmado</h1>
      <p className="mt-2 text-sm text-muted-foreground">O comprovante será liberado somente após a aprovação do PIX.</p>
      {slug && <Button asChild className="mt-6"><Link to="/campanha/$slug" params={{ slug }}>Voltar para a campanha</Link></Button>}
    </div>
  );
  if (!receipt) return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Carregando confirmação...</div>;

  const firstName = receipt.buyerName.split(" ")[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-secondary selection:bg-primary/10">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-xl px-3 py-6 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-2xl bg-background shadow-premium sm:rounded-3xl">
          <div className="relative bg-gradient-to-br from-success/10 via-primary/5 to-gold/10 px-5 pb-7 pt-12 text-center sm:p-12">
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 shadow-sm backdrop-blur-sm sm:right-4 sm:top-4 sm:px-3">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">Boa sorte!</span>
            </div>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-success/10 bg-background shadow-md animate-scale-in sm:h-24 sm:w-24">
              <CheckCircle2 className="h-10 w-10 text-success sm:h-12 sm:w-12" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-primary animate-fade-in sm:mt-8 sm:text-3xl">
              Parabéns, {firstName}! 🎉
            </h1>
            <p className="mt-2 text-base font-semibold text-primary/80 animate-fade-in sm:mt-3">
              Sua participação está confirmada
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground animate-fade-in sm:mt-4">
              Muito obrigado por acreditar e fazer parte dessa corrente do bem.
              Cada número comprado se transforma em <strong className="text-success">esperança e oportunidade</strong> para
              quem mais precisa. Que a sorte esteja com você <Heart className="inline h-3.5 w-3.5 fill-success text-success" />
            </p>
          </div>

          <div className="space-y-5 p-4 sm:space-y-6 sm:p-8 md:p-12">
            <Button
              type="button"
              onClick={handleReceipt}
              disabled={generating}
              size="lg"
              className="group relative h-auto min-h-20 w-full overflow-hidden border-2 border-gold bg-primary px-4 py-4 shadow-premium ring-4 ring-gold/20 hover:bg-primary/95 sm:min-h-24 sm:px-6"
            >
              <span className="flex min-w-0 items-center gap-3 text-primary-foreground">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-primary sm:h-12 sm:w-12">
                  <Ticket className="h-6 w-6" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-base font-black uppercase sm:text-lg">
                    {generating ? "Gerando comprovante..." : "Gerar meu comprovante"}
                  </span>
                  <span className="mt-0.5 block whitespace-normal text-xs font-semibold normal-case text-primary-foreground/75 sm:text-sm">
                    Baixe ou compartilhe seu bilhete de compra
                  </span>
                </span>
                {!generating && <Download className="ml-auto h-5 w-5 shrink-0 transition-transform group-hover:translate-y-0.5" />}
              </span>
            </Button>

            <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4 text-sm sm:space-y-4 sm:p-6">
              <Row label="Campanha" value={receipt.campaignName} />
              <Row label="Comprador" value={receipt.buyerName} />
              <Row label="Valor" value={<span className="font-bold text-primary">{formatBRL(receipt.amount)}</span>} />
            </div>

            <section className="rounded-2xl border border-gold/40 bg-gold/10 p-4 sm:p-6" aria-labelledby="numbers-title">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Ticket className="h-4 w-4 text-gold" />
                <h2 id="numbers-title" className="text-center text-xs font-black uppercase tracking-widest">
                  Seus números da sorte ({receipt.numbers.length})
                </h2>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 min-[420px]:grid-cols-5 sm:grid-cols-6">
                {receipt.numbers.map((number) => (
                  <span
                    key={number}
                    className="flex aspect-square min-w-0 items-center justify-center rounded-lg bg-primary px-1 text-sm font-black tabular-nums text-primary-foreground shadow-sm"
                  >
                    {padNumber(number, receipt.numberTotal)}
                  </span>
                ))}
              </div>
            </section>

            <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-gold/5 p-5 text-center">
              <p className="text-sm font-bold text-primary">
                Convide um amigo e dobre a torcida!
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Compartilhe a campanha e ajude a transformar mais vidas.
              </p>
            </div>

            <p className="text-center text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
              Guarde esta confirmação · O sorteio será transmitido em breve
            </p>

            {slug && (
              <Button asChild size="lg" className="w-full">
                <Link to="/campanha/$slug" params={{ slug }}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para a campanha
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Off-screen ticket used for image rendering */}
      <div
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
        aria-hidden
      >
        <ReceiptTicket ref={ticketRef} data={receipt} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-3 border-b border-border py-1 last:border-0 last:pb-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="min-w-0 break-words text-right font-bold text-primary">{value}</span>
    </div>
  );
}

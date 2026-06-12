import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { formatBRL, padNumber } from "@/lib/format";
import { CheckCircle2, Heart, ArrowLeft, Sparkles, Download, Share2, Ticket } from "lucide-react";
import { getOrderPublic } from "@/lib/api/order.functions";
import { ReceiptTicket, type ReceiptData } from "@/components/ReceiptTicket";

export const Route = createFileRoute("/confirmacao/$orderId")({
  component: ConfirmationPage,
});

function fireConfetti() {
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
  const [generating, setGenerating] = useState(false);
  const fired = useRef(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const o = await getOrderPublic({ data: { orderId } });
      if (!o) return;
      setSlug(o.campaign_slug);
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
            title: "Meu bilhete da sorte",
            text: `Acabei de garantir meus números na rifa "${receipt.campaignName}"! 🍀`,
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

  if (!receipt) return <div className="flex min-h-[50vh] items-center justify-center">...</div>;

  const firstName = receipt.buyerName.split(" ")[0];

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="mx-auto max-w-xl px-6 py-16 relative z-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-premium">
          <div className="relative bg-gradient-to-br from-success/10 via-primary/5 to-gold/10 p-12 text-center">
            <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 backdrop-blur-sm shadow-sm">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">Boa sorte!</span>
            </div>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-md border border-success/10 animate-scale-in">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h1 className="mt-8 text-3xl font-black text-primary animate-fade-in">
              Parabéns, {firstName}! 🎉
            </h1>
            <p className="mt-3 text-base font-semibold text-primary/80 animate-fade-in">
              Sua participação está confirmada
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-sm mx-auto animate-fade-in">
              Muito obrigado por acreditar e fazer parte dessa corrente do bem.
              Cada número comprado se transforma em <strong className="text-success">esperança e oportunidade</strong> para
              quem mais precisa. Que a sorte esteja com você <Heart className="inline h-3.5 w-3.5 fill-success text-success" />
            </p>
          </div>

          <div className="p-8 md:p-12 space-y-6">
            {/* CTA bilhete — bem chamativo */}
            <button
              onClick={handleReceipt}
              disabled={generating}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold p-[2px] shadow-[0_12px_40px_-8px_rgba(245,197,24,0.6)] transition-all hover:shadow-[0_18px_50px_-8px_rgba(245,197,24,0.8)] active:scale-[0.98] disabled:opacity-70"
            >
              <span className="flex h-16 w-full items-center justify-center gap-3 rounded-[14px] bg-gradient-to-r from-primary to-primary/90 px-6 text-base font-black uppercase tracking-wide text-white">
                <Ticket className="h-5 w-5" />
                {generating ? "Gerando seu bilhete..." : "Emitir bilhete comprovante"}
                {!generating && <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />}
              </span>
              <span className="pointer-events-none absolute -top-1 -right-1 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-md">
                <Share2 className="h-2.5 w-2.5" /> Baixar/Compartilhar
              </span>
            </button>

            <div className="space-y-4 rounded-2xl border border-black/[0.03] bg-secondary/30 p-6 text-sm">
              <Row label="Campanha" value={receipt.campaignName} />
              <Row label="Comprador" value={receipt.buyerName} />
              <Row label="Números da sorte" value={<span className="font-bold text-primary">{receipt.numbers.map(n => padNumber(n, receipt.numberTotal)).join(", ")}</span>} />
              <Row label="Valor" value={<span className="font-bold text-primary">{formatBRL(receipt.amount)}</span>} />
            </div>

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
              <Link
                to="/campanha/$slug"
                params={{ slug }}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-sm font-bold text-white shadow-premium transition-all hover:bg-primary/90 active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para a campanha
              </Link>
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
    <div className="flex justify-between items-start py-1 border-b border-black/[0.03] last:border-0 last:pb-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-right text-primary font-bold max-w-[60%]">{value}</span>
    </div>
  );
}

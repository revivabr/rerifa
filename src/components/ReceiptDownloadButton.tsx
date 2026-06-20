import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptTicket, type ReceiptData } from "@/components/ReceiptTicket";

type Props = {
  data: ReceiptData;
  label?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default" | "icon";
  iconOnly?: boolean;
  title?: string;
};

export function ReceiptDownloadButton({
  data,
  label = "Comprovante",
  variant = "outline",
  size = "sm",
  iconOnly = false,
  title = "Baixar comprovante de doação",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const fileName = `bilhete-${data.campaignName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${data.orderId.slice(0, 8)}.png`;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Comprovante baixado!");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o comprovante.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className="h-8 gap-1.5"
        onClick={handle}
        disabled={busy}
        title={title}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {!iconOnly && <span className="text-xs font-semibold">{label}</span>}
      </Button>
      <div
        style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none", opacity: 0 }}
        aria-hidden
      >
        <ReceiptTicket ref={ref} data={data} />
      </div>
    </>
  );
}

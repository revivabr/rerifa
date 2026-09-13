import { useState } from "react";
import { Mail, Copy, Check, Share2, Instagram } from "lucide-react";
import { toast } from "sonner";
import type { PromotionTier } from "@/lib/promotions";
import { buildCampaignShareMessage, campaignPublicUrl } from "@/lib/share";

type Props = {
  campaignName: string;
  slug: string;
  price: number;
  endDate: string;
  shortDescription?: string | null;
  promotions?: PromotionTier[];
  bannerUrl?: string | null;
};

export function ShareCampaign({ campaignName, slug, price, endDate, shortDescription, promotions = [], bannerUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const url = campaignPublicUrl(slug);
  const message = buildCampaignShareMessage({ campaignName, slug, price, endDate, shortDescription, promotions });

  const subject = `Participe da Rifa Solidária — ${campaignName}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  const instagramUrl = `https://www.instagram.com/`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Texto copiado! Cole no Instagram ou onde quiser.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  async function handleInstagram() {
    await copyToClipboard();
    window.open(instagramUrl, "_blank", "noopener,noreferrer");
  }

  async function fetchBannerFile(): Promise<File | null> {
    if (!bannerUrl) return null;
    try {
      const response = await fetch(bannerUrl);
      const blob = await response.blob();
      return new File([blob], `${slug}.jpg`, { type: blob.type || "image/jpeg" });
    } catch {
      return null;
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      copyToClipboard();
      return;
    }
    const file = await fetchBannerFile();
    const filesPayload = file && navigator.canShare?.({ files: [file] }) ? { files: [file] } : {};
    try {
      await navigator.share({ title: subject, text: message, url, ...filesPayload });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <section className="rounded-[2rem] border border-black/[0.05] bg-gradient-to-br from-primary/5 via-white to-gold/5 p-6 md:p-10 shadow-2xl">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <Share2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Convite</span>
        </div>
        <h2 className="mt-4 text-2xl md:text-3xl font-extrabold text-primary leading-tight">
          Ajude-nos a divulgar essa campanha
        </h2>
        <p className="mt-3 max-w-xl text-sm md:text-base leading-relaxed text-muted-foreground">
          Cada compartilhamento aproxima a gente da meta e transforma a vida de mais famílias.
          Convide seus amigos, familiares e colegas para fazer parte dessa corrente do bem! 💙
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          <ShareBubble
            label="WhatsApp"
            onClick={() => window.open(whatsappUrl, "_blank")}
            className="bg-[#25D366] hover:bg-[#1DA851] shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)]"
          >
            <WhatsappIcon />
          </ShareBubble>

          <ShareBubble
            label="Instagram"
            onClick={handleInstagram}
            className="bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] hover:opacity-90 shadow-[0_10px_30px_-10px_rgba(214,41,118,0.55)]"
          >
            <Instagram className="h-7 w-7 text-white" strokeWidth={2.2} />
          </ShareBubble>

          <ShareBubble
            label="E-mail"
            href={emailUrl}
            className="bg-primary hover:bg-primary/90 shadow-[0_10px_30px_-10px_rgba(43,75,235,0.6)]"
          >
            <Mail className="h-7 w-7 text-white" strokeWidth={2.2} />
          </ShareBubble>

          <ShareBubble
            label={copied ? "Copiado!" : "Copiar"}
            onClick={copyToClipboard}
            className="bg-stone-800 hover:bg-stone-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
          >
            {copied ? <Check className="h-7 w-7 text-white" strokeWidth={2.5} /> : <Copy className="h-6 w-6 text-white" strokeWidth={2.2} />}
          </ShareBubble>
        </div>

        <button
          type="button"
          onClick={nativeShare}
          className="mt-6 text-xs font-bold uppercase tracking-widest text-primary/70 hover:text-primary transition-colors"
        >
          Ou use o compartilhamento do seu dispositivo →
        </button>

        <div className="mt-8 w-full max-w-2xl rounded-2xl border border-dashed border-primary/20 bg-white/60 p-4 text-left backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Pré-visualização da mensagem
          </p>
          <p className="whitespace-pre-line text-xs leading-relaxed text-stone-700 line-clamp-6">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}

function ShareBubble({
  children,
  label,
  href,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${className}`}
      >
        {children}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 group-hover:text-primary transition-colors">
        {label}
      </span>
    </>
  );

  const base = "group flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base}>
      {content}
    </button>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
      <path d="M19.05 4.91A10 10 0 0 0 4.1 18.36L3 22l3.74-1.08a10 10 0 0 0 4.78 1.22h.01a10 10 0 0 0 7.52-17.23ZM11.54 20.3h-.01a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-2.22.64.66-2.17-.2-.31a8.3 8.3 0 1 1 6.3 3.18Zm4.55-6.22c-.25-.13-1.47-.73-1.7-.81-.23-.08-.4-.13-.56.13-.16.25-.64.81-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.24a7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48a.92.92 0 0 0-.67.31 2.8 2.8 0 0 0-.88 2.08c0 1.22.9 2.4 1.02 2.57.13.16 1.77 2.7 4.28 3.78.6.26 1.06.42 1.43.54.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.11-.23-.18-.48-.31Z" />
    </svg>
  );
}

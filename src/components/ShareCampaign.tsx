import { Share2 } from "lucide-react";
import type { PromotionTier } from "@/lib/promotions";
import { buildCampaignShareMessage } from "@/lib/share";
import { ShareButtons } from "@/components/ShareButtons";

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
  const message = buildCampaignShareMessage({ campaignName, slug, price, endDate, shortDescription, promotions });

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

        <div className="mt-8">
          <ShareButtons
            campaignName={campaignName}
            slug={slug}
            price={price}
            endDate={endDate}
            shortDescription={shortDescription}
            promotions={promotions}
            bannerUrl={bannerUrl}
            size="compact"
          />
        </div>

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

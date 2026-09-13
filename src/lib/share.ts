import { formatBRL, formatCalendarDateBR } from "@/lib/format";
import type { PromotionTier } from "@/lib/promotions";

export function campaignPublicUrl(slug: string): string {
  return `https://rifa.revivabrasil.com.br/campanha/${slug}`;
}

export function buildCampaignShareMessage({
  campaignName,
  slug,
  price,
  endDate,
  shortDescription,
  promotions = [],
}: {
  campaignName: string;
  slug: string;
  price: number;
  endDate: string;
  shortDescription?: string | null;
  promotions?: PromotionTier[];
}): string {
  const activePromotions = promotions.filter((promotion) => promotion.active !== false);
  const promotionLines = activePromotions
    .map((promotion) => {
      const savings = Number(price) * promotion.quantity - Number(promotion.promotional_price);
      const savingsText = savings > 0 ? ` (economize ${formatBRL(savings)})` : "";
      return `🎁 ${promotion.quantity} números por ${formatBRL(promotion.promotional_price)}${savingsText}`;
    })
    .join("\n");

  return (
    `🎟️ *${campaignName}*\n\n` +
    `${shortDescription ? `${shortDescription}\n\n` : ""}` +
    `Participe dessa corrente do bem! Cada número ajuda a Associação Reviva Brasil a *Restaurar Vidas e Transformar Histórias*. 💙\n\n` +
    `💰 Número: ${formatBRL(price)}\n` +
    `${promotionLines ? `${promotionLines}\n` : ""}` +
    `🗓️ Sorteio: ${formatCalendarDateBR(endDate)}\n\n` +
    `Garanta seus números agora:\n` +
    `${campaignPublicUrl(slug)}\n\n` +
    `#RifaSolidária #RevivaBrasil 🙏`
  );
}

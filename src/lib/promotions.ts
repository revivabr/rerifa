export type PromotionTier = {
  id?: string;
  quantity: number;
  promotional_price: number;
  active?: boolean;
};

export function getExactPromotion(promotions: PromotionTier[], quantity: number) {
  return promotions.find((promotion) => promotion.active !== false && promotion.quantity === quantity) ?? null;
}

export function calculateCampaignPrice(unitPrice: number, quantity: number, promotions: PromotionTier[]) {
  const listAmount = Number((unitPrice * quantity).toFixed(2));
  const promotion = getExactPromotion(promotions, quantity);
  const amount = promotion ? Number(promotion.promotional_price) : listAmount;

  return {
    amount,
    listAmount,
    savings: Number(Math.max(0, listAmount - amount).toFixed(2)),
    promotion,
  };
}
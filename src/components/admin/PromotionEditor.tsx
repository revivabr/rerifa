import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import type { PromotionTier } from "@/lib/promotions";

type Props = {
  promotions: PromotionTier[];
  unitPrice: number;
  onChange: (promotions: PromotionTier[]) => void;
};

export function PromotionEditor({ promotions, unitPrice, onChange }: Props) {
  function update(index: number, field: "quantity" | "promotional_price", value: number) {
    onChange(promotions.map((promotion, current) => current === index ? { ...promotion, [field]: value } : promotion));
  }

  return (
    <div className="md:col-span-2 space-y-4 border-t border-border pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-primary"><Tag className="h-4 w-4 text-gold" /> Promoções por quantidade</h3>
          <p className="mt-1 text-xs text-muted-foreground">O desconto vale somente para a quantidade exata cadastrada.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...promotions, { quantity: 2, promotional_price: 0, active: true }])}>
          <Plus className="mr-1.5 h-4 w-4" /> Adicionar oferta
        </Button>
      </div>

      {promotions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-5 text-center text-sm text-muted-foreground">Nenhuma promoção cadastrada.</div>
      ) : (
        <div className="space-y-3">
          {promotions.map((promotion, index) => {
            const regular = Number(promotion.quantity || 0) * Number(unitPrice || 0);
            const savings = Math.max(0, regular - Number(promotion.promotional_price || 0));
            return (
              <div key={promotion.id ?? index} className="grid items-end gap-3 rounded-xl border border-border bg-secondary/20 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <Label htmlFor={`promotion-quantity-${index}`}>Quantidade exata</Label>
                  <Input id={`promotion-quantity-${index}`} type="number" min={2} step={1} value={promotion.quantity || ""} onChange={(event) => update(index, "quantity", Number(event.target.value))} />
                </div>
                <div>
                  <Label htmlFor={`promotion-price-${index}`}>Preço total promocional (R$)</Label>
                  <Input id={`promotion-price-${index}`} type="number" min={0.01} step="0.01" value={promotion.promotional_price || ""} onChange={(event) => update(index, "promotional_price", Number(event.target.value))} />
                  {regular > 0 && promotion.promotional_price > 0 && (
                    <p className={`mt-1 text-xs ${savings > 0 ? "text-success" : "text-destructive"}`}>
                      {savings > 0 ? `Economia de ${formatBRL(savings)}` : "O preço deve ser menor que o valor normal."}
                    </p>
                  )}
                </div>
                <Button type="button" variant="outline" size="icon" className="text-destructive" onClick={() => onChange(promotions.filter((_, current) => current !== index))} aria-label="Remover promoção">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
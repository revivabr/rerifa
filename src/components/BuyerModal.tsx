import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatBRL, formatWhatsapp } from "@/lib/format";

export function BuyerModal({
  open, onOpenChange, onSubmit, submitting, total, count,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: { name: string; email: string; whatsapp: string; sellerName: string }) => void;
  submitting: boolean;
  total: number;
  count: number;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [agree, setAgree] = useState(false);

  const canSubmit = name.trim().length >= 3 && whatsapp.replace(/\D/g, "").length >= 10 && agree && !submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Seus dados</DialogTitle>
          <DialogDescription>
            {count} {count === 1 ? "número" : "números"} · Total <strong className="text-primary">{formatBRL(total)}</strong>
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit({ name: name.trim(), email: email.trim(), whatsapp, sellerName: sellerName.trim() }); }}
        >
          <div>
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="João da Silva" required />
          </div>
          <div>
            <Label htmlFor="wa">WhatsApp *</Label>
            <Input id="wa" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))} placeholder="(17) 99999-9999" inputMode="tel" required />
          </div>
          <div>
            <Label htmlFor="email">E-mail (recomendado)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-semibold">Indicação</span>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <Label htmlFor="sellerName" className="text-primary font-bold">Quem te vendeu? (Vendedor)</Label>
            <Input 
              id="sellerName" 
              value={sellerName} 
              onChange={(e) => setSellerName(e.target.value)} 
              placeholder="Nome do vendedor (opcional)"
              className="mt-1.5 border-primary/20 focus-visible:ring-primary/30"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">Preencha se alguém te indicou esta campanha.</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary p-3 text-sm">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} className="mt-0.5" />
            <span className="text-muted-foreground">
              Autorizo a Associação Reviva Brasil a utilizar meus dados para identificação da minha participação,
              confirmação de pagamento e comunicação sobre o sorteio.
            </span>
          </label>
          <Button type="submit" disabled={!canSubmit} className="w-full bg-gradient-primary text-base font-bold" size="lg">
            {submitting ? "Gerando PIX…" : "Gerar PIX"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

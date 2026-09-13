import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatBRL, formatWhatsapp } from "@/lib/format";

export function BuyerModal({
  open, onOpenChange, onSubmit, submitting, total, count, listTotal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: { name: string; email: string; whatsapp: string; sellerName: string }) => void;
  submitting: boolean;
  total: number;
  listTotal?: number;
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
      <DialogContent className="max-h-[92vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border-none p-5 shadow-premium sm:max-w-md sm:rounded-3xl sm:p-8">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold text-primary sm:text-3xl">Seus Dados</DialogTitle>
          <DialogDescription className="text-sm">
            {count} {count === 1 ? "número" : "números"} · Total {listTotal && listTotal > total ? <><span className="line-through">{formatBRL(listTotal)}</span> <strong className="text-success">{formatBRL(total)}</strong></> : <strong className="text-primary">{formatBRL(total)}</strong>}
          </DialogDescription>
        </DialogHeader>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit({ name: name.trim(), email: email.trim(), whatsapp, sellerName: sellerName.trim() }); }}
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nome completo *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="João da Silva" className="rounded-xl border-border bg-secondary/50" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">WhatsApp *</Label>
            <Input id="wa" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))} placeholder="(17) 99999-9999" inputMode="tel" className="rounded-xl border-border bg-secondary/50" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">E-mail (opcional)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="rounded-xl border-border bg-secondary/50" />
          </div>

          <div className="py-2">
            <div className="relative flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="bg-white px-2">Indicação</span>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4">
              <Label htmlFor="sellerName" className="text-xs font-bold text-primary">Quem te indicou?</Label>
              <Input 
                id="sellerName" 
                value={sellerName} 
                onChange={(e) => setSellerName(e.target.value)} 
                placeholder="Nome do vendedor (opcional)"
                className="mt-2 rounded-lg border-primary/10 bg-white"
              />
            </div>
          </div>
          
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary/50 p-4 text-[11px] leading-relaxed text-muted-foreground">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} className="mt-0.5" />
            <span>
              Ao continuar, você concorda com o uso de seus dados para fins de processamento da rifa e comunicação oficial.
            </span>
          </label>
          <Button type="submit" disabled={!canSubmit} className="h-14 w-full rounded-2xl bg-primary text-white text-sm font-black shadow-premium transition-all duration-500 hover:bg-primary/90" size="lg">
            {submitting ? "Gerando PIX…" : "Gerar PIX"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
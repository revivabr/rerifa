import { forwardRef } from "react";
import { formatBRL, padNumber, formatDateBR, formatWhatsapp } from "@/lib/format";
import logoAsset from "@/assets/logo-reviva-color.png.asset.json";
import { Heart, Ticket } from "lucide-react";

export type ReceiptData = {
  orderId: string;
  campaignName: string;
  bannerUrl: string | null;
  buyerName: string;
  buyerWhatsapp: string | null;
  numbers: number[];
  numberTotal: number;
  amount: number;
  paidAt: string | null;
};

export const ReceiptTicket = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: 720, fontFamily: "'Inter', system-ui, sans-serif" }}
        className="bg-white overflow-hidden rounded-[28px] shadow-2xl border border-black/[0.04]"
      >
        {/* Banner */}
        <div className="relative w-full bg-stone-100" style={{ aspectRatio: "16 / 9" }}>
          {data.bannerUrl && (
            <img
              src={data.bannerUrl}
              alt={data.campaignName}
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                <Ticket className="h-3 w-3" /> Bilhete da sorte
              </span>
              <h2 className="mt-2 text-2xl font-black text-white drop-shadow-md">
                {data.campaignName}
              </h2>
            </div>
            <img
              src={logoAsset.url}
              alt="Reviva"
              crossOrigin="anonymous"
              style={{ height: 56 }}
              className="drop-shadow-lg"
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Gratitude */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-gold/5 to-success/5 p-5 text-center">
            <div className="inline-flex items-center gap-2 text-primary">
              <Heart className="h-4 w-4 fill-success text-success" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                Gratidão
              </span>
              <Heart className="h-4 w-4 fill-success text-success" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-primary/80">
              Obrigado, <strong className="text-primary">{data.buyerName.split(" ")[0]}</strong>,
              por fazer parte dessa corrente do bem. Sua participação transforma vidas e
              espalha esperança. <span className="whitespace-nowrap">Boa sorte! 🍀</span>
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Comprador" value={data.buyerName} />
            <Field
              label="WhatsApp"
              value={data.buyerWhatsapp ? formatWhatsapp(data.buyerWhatsapp) : "—"}
            />
            <Field
              label="Data"
              value={formatDateBR(data.paidAt ?? new Date().toISOString())}
            />
            <Field label="Valor pago" value={formatBRL(data.amount)} highlight />
          </div>

          {/* Numbers */}
          <div className="rounded-2xl border border-black/[0.06] bg-secondary/30 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Seus números da sorte ({data.numbers.length})
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.numbers.map((n) => (
                <span
                  key={n}
                  className="inline-flex h-11 min-w-[52px] items-center justify-center rounded-xl bg-primary px-3 text-base font-black tabular-nums text-white shadow-sm"
                >
                  {padNumber(n, data.numberTotal)}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-dashed border-black/10 pt-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Código do bilhete
              </p>
              <p className="font-mono text-[11px] font-bold text-primary">
                {data.orderId.slice(0, 8).toUpperCase()}-{data.orderId.slice(-4).toUpperCase()}
              </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Reviva Brasil · rifa.revivabrasil.com.br
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptTicket.displayName = "ReceiptTicket";

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold ${
          highlight ? "text-success text-base" : "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

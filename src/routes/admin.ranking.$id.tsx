import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Crown, Trophy, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { formatBRL, padNumber } from "@/lib/format";

export const Route = createFileRoute("/admin/ranking/$id")({
  component: RankingPage,
});

type Row = {
  seller: string;
  numbers: number[];
  total: number;
  amount: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playApplause() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const duration = 3.5;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // burst noise envelope to mimic applause
      const t = i / ctx.sampleRate;
      const env = Math.min(1, t * 4) * Math.exp(-t * 0.6);
      data[i] = (Math.random() * 2 - 1) * env * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2500;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    src.onended = () => ctx.close();
  } catch {}
}

function fireConfetti() {
  const end = Date.now() + 2500;
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#34D399"];
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 80, origin: { x: 0 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 80, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, colors });
}

function RankingPage() {
  const { id } = Route.useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: camp }, { data: orders }] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("orders")
          .select("seller_name, amount, order_numbers(number)")
          .eq("campaign_id", id)
          .eq("status", "paid")
          .not("seller_name", "is", null),
      ]);

      setCampaign(camp);

      const grouped: Record<string, Row> = {};
      (orders ?? []).forEach((o: any) => {
        const name = (o.seller_name || "").trim();
        if (!name) return;
        if (!grouped[name]) grouped[name] = { seller: name, numbers: [], total: 0, amount: 0 };
        const nums = (o.order_numbers ?? []).map((x: any) => x.number);
        grouped[name].numbers.push(...nums);
        grouped[name].total += nums.length;
        grouped[name].amount += Number(o.amount || 0);
      });

      // shuffle numbers display (random order) per seller
      const list = Object.values(grouped).map((r) => ({ ...r, numbers: shuffle(r.numbers) }));
      // table order also random
      setRows(shuffle(list));
      setLoading(false);
    })();
  }, [id]);

  const topSeller = useMemo(() => {
    if (rows.length === 0) return null;
    return [...rows].sort((a, b) => b.total - a.total || b.amount - a.amount)[0];
  }, [rows]);

  const numberWidth = campaign?.number_quantity ?? 100;

  const reveal = () => {
    if (!topSeller) return;
    setShowModal(true);
    setTimeout(() => {
      fireConfetti();
      playApplause();
    }, 150);
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/ranking" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-premium">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary">Ranking de Vendedores</h1>
          <p className="text-sm text-muted-foreground">{campaign?.name}</p>
        </div>
      </div>

      {/* Animated CTA */}
      <div className="flex justify-center">
        <button
          onClick={reveal}
          disabled={!topSeller}
          className="animated-border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="slow-pulse flex items-center gap-3 rounded-[0.85rem] bg-gradient-to-br from-primary to-primary-glow px-8 py-4 text-lg font-black text-white">
            <Trophy className="h-6 w-6 text-yellow-300" />
            Melhor Vendedor
            <Sparkles className="h-5 w-5 text-yellow-300" />
          </span>
        </button>
      </div>


      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando ranking...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          Nenhuma venda registrada ainda.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-premium">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-primary">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Vendedor</th>
                <th className="px-4 py-3 text-left font-bold">Números vendidos</th>
                <th className="px-4 py-3 text-right font-bold">Qtd</th>
                <th className="px-4 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.seller} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3 font-semibold text-foreground">{r.seller}</td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[480px] flex-wrap gap-1">
                      {r.numbers.map((n, i) => (
                        <span key={`${n}-${i}`} className="inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-md bg-primary/10 px-1.5 text-[11px] font-bold text-primary">
                          {padNumber(n, numberWidth)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">{r.total}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatBRL(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg p-0 border-0 bg-transparent shadow-none">
          <div className="animated-border rounded-3xl">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 14 }}
              className="rounded-[1.35rem] bg-gradient-to-br from-primary via-primary to-primary-glow p-8 text-center text-white"
            >

              <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 shadow-2xl">
                <Crown className="h-10 w-10 text-white" />
              </div>


              <h2 className="text-3xl font-black tracking-tight">🎉 PARABÉNS! 🎉</h2>
              <p className="mt-2 text-sm uppercase tracking-widest text-white/70">Melhor vendedor da campanha</p>

              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="my-5 bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-300 bg-clip-text text-4xl font-black text-transparent"
              >
                {topSeller?.seller}
              </motion.p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase text-white/60">Vendas</p>
                  <p className="text-3xl font-black text-yellow-300">{topSeller?.total ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase text-white/60">Arrecadado</p>
                  <p className="text-2xl font-black text-emerald-300">{formatBRL(topSeller?.amount ?? 0)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-black/20 p-4 text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/70">Números vendidos</p>
                <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
                  {topSeller?.numbers.map((n, i) => (
                    <span key={`${n}-${i}`} className="inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-md bg-yellow-300/90 px-1.5 text-[11px] font-black text-primary">
                      {padNumber(n, numberWidth)}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-primary hover:bg-yellow-200"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

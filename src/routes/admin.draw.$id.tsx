import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Trophy, Play, RefreshCw, Sparkles, Gift } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { padNumber } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/draw/$id")({
  component: RaffleDraw,
});

type SoldNumber = { number: number; buyer_id: string; buyer_name: string; buyer_whatsapp: string | null };
type Prize = { title: string; description: string | null; image_url: string | null; position: number };

function RaffleDraw() {
  const { id } = Route.useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [soldNumbers, setSoldNumbers] = useState<SoldNumber[]>([]);
  const [allNumbers, setAllNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [winner, setWinner] = useState<SoldNumber | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const drawIntervalRef = useRef<number | null>(null);
  const drawTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const [{ data: camp }, { data: nums }, { data: prizes }, { data: sessionData }] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", id).maybeSingle(),
        supabase.from("raffle_numbers").select("number, buyer_id, status, buyers(name, whatsapp)").eq("campaign_id", id),
        supabase.from("campaign_prizes").select("title, description, image_url, position").eq("campaign_id", id).order("position"),
        supabase.auth.getSession(),
      ]);

      if (camp) {
        setCampaign(camp);
        const total = camp.number_quantity as number;
        setAllNumbers(Array.from({ length: total }, (_, i) => i + 1));
      }

      const sold = (nums ?? [])
        .filter((n: any) => n.status === "sold")
        .map((n: any) => ({
          number: n.number,
          buyer_id: n.buyer_id,
          buyer_name: n.buyers?.name || "Comprador",
          buyer_whatsapp: n.buyers?.whatsapp ?? null,
        }));
      setSoldNumbers(sold);

      if (prizes && prizes.length > 0) setPrize(prizes[0] as Prize);

      if (sessionData?.session) {
        const { data: admin } = await supabase
          .from("admin_users").select("id").eq("auth_user_id", sessionData.session.user.id).maybeSingle();
        if (admin) setAdminId(admin.id);
      }

      setIsLoading(false);
    })();

    return () => {
      if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
      if (drawTimeoutRef.current) clearTimeout(drawTimeoutRef.current);
    };
  }, [id]);

  const soldSet = new Set(soldNumbers.map((s) => s.number));

  const startDraw = () => {
    if (soldNumbers.length === 0) {
      toast.error("Não há números vendidos para sortear.");
      return;
    }
    setWinner(null);
    setSaved(false);
    setShowModal(false);
    setIsDrawing(true);

    // Pré-decide o vencedor (justo: random uniforme sobre vendidos)
    const winnerIndex = Math.floor(Math.random() * soldNumbers.length);
    const finalWinner = soldNumbers[winnerIndex];

    // 30s a 100ms = 300 flashes
    drawIntervalRef.current = window.setInterval(() => {
      const r = Math.floor(Math.random() * soldNumbers.length);
      setHighlight(soldNumbers[r].number);
    }, 100);

    drawTimeoutRef.current = window.setTimeout(() => {
      if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
      setHighlight(finalWinner.number);
      setWinner(finalWinner);
      setIsDrawing(false);
      setShowModal(true);
      fireConfetti();
    }, 30000);
  };

  const fireConfetti = () => {
    const duration = 6000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors: ["#1A3C23", "#C5A059", "#D4AF37", "#2D5F3A"] });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors: ["#1A3C23", "#C5A059", "#D4AF37", "#2D5F3A"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const saveResult = async () => {
    if (!winner || saved) return;
    const { error } = await supabase.from("draws").insert({
      campaign_id: id,
      winner_number: winner.number,
      winner_buyer_id: winner.buyer_id,
      eligible_numbers_count: soldNumbers.length,
      draw_method: "Sistema Aleatório",
      drawn_at: new Date().toISOString(),
      drawn_by: adminId,
    });
    if (error) toast.error("Erro: " + error.message);
    else { setSaved(true); toast.success("Resultado salvo!"); }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-sand"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const total = campaign?.number_quantity ?? 0;
  const pad = (n: number) => padNumber(n, total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-primary text-white relative overflow-hidden">
      {/* Decoração festiva */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-gold blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-gold-glow blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 h-24 w-24 rounded-full bg-white blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <Link to="/admin/draw" className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-8">
        {/* Header festivo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/20 border border-gold/40 backdrop-blur text-gold-glow text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> Sorteio Oficial <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-lg">{campaign?.name}</h1>
          <p className="text-white/80 text-sm md:text-base">
            <strong className="text-gold-glow">{soldNumbers.length}</strong> de {total} números vendidos
          </p>
        </motion.div>

        {/* Botão de iniciar — borda animada, conteúdo com pulso lento */}
        {!winner && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center">
            <button
              onClick={startDraw}
              disabled={isDrawing || soldNumbers.length === 0}
              className="animated-border disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="slow-pulse flex items-center gap-3 rounded-[0.85rem] bg-success px-10 md:px-14 h-16 md:h-20 text-white text-lg md:text-2xl font-black">
                <Play className="h-6 w-6 md:h-7 md:w-7 fill-current" />
                {isDrawing ? "Sorteando..." : "Iniciar o Sorteio"}
              </span>
            </button>
          </motion.div>
        )}


        {/* Número em destaque durante o sorteio */}
        {isDrawing && highlight !== null && (
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex justify-center">
            <div className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur border-2 border-gold-glow shadow-2xl">
              <div className="text-6xl md:text-8xl font-black tabular-nums text-gold-glow drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]">
                {pad(highlight)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabela de números */}
        <div className="bg-white/95 backdrop-blur rounded-3xl p-4 md:p-6 shadow-2xl">
          <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(15,minmax(0,1fr))] lg:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5 md:gap-2">
            {allNumbers.map((n) => {
              const sold = soldSet.has(n);
              const isHighlight = highlight === n && isDrawing;
              const isWinnerN = winner?.number === n;
              return (
                <div
                  key={n}
                  className={cn(
                    "aspect-square rounded-md md:rounded-lg flex items-center justify-center text-[10px] md:text-xs font-bold tabular-nums transition-all duration-75 select-none",
                    !sold && "bg-gray-100 text-gray-300",
                    sold && !isHighlight && !isWinnerN && "bg-foreground text-white",
                    isHighlight && !isWinnerN && "bg-gold text-white scale-125 shadow-[0_0_20px_rgba(212,175,55,0.9)] z-10",
                    isWinnerN && "bg-success text-white scale-150 shadow-[0_0_30px_rgba(5,150,105,0.9)] ring-2 ring-white z-20 animate-pulse",
                  )}
                >
                  {pad(n)}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-foreground" /> Vendido</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gray-200" /> Disponível</span>
          </div>
        </div>
      </div>

      {/* Modal do ganhador */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-white to-secondary border-4 border-gold p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gold to-gold-glow p-1.5" />
          <div className="p-6 md:p-8 space-y-5 text-center">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }} className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-gold to-gold-glow flex items-center justify-center shadow-xl">
              <Trophy className="h-10 w-10 text-white" />
            </motion.div>

            <div className="space-y-2">
              <p className="text-gold font-bold uppercase tracking-widest text-xs">🎉 Temos um vencedor! 🎉</p>
              <h2 className="text-2xl md:text-3xl font-black text-primary leading-tight">
                Parabéns, {winner?.buyer_name}!
              </h2>
              <p className="text-foreground/80 text-sm md:text-base">Seu número foi sorteado:</p>
            </div>

            {winner && (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} className="flex justify-center">
                <div className="px-8 py-4 rounded-2xl bg-success text-white text-5xl md:text-6xl font-black tabular-nums shadow-xl border-4 border-white">
                  {pad(winner.number)}
                </div>
              </motion.div>
            )}

            <p className="text-lg font-bold text-primary">O prêmio é todo seu! 🏆</p>

            {prize && (
              <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
                {prize.image_url && (
                  <img src={prize.image_url} alt={prize.title} className="w-full h-48 object-cover rounded-xl" />
                )}
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Gift className="h-5 w-5" />
                  <span className="font-bold">{prize.title}</span>
                </div>
                {prize.description && <p className="text-xs text-muted-foreground">{prize.description}</p>}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={saveResult} disabled={saved} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl">
                {saved ? "✓ Salvo" : "Salvar Resultado"}
              </Button>
              <Button onClick={() => { setShowModal(false); setWinner(null); setHighlight(null); }} variant="outline" className="flex-1 font-bold h-12 rounded-xl">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

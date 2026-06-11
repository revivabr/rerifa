import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Play, RefreshCw, Star, Share2, Download, Calendar, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { formatDateBR, padNumber } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/draw/$id")({
  component: RaffleDraw,
});

type SoldNumber = {
  number: number;
  buyer_id: string;
  buyer_name: string;
};

function RaffleDraw() {
  const { id } = Route.useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [soldNumbers, setSoldNumbers] = useState<SoldNumber[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<string | null>(null);
  const [winner, setWinner] = useState<{ number: number; name: string; date: Date } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data: camp } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
      if (!camp) return;
      setCampaign(camp);

      const { data: nums, error } = await supabase
        .from("raffle_numbers")
        .select("number, buyer_id, buyers(name)")
        .eq("campaign_id", id)
        .eq("status", "sold");

      if (error) {
        toast.error("Erro ao carregar números vendidos");
      } else {
        const mapped = (nums || []).map((n: any) => ({
          number: n.number,
          buyer_id: n.buyer_id,
          buyer_name: n.buyers?.name || "Comprador Desconhecido"
        }));
        setSoldNumbers(mapped);
      }

      // Fetch admin user id for the draw record
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: admin } = await supabase
          .from("admin_users")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();
        if (admin) setAdminId(admin.id);
      }

      setIsLoading(false);
    }
    load();
  }, [id]);

  const [adminId, setAdminId] = useState<string | null>(null);

  const startDraw = () => {
    if (soldNumbers.length === 0) {
      toast.error("Não há números vendidos para sortear.");
      return;
    }

    setIsDrawing(true);
    setWinner(null);
    
    // Iniciar animação de números aleatórios
    let count = 0;
    const totalDuration = 5000; // 5 segundos
    const intervalTime = 50;
    const maxSteps = totalDuration / intervalTime;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * soldNumbers.length);
      const randomNum = soldNumbers[randomIndex].number;
      setDisplayNumber(padNumber(randomNum, campaign.number_quantity));
      
      count++;
      if (count >= maxSteps) {
        clearInterval(interval);
        finalizeDraw();
      }
    }, intervalTime);
  };

  const finalizeDraw = () => {
    const winnerIndex = Math.floor(Math.random() * soldNumbers.length);
    const winningData = soldNumbers[winnerIndex];
    
    const winDate = new Date();
    setDisplayNumber(padNumber(winningData.number, campaign.number_quantity));
    setWinner({
      number: winningData.number,
      name: winningData.buyer_name,
      date: winDate
    });
    setIsDrawing(false);

    // Explosão de confetes festiva
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    toast.success("Temos um ganhador!", { icon: "🎉" });
  };

  const saveResult = async () => {
    if (!winner || !campaign) return;

    const { error } = await supabase.from("draws").insert({
      campaign_id: id,
      winner_number: winner.number,
      winner_buyer_id: soldNumbers.find(s => s.number === winner.number)?.buyer_id,
      eligible_numbers_count: soldNumbers.length,
      draw_method: "Sistema Aleatório",
      drawn_at: winner.date.toISOString(),
      drawn_by: adminId
    });

    if (error) {
      toast.error("Erro ao salvar resultado: " + error.message);
    } else {
      toast.success("Resultado salvo com sucesso!");
    }
  };

  const shareResult = async () => {
    if (!winner || !campaign) return;
    
    const text = `🎉 GANHADOR DO SORTEIO! 🎉\n\nCampanha: ${campaign.name}\nNúmero: ${padNumber(winner.number, campaign.number_quantity)}\nGanhador: ${winner.name}\nData: ${formatDateBR(winner.date)}\n\nParabéns! 🏆`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ganhador do Sorteio',
          text: text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Resultado copiado para a área de transferência!");
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 flex flex-col items-center justify-center overflow-hidden">
      <Link 
        to="/admin/campaigns/$id" 
        params={{ id }} 
        className="absolute top-8 left-8 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
      </Link>

      <div className="max-w-4xl w-full space-y-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-bold uppercase tracking-widest">
            <Star className="h-4 w-4 fill-current" /> Sorteio Oficial <Star className="h-4 w-4 fill-current" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            {campaign?.name}
          </h1>
          <p className="text-zinc-400 font-medium">
            Sorteando entre <span className="text-white font-bold">{soldNumbers.length}</span> números vendidos
          </p>
        </motion.div>

        <div className="relative py-20 flex justify-center">
          {/* Slot Machine Container */}
          <div className="relative bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-6 shadow-2xl flex items-center justify-center overflow-hidden min-w-[200px] md:min-w-[400px] h-32 md:h-48">
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {!winner && !isDrawing ? (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="relative z-10"
                >
                  <Button 
                    onClick={startDraw}
                    className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-primary text-white font-black shadow-lg hover:scale-105 transition-transform group"
                  >
                    <Play className="h-10 w-10 md:h-12 md:w-12 fill-current" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="drawing"
                  className="text-6xl md:text-8xl font-black tabular-nums text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                >
                  {displayNumber || "000"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              {/* Detalhe festivo */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-primary to-purple-500" />
              
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-2xl bg-orange-500 flex items-center justify-center rotate-3 shadow-lg shadow-orange-500/20">
                    <Trophy className="h-10 w-10 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-black text-white">
                    {winner.name}
                  </h2>
                  <p className="text-primary font-bold text-xl uppercase tracking-widest">
                    Vencedor Oficial
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-8 border-y border-white/5">
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase">
                      <Calendar className="h-3 w-3" /> Data
                    </div>
                    <div className="text-white font-bold">{formatDateBR(winner.date)}</div>
                  </div>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase">
                      <Clock className="h-3 w-3" /> Hora
                    </div>
                    <div className="text-white font-bold">
                      {winner.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center pt-4">
                  <Button onClick={saveResult} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl gap-2">
                    <Download className="h-5 w-5" /> Salvar Resultado
                  </Button>
                  <Button onClick={shareResult} variant="outline" className="border-white/10 hover:bg-white/5 text-white font-bold px-8 h-12 rounded-xl gap-2">
                    <Share2 className="h-5 w-5" /> Compartilhar
                  </Button>
                  <Button onClick={startDraw} variant="ghost" className="text-zinc-500 hover:text-white h-12 rounded-xl gap-2">
                    <RefreshCw className="h-5 w-5" /> Refazer Sorteio
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Partículas de fundo (opcional, para mais clima) */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 h-2 w-2 bg-white rounded-full animate-ping" />
        <div className="absolute bottom-1/4 right-1/4 h-2 w-2 bg-white rounded-full animate-ping delay-700" />
        <div className="absolute top-1/2 right-1/3 h-1 w-1 bg-white rounded-full animate-ping delay-1000" />
      </div>
    </div>
  );
}

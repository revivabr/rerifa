import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Award } from "lucide-react";

type RankingItem = {
  seller_name: string;
  total_sales: number;
};

export function SellerRanking({ campaignId }: { campaignId: string }) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      const { data, error } = await supabase.rpc("get_seller_ranking", { p_campaign_id: campaignId });
      if (error || !data) { setLoading(false); return; }
      const sortedRanking = (data as { seller_name: string; total_sales: number }[])
        .map((r) => ({ seller_name: r.seller_name, total_sales: Number(r.total_sales) }))
        .slice(0, 5);
      setRanking(sortedRanking);
      setLoading(false);
    }

    fetchRanking();
    const channel = supabase.channel(`ranking-${campaignId}`).on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `campaign_id=eq.${campaignId}` }, () => fetchRanking()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);


  if (loading || ranking.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-primary">
        <Trophy className="h-5 w-5 text-gold" /> Ranking de Vendedores
      </h2>
      <div className="rounded-3xl border border-black/[0.03] bg-white p-6 shadow-premium">
        <div className="space-y-5">
          {ranking.map((item, index) => (
            <div key={item.seller_name} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary font-bold">
                  {index === 0 ? <Trophy className="h-4 w-4 text-gold" /> : index + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{item.seller_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-primary">{item.total_sales}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Vendas</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
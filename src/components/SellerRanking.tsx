import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Award, User } from "lucide-react";

type RankingItem = {
  seller_name: string;
  total_sales: number;
};

export function SellerRanking({ campaignId }: { campaignId: string }) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      // Fetch only paid orders that have a seller_name
      const { data, error } = await supabase
        .from("orders")
        .select("seller_name, quantity")
        .eq("campaign_id", campaignId)
        .eq("status", "paid")
        .not("seller_name", "is", null);

      if (error) {
        console.error("Error fetching ranking:", error);
        setLoading(false);
        return;
      }

      // Group by seller_name and sum quantity
      const grouped = data.reduce((acc: Record<string, number>, curr) => {
        const name = curr.seller_name?.trim();
        if (name) {
          acc[name] = (acc[name] || 0) + (curr.quantity || 0);
        }
        return acc;
      }, {});

      const sortedRanking = Object.entries(grouped)
        .map(([seller_name, total_sales]) => ({ seller_name, total_sales }))
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 5);

      setRanking(sortedRanking);
      setLoading(false);
    }

    fetchRanking();
    
    // Realtime update when orders are updated to 'paid'
    const channel = supabase
      .channel(`ranking-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchRanking()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  if (loading) return null;
  if (ranking.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 inline-flex items-center gap-2 text-2xl font-bold text-primary">
        <Trophy className="h-6 w-6 text-gold" /> Ranking de Vendedores
      </h2>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="space-y-4">
          {ranking.map((item, index) => (
            <div key={item.seller_name} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center shrink-0">
                  {index === 0 ? (
                    <Trophy className="h-7 w-7 text-gold" />
                  ) : index === 1 ? (
                    <Medal className="h-6 w-6 text-silver" />
                  ) : index === 2 ? (
                    <Award className="h-6 w-6 text-bronze" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">{index + 1}º</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{item.seller_name}</p>
                  <p className="text-xs text-muted-foreground">Top vendedor</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary">{item.total_sales}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Números vendidos</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const colors = {
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32"
};

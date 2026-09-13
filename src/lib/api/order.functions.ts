import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase config faltando no servidor");
  return createClient(url, key);
}

/**
 * Retorna dados seguros (sem campos sensíveis como buyer_id, payment_provider_id)
 * de um pedido para exibição ao comprador, dado o orderId (UUID, capability-based).
 */
export const getOrderPublic = createServerFn({ method: "GET" })
  .inputValidator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdmin();

    // Cada consulta também limpa reservas vencidas. Assim, os números voltam
    // para venda mesmo sem uma tarefa agendada ou outro comprador acessando-os.
    await supabase.rpc("expire_pending_orders");

    const { data: order } = await supabase
      .from("orders")
      .select("id,status,amount,list_amount,campaign_promotion_id,quantity,pix_qr_code,pix_copy_paste,expires_at,paid_at,campaign_id,buyer_id,seller_name")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return null;

    const [{ data: campaign }, { data: nums }, { data: buyer }] = await Promise.all([
      supabase.from("campaigns").select("name,slug,banner_url,number_quantity").eq("id", order.campaign_id).maybeSingle(),
      supabase.from("order_numbers").select("number").eq("order_id", data.orderId).order("number"),
      order.buyer_id
        ? supabase.from("buyers").select("name,whatsapp").eq("id", order.buyer_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      id: order.id,
      status: order.status as string,
      amount: Number(order.amount),
      list_amount: Number(order.list_amount),
      promotion_applied: Boolean(order.campaign_promotion_id),
      quantity: order.quantity as number,
      pix_qr_code: order.pix_qr_code as string | null,
      pix_copy_paste: order.pix_copy_paste as string | null,
      expires_at: order.expires_at as string | null,
      paid_at: order.paid_at as string | null,
      campaign_id: order.campaign_id as string,
      campaign_name: (campaign?.name as string) ?? "",
      campaign_slug: (campaign?.slug as string) ?? "",
      campaign_banner: (campaign?.banner_url as string | null) ?? null,
      campaign_number_quantity: (campaign?.number_quantity as number) ?? 1000,
      buyer_name: (buyer?.name as string) ?? "",
      buyer_whatsapp: (buyer?.whatsapp as string | null) ?? null,
      seller_name: order.seller_name as string | null,
      numbers: (nums ?? []).map((n: { number: number }) => n.number),
    };
  });

/**
 * Cancela um pedido e libera os números imediatamente.
 */
export const cancelOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdmin();
    const { data: result, error } = await supabase.rpc("cancel_order", {
      p_order_id: data.orderId,
    });

    if (error) {
      console.error("Erro ao cancelar pedido:", error);
      return { ok: false, error: error.message };
    }

    return result as { ok: boolean; error?: string };
  });


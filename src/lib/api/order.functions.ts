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

    const { data: order } = await supabase
      .from("orders")
      .select("id,status,amount,quantity,pix_qr_code,pix_copy_paste,expires_at,paid_at,campaign_id,buyer_id")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return null;

    const [{ data: campaign }, { data: nums }, { data: buyer }] = await Promise.all([
      supabase.from("campaigns").select("name,slug").eq("id", order.campaign_id).maybeSingle(),
      supabase.from("order_numbers").select("number").eq("order_id", data.orderId).order("number"),
      order.buyer_id
        ? supabase.from("buyers").select("name").eq("id", order.buyer_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      id: order.id,
      status: order.status as string,
      amount: Number(order.amount),
      quantity: order.quantity as number,
      pix_qr_code: order.pix_qr_code as string | null,
      pix_copy_paste: order.pix_copy_paste as string | null,
      expires_at: order.expires_at as string | null,
      paid_at: order.paid_at as string | null,
      campaign_id: order.campaign_id as string,
      campaign_name: (campaign?.name as string) ?? "",
      campaign_slug: (campaign?.slug as string) ?? "",
      buyer_name: (buyer?.name as string) ?? "",
      numbers: (nums ?? []).map((n: { number: number }) => n.number),
    };
  });

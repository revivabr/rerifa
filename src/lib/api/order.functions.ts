import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import { cancelPixPaymentRecord } from "../mercadopago.server";

const reserveOrderInput = z.object({
  campaignId: z.string().uuid(),
  numbers: z.array(z.number().int().positive()).min(1).max(100),
  buyerName: z.string().trim().min(3).max(150),
  buyerEmail: z.union([z.string().trim().email(), z.literal("")]),
  buyerWhatsapp: z.string().trim().min(10).max(30),
  sellerName: z.string().trim().max(150),
});

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase config faltando no servidor");
  return createClient(url, key);
}

export const reserveOrder = createServerFn({ method: "POST" })
  .inputValidator(reserveOrderInput)
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdmin();
    const uniqueNumbers = [...new Set(data.numbers)].sort((a, b) => a - b);
    if (uniqueNumbers.length !== data.numbers.length) {
      return { ok: false, error: "A seleção contém números repetidos." };
    }

    const { data: result, error } = await supabase.rpc("reserve_numbers", {
      p_campaign_id: data.campaignId,
      p_numbers: uniqueNumbers,
      p_buyer_name: data.buyerName,
      p_buyer_email: data.buyerEmail,
      p_buyer_whatsapp: data.buyerWhatsapp,
      p_buyer_cpf: null,
      p_seller_name: data.sellerName,
    });

    if (error) {
      console.error("Erro ao reservar números:", error);
      return { ok: false, error: "Não foi possível reservar os números. Atualize a página e tente novamente." };
    }
    return result as { ok: boolean; error?: string; order_id?: string; expires_at?: string };
  });

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
      .select("id,status,amount,list_amount,campaign_promotion_id,quantity,pix_qr_code,pix_copy_paste,expires_at,paid_at,campaign_id,buyer_id,seller_name")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return null;

    const [{ data: campaign }, { data: nums }, { data: buyer }, { data: promotions }] = await Promise.all([
      supabase.from("campaigns").select("name,slug,banner_url,number_quantity,number_price,end_date,short_description").eq("id", order.campaign_id).maybeSingle(),
      supabase.from("order_numbers").select("number").eq("order_id", data.orderId).order("number"),
      order.buyer_id
        ? supabase.from("buyers").select("name,whatsapp").eq("id", order.buyer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("campaign_promotions").select("id,quantity,promotional_price,active").eq("campaign_id", order.campaign_id).eq("active", true).order("quantity"),
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
      campaign_number_price: Number(campaign?.number_price ?? 0),
      campaign_end_date: (campaign?.end_date as string) ?? "",
      campaign_short_description: (campaign?.short_description as string | null) ?? null,
      campaign_promotions: (promotions ?? []).map((promotion) => ({
        ...promotion,
        promotional_price: Number(promotion.promotional_price),
      })),
      buyer_name: (buyer?.name as string) ?? "",
      buyer_whatsapp: (buyer?.whatsapp as string | null) ?? null,
      seller_name: order.seller_name as string | null,
      numbers: (nums ?? []).map((n: { number: number }) => n.number),
    };
  });

/**
 * Libera reservas vencidas antes de devolver a disponibilidade pública.
 * Assim, fechar o checkout não mantém números bloqueados indefinidamente.
 */
export const getCampaignNumberAvailability = createServerFn({ method: "GET" })
  .inputValidator(z.object({ campaignId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdmin();
    const { error: expirationError } = await supabase.rpc("expire_pending_orders");

    if (expirationError) {
      console.error("Erro ao liberar reservas vencidas:", expirationError);
      throw new Error("Não foi possível atualizar a disponibilidade dos números");
    }

    const { data: numbers, error } = await supabase
      .from("raffle_numbers")
      .select("number,status")
      .eq("campaign_id", data.campaignId)
      .order("number");

    if (error) {
      console.error("Erro ao consultar números da campanha:", error);
      throw new Error("Não foi possível consultar os números da campanha");
    }

    return (numbers ?? []).map((number) => ({
      number: number.number as number,
      status: number.status as string,
    }));
  });

/**
 * Cancela um pedido e libera os números imediatamente.
 */
export const cancelOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdmin();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,status,payment_provider_id,expires_at")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderError || !order) return { ok: false, error: "Pedido não encontrado" };
    if (order.status === "paid") return { ok: true, paid: true };
    const reservationExpired = Boolean(
      order.expires_at && new Date(order.expires_at).getTime() <= Date.now(),
    );

    if (order.payment_provider_id) {
      try {
        const payment = await cancelPixPaymentRecord(String(order.payment_provider_id));
        if (payment.status === "approved") {
          const { data: confirmed, error: confirmError } = await supabase.rpc("confirm_payment", {
            p_order_id: data.orderId,
            p_external_id: String(order.payment_provider_id),
          });
          if (confirmError || !confirmed?.ok) {
            return { ok: false, error: confirmed?.error || "Pagamento aprovado, mas ainda não confirmado" };
          }
          return { ok: true, paid: true };
        }
        if (!payment.status || !["cancelled", "rejected", "refunded", "charged_back"].includes(payment.status)) {
          return { ok: false, error: "O cancelamento ainda está sendo confirmado. Seus números continuam protegidos." };
        }
      } catch (error) {
        console.error("Erro ao descartar cobrança PIX:", error);
        // Nunca libera os números sem conhecer o estado real da cobrança.
        // A manutenção automática tentará novamente no minuto seguinte.
        return {
          ok: false,
          error: reservationExpired
            ? "Estamos confirmando o estado do PIX. Seus números continuam protegidos enquanto verificamos."
            : "Não foi possível cancelar o PIX com segurança. Tente novamente.",
        };
      }
    }

    const { data: result, error } = await supabase.rpc("cancel_order", {
      p_order_id: data.orderId,
    });

    if (error) {
      console.error("Erro ao cancelar pedido:", error);
      return { ok: false, error: error.message };
    }

    return result as { ok: boolean; error?: string; paid?: boolean };
  });


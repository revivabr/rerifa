import { z } from "zod";
import { getPixPaymentRecord } from "./mercadopago.server";

const webhookBodySchema = z.object({
  type: z.string().optional(),
  topic: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  data: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(),
}).passthrough();

export async function handleMercadoPagoWebhook(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    let body: z.infer<typeof webhookBodySchema> = {};
    try {
      body = webhookBodySchema.parse(await request.json());
    } catch {
      body = {};
    }

    const type = url.searchParams.get("type") || url.searchParams.get("topic") || body.type || body.topic;
    const rawId = url.searchParams.get("data.id") || url.searchParams.get("id") || body.data?.id || body.id;
    const paymentId = rawId == null ? "" : String(rawId);
    if (type !== "payment" || !/^\d+$/.test(paymentId)) {
      return new Response("Notificação ignorada", { status: 200 });
    }

    // A consulta autenticada ao Mercado Pago é a fonte da verdade; dados do
    // webhook nunca são usados diretamente para aprovar um pedido.
    const payment = await getPixPaymentRecord(paymentId);
    if (payment.status !== "approved" || !payment.external_reference) {
      return new Response("OK", { status: 200 });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id,amount,payment_provider_id")
      .eq("id", payment.external_reference)
      .maybeSingle();

    if (orderError || !order) throw new Error("Pedido do pagamento não encontrado");
    if (order.payment_provider_id && String(order.payment_provider_id) !== paymentId) {
      throw new Error("Pagamento não corresponde à cobrança do pedido");
    }
    if (Math.abs(Number(order.amount) - Number(payment.transaction_amount)) > 0.009) {
      throw new Error("Valor aprovado não corresponde ao valor do pedido");
    }

    const { data: confirmed, error: confirmError } = await supabaseAdmin.rpc("confirm_payment", {
      p_order_id: order.id,
      p_external_id: paymentId,
    });
    const confirmation = confirmed && typeof confirmed === "object" && !Array.isArray(confirmed)
      ? confirmed as { ok?: boolean; error?: string }
      : null;
    if (confirmError || !confirmation?.ok) {
      throw new Error(confirmation?.error || confirmError?.message || "Falha ao confirmar pedido");
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Falha no webhook do Mercado Pago:", error);
    return new Response("Falha ao processar notificação", { status: 500 });
  }
}
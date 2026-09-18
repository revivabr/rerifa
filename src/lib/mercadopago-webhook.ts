import { z } from "zod";
import { getPixPaymentRecord } from "./mercadopago.server";
import { refundLatePayment } from "./pix-maintenance.server";

const webhookBodySchema = z.object({
  type: z.string().optional(),
  topic: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  data: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(),
}).passthrough();

export async function handleMercadoPagoWebhook(request: Request): Promise<Response> {
  let eventId: string | null = null;
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

    // O Mercado Pago não fornece uma credencial separada nesta integração.
    // A consulta autenticada pela cobrança é a fonte da verdade; os dados da
    // notificação nunca aprovam um pedido diretamente.
    const payment = await getPixPaymentRecord(paymentId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const eventKey = `${paymentId}:${payment.status ?? "unknown"}`;
    const { data: insertedEvent, error: eventError } = await supabaseAdmin
      .from("payment_webhook_events")
      .insert({
        event_key: eventKey,
        provider_payment_id: paymentId,
        event_type: type,
      })
      .select("id")
      .maybeSingle();
    if (eventError?.code === "23505") {
      const { data: existing } = await supabaseAdmin
        .from("payment_webhook_events")
        .select("id,processing_status")
        .eq("event_key", eventKey)
        .maybeSingle();
      if (existing?.processing_status === "processed" || existing?.processing_status === "ignored") {
        return new Response("OK", { status: 200 });
      }
      eventId = existing?.id ?? null;
    } else if (eventError || !insertedEvent) {
      throw new Error("Falha ao registrar notificação");
    } else {
      eventId = insertedEvent.id;
    }
    if (!eventId) throw new Error("Notificação sem identificador para processamento");

    if (payment.status !== "approved" || !payment.external_reference) {
      await supabaseAdmin.from("payment_webhook_events").update({
        processing_status: "ignored",
        processed_at: new Date().toISOString(),
      }).eq("id", eventId);
      return new Response("OK", { status: 200 });
    }

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
      ? confirmed as { ok?: boolean; error?: string; requires_refund?: boolean }
      : null;
    if (confirmation?.requires_refund) {
      await refundLatePayment(supabaseAdmin, paymentId);
      await supabaseAdmin.from("payment_webhook_events").update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
      }).eq("id", eventId);
      return new Response("OK", { status: 200 });
    }
    if (confirmError || !confirmation?.ok) {
      throw new Error(confirmation?.error || confirmError?.message || "Falha ao confirmar pedido");
    }

    await supabaseAdmin.from("payment_webhook_events").update({
      processing_status: "processed",
      processed_at: new Date().toISOString(),
    }).eq("id", eventId);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Falha no webhook do Mercado Pago:", error);
    if (eventId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("payment_webhook_events").update({
        processing_status: "failed",
        error_message: error instanceof Error ? error.message.slice(0, 500) : "Falha desconhecida",
        processed_at: new Date().toISOString(),
      }).eq("id", eventId);
    }
    return new Response("Falha ao processar notificação", { status: 500 });
  }
}
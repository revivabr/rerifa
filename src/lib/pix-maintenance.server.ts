import { cancelPixPaymentRecord, getPixPaymentRecord, refundPixPaymentRecord } from "./mercadopago.server";

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

type Reconciliation = {
  provider_payment_id: string;
};

export async function refundLatePayment(
  supabaseAdmin: AdminClient,
  paymentId: string,
) {
  await supabaseAdmin.rpc("mark_reconciliation_result", {
    p_provider_payment_id: paymentId,
    p_status: "refund_processing",
  });

  try {
    const refund = await refundPixPaymentRecord(paymentId);
    await supabaseAdmin.rpc("mark_reconciliation_result", {
      p_provider_payment_id: paymentId,
      p_status: "refunded",
      p_refund_provider_id: refund.id == null ? undefined : String(refund.id),
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida no estorno";
    await supabaseAdmin.rpc("mark_reconciliation_result", {
      p_provider_payment_id: paymentId,
      p_status: "refund_failed",
      p_error: message,
    });
    console.error("Falha ao estornar pagamento tardio:", { paymentId, message });
    return false;
  }
}

export async function processPixMaintenance(limit = 25) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.rpc("expire_pending_orders");
  // Aguarda uma margem após o contador para absorver a latência entre o banco
  // pagador, a confirmação do Mercado Pago e a chegada do webhook.
  const cutoff = new Date(Date.now() - 30_000).toISOString();
  const { data: expiredOrders, error } = await supabaseAdmin
    .from("orders")
    .select("id,payment_provider_id")
    .eq("status", "pending")
    .lte("expires_at", cutoff)
    .not("payment_provider_id", "is", null)
    .order("expires_at")
    .limit(limit);

  if (error) throw new Error(`Falha ao listar reservas vencidas: ${error.message}`);

  let confirmed = 0;
  let cancelled = 0;
  let deferred = 0;

  for (const order of expiredOrders ?? []) {
    const paymentId = String(order.payment_provider_id);
    try {
      const payment = await getPixPaymentRecord(paymentId);
      if (payment.status === "approved") {
        const { data } = await supabaseAdmin.rpc("confirm_payment", {
          p_order_id: order.id,
          p_external_id: paymentId,
        });
        const result = data && typeof data === "object" && !Array.isArray(data)
          ? data as { ok?: boolean; requires_refund?: boolean }
          : null;
        if (result?.ok) confirmed += 1;
        else if (result?.requires_refund) await refundLatePayment(supabaseAdmin, paymentId);
        continue;
      }

      if (!payment.status || !["cancelled", "rejected", "refunded", "charged_back"].includes(payment.status)) {
        const cancellation = await cancelPixPaymentRecord(paymentId);
        if (cancellation.status === "approved") {
          const { data } = await supabaseAdmin.rpc("confirm_payment", {
            p_order_id: order.id,
            p_external_id: paymentId,
          });
          const result = data && typeof data === "object" && !Array.isArray(data)
            ? data as { ok?: boolean; requires_refund?: boolean }
            : null;
          if (result?.ok) confirmed += 1;
          else if (result?.requires_refund) await refundLatePayment(supabaseAdmin, paymentId);
          continue;
        }
        if (!cancellation.status || !["cancelled", "rejected", "refunded", "charged_back"].includes(cancellation.status)) {
          deferred += 1;
          continue;
        }
      }
      const { data } = await supabaseAdmin.rpc("cancel_order", { p_order_id: order.id });
      const result = data && typeof data === "object" && !Array.isArray(data)
        ? data as { ok?: boolean }
        : null;
      if (result?.ok) cancelled += 1;
    } catch (maintenanceError) {
      deferred += 1;
      console.error("Manutenção PIX adiada para nova tentativa:", {
        orderId: order.id,
        message: maintenanceError instanceof Error ? maintenanceError.message : "Erro desconhecido",
      });
    }
  }

  const { data: pendingRefunds } = await supabaseAdmin
    .from("payment_reconciliation_issues")
    .select("provider_payment_id")
    .in("status", ["refund_pending", "refund_failed"])
    .lt("attempt_count", 5)
    .order("created_at")
    .limit(limit);

  let refunded = 0;
  for (const issue of (pendingRefunds ?? []) as Reconciliation[]) {
    if (await refundLatePayment(supabaseAdmin, issue.provider_payment_id)) refunded += 1;
  }

  return { checked: expiredOrders?.length ?? 0, confirmed, cancelled, deferred, refunded };
}
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPixPaymentRecord } from "../mercadopago.server";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";

// Helper para Supabase no servidor com Service Role (pode bypass RLS para atualizar status)
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase config faltando no servidor");
  return createClient(url, key);
}

export const getOrGeneratePix = createServerFn({ method: "POST" })
  .inputValidator(z.object({ orderId: z.string() }))
  .handler(async ({ data }) => {
    const supabase = getSupabaseAdmin();
    
    // 1. Busca o pedido e dados necessários
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, campaigns(name), buyers(name, email, whatsapp, cpf)")
      .eq("id", data.orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Pedido não encontrado");
    }

    // Um pedido recebe apenas uma cobrança PIX. Se ela venceu, o checkout
    // deve cancelar o pedido e liberar os números, nunca criar outra cobrança
    // para a mesma reserva.
    if (order.pix_qr_code && order.pix_copy_paste && order.status === 'pending') {
      const expiresAt = order.expires_at ? new Date(order.expires_at).getTime() : 0;
      if (expiresAt > Date.now()) {
        console.log("Retornando PIX existente para o pedido:", order.id);
        return {
          qr_code_base64: order.pix_qr_code,
          qr_code: order.pix_copy_paste,
          status: order.status,
          expires_at: order.expires_at as string,
        };
      }

      return {
        status: "expired",
        expires_at: order.expires_at as string | null,
      };
    }

    if (order.status !== 'pending') {
       return { status: order.status };
    }

    const buyer = order.buyers as { name?: string; email?: string; cpf?: string } | null;
    const campaign = order.campaigns as { name?: string } | null;
    if (!buyer || !campaign) throw new Error("Dados do pedido estão incompletos");

    const { data: claim, error: claimError } = await supabase.rpc("claim_pix_generation", {
      p_order_id: order.id,
    });
    if (claimError || !claim?.ok) throw new Error(claim?.error || "Não foi possível preparar o pagamento");

    if (claim.state === "processing") {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        const { data: current } = await supabase
          .from("orders")
          .select("status,pix_generation_status,pix_qr_code,pix_copy_paste,expires_at")
          .eq("id", order.id)
          .maybeSingle();
        if (current?.pix_generation_status === "ready" && current.pix_qr_code && current.pix_copy_paste) {
          return {
            qr_code_base64: current.pix_qr_code,
            qr_code: current.pix_copy_paste,
            status: current.status,
            expires_at: current.expires_at,
          };
        }
        if (current?.pix_generation_status === "failed") break;
      }
      throw new Error("A cobrança PIX ainda está sendo gerada. Tente novamente em alguns segundos.");
    }

    if (claim.state !== "claimed") return { status: String(claim.state) };

    // Apenas a chamada que obteve a posse atômica gera a cobrança externa.
    const nameParts = (buyer.name || "Comprador").split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Silva";

    try {
      console.log("Gerando novo PIX no Mercado Pago para o pedido:", order.id);
      console.log("Dados do comprador:", { email: buyer.email, firstName, lastName });
      const mpResponse = await createPixPaymentRecord({
        id: order.id,
        amount: Number(order.amount),
        email: buyer.email || "comprador@revivabrasil.com.br",
        description: `Rifa Reviva Brasil - ${campaign.name}`,
        firstName,
        lastName,
        cpf: buyer.cpf ?? "",
      });

      const pixData = mpResponse.point_of_interaction?.transaction_data;
      
      if (!pixData) {
        console.error("Erro MP Response:", mpResponse);
        throw new Error("Erro ao gerar dados do PIX no Mercado Pago");
      }

      if (!pixData.qr_code_base64 || !pixData.qr_code || mpResponse.id == null) {
        throw new Error("A cobrança retornou dados incompletos");
      }

      const { data: finalized, error: finalizeError } = await supabase.rpc("finalize_pix_generation", {
        p_order_id: order.id,
        p_qr_code: pixData.qr_code_base64,
        p_copy_paste: pixData.qr_code,
        p_provider_id: String(mpResponse.id),
      });

      if (finalizeError || !finalized?.ok) {
        throw new Error(finalized?.error || "Não foi possível salvar a cobrança PIX");
      }

      return {
        qr_code_base64: pixData.qr_code_base64,
        qr_code: pixData.qr_code,
        status: order.status,
        expires_at: finalized.expires_at as string,
      };
    } catch (err: unknown) {
      await supabase.rpc("fail_pix_generation", {
        p_order_id: order.id,
        p_error_code: err instanceof Error ? err.message.slice(0, 100) : "unknown",
      });
      console.error("Erro ao processar PIX:", err);
      if (err instanceof Error) {
        console.error("Stack trace:", err.stack);
        throw new Error(err.message);
      }
      throw new Error("Erro interno ao processar pagamento");
    }
  });

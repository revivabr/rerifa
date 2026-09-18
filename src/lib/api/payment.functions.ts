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
      .select("*, campaigns(name), buyers(name, email, whatsapp)")
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

    // 2. Gera no Mercado Pago
    const buyer = order.buyers as any;
    const campaign = order.campaigns as any;
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
        lastName
      });

      const pixData = mpResponse.point_of_interaction?.transaction_data;
      
      if (!pixData) {
        console.error("Erro MP Response:", mpResponse);
        throw new Error("Erro ao gerar dados do PIX no Mercado Pago");
      }

      // 3. Persiste o PIX e inicia somente agora a reserva unificada de 180 segundos.
      const { error: updateError } = await supabase.from("orders").update({
        pix_qr_code: pixData.qr_code_base64,
        pix_copy_paste: pixData.qr_code,
        payment_provider_id: String(mpResponse.id),
        payment_provider: 'mercadopago',
        updated_at: new Date().toISOString()
      }).eq("id", order.id);

      if (updateError) {
        throw new Error("Não foi possível salvar a cobrança PIX");
      }

      const { data: paymentWindow, error: windowError } = await supabase.rpc("start_pix_payment_window", {
        p_order_id: order.id,
      });

      if (windowError || !paymentWindow?.ok) {
        throw new Error("Não foi possível iniciar o prazo de pagamento");
      }

      return {
        qr_code_base64: pixData.qr_code_base64,
        qr_code: pixData.qr_code,
        status: order.status,
        expires_at: paymentWindow.expires_at as string,
      };
    } catch (err: unknown) {
      console.error("Erro ao processar PIX:", err);
      if (err instanceof Error) {
        console.error("Stack trace:", err.stack);
        throw new Error(err.message);
      }
      throw new Error("Erro interno ao processar pagamento");
    }
  });

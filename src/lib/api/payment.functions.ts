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

    // Se já tiver os dados do PIX e não estiver expirado, retorna
    if (order.pix_qr_code && order.pix_copy_paste && order.status === 'pending') {
      const expiresAt = order.expires_at ? new Date(order.expires_at).getTime() : 0;
      if (expiresAt > Date.now()) {
        return {
          qr_code_base64: order.pix_qr_code,
          qr_code: order.pix_copy_paste,
          status: order.status
        };
      }
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

      // 3. Atualiza o pedido no banco com os dados reais e o ID do pagamento MP
      await supabase.from("orders").update({
        pix_qr_code: pixData.qr_code_base64,
        pix_copy_paste: pixData.qr_code,
        payment_provider_id: String(mpResponse.id),
        payment_provider: 'mercadopago',
        updated_at: new Date().toISOString()
      }).eq("id", order.id);

      return {
        qr_code_base64: pixData.qr_code_base64,
        qr_code: pixData.qr_code,
        status: order.status
      };
    } catch (err: any) {
      console.error("Erro ao processar PIX:", err);
      throw new Error(err.message || "Erro interno ao processar pagamento");
    }
  });

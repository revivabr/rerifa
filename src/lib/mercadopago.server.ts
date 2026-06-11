import process from "node:process";

export async function createPixPaymentRecord({
  id,
  amount,
  email,
  description,
  firstName,
  lastName
}: {
  id: string;
  amount: number;
  email: string;
  description: string;
  firstName: string;
  lastName: string;
}) {
  const accessToken = process.env.ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Mercado Pago ACCESS_TOKEN não configurado no servidor.");
  }

  const body = {
    transaction_amount: Number(amount.toFixed(2)),
    description: description.substring(0, 60),
    payment_method_id: 'pix',
    installments: 1,
    external_reference: id,
    notification_url: process.env.APP_BASE_URL 
      ? `${process.env.APP_BASE_URL}/api/webhooks/mercadopago`
      : undefined,
    payer: {
      email: email?.trim() || "comprador@revivabrasil.com.br",
      first_name: firstName?.trim() || "Comprador",
      last_name: lastName?.trim() || "Silva",
    },
    // Expira em 90 segundos (conforme solicitado pelo usuário)
    date_of_expiration: new Date(Date.now() + 90 * 1000).toISOString(),
  };
  
  console.log("Iniciando requisição direta ao Mercado Pago para o pedido:", id);

  try {
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${id}-${Date.now()}` // Chave única por tentativa para evitar lock 423
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Erro na API do Mercado Pago:", JSON.stringify(result));
      throw new Error(result.message || "Erro na comunicação com Mercado Pago");
    }

    console.log("Pagamento PIX gerado com sucesso para o pedido:", id);
    return result;
  } catch (error: any) {
    console.error("Falha ao chamar API do Mercado Pago:", error.message);
    throw error;
  }
}


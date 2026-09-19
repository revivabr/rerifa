import process from "node:process";

/**
 * Formata a validade no padrão ISO-8601 em UTC, sem ambiguidade de fuso.
 */
function formatMpExpiration(date: Date): string {
  return date.toISOString();
}

export async function createPixPaymentRecord({
  id,
  amount,
  email,
  description,
  firstName,
  lastName,
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

  // A cobrança e a reserva precisam vencer juntas. Assim, um código salvo não
  // pode ser pago depois que os números já tiverem sido liberados.
  const expiration = new Date(Date.now() + 180 * 1000);

  const body = {
    transaction_amount: Number(amount.toFixed(2)),
    description: description.substring(0, 60),
    payment_method_id: 'pix',
    installments: 1,
    external_reference: id,
    notification_url: `${process.env.APP_BASE_URL || "https://rifa.revivabrasil.com.br"}/api/public/webhooks/mercadopago`,
    payer: {
      email: email?.trim() || "comprador@revivabrasil.com.br",
      first_name: firstName?.trim() || "Comprador",
      last_name: lastName?.trim() || "Silva",
    },
    date_of_expiration: formatMpExpiration(expiration),
  };
  
  console.log("Iniciando requisição direta ao Mercado Pago para o pedido:", id);

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          // Um pedido só pode originar uma cobrança. Repetições de rede devem
          // devolver a mesma cobrança, não criar PIX órfãos.
          "X-Idempotency-Key": id,
        },
        body: JSON.stringify(body)
      });

      const result = await response.json() as MercadoPagoPayment;
      if (response.ok) {
        console.log("Pagamento PIX gerado com sucesso para o pedido:", id);
        return result;
      }

      console.error("Erro na API do Mercado Pago:", JSON.stringify(result));
      if (!isResourceLocked(response.status, result)) {
        throw new Error(paymentErrorMessage(result));
      }

      // O Mercado Pago pode bloquear brevemente a mesma chave idempotente
      // quando duas abas/requisições chegam juntas. Aguarda a primeira criação
      // terminar e recupera a cobrança pelo identificador do pedido.
      const recovered = await recoverPixPayment(id, accessToken);
      if (recovered) {
        console.log("Pagamento PIX recuperado após bloqueio para o pedido:", id);
        return recovered;
      }
    }

    throw new Error("A cobrança PIX ainda está sendo processada. Tente novamente em alguns segundos.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro na comunicação com Mercado Pago";
    console.error("Falha ao chamar API do Mercado Pago:", message);
    throw error;
  }
}

export type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  message?: string;
  external_reference?: string;
  transaction_amount?: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
    };
  };
};

function isResourceLocked(httpStatus: number, result: MercadoPagoPayment) {
  const message = result.message?.toLowerCase() ?? "";
  return httpStatus === 423 || message.includes("resource is locked") || message.includes("lock error");
}

function paymentErrorMessage(result: MercadoPagoPayment) {
  return result.message || "Erro na comunicação com Mercado Pago";
}

async function recoverPixPayment(orderId: string, accessToken: string): Promise<MercadoPagoPayment | null> {
  const delays = [400, 900, 1_800];

  for (const delay of delays) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const params = new URLSearchParams({
      external_reference: orderId,
      sort: "date_created",
      criteria: "desc",
      limit: "10",
    });
    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) continue;

    const search = await response.json() as { results?: MercadoPagoPayment[] };
    const payment = search.results?.find((candidate) => (
      candidate.external_reference === orderId
      && candidate.point_of_interaction?.transaction_data?.qr_code
      && candidate.point_of_interaction.transaction_data.qr_code_base64
    ));
    if (payment) return payment;
  }

  return null;
}

async function mercadoPagoRequest(path: string, init?: RequestInit): Promise<MercadoPagoPayment> {
  const accessToken = process.env.ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Mercado Pago ACCESS_TOKEN não configurado no servidor.");
  }

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const result = await response.json() as MercadoPagoPayment;
  if (!response.ok) {
    throw new Error(result.message || `Mercado Pago respondeu com status ${response.status}`);
  }
  return result;
}

export function getPixPaymentRecord(paymentId: string) {
  return mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

export async function cancelPixPaymentRecord(paymentId: string) {
  const payment = await getPixPaymentRecord(paymentId);
  if (payment.status === "approved") return payment;
  if (payment.status === "cancelled" || payment.status === "rejected") return payment;

  return mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "PUT",
    headers: { "X-Idempotency-Key": `cancel-${paymentId}` },
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export function refundPixPaymentRecord(paymentId: string) {
  return mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: "POST",
    headers: { "X-Idempotency-Key": `refund-${paymentId}` },
    body: JSON.stringify({}),
  });
}


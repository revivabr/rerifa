import process from "node:process";

/**
 * Formata uma data como ISO-8601 com offset de São Paulo (-03:00),
 * que é o formato exigido pelo Mercado Pago no campo `date_of_expiration`.
 * Enviar `.toISOString()` (com `Z` em UTC) pode fazer o pagamento nascer
 * marcado como vencido devido à interpretação de fuso no lado do MP.
 *
 * Exemplo de saída: 2026-06-12T15:30:45.000-03:00
 */
function formatMpExpiration(date: Date): string {
  // São Paulo não tem horário de verão desde 2019: offset fixo -03:00
  const offsetMinutes = -180; // -03:00
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const yyyy = local.getUTCFullYear();
  const mm = pad(local.getUTCMonth() + 1);
  const dd = pad(local.getUTCDate());
  const hh = pad(local.getUTCHours());
  const mi = pad(local.getUTCMinutes());
  const ss = pad(local.getUTCSeconds());
  const ms = pad(local.getUTCMilliseconds(), 3);
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}.${ms}-03:00`;
}

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

  // O Mercado Pago precisa de margem operacional para liquidar o PIX entre
  // instituições. A reserva no site continua limitada a 180 segundos e, ao
  // terminar, a cobrança é cancelada pelo fluxo de checkout.
  const expiration = new Date(Date.now() + 30 * 60 * 1000);

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

type MercadoPagoPaymentStatus = {
  id?: number;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
};

async function mercadoPagoRequest(path: string, init?: RequestInit): Promise<MercadoPagoPaymentStatus> {
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
  const result = await response.json() as MercadoPagoPaymentStatus & { message?: string };
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
    body: JSON.stringify({ status: "cancelled" }),
  });
}


import { MercadoPagoConfig, Payment } from "mercadopago";
import process from "node:process";

export function getMercadoPagoClient() {
  const accessToken = process.env.ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Mercado Pago ACCESS_TOKEN não configurado no servidor.");
  }
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 }
  });
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
  const client = getMercadoPagoClient();
  const payment = new Payment(client);

  const body = {
    transaction_amount: amount,
    description: description,
    payment_method_id: 'pix',
    installments: 1,
    external_reference: id,
    notification_url: `${process.env.APP_BASE_URL || ""}/api/webhooks/mercadopago`,
    payer: {
      email: email || "comprador@revivabrasil.com.br", // MP requer um email válido
      first_name: firstName,
      last_name: lastName || "Silva",
    },
    // Expira em 15 minutos (tempo de reserva padrão no DB)
    date_of_expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };

  return await payment.create({ body });
}

import { createFileRoute } from "@tanstack/react-router";
import { handleMercadoPagoWebhook } from "@/lib/mercadopago-webhook";

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleMercadoPagoWebhook(request),
    },
  },
});
import { createFileRoute } from "@tanstack/react-router";
import { processPixMaintenance } from "@/lib/pix-maintenance.server";

type TokenVerifier = {
  rpc: (name: string, args: { p_token: string }) => Promise<{ data: boolean | null; error: { message: string } | null }>;
};

export const Route = createFileRoute("/api/public/internal/pix-maintenance")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
        if (!token) return new Response("Não autorizado", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const verifier = supabaseAdmin as unknown as TokenVerifier;
        const { data: valid, error } = await verifier.rpc("verify_pix_maintenance_token", { p_token: token });
        if (error || !valid) return new Response("Não autorizado", { status: 401 });

        return Response.json(await processPixMaintenance());
      },
    },
  },
});
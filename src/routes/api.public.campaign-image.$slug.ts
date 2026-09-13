import { createFileRoute } from "@tanstack/react-router";

const PUBLIC_CAMPAIGN_STATUSES = ["active", "paused", "finished", "drawn"];

function storageLocation(imageUrl: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(imageUrl);
    const marker = "/storage/v1/object/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const objectPath = url.pathname.slice(markerIndex + marker.length);
    const withoutAccessMode = objectPath.replace(/^(?:public|sign|authenticated)\//, "");
    const [bucket, ...pathParts] = withoutAccessMode.split("/").map(decodeURIComponent);
    if (!bucket || pathParts.length === 0) return null;

    return { bucket, path: pathParts.join("/") };
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/campaign-image/$slug")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { slug: string } }) => {
        const slug = params.slug.trim();
        if (!/^[a-z0-9-]{1,120}$/i.test(slug)) {
          return new Response("Campanha inválida", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: campaign, error } = await supabaseAdmin
          .from("campaigns")
          .select("banner_url,status")
          .eq("slug", slug)
          .maybeSingle();

        if (
          error ||
          !campaign?.banner_url ||
          !PUBLIC_CAMPAIGN_STATUSES.includes(campaign.status)
        ) {
          return new Response("Imagem não encontrada", { status: 404 });
        }

        const location = storageLocation(campaign.banner_url);
        let imageResponse: Response;

        if (location) {
          const { data, error: downloadError } = await supabaseAdmin.storage
            .from(location.bucket)
            .download(location.path);

          if (downloadError || !data) {
            return new Response("Imagem não encontrada", { status: 404 });
          }

          imageResponse = new Response(data);
        } else {
          imageResponse = await fetch(campaign.banner_url, { redirect: "follow" });
          if (!imageResponse.ok) {
            return new Response("Imagem não encontrada", { status: 404 });
          }
        }

        const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
        if (!contentType.startsWith("image/")) {
          return new Response("Arquivo inválido", { status: 415 });
        }

        return new Response(imageResponse.body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            "Content-Disposition": `inline; filename="${slug}-banner"`,
          },
        });
      },
    },
  },
});
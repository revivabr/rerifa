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
      GET: async ({ params, request }: { params: { slug: string }; request: Request }) => {
        const slug = params.slug.trim();
        if (!/^[a-z0-9-]{1,120}$/i.test(slug)) {
          return new Response("Campanha inválida", { status: 400 });
        }

        const asset = new URL(request.url).searchParams.get("asset") ?? "banner";
        if (!/^(?:banner|prize-[12]|award-[0-9a-f-]{36})$/i.test(asset)) {
          return new Response("Imagem inválida", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: campaign, error } = await supabaseAdmin
          .from("campaigns")
          .select("id,banner_url,prize_image_1,prize_image_2,status")
          .eq("slug", slug)
          .maybeSingle();

        if (error || !campaign || !PUBLIC_CAMPAIGN_STATUSES.includes(campaign.status)) {
          return new Response("Imagem não encontrada", { status: 404 });
        }

        let imageUrl: string | null = null;
        if (asset === "banner") imageUrl = campaign.banner_url;
        if (asset === "prize-1") imageUrl = campaign.prize_image_1;
        if (asset === "prize-2") imageUrl = campaign.prize_image_2;
        if (asset.startsWith("award-")) {
          const prizeId = asset.slice("award-".length);
          const { data: prize } = await supabaseAdmin
            .from("campaign_prizes")
            .select("image_url")
            .eq("id", prizeId)
            .eq("campaign_id", campaign.id)
            .maybeSingle();
          imageUrl = prize?.image_url ?? null;
        }
        if (!imageUrl) return new Response("Imagem não encontrada", { status: 404 });

        const location = storageLocation(imageUrl);
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
          imageResponse = await fetch(imageUrl, { redirect: "follow" });
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
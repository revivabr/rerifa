import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/draw-media/$slug")({
  server: { handlers: { GET: async ({ params, request }) => {
    if (!z.string().regex(/^[a-z0-9-]{1,120}$/i).safeParse(params.slug).success) return new Response("Campanha inválida", { status: 400 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: campaign } = await supabaseAdmin.from("campaigns").select("id,status").eq("slug", params.slug).maybeSingle();
    if (!campaign || !["active", "paused", "finished", "drawn"].includes(campaign.status)) return new Response("Não encontrado", { status: 404 });
    const { data: media } = await supabaseAdmin.from("campaign_draw_media").select("youtube_id,video_path").eq("campaign_id", campaign.id).maybeSingle();
    if (new URL(request.url).searchParams.get("play") !== "1") {
      return Response.json({ youtubeId: media?.youtube_id ?? null, videoUrl: media?.video_path ? `/api/public/draw-media/${encodeURIComponent(params.slug)}?play=1` : null }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!media?.video_path || !media.video_path.startsWith(`${campaign.id}/`)) return new Response("Vídeo não encontrado", { status: 404 });
    const { data: signed, error } = await supabaseAdmin.storage.from("draw-videos").createSignedUrl(media.video_path, 120);
    if (error || !signed) return new Response("Vídeo indisponível", { status: 503 });
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) {
      if (!/^bytes=\d+-\d*$/.test(range)) return new Response("Intervalo inválido", { status: 416 });
      headers.set("Range", range);
    }
    const upstream = await fetch(signed.signedUrl, { headers });
    if (!upstream.ok) return new Response("Vídeo indisponível", { status: upstream.status === 416 ? 416 : 503 });
    const responseHeaders = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    for (const key of ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"]) {
      const value = upstream.headers.get(key); if (value) responseHeaders.set(key, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } } },
});
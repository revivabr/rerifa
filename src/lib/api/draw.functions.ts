import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { drawMediaSchema } from "@/lib/draw-media";

export const saveDrawMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => drawMediaSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || !admin) throw new Error("Acesso restrito aos administradores.");
    if (data.videoPath) {
      const name = data.videoPath.slice(data.campaignId.length + 1);
      const { data: files, error } = await context.supabase.storage.from("draw-videos").list(data.campaignId, { search: name });
      const file = files?.find(f => f.name === name);
      if (error || !file || !["video/mp4", "video/webm"].includes(file.metadata?.mimetype ?? "")) throw new Error("Vídeo não encontrado ou formato inválido.");
    }
    const { error } = await context.supabase.from("campaign_draw_media").upsert({
      campaign_id: data.campaignId, youtube_id: data.youtubeId, video_path: data.videoPath, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Não foi possível salvar o vídeo.");
    return { ok: true };
  });

export const getWinnerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ drawId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || !admin) throw new Error("Acesso restrito aos administradores.");
    const { data: draw, error } = await context.supabase.from("draws").select("*").eq("id", data.drawId).single();
    if (error || !draw?.campaign_id || !draw.winner_buyer_id) throw new Error("Resultado do sorteio incompleto.");
    const { data: matches, error: matchError } = await context.supabase.from("order_numbers")
      .select("order_id,orders!inner(id,status,buyer_id,campaign_id)")
      .eq("campaign_id", draw.campaign_id).eq("number", draw.winner_number)
      .eq("orders.status", "paid").eq("orders.buyer_id", draw.winner_buyer_id).limit(2);
    if (matchError || matches?.length !== 1) throw new Error("Não foi possível identificar uma única compra paga para o número sorteado.");
    const orderId = matches[0].order_id;
    if (!orderId) throw new Error("Pedido não encontrado.");
    if (draw.winner_order_id && draw.winner_order_id !== orderId) throw new Error("O pedido vinculado não corresponde ao número sorteado.");
    const [{ data: order }, { data: campaign }, { data: prizes }] = await Promise.all([
      context.supabase.from("orders").select("id,created_at,paid_at,amount,quantity,seller_name,buyers(name,email,whatsapp),order_numbers(number)").eq("id", orderId).eq("status", "paid").single(),
      context.supabase.from("campaigns").select("name,slug,number_quantity,banner_url,prize_image_1,prize_description").eq("id", draw.campaign_id).single(),
      context.supabase.from("campaign_prizes").select("title,image_url").eq("campaign_id", draw.campaign_id).order("position").limit(1),
    ]);
    if (!order?.buyers || !campaign || order.order_numbers.length !== order.quantity) throw new Error("Dados da compra incompletos; confira o pedido antes de emitir.");
    return { draw, order: { ...order, buyers: order.buyers }, campaign, prize: prizes?.[0] ?? null };
  });
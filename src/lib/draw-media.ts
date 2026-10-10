import { z } from "zod";

export const youtubeIdSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/);
export function parseYoutubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    let id: string | null = null;
    if (["youtu.be", "www.youtu.be"].includes(url.hostname)) id = url.pathname.slice(1);
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
    }
    return youtubeIdSchema.safeParse(id).success ? id : null;
  } catch { return null; }
}

export const drawMediaSchema = z.object({
  campaignId: z.string().uuid(),
  youtubeId: youtubeIdSchema.nullable(),
  videoPath: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|webm)$/).nullable(),
}).refine(v => !(v.youtubeId && v.videoPath), "Escolha apenas uma fonte de vídeo.")
  .refine(v => !v.videoPath || v.videoPath.startsWith(`${v.campaignId}/`), "Arquivo de outra campanha.");

export type PublicDrawMedia = { youtubeId: string | null; videoUrl: string | null };
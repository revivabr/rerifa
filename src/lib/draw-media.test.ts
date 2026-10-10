import { describe, expect, it } from "vitest";
import { drawMediaSchema, parseYoutubeId } from "./draw-media";
import { drawDateTime } from "./winner-pdf";

describe("publicação segura do sorteio", () => {
  it("aceita links YouTube watch, live e curtos", () => {
    for (const link of ["https://youtu.be/abcdefghijk", "https://www.youtube.com/watch?v=abcdefghijk", "https://youtube.com/live/abcdefghijk"]) expect(parseYoutubeId(link)).toBe("abcdefghijk");
  });
  it("recusa domínios falsos e protocolos inseguros", () => {
    for (const link of ["https://youtube.com.evil.example/watch?v=abcdefghijk", "javascript:alert(1)", "http://youtu.be/abcdefghijk"]) expect(parseYoutubeId(link)).toBeNull();
  });
  it("impede publicar arquivo de outra campanha ou fontes simultâneas", () => {
    const campaignId = "35ae272f-0cd3-42f8-9444-cf311a92ef02";
    const videoPath = `${campaignId}/70b1e640-69bf-4c61-9858-ada21c5356f6.mp4`;
    expect(drawMediaSchema.safeParse({ campaignId, youtubeId: null, videoPath }).success).toBe(true);
    expect(drawMediaSchema.safeParse({ campaignId, youtubeId: "abcdefghijk", videoPath }).success).toBe(false);
    expect(drawMediaSchema.safeParse({ campaignId, youtubeId: null, videoPath: "70b1e640-69bf-4c61-9858-ada21c5356f6/70b1e640-69bf-4c61-9858-ada21c5356f6.mp4" }).success).toBe(false);
  });
  it("usa o horário de Brasília mesmo em navegador de outro fuso", () => {
    expect(drawDateTime("2026-10-10T20:30:42Z")).toContain("17:30:42");
  });
});
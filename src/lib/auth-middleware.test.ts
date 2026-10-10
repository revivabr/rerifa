import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), client: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => ({ client: mocks.client }),
}));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
import "./auth-middleware";

describe("autorização das ações administrativas", () => {
  beforeEach(() => mocks.getSession.mockReset());
  const run = (next: ReturnType<typeof vi.fn>) => mocks.client.mock.calls[0][0]({ next });

  it("envia a sessão do mesmo cliente usado no login do painel", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: "test-session" } }, error: null });
    const next = vi.fn();
    await run(next);
    expect(next).toHaveBeenCalledWith({ headers: { Authorization: "Bearer test-session" } });
  });
  it("não inventa autorização quando não há sessão", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const next = vi.fn();
    await run(next);
    expect(next).toHaveBeenCalledWith({ headers: {} });
  });
  it("informa falha de sessão sem executar a ação", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: { message: "unavailable" } });
    const next = vi.fn();
    await expect(run(next)).rejects.toThrow("Entre novamente no painel");
    expect(next).not.toHaveBeenCalled();
  });
  it("mantém o vínculo global e a proteção de vídeo e PDF", () => {
    const start = readFileSync("src/start.ts", "utf8");
    expect(start).toContain("functionMiddleware: [attachProjectAuth]");
    expect(start).not.toContain("attachSupabaseAuth");
    const draw = readFileSync("src/lib/api/draw.functions.ts", "utf8");
    expect(draw.match(/\.middleware\(\[requireSupabaseAuth\]\)/g)).toHaveLength(2);
    expect(draw.match(/rpc\("is_admin"\)/g)).toHaveLength(2);
  });
});
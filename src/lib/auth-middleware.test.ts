import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
import { projectAuthHeaders } from "./auth-session";

describe("autorização das ações administrativas", () => {
  beforeEach(() => mocks.getSession.mockReset());

  it("envia a sessão do mesmo cliente usado no login do painel", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: "test-session" } }, error: null });
    expect(await projectAuthHeaders()).toEqual({ Authorization: "Bearer test-session" });
  });
  it("não inventa autorização quando não há sessão", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await projectAuthHeaders()).toEqual({});
  });
  it("informa falha de sessão sem executar a ação", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: { message: "unavailable" } });
    await expect(projectAuthHeaders()).rejects.toThrow("Entre novamente no painel");
  });
  it("mantém o vínculo global e a proteção de vídeo e PDF", () => {
    const start = readFileSync("src/start.ts", "utf8");
    expect(start).toContain("functionMiddleware: [attachProjectAuth]");
    expect(start).not.toContain("attachSupabaseAuth");
    expect(readFileSync("src/lib/auth-middleware.ts", "utf8")).toContain("next({ headers: await projectAuthHeaders() })");
    const draw = readFileSync("src/lib/api/draw.functions.ts", "utf8");
    expect(draw.match(/\.middleware\(\[requireSupabaseAuth\]\)/g)).toHaveLength(2);
    expect(draw.match(/rpc\("is_admin"\)/g)).toHaveLength(2);
  });
});
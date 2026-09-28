import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_NUMBERS_PER_ORDER,
  PIX_EXPIRATION_GRACE_MS,
  PIX_RESERVATION_MS,
  isTerminalPixStatus,
} from "./pix-policy";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("regras críticas do PIX", () => {
  it("mantém cobrança e reserva no prazo único de dez minutos", () => {
    expect(PIX_RESERVATION_MS).toBe(600_000);
    expect(PIX_EXPIRATION_GRACE_MS).toBe(30_000);
    expect(source("./mercadopago.server.ts")).toContain("PIX_RESERVATION_MS");
  });

  it("só libera números após estado terminal confirmado", () => {
    expect(isTerminalPixStatus("cancelled")).toBe(true);
    expect(isTerminalPixStatus("rejected")).toBe(true);
    expect(isTerminalPixStatus("approved")).toBe(false);
    expect(isTerminalPixStatus("pending")).toBe(false);
    expect(source("./api/order.functions.ts")).toContain("isTerminalPixStatus");
    expect(source("./pix-maintenance.server.ts")).toContain("isTerminalPixStatus");
  });

  it("impede regressão de repetição infinita na tela expirada", () => {
    const checkout = source("../routes/checkout.$orderId.tsx");
    expect(checkout).not.toContain("setExpirationHandled(false)");
    expect(checkout).toContain('id: `pix-expiration-${orderId}`');
  });

  it("mantém limite e recuperação do botão de reserva", () => {
    expect(MAX_NUMBERS_PER_ORDER).toBe(100);
    const campaign = source("../routes/campanha.$slug.tsx");
    expect(campaign).toContain("next.size >= MAX_NUMBERS_PER_ORDER");
    expect(campaign).toContain("finally {");
    expect(campaign).toContain("setSubmitting(false)");
  });

  it("não devolve campos internos na disponibilidade pública", () => {
    const orders = source("./api/order.functions.ts");
    expect(orders).toContain('.select("number,status")');
    expect(orders).not.toContain('.select("number,status,buyer_id")');
  });
});
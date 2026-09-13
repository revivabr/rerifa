export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function padNumber(n: number, total: number): string {
  const width = String(total).length;
  return String(n).padStart(width, "0");
}

export function formatDateBR(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Para datas de calendário puras (start_date, end_date, draw_date), armazenadas como
// meia-noite UTC sem horário relevante. Formatar em UTC evita que o fuso do navegador
// jogue a data um dia para trás (ex.: 2026-10-10T00:00:00Z virando 09/10 no Brasil).
export function formatCalendarDateBR(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

export function formatWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const PIX_RESERVATION_MS = 10 * 60 * 1000;
export const PIX_EXPIRATION_GRACE_MS = 30 * 1000;
export const MAX_NUMBERS_PER_ORDER = 100;
export const AVAILABILITY_REFRESH_MS = 5 * 1000;

export const TERMINAL_PIX_STATUSES = [
  "cancelled",
  "rejected",
  "refunded",
  "charged_back",
] as const;

export function isTerminalPixStatus(status: string | null | undefined): boolean {
  return Boolean(status && TERMINAL_PIX_STATUSES.includes(status as (typeof TERMINAL_PIX_STATUSES)[number]));
}
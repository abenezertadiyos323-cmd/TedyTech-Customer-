/// <reference types="vite/client" />

function normalizeBotUsername(value: string | undefined): string {
  if (!value) return "TedyTechBot";
  return value.trim().replace(/^@+/, "");
}

/**
 * Single source of truth for store/bot/contact routing in the customer app.
 * Keep values public-safe: this object is bundled client-side.
 */
export const storeConfig = {
  botUsername: normalizeBotUsername(import.meta.env.VITE_BOT_USERNAME as string),
  phoneNumberE164: (import.meta.env.VITE_STORE_PHONE as string) || "",
  mapsUrl: (import.meta.env.VITE_STORE_MAPS_URL as string) || "",
  telegramStartPrefix: "lead_",
} as const;

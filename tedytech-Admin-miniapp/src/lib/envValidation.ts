export interface EnvConfig {
  VITE_CONVEX_URL: string;
  VITE_ADMIN_CHAT_ID: string | null;
}

export function validateEnv(): {
  isValid: boolean;
  config: EnvConfig;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate VITE_CONVEX_URL
  const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
  if (!convexUrl) {
    errors.push("VITE_CONVEX_URL is not configured");
  } else if (!convexUrl.startsWith("https://")) {
    errors.push("VITE_CONVEX_URL must start with https://");
  }

  // Validate VITE_ADMIN_CHAT_ID
  const adminChatId = import.meta.env.VITE_ADMIN_CHAT_ID?.trim();
  if (!adminChatId || adminChatId === "") {
    errors.push(
      "VITE_ADMIN_CHAT_ID is not configured (required for admin authorization)",
    );
  } else if (!/^\d+$/.test(adminChatId)) {
    errors.push(
      "VITE_ADMIN_CHAT_ID must be a numeric Telegram user ID (found: '" +
        adminChatId +
        "')",
    );
  }

  return {
    isValid: errors.length === 0,
    config: {
      VITE_CONVEX_URL: convexUrl || "",
      VITE_ADMIN_CHAT_ID: adminChatId || null,
    },
    errors,
  };
}

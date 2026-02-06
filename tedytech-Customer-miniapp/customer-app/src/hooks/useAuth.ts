import { useState, useEffect, useCallback } from "react";
import { useSession } from "./useSession";

const TELEGRAM_VERIFIED_KEY = "tedytech_tg_verified";

interface TelegramIdentity {
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

export function useAuth() {
  const { sessionId, isLoading: sessionLoading } = useSession();
  const [telegramIdentity, setTelegramIdentity] =
    useState<TelegramIdentity | null>(null);

  useEffect(() => {
    const verified = localStorage.getItem(TELEGRAM_VERIFIED_KEY);
    if (verified) setTelegramIdentity(null);
  }, []);

  const verifyTelegram = useCallback(async (_initData: string) => {
    // Placeholder: mark as verified locally. Server-side verification can be
    // implemented later as a Convex action when needed.
    localStorage.setItem(TELEGRAM_VERIFIED_KEY, "true");
    return true;
  }, []);

  return {
    user: null,
    session: null,
    authUserId: sessionId,
    telegramIdentity,
    isLoading: sessionLoading,
    isAuthenticated: !!sessionId,
    authError: null,
    verifyTelegram,
  };
}

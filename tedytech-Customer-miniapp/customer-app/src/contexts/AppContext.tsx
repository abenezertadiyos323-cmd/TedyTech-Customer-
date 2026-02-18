import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useFavorites,
  useAddFavorite,
  useRemoveFavorite,
} from "@/hooks/useFavorites";
import type { Phone, SortOption } from "@/types/phone";

const TELEGRAM_STARTAPP_URL = "https://t.me/<BOT_USERNAME>?startapp=home";
type TelegramGateState =
  | "loading"
  | "needs_telegram"
  | "verifying"
  | "error"
  | "ready";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function AuthGateScreen({
  state,
  errorMessage,
  onRetry,
}: {
  state: TelegramGateState;
  errorMessage?: string | null;
  onRetry: () => void;
}) {
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasWebApp = !!window.Telegram?.WebApp;
    const uaIsTelegram = /Telegram/i.test(window.navigator.userAgent);

    setIsInTelegram(hasWebApp || uaIsTelegram);

    window.Telegram?.WebApp?.ready?.();
  }, []);

  if (state === "needs_telegram") {
    return (
      <div className="min-h-screen bg-background px-6 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Open this inside Telegram</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This mini app must be launched from Telegram.
          </p>
          {!isInTelegram && (
            <a
              href={TELEGRAM_STARTAPP_URL}
              className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open in Telegram
            </a>
          )}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-background px-6 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Couldn&apos;t sign you in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage ||
              "Please reopen this mini app from Telegram and try again."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
          >
            Retry
          </button>
          <a
            href={TELEGRAM_STARTAPP_URL}
            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reopen in Telegram
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">
        {state === "verifying"
          ? "Verifying Telegram session..."
          : "Loading..."}
      </p>
    </div>
  );
}

interface AppContextType {
  // Auth (replaces session)
  authUserId: string | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  isTelegramAuthenticated: boolean;
  customerId: string | null;
  telegramUserId: number | null;
  telegramUsername: string | null;

  // Legacy session support for existing hooks
  sessionId: string | null;
  isSessionLoading: boolean;
  isInTelegram: boolean;
  closeWebApp: () => void;

  // Favorites
  favoritePhoneIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;

  // Filters
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  selectedBudget: { min: number; max: number } | null;
  setSelectedBudget: (budget: { min: number; max: number } | null) => void;
  selectedStorageFilters: number[];
  setSelectedStorageFilters: (storage: number[]) => void;
  selectedConditions: string[];
  setSelectedConditions: (conditions: string[]) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quickPickMode: "home" | "all" | "arrivals" | "premium" | "accessories";
  setQuickPickMode: (
    mode: "home" | "all" | "arrivals" | "premium" | "accessories",
  ) => void;

  // Actions
  clearFilters: () => void;
  hasActiveFilters: boolean;
  targetExchangePhone: Phone | null;
  setTargetExchangePhone: (phone: Phone | null) => void;
  resetToDefaultHome: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // New auth system with anonymous auth
  const {
    authUserId,
    isLoading: isAuthLoading,
    isAuthenticated,
    isTelegramAuthenticated,
    telegramIdentity,
    verifyTelegram,
    authError,
    clearAuthError = () => {},
  } = useAuth();

  // For backwards compatibility, create a session ID from auth user ID
  const sessionId = authUserId;
  const isSessionLoading = isAuthLoading;

  // Favorites from Supabase (using sessionId for backwards compat)
  // Guard: only subscribe once Telegram auth is verified to prevent premature query
  const { data: favorites = [] } = useFavorites(
    isTelegramAuthenticated && sessionId ? sessionId : null
  );
  const addFavorite = useAddFavorite(sessionId);
  const removeFavorite = useRemoveFavorite(sessionId);

  const favoritePhoneIds = useMemo(
    () => favorites.map((f) => f.phone_id),
    [favorites],
  );

  // Filter state
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [selectedStorageFilters, setSelectedStorageFilters] = useState<
    number[]
  >([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickPickMode, setQuickPickMode] = useState<
    "home" | "all" | "arrivals" | "premium" | "accessories"
  >("home");
  const [targetExchangePhone, setTargetExchangePhone] = useState<Phone | null>(
    null,
  );
  const [isInTelegram, setIsInTelegram] = React.useState(false);
  const [telegramGateState, setTelegramGateState] =
    React.useState<TelegramGateState>("loading");
  const hasAttemptedTelegramAuth = React.useRef(false);
  const setGateState = useCallback((next: TelegramGateState) => {
    setTelegramGateState((current) => {
      if (current !== next) {
        console.info(`[AuthGate] state=${next}`);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    console.info(`[AuthGate] state=${telegramGateState}`);
  }, []);

  const retryTelegramAuth = useCallback(() => {
    clearAuthError();
    hasAttemptedTelegramAuth.current = false;
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) {
      setGateState("needs_telegram");
      return;
    }
    setGateState("loading");
  }, [clearAuthError, setGateState]);

  // Initialize Telegram WebApp: lifecycle, theme, main button.
  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) {
        setIsInTelegram(false);
        setGateState("needs_telegram");
        return;
      }

      setIsInTelegram(true);
      setGateState("loading");

      // Basic lifecycle
      tg.ready?.();
      tg.expand?.();

      // Apply theme params (set CSS variables for easy theming)
      const tp = tg.themeParams;
      if (tp) {
        if (tp.bg_color)
          document.documentElement.style.setProperty(
            "--tg-bg-color",
            tp.bg_color,
          );
        if (tp.text_color)
          document.documentElement.style.setProperty(
            "--tg-text-color",
            tp.text_color,
          );
        if (tp.secondary_bg_color)
          document.documentElement.style.setProperty(
            "--tg-secondary-bg-color",
            tp.secondary_bg_color,
          );
        if (tp.button_color)
          document.documentElement.style.setProperty(
            "--tg-button-color",
            tp.button_color,
          );
        if (tp.button_text_color)
          document.documentElement.style.setProperty(
            "--tg-button-text-color",
            tp.button_text_color,
          );
      }
    } catch (error) {
      console.error(`[AuthGate] init error: ${getErrorMessage(error)}`);
      setGateState("error");
    }

    return () => {
      // no teardown required for ready/expand
    };
  }, [setGateState]);

  // Verify Telegram initData with backend once the anonymous session is ready.
  useEffect(() => {
    let cancelled = false;

    async function runGate() {
      if (telegramGateState === "needs_telegram") return;
      if (isAuthLoading) return;

      if (!isAuthenticated || !authUserId) {
        if (!cancelled) setGateState("error");
        return;
      }

      if (isTelegramAuthenticated && telegramIdentity) {
        if (!cancelled) setGateState("ready");
        return;
      }

      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) {
        if (!cancelled) setGateState("needs_telegram");
        return;
      }

      if (hasAttemptedTelegramAuth.current) return;
      hasAttemptedTelegramAuth.current = true;

      clearAuthError();
      if (!cancelled) setGateState("verifying");

      try {
        const success = await verifyTelegram(tg.initData);
        if (!cancelled) setGateState(success ? "ready" : "error");
      } catch (error) {
        console.error(`[AuthGate] verify error: ${getErrorMessage(error)}`);
        if (!cancelled) setGateState("error");
      }
    }

    void runGate();

    return () => {
      cancelled = true;
    };
  }, [
    telegramGateState,
    isAuthLoading,
    isAuthenticated,
    authUserId,
    isTelegramAuthenticated,
    telegramIdentity,
    clearAuthError,
    setGateState,
    verifyTelegram,
  ]);

  const closeWebApp = React.useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.close) tg.close();
  }, []);

  // MainButton: show a default Close action while in Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const main = tg?.MainButton;
    if (!tg || !main) return;

    try {
      main.setText?.("Close");
      const handler = () => closeWebApp();
      main.onClick?.(handler);
      main.show?.();
      return () => {
        main.offClick?.(handler);
        main.hide?.();
      };
    } catch (error) {
      console.warn(
        `[AuthGate] MainButton error: ${getErrorMessage(error)}`,
      );
    }
  }, [closeWebApp]);

  const toggleSaved = useCallback(
    (id: string) => {
      if (favoritePhoneIds.includes(id)) {
        removeFavorite.mutate(id);
      } else {
        addFavorite.mutate(id);
      }
    },
    [favoritePhoneIds, addFavorite, removeFavorite],
  );

  const isSaved = useCallback(
    (id: string) => favoritePhoneIds.includes(id),
    [favoritePhoneIds],
  );

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedBudget(null);
    setSelectedStorageFilters([]);
    setSelectedConditions([]);
    setSortOption("newest");
    setQuickPickMode("home");
  };

  const resetToDefaultHome = () => {
    setQuickPickMode("home");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedBudget !== null ||
    selectedStorageFilters.length > 0 ||
    selectedConditions.length > 0 ||
    sortOption !== "newest";

  if (telegramGateState !== "ready") {
    return (
      <AuthGateScreen
        state={telegramGateState}
        errorMessage={authError}
        onRetry={retryTelegramAuth}
      />
    );
  }

  return (
    <AppContext.Provider
      value={{
        // Auth
        authUserId,
        isAuthLoading,
        isAuthenticated,
        isTelegramAuthenticated,
        customerId: telegramIdentity?.customerId ?? null,
        telegramUserId: telegramIdentity?.telegramUserId ?? null,
        telegramUsername: telegramIdentity?.username ?? null,

        // Legacy session compat
        sessionId,
        isSessionLoading,
        isInTelegram,
        closeWebApp,

        favoritePhoneIds,
        toggleSaved,
        isSaved,
        selectedBrands,
        setSelectedBrands,
        selectedBudget,
        setSelectedBudget,
        selectedStorageFilters,
        setSelectedStorageFilters,
        selectedConditions,
        setSelectedConditions,
        sortOption,
        setSortOption,
        searchQuery,
        setSearchQuery,
        quickPickMode,
        setQuickPickMode,
        clearFilters,
        hasActiveFilters,
        targetExchangePhone,
        setTargetExchangePhone,
        resetToDefaultHome,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

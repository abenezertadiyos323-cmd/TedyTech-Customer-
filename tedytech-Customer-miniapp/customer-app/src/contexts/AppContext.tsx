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

// Declare Telegram WebApp global
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        // Theme parameters provided by Telegram
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        // Typical lifecycle methods
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        // MainButton API (partial)
        MainButton?: {
          setText?: (s: string) => void;
          show?: () => void;
          hide?: () => void;
          onClick?: (fn: () => void) => void;
          offClick?: (fn: () => void) => void;
        };
      };
    };
  }
}

interface AppContextType {
  // Auth (replaces session)
  authUserId: string | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  telegramUserId: number | null;

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
    telegramIdentity,
    verifyTelegram,
    authError,
  } = useAuth();

  // For backwards compatibility, create a session ID from auth user ID
  const sessionId = authUserId;
  const isSessionLoading = isAuthLoading;

  // Favorites from Supabase (using sessionId for backwards compat)
  const { data: favorites = [] } = useFavorites(sessionId);
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

  // Telegram WebApp verification on load
  useEffect(() => {
    if (!isAuthenticated || !authUserId) return;
    if (telegramIdentity) return; // Already verified

    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) return; // Not in Telegram context

    // Verify telegram identity
    console.log("Attempting Telegram verification...");
    verifyTelegram(tg.initData).then((success) => {
      if (success) {
        console.log("Telegram identity verified and linked");
      } else {
        console.log("Telegram verification failed or not in Telegram context");
      }
    });
  }, [isAuthenticated, authUserId, telegramIdentity, verifyTelegram]);

  // Initialize Telegram WebApp: lifecycle, theme, main button
  const [isInTelegram, setIsInTelegram] = React.useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    setIsInTelegram(true);

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

    return () => {
      // no teardown required for ready/expand
    };
  }, []);

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
    } catch (e) {
      console.warn("[Telegram] MainButton setup failed", e);
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

  return (
    <AppContext.Provider
      value={{
        // Auth
        authUserId,
        isAuthLoading,
        isAuthenticated,
        telegramUserId: telegramIdentity?.telegram_user_id ?? null,

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

/// <reference types="vite/client" />
/// <reference path="../types/telegram-webapp.d.ts" />
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex_generated/api";
import { useSession } from "@/hooks/useSession";
import {
  useFavorites,
  useAddFavorite,
  useRemoveFavorite,
} from "@/hooks/useFavorites";
import type { Phone, SortOption } from "@/types/phone";
import { storeConfig } from "@/config/storeConfig";

// Local Telegram WebApp type — self-contained so this file compiles
// regardless of which tsconfig the IDE picks up.
type TgThemeParams = {
  bg_color?: string;
  text_color?: string;
  secondary_bg_color?: string;
  button_color?: string;
  button_text_color?: string;
};
type TgMainButton = {
  setText?: (t: string) => void;
  show?: () => void;
  hide?: () => void;
  onClick?: (h: () => void) => void;
  offClick?: (h: () => void) => void;
};
type TgWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    // Set by Telegram when app is opened via t.me/bot?startapp=<value> or inline button
    start_param?: string;
  };
  themeParams?: TgThemeParams;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  MainButton?: TgMainButton;
};
/** Type-safe accessor — avoids relying on global Window augmentation. */
function getTgWebApp(): TgWebApp | undefined {
  return (window as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
}

// ---------------------------------------------------------------------------
// Debug logger — only emits when VITE_APP_ENVIRONMENT=dev or ?debug=1
// ---------------------------------------------------------------------------

const IS_DEBUG =
  new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  ).get("debug") === "1" ||
  (import.meta.env.VITE_APP_ENVIRONMENT as string | undefined) === "dev";

function debugLog(msg: string, data?: Record<string, unknown>) {
  if (!IS_DEBUG) return;
  data !== undefined
    ? console.debug(`[TedyTech] ${msg}`, data)
    : console.debug(`[TedyTech] ${msg}`);
}

// ---------------------------------------------------------------------------
// Telegram detection — 3-state machine
// ---------------------------------------------------------------------------

type TelegramCheckState = "checking" | "in_telegram" | "needs_telegram";

const TELEGRAM_STARTAPP_URL = `https://t.me/${storeConfig.botUsername}?startapp=home`;
const TG_USER_STORAGE_KEY = "tg_user_id";
// Stores the ?ref= referral code from the URL across the session until auth resolves.
const REF_STORAGE_KEY = "tedytech_ref";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Safely extract the authenticated Telegram user from initDataUnsafe.
 * Returns null if WebApp is unavailable or the user object is missing/malformed.
 * Never throws — every level is guarded explicitly.
 */
function getTelegramUser(): TelegramUser | null {
  try {
    const tg = getTgWebApp();
    if (!tg) return null;
    // Guard each level independently — do NOT rely on optional chaining alone.
    const unsafe = tg.initDataUnsafe;
    if (!unsafe) return null;
    const user = unsafe.user;
    if (!user) return null;
    // user.id must be a positive finite integer (Telegram guarantees this but be paranoid).
    if (
      typeof user.id !== "number" ||
      !Number.isFinite(user.id) ||
      user.id <= 0
    ) {
      return null;
    }
    return {
      id: user.id,
      // Type-guard every string field — malformed payloads may have wrong types.
      first_name: typeof user.first_name === "string" ? user.first_name : "",
      last_name:
        typeof user.last_name === "string" ? user.last_name : undefined,
      username:
        typeof user.username === "string" ? user.username : undefined,
      language_code:
        typeof user.language_code === "string"
          ? user.language_code
          : undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Loading screen — shown immediately on mount while detection runs
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gate screen — only shown as last resort after 3 000 ms timeout
// ---------------------------------------------------------------------------

function NeedsTelegramScreen() {
  return (
    <div className="min-h-screen bg-background px-6 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">Open this inside Telegram</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This mini app must be launched from Telegram.
        </p>
        <a
          href={TELEGRAM_STARTAPP_URL}
          className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Open in Telegram
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface AppContextType {
  // Telegram identity (new)
  telegramUser: TelegramUser | null;

  // Auth (backwards-compatible field names kept)
  authUserId: string | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  isTelegramAuthenticated: boolean;
  customerId: string | null;
  telegramUserId: number | null;
  telegramUsername: string | null;

  // Verified Convex customer ID — populated after background initData
  // verification completes. null until then; never blocks rendering.
  verifiedCustomerId: string | null;

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

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AppContext = createContext<AppContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Telegram detection (3-state) ─────────────────────────────────────────
  const [checkState, setCheckState] =
    useState<TelegramCheckState>("checking");
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  // Pre-load Telegram user id from localStorage — available immediately on
  // reload before WebApp injects, so Convex or logging can use it during the
  // "checking" phase. Replaced by the real Telegram id once detection succeeds.
  const storedTelegramUserId = useState<string | null>(() => {
    try {
      return localStorage.getItem(TG_USER_STORAGE_KEY);
    } catch {
      return null;
    }
  })[0]; // read-only — we only need the initial value

  // ── Convex background verification ───────────────────────────────────────
  // Hook must be called unconditionally (Rules of Hooks).
  // The actual call happens in a useEffect after Telegram is detected.
  const verifyTelegramUserMutation = useMutation(api.auth.verifyTelegramUser);
  const createReferralMutation = useMutation(api.affiliates.createReferralIfValid);
  // Verified Convex customer document ID — null until background verification
  // completes successfully. Never blocks UI rendering.
  const [verifiedCustomerId, setVerifiedCustomerId] = useState<string | null>(
    null,
  );

  // ── Session — runs in background; provides a stable Convex session id ────
  const { sessionId, isLoading: isSessionLoading } = useSession();

  // ── Favorites — no backend auth required; keyed by anonymous sessionId ───
  const { data: favorites = [] } = useFavorites(sessionId);
  const addFavorite = useAddFavorite(sessionId);
  const removeFavorite = useRemoveFavorite(sessionId);

  const favoritePhoneIds = useMemo(
    () => favorites.map((f: { phoneId: string }) => f.phoneId),
    [favorites],
  );

  // ── Filter state ─────────────────────────────────────────────────────────
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

  // ── Telegram detection: poll every 50ms, give up after 3 000ms ──────────
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const startMs = Date.now();
    const MAX_WAIT_MS = 3000;
    const POLL_MS = 50;

    function applyTheme(tp: TgThemeParams | undefined) {
      if (!tp) return;
      const cssVars: Array<[string, string | undefined]> = [
        ["--tg-bg-color", tp.bg_color],
        ["--tg-text-color", tp.text_color],
        ["--tg-secondary-bg-color", tp.secondary_bg_color],
        ["--tg-button-color", tp.button_color],
        ["--tg-button-text-color", tp.button_text_color],
      ];
      for (const [key, val] of cssVars) {
        if (val) document.documentElement.style.setProperty(key, val);
      }
    }

    debugLog("poll started", { hasStoredId: !!storedTelegramUserId });

    function poll() {
      if (cancelled) return;
      try {
        const tg = getTgWebApp();

        // Detect presence strictly via Boolean(window.Telegram?.WebApp).
        // Do not gate detection on initData content.
        // Empty initData can still happen in valid Telegram contexts.
        if (Boolean(tg)) {
          debugLog("telegram WebApp detected");
          tg.ready?.();
          tg.expand?.();
          applyTheme(tg.themeParams);

          const user = getTelegramUser();
          debugLog("user resolved", {
            hasUser: !!user,
            userId: user?.id ?? null,
            // Show what was pre-loaded from localStorage before WebApp injected
            priorStoredId: storedTelegramUserId,
          });
          setTelegramUser(user);

          // Persist Telegram user id to localStorage as a stable string fallback
          if (user?.id) {
            const idStr = String(user.id);
            try {
              localStorage.setItem(TG_USER_STORAGE_KEY, idStr);
              debugLog("user id persisted to localStorage", { id: idStr });
            } catch {
              // Blocked in some private-browsing contexts — safe to ignore
            }
          }

          if (!cancelled) {
            debugLog("state transition: checking → in_telegram", {
              hasUser: !!user,
              userId: user?.id ?? null,
            });
            setCheckState("in_telegram");
          }
          return;
        }

        // Still waiting for WebApp injection
        if (Date.now() - startMs >= MAX_WAIT_MS) {
          if (!cancelled) {
            debugLog("state transition: checking → needs_telegram (timeout)");
            setCheckState("needs_telegram");
          }
          return;
        }

        timer = setTimeout(poll, POLL_MS);
      } catch (err) {
        // Always log real errors — not gated behind debug flag
        console.error("[TedyTech] poll error:", err);
        if (!cancelled) setCheckState("needs_telegram");
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  // ── Capture ?ref= referral code from URL on first mount ──────────────────
  // Runs before Telegram detection so the code is saved even during loading.
  // Uses window.location.search (before the hash) — unaffected by HashRouter.
  useEffect(() => {
    const ref = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    ).get("ref");
    if (ref && ref.trim()) {
      try {
        localStorage.setItem(REF_STORAGE_KEY, ref.trim());
        debugLog("referral code captured from URL", { ref: ref.trim() });
      } catch {
        // Blocked in some private-browsing contexts — safe to ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Telegram MainButton: default close action ────────────────────────────
  const closeWebApp = useCallback(() => {
    try {
      getTgWebApp()?.close?.();
    } catch {
      // ignore
    }
  }, []);

  // ── Background Telegram verification ─────────────────────────────────────
  // Fires once after Telegram is detected. Never blocks UI — on any failure
  // we log a warning and carry on; verifiedCustomerId simply stays null.
  useEffect(() => {
    if (checkState !== "in_telegram") return;

    const initData = getTgWebApp()?.initData ?? "";
    if (!initData.trim()) {
      // initData is empty in some preview/test contexts — skip silently.
      debugLog("background verify: no initData, skipping");
      return;
    }

    debugLog("background verify: starting");
    verifyTelegramUserMutation({ initData })
      .then((result) => {
        const id = String(result.customerId);
        setVerifiedCustomerId(id);
        debugLog("background verify: complete", { customerId: id });

        // Apply any referral code: first from ?ref= URL param (captured on mount),
        // then fall back to Telegram start_param (app opened via startapp=ref_CODE).
        // createReferralIfValid has server-side guards (duplicate, self-referral).
        let refCode: string | null = null;
        try {
          refCode = localStorage.getItem(REF_STORAGE_KEY);
        } catch { /* ignore */ }

        // Fallback: read Telegram's start_param (set when opened via startapp=ref_CODE)
        if (!refCode) {
          try {
            const startParam = getTgWebApp()?.initDataUnsafe?.start_param;
            if (typeof startParam === "string" && startParam.startsWith("ref_")) {
              refCode = startParam.slice(4); // strip leading 'ref_'
              console.log("[TedyTech] referral code from start_param", { code: refCode });
            }
          } catch { /* ignore */ }
        }

        const tgUser = getTelegramUser();
        if (refCode && tgUser?.id) {
          console.log("[TedyTech] applying referral", { refCode, referredId: tgUser.id });
          createReferralMutation({
            referralCode: refCode,
            referredTelegramId: tgUser.id,
          })
            .catch(() => { /* non-fatal — server guards prevent double-apply */ })
            .finally(() => {
              // Clear after attempt regardless of result.
              // Server is idempotent — safe to clear here.
              try { localStorage.removeItem(REF_STORAGE_KEY); } catch { /* */ }
            });
        }
      })
      .catch((err: unknown) => {
        // Non-fatal: initData may be expired or TELEGRAM_BOT_TOKEN not set yet.
        // UX is already running — log and continue.
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[TedyTech] Background Telegram verification failed:", msg);
      });
  }, [checkState, verifyTelegramUserMutation, createReferralMutation]);

  // ── Favorites helpers ────────────────────────────────────────────────────
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

  // ── Gate render ──────────────────────────────────────────────────────────

  // Default: show loading immediately (no blank frame)
  if (checkState === "checking") return <LoadingScreen />;

  // Last resort: show gate only after 3000ms timeout
  if (checkState === "needs_telegram") return <NeedsTelegramScreen />;

  // In Telegram — render the full app
  return (
    <AppContext.Provider
      value={{
        // Telegram identity
        telegramUser,
        telegramUserId: telegramUser?.id ?? null,
        telegramUsername: telegramUser?.username ?? null,

        // Auth — backwards-compatible shape
        authUserId: sessionId,
        isAuthLoading: isSessionLoading,
        isAuthenticated: !!sessionId,
        // Always true here: we only render children when in_telegram
        isTelegramAuthenticated: true,
        // Populated once background initData verification completes
        customerId: verifiedCustomerId,
        verifiedCustomerId,

        // Legacy session support
        sessionId,
        isSessionLoading,
        isInTelegram: true,
        closeWebApp,

        // Favorites
        favoritePhoneIds,
        toggleSaved,
        isSaved,

        // Filters
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


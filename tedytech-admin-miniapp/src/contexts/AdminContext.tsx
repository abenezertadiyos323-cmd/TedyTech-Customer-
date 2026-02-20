import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useConvex } from "convex/react";
import { api } from "convex_generated/api";
import type { TabType, Filters } from "@/types/admin";
import { processQueue } from "@/lib/offlineQueue";
import { toast } from "@/lib/toast";

interface AdminContextType {
  // Active tab navigation.
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Session and auth.
  sessionId: string | null;
  telegramUserId: number | null;
  isWebAppReady: boolean;
  adminToken: string | null;
  sellerId: string | null;
  isAuthorized: boolean | null;
  webAppError: string | null;

  // Inventory filters.
  inventoryFilters: Filters;
  setInventoryFilters: (filters: Filters) => void;
  clearInventoryFilters: () => void;

  // Orders filters.
  ordersFilters: Filters;
  setOrdersFilters: (filters: Filters) => void;
  clearOrdersFilters: () => void;

  // UI state.
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const getTelegramWebApp = () => {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
};

export function AdminProvider({ children }: { children: ReactNode }) {
  // Navigation state.
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Session state.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [telegramUserId, setTelegramUserId] = useState<number | null>(null);
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [webAppError, setWebAppError] = useState<string | null>(null);

  // Filter states.
  const [inventoryFilters, setInventoryFilters] = useState<Filters>({});
  const [ordersFilters, setOrdersFilters] = useState<Filters>({});

  // UI state.
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Initialize Telegram WebApp.
  useEffect(() => {
    let didCleanup = false;
    let resolved = false;

    const markReady = (errorMessage: string | null) => {
      if (didCleanup || resolved) return;
      resolved = true;
      setWebAppError(errorMessage);
      setIsWebAppReady(true);
    };

    const timeoutId = window.setTimeout(() => {
      console.error("[AdminContext] Telegram WebApp initialization timed out");
      markReady(
        "Telegram WebApp initialization timed out. Open the app from Telegram again.",
      );
    }, 5000);

    try {
      const tg = getTelegramWebApp();

      if (tg) {
        console.log("[AdminContext] Telegram WebApp detected", {
          version: (tg as any).version,
          platform: (tg as any).platform,
        });

        tg.ready?.();
        tg.expand?.();

        // Apply Telegram color scheme: dark by default, switch to light if Telegram says so.
        const root = document.documentElement;
        if ((tg as any).colorScheme === "light") {
          root.classList.remove("dark");
        }

        // Helper: convert hex/rgba color to H S% L% triple used by our HSL vars
        const hexToHslTriple = (hexOrColor: string) => {
          try {
            // Create a temporary element to normalize color values to rgb()
            const el = document.createElement("div");
            el.style.color = hexOrColor;
            document.body.appendChild(el);
            const computed = getComputedStyle(el).color; // e.g. rgb(r, g, b) or rgba(...)
            document.body.removeChild(el);

            const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!m) return null;
            const r = Number(m[1]) / 255;
            const g = Number(m[2]) / 255;
            const b = Number(m[3]) / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0;
            let s = 0;
            const l = (max + min) / 2;

            if (max !== min) {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r:
                  h = (g - b) / d + (g < b ? 6 : 0);
                  break;
                case g:
                  h = (b - r) / d + 2;
                  break;
                case b:
                  h = (r - g) / d + 4;
                  break;
              }
              h /= 6;
            }

            const H = Math.round(h * 360);
            const S = Math.round(s * 100);
            const L = Math.round(l * 100);

            return `${H} ${S}% ${L}%`;
          } catch (e) {
            return null;
          }
        };

        if (tg.themeParams) {
          if (tg.themeParams.bg_color) {
            const triple = hexToHslTriple(tg.themeParams.bg_color);
            if (triple) root.style.setProperty("--background", triple);
            root.style.setProperty("--tg-bg-color", tg.themeParams.bg_color);
          }
          if (tg.themeParams.text_color) {
            const triple = hexToHslTriple(tg.themeParams.text_color);
            if (triple) root.style.setProperty("--foreground", triple);
            root.style.setProperty(
              "--tg-text-color",
              tg.themeParams.text_color,
            );
          }
          if (tg.themeParams.button_color) {
            const triple = hexToHslTriple(tg.themeParams.button_color);
            if (triple) root.style.setProperty("--primary", triple);
            root.style.setProperty(
              "--tg-button-color",
              tg.themeParams.button_color,
            );
          }
          if (tg.themeParams.button_text_color) {
            const triple = hexToHslTriple(tg.themeParams.button_text_color);
            if (triple) root.style.setProperty("--primary-foreground", triple);
            root.style.setProperty(
              "--tg-button-text-color",
              tg.themeParams.button_text_color,
            );
          }
          if (tg.themeParams.secondary_bg_color) {
            const triple = hexToHslTriple(tg.themeParams.secondary_bg_color);
            if (triple) root.style.setProperty("--secondary", triple);
            root.style.setProperty(
              "--tg-secondary-bg-color",
              tg.themeParams.secondary_bg_color,
            );
          }
        }

        if (tg.initDataUnsafe?.user?.id) {
          setTelegramUserId(tg.initDataUnsafe.user.id);
        }

        if (tg.MainButton) {
          tg.MainButton.setText?.("Close");
          tg.MainButton.onClick?.(() => tg.close?.());
          tg.MainButton.hide?.();
        }

        markReady(null);
      } else if (import.meta.env.DEV) {
        console.log(
          "[AdminContext] Running in browser dev mode (Telegram WebApp not detected)",
        );
        markReady(null);
      } else {
        console.error(
          "[AdminContext] Telegram WebApp SDK not detected in production",
        );
        markReady(
          "Telegram WebApp SDK is unavailable. Ensure telegram-web-app.js is loaded.",
        );
      }
    } catch (error) {
      console.error("[AdminContext] Telegram WebApp init error", error);
      markReady(
        "Telegram WebApp failed to initialize. Check Telegram Inspect logs.",
      );
    }

    return () => {
      didCleanup = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Initialize session (can be enhanced with Convex session creation later).
  useEffect(() => {
    console.log("[AdminContext] Initializing session");

    try {
      const storedSessionId = localStorage.getItem("tedytech_admin_session_id");
      if (storedSessionId) {
        console.log("[AdminContext] Found existing session:", storedSessionId);
        setSessionId(storedSessionId);
      } else {
        const newSessionId = `admin_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;
        console.log("[AdminContext] Creating new session:", newSessionId);
        localStorage.setItem("tedytech_admin_session_id", newSessionId);
        setSessionId(newSessionId);
      }
    } catch (error) {
      console.error("[AdminContext] localStorage unavailable:", error);

      // Still set a session ID in memory even if localStorage fails
      const fallbackSessionId = `admin_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      console.log(
        "[AdminContext] Using fallback session (memory only):",
        fallbackSessionId,
      );
      setSessionId(fallbackSessionId);

      setWebAppError(
        (prev) =>
          prev ??
          "Local storage is unavailable. Session will not persist after refresh.",
      );
    }
  }, []);

  // Process offline queue when connection is restored.
  const convex = useConvex();
  useEffect(() => {
    const handleOnline = async () => {
      toast.online();
      const result = await processQueue(convex);
      if (result.processed > 0) {
        toast.synced();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [convex]);

  const clearInventoryFilters = () => {
    setInventoryFilters({});
  };

  const clearOrdersFilters = () => {
    setOrdersFilters({});
  };

  // Try to authenticate with Convex when Telegram is ready.
  useEffect(() => {
    const tryAuth = async (attempt = 1) => {
      const MAX_AUTH_RETRIES = 3;

      console.log(
        `[AdminContext] Auth attempt ${attempt}/${MAX_AUTH_RETRIES}`,
        {
          isWebAppReady,
          telegramUserId,
          adminToken,
        },
      );

      if (!isWebAppReady) {
        console.log("[AdminContext] Skipping auth: WebApp not ready");
        return;
      }

      if (!telegramUserId) {
        console.log("[AdminContext] Skipping auth: No Telegram user ID");
        return;
      }

      if (adminToken) {
        console.log("[AdminContext] Skipping auth: Already authenticated");
        return;
      }

      try {
        console.log("[AdminContext] Starting authentication mutation");

        const authenticateRef = (api as any)?.mutations?.sellers
          ?.authenticateWithTelegram;

        if (!authenticateRef) {
          console.error(
            "[AdminContext] Missing Convex mutation: api.mutations.sellers.authenticateWithTelegram",
          );
          setWebAppError(
            (prev) =>
              prev ??
              "Authentication service unavailable. Regenerate Convex API with: npx convex dev",
          );
          setIsAuthorized(false);
          return;
        }

        const tg = getTelegramWebApp();
        const user = (tg as any)?.initDataUnsafe?.user;

        console.log("[AdminContext] Calling authentication mutation with:", {
          telegramId: String(telegramUserId),
          username: user?.username,
          firstName: user?.first_name,
          lastName: user?.last_name,
        });

        const resp = await convex.mutation(authenticateRef, {
          telegramId: String(telegramUserId),
          username: user?.username,
          firstName: user?.first_name,
          lastName: user?.last_name,
        });

        console.log("[AdminContext] Authentication response:", {
          hasToken: Boolean((resp as any)?.token),
          sessionId: (resp as any)?.sessionId,
          sellerId: (resp as any)?.seller?.id,
        });

        if (resp && (resp as any).token) {
          const token = (resp as any).token as string;
          const sellerIdValue = String((resp as any)?.seller?.id ?? "");
          console.log("[AdminContext] Authentication successful", {
            sellerId: sellerIdValue,
            businessName: (resp as any)?.seller?.businessName,
            role: (resp as any)?.seller?.role,
          });

          setAdminToken(token);
          setSellerId(sellerIdValue);
          try {
            localStorage.setItem("tedytech_admin_token", token);
            localStorage.setItem("tedytech_admin_seller_id", sellerIdValue);
            console.log("[AdminContext] Token saved to localStorage. SELLER_ID:", sellerIdValue);
          } catch (e) {
            console.error(
              "[AdminContext] Failed to save token to localStorage:",
              e,
            );
          }

          setIsAuthorized(true);
        } else {
          console.error(
            "[AdminContext] Authentication failed: No token in response",
          );
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error(
          `[AdminContext] Authentication error (attempt ${attempt}):`,
          {
            error: err,
            message: (err as Error)?.message,
            stack: (err as Error)?.stack,
          },
        );

        // Retry logic
        if (attempt < MAX_AUTH_RETRIES) {
          console.log(`[AdminContext] Retrying authentication in 2s...`);
          setTimeout(() => tryAuth(attempt + 1), 2000);
        } else {
          console.error("[AdminContext] Max auth retries exceeded");
          setWebAppError(
            (prev) =>
              prev ??
              "Authentication failed after multiple attempts. Check Convex deployment and network connection.",
          );
          setIsAuthorized(false);
        }
      }
    };

    tryAuth();
  }, [isWebAppReady, telegramUserId, adminToken, convex]);

  const value: AdminContextType = {
    activeTab,
    setActiveTab,
    sessionId,
    telegramUserId,
    isWebAppReady,
    adminToken,
    sellerId,
    isAuthorized,
    webAppError,
    inventoryFilters,
    setInventoryFilters,
    clearInventoryFilters,
    ordersFilters,
    setOrdersFilters,
    clearOrdersFilters,
    isSidebarOpen,
    setSidebarOpen,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

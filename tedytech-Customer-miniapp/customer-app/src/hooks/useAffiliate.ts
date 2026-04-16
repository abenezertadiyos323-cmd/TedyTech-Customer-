import {
  useQuery as useConvexQuery,
  useMutation as useConvexMutation,
} from "convex/react";
import { useState, createContext, useContext, useEffect, useRef } from "react";
import { api } from "@/convex_generated/api";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

// Debug: active when ?debug=1 or localStorage TEDY_TECH_DEBUG=1.
const _IS_DEBUG: boolean = (() => {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("debug") === "1") return true;
    if (localStorage.getItem("TEDY_TECH_DEBUG") === "1") return true;
  } catch { /* ignore */ }
  return false;
})();
const STATS_DEBUG_KEY = "TEDY_TECH_STATS_DEBUG_LAST";
// Developer Telegram ID — auto-toasts visible only to this account.
const DEV_TG_ID = 8319120114;

// ---------------------------------------------------------------------------
// Runtime shape of affiliateCommissions rows from Convex.
// Schema uses camelCase — these MUST match convex/schema.ts exactly.
// ---------------------------------------------------------------------------
interface ConvexCommission {
  _id: string;
  affiliateId: string;
  orderId?: string;
  orderAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: string;
  createdAt: number;
}

interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalReferredCount: number;
  successfulReferrals: number;
  commissionPercent: number;
  referralCode: string | null;
}

/**
 * Hook to fetch affiliate data for the authenticated user.
 */
export function useAffiliate() {
  const { verifiedCustomerId, telegramUser, isAuthLoading } = useApp();
  const shownStatsToastRef = useRef(false);
  const initData =
    (
      window as { Telegram?: { WebApp?: { initData?: string } } }
    ).Telegram?.WebApp?.initData ?? "";
  const hasTelegramEvidence = initData.trim().length > 0 || Boolean(telegramUser);
  const customerId =
    verifiedCustomerId && hasTelegramEvidence ? verifiedCustomerId : null;
  const telegramId = telegramUser?.id ?? null;

  const affiliateData = useConvexQuery(
    api.affiliates.getAffiliateByCustomerId,
    customerId ? { customerId } : "skip",
  );
  const affiliate = affiliateData ?? null;

  const commissionsData = useConvexQuery(
    api.affiliates.listAffiliateCommissions,
    affiliate?._id ? { affiliateId: affiliate._id } : "skip",
  );
  const commissions = (commissionsData ?? []) as ConvexCommission[];

  // ── New: referral-table stats (populated by Telegram bot tracking) ────────
  // Smoke-check: only fire the query when telegramId is a confirmed positive integer.
  const referralStatsData = useConvexQuery(
    api.affiliates.getUserReferralStats,
    typeof telegramId === "number" && telegramId > 0
      ? { telegramId }
      : "skip",
  );

  const safeNum = (v: unknown): number =>
    typeof v === "number" && isFinite(v) ? v : 0;

  // Merge commissions (legacy manual entries) with referrals table stats.
  const commissionTotal = commissions.reduce(
    (sum, c) => sum + safeNum(c.commissionAmount),
    0,
  );
  const commissionPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + safeNum(c.commissionAmount), 0);
  const commissionPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + safeNum(c.commissionAmount), 0);
  const referralTotal = safeNum(referralStatsData?.totalEarned);
  const referralPending = safeNum(referralStatsData?.pendingAmount);
  const referralPaid = safeNum(referralStatsData?.paidAmount);
  const totalReferredCount = safeNum(
    referralStatsData?.totalReferredCount ?? referralStatsData?.referralCount,
  );
  const resolvedReferralCode = [
    referralStatsData?.referralCode,
    affiliate?.referralCode,
  ].find(
    (code): code is string =>
      typeof code === "string" && code.trim().length > 0,
  ) ?? null;

  const stats: AffiliateStats = {
    referralCode: resolvedReferralCode,
    commissionPercent: 5,
    totalEarnings: commissionTotal + referralTotal,
    pendingEarnings: commissionPending + referralPending,
    paidEarnings: commissionPaid + referralPaid,
    totalReferredCount,
    successfulReferrals: totalReferredCount,
  };

  const isLoading =
    isAuthLoading ||
    (customerId !== null && affiliateData === undefined) ||
    (affiliate !== null && commissionsData === undefined);

  // Persist stats snapshot for debug panel + show dev-only toast when stats first load.
  useEffect(() => {
    // Dev-only: show once when referralStatsData first arrives for DEV_TG_ID.
    if (
      telegramId === DEV_TG_ID &&
      referralStatsData !== undefined &&
      !shownStatsToastRef.current
    ) {
      shownStatsToastRef.current = true;
      const count = safeNum(
        referralStatsData?.totalReferredCount ?? referralStatsData?.referralCount,
      );
      toast.info(`Referral stats: referralCount=${count}`, { duration: 9000 });
    }
    // Debug localStorage snapshot (only when debug mode is active).
    if (_IS_DEBUG) {
      try {
        localStorage.setItem(STATS_DEBUG_KEY, JSON.stringify({
          stats,
          statsLoaded: !isLoading,
          statsError: null,
          timestampISO: new Date().toISOString(),
        }));
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralStatsData, affiliateData, isLoading]);

  return {
    affiliate,
    commissions,
    stats,
    isLoading,
    error: null,
    hasAffiliate: !!affiliate,
    canUseAffiliate: customerId !== null,
  };
}

/**
 * Hook to get or create an affiliate record using telegramUserId directly.
 */
export function useCreateAffiliate() {
  const { telegramUser } = useApp();
  const mutation = useConvexMutation(api.affiliates.getOrCreateMyAffiliate);
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    mutate: async () => {
      if (!telegramUser?.id)
        throw new Error("Telegram user not available");
      setIsPending(true);
      try {
        await mutation({ telegramUserId: String(telegramUser.id) });
        return true;
      } catch (e) {
        console.error("[Affiliate] Error creating:", e);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
  };
}

export type AffiliateState = ReturnType<typeof useAffiliate>;

const _affiliateFallback: AffiliateState = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  affiliate: null as any,
  commissions: [],
  stats: {
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    totalReferredCount: 0,
    successfulReferrals: 0,
    commissionPercent: 5,
    referralCode: null,
  },
  isLoading: true,
  error: null,
  hasAffiliate: false,
  canUseAffiliate: false,
};

export const AffiliateContext = createContext<AffiliateState>(_affiliateFallback);

/** Consume the affiliate state provided by Index.tsx's AffiliateContext.Provider. */
export function useAffiliateContext(): AffiliateState {
  return useContext(AffiliateContext);
}

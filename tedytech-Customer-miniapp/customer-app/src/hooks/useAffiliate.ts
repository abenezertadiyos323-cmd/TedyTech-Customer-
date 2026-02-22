import {
  useQuery as useConvexQuery,
  useMutation as useConvexMutation,
} from "convex/react";
import { useState, createContext, useContext } from "react";
import { api } from "@/convex_generated/api";
import { useApp } from "@/contexts/AppContext";

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
  const referralStatsData = useConvexQuery(
    api.affiliates.getUserReferralStats,
    telegramId ? { telegramId } : "skip",
  );

  const safeNum = (v: unknown): number =>
    typeof v === "number" && isFinite(v) ? v : 0;

  // Merge commissions (legacy manual entries) with referrals table stats.
  // Referrals-table values take precedence when non-zero.
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
 * Hook to create an affiliate record for the authenticated user.
 * Passes firstName so the generated code uses the user's name.
 */
export function useCreateAffiliate() {
  const { verifiedCustomerId, telegramUser } = useApp();
  const mutation = useConvexMutation(api.affiliates.createAffiliateIfNotExists);
  const [isPending, setIsPending] = useState(false);
  const initData =
    (
      window as { Telegram?: { WebApp?: { initData?: string } } }
    ).Telegram?.WebApp?.initData ?? "";
  const hasTelegramEvidence = initData.trim().length > 0 || Boolean(telegramUser);

  return {
    isPending,
    mutate: async () => {
      if (!verifiedCustomerId || !hasTelegramEvidence)
        throw new Error("Must be authenticated to create affiliate");
      setIsPending(true);
      try {
        await mutation({
          customerId: verifiedCustomerId,
          firstName: telegramUser?.first_name,
          telegramId: telegramUser?.id,
        });
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

// ---------------------------------------------------------------------------
// Shared context — Index.tsx calls useAffiliate() once, stores the result
// here, and EarnTab consumes it without opening a second subscription.
// ---------------------------------------------------------------------------

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

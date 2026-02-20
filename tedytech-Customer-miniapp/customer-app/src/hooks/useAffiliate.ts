import {
  useQuery as useConvexQuery,
  useMutation as useConvexMutation,
} from "convex/react";
import { useState } from "react";
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
  commissionAmount: number; // camelCase — matches schema.ts
  status: string;
  createdAt: number;
}

interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
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

  const affiliateData = useConvexQuery(
    api.affiliates.getAffiliateByCustomerId,
    customerId ? { customerId } : "skip",
  );
  const affiliate = affiliateData ?? null;

  const commissionsData = useConvexQuery(
    api.affiliates.listAffiliateCommissions,
    affiliate?._id ? { affiliateId: affiliate._id } : "skip",
  );
  // Cast to the runtime camelCase shape that Convex actually returns.
  const commissions = (commissionsData ?? []) as ConvexCommission[];

  const safeNum = (v: unknown): number =>
    typeof v === "number" && isFinite(v) ? v : 0;

  const stats: AffiliateStats = {
    referralCode: affiliate?.referralCode ?? null,
    commissionPercent: 5,
    totalEarnings: commissions.reduce(
      (sum, c) => sum + safeNum(c.commissionAmount),
      0,
    ),
    pendingEarnings: commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + safeNum(c.commissionAmount), 0),
    paidEarnings: commissions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + safeNum(c.commissionAmount), 0),
    successfulReferrals: commissions.filter((c) => c.status !== "cancelled")
      .length,
  };

  // isLoading is true only while queries are genuinely in-flight.
  // commissionsData is "skip"/undefined when affiliate is null — that is NOT
  // loading, so we must not gate on it when affiliate is null.
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
 * Tracks isPending so callers can gate loading UI correctly.
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
        await mutation({ customerId: verifiedCustomerId });
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

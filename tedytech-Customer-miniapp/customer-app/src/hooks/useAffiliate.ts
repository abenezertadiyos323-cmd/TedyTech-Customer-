import {
  useQuery as useConvexQuery,
  useMutation as useConvexMutation,
  useQuery as _unused,
} from "convex/react";
import { api } from "@/convex_generated/api";
import { useApp } from "@/contexts/AppContext";

interface Affiliate {
  id: string;
  customer_id: string;
  referral_code: string;
  created_at: string;
}

interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  order_id: string;
  order_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
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
 * Uses authUserId from AppContext to avoid duplicate auth state.
 * Relies on RLS policies (auth.uid() = customer_id) for security.
 */
export function useAffiliate() {
  const { authUserId, isAuthenticated, isAuthLoading } = useApp();
  const affiliateEnabled = isAuthenticated && !!authUserId && !isAuthLoading;
  const affiliateData = useConvexQuery(
    api.affiliates.getAffiliateByCustomerId,
    authUserId ? { customerId: authUserId } : (undefined as any),
  );
  const affiliate = affiliateData ?? null;

  const commissionsData = useConvexQuery(
    api.affiliates.listAffiliateCommissions,
    affiliate?._id ? { affiliateId: affiliate._id } : (undefined as any),
  );
  const commissions = commissionsData ?? [];

  // Compute stats from commissions
  const stats: AffiliateStats = {
    referralCode: affiliate?.referralCode ?? null,
    commissionPercent: 5, // Default commission rate
    totalEarnings: commissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pendingEarnings: commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.commission_amount, 0),
    paidEarnings: commissions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.commission_amount, 0),
    successfulReferrals: commissions.filter((c) => c.status !== "cancelled")
      .length,
  };
  const isLoading =
    isAuthLoading ||
    affiliateData === undefined ||
    commissionsData === undefined;

  return {
    affiliate,
    commissions,
    stats,
    isLoading,
    error: null,
    hasAffiliate: !!affiliate,
  };
}

/**
 * Hook to create an affiliate record for the authenticated user.
 * Uses RPC to safely generate referral code.
 */
export function useCreateAffiliate() {
  const { authUserId } = useApp();
  const mutation = useConvexMutation(api.affiliates.createAffiliateIfNotExists);

  return {
    mutate: async () => {
      if (!authUserId)
        throw new Error("Must be authenticated to create affiliate");
      try {
        await mutation({ customerId: authUserId });
        return true;
      } catch (e) {
        console.error("[Affiliate] Error creating:", e);
        throw e;
      }
    },
  };
}

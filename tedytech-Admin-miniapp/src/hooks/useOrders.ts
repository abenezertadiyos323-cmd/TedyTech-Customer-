import { useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import type { PhoneAction } from "@/types/order";
import { mockPhoneActions } from "@/data/mockData";

/**
 * Fetch all phone actions
 */
export function usePhoneActions() {
  const { adminToken } = useAdmin();
  const authArgs = adminToken ? { token: adminToken } : "skip";
  const convexActions = useQuery(api.phoneActions.listAllPhoneActions, authArgs);

  // Fallback to mock data if Convex data is unavailable
  const actions = (convexActions ?? mockPhoneActions) as PhoneAction[];

  return {
    data: actions,
    isLoading: convexActions === undefined,
    error: null,
  };
}

/**
 * Fetch filtered phone actions
 */
export function useFilteredPhoneActions(filters: {
  actionType?: "reserve" | "ask" | "view";
  search?: string;
}) {
  const { data: allActions, isLoading } = usePhoneActions();

  let filtered = [...allActions];

  // Filter by action type
  if (filters.actionType) {
    filtered = filtered.filter((a) => a.actionType === filters.actionType);
  }

  // Search filter (by phone name)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((a) =>
      a.phoneName?.toLowerCase().includes(searchLower),
    );
  }

  // Sort by most recent
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

/**
 * Get phone action statistics
 */
export function usePhoneActionStats() {
  const { data: actions, isLoading } = usePhoneActions();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const stats = {
    totalActions: actions.length,
    reserveActions: actions.filter((a) => a.actionType === "reserve").length,
    askActions: actions.filter((a) => a.actionType === "ask").length,
    viewActions: actions.filter((a) => a.actionType === "view").length,
    todayActions: actions.filter((a) => a.createdAt >= todayTimestamp).length,
  };

  return {
    data: stats,
    isLoading,
  };
}

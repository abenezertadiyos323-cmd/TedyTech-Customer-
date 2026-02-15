import { useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import type { ExchangeRequest, OrderStatus } from "@/types/order";
import { mockExchangeRequests } from "@/data/mockData";

/**
 * Fetch all exchange requests
 */
export function useExchangeRequests() {
  const { adminToken } = useAdmin();
  const authArgs = adminToken ? { token: adminToken } : "skip";
  const convexExchanges = useQuery(
    api.phoneActions.listAllExchangeRequests,
    authArgs,
  );
  const isMockData = convexExchanges === undefined;

  // Fallback to mock data if Convex data is unavailable
  const exchanges = (convexExchanges ??
    mockExchangeRequests) as ExchangeRequest[];

  return {
    data: exchanges,
    isLoading: convexExchanges === undefined,
    isMockData,
    error: null,
  };
}

/**
 * Fetch filtered exchange requests
 */
export function useFilteredExchangeRequests(filters: {
  status?: OrderStatus;
  search?: string;
}) {
  const { data: allExchanges, isLoading, isMockData } = useExchangeRequests();

  let filtered = [...allExchanges];

  // Filter by status
  if (filters.status) {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  // Search filter (by desired phone name or offered model)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.desiredPhoneName?.toLowerCase().includes(searchLower) ||
        e.offeredModel.toLowerCase().includes(searchLower),
    );
  }

  // Sort by most recent
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  return {
    data: filtered,
    isLoading,
    isMockData,
    error: null,
  };
}

/**
 * Get exchange request statistics
 */
export function useExchangeStats() {
  const { data: exchanges, isLoading } = useExchangeRequests();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const stats = {
    totalExchanges: exchanges.length,
    newExchanges: exchanges.filter((e) => e.status === "new").length,
    pendingExchanges: exchanges.filter((e) => e.status === "pending").length,
    completedExchanges: exchanges.filter((e) => e.status === "completed")
      .length,
    rejectedExchanges: exchanges.filter((e) => e.status === "rejected").length,
    todayExchanges: exchanges.filter((e) => e.createdAt >= todayTimestamp)
      .length,
  };

  return {
    data: stats,
    isLoading,
  };
}

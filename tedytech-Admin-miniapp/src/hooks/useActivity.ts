import { useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import type { Activity } from "@/types/admin";
import { mockActivities } from "@/data/mockData";

function getActionDescription(actionType: string) {
  switch (actionType) {
    case "reserve":
      return "Reservation";
    case "ask":
      return "Question";
    case "view":
      return "View";
    default:
      return "Action";
  }
}

/**
 * Fetch recent activities — aggregates phone actions, exchanges, and searches from Convex
 */
export function useRecentActivity(limit: number = 20) {
  const { adminToken } = useAdmin();
  const authArgs = adminToken ? { token: adminToken } : "skip";
  const convexActions = useQuery(
    api.phoneActions.listAllPhoneActions,
    authArgs,
  );
  const convexExchanges = useQuery(
    api.phoneActions.listAllExchangeRequests,
    authArgs,
  );
  const convexSearches = useQuery(api.search.listRecentSearches, { limit: 50 });

  const isLoading =
    convexActions === undefined ||
    convexExchanges === undefined ||
    convexSearches === undefined;

  // If any query is still loading and we have no data yet, use mock data
  if (isLoading) {
    const sorted = [...mockActivities].sort(
      (a, b) => b.timestamp - a.timestamp,
    );
    return { data: sorted.slice(0, limit), isLoading: true, error: null };
  }

  // Map each data source to Activity format
  const activities: Activity[] = [
    ...(convexActions ?? []).map((a: any) => ({
      id: a._id,
      type: "phone_action" as const,
      description: `${getActionDescription(a.actionType)} for ${a.phoneName || "a phone"}`,
      timestamp: a.createdAt,
      sessionId: a.sessionId,
      metadata: { actionType: a.actionType, phoneName: a.phoneName },
    })),
    ...(convexExchanges ?? []).map((e: any) => ({
      id: e._id,
      type: "exchange_request" as const,
      description: `Exchange: ${e.offeredModel} → ${e.desiredPhoneName || "a phone"}`,
      timestamp: e.createdAt,
      sessionId: e.sessionId,
      metadata: { offeredModel: e.offeredModel, status: e.status },
    })),
    ...(convexSearches ?? []).map((s: any) => ({
      id: s._id,
      type: "search" as const,
      description: `Searched for "${s.term}"`,
      timestamp: s.createdAt,
      metadata: { searchTerm: s.term },
    })),
  ];

  // Sort by most recent, apply limit
  activities.sort((a, b) => b.timestamp - a.timestamp);

  return { data: activities.slice(0, limit), isLoading: false, error: null };
}

/**
 * Fetch filtered activities
 */
export function useFilteredActivity(filters: {
  type?: "search" | "phone_action" | "exchange_request";
  limit?: number;
}) {
  const { data: allActivities, isLoading } = useRecentActivity(
    filters.limit ?? 50,
  );

  let filtered = [...allActivities];

  // Filter by type
  if (filters.type) {
    filtered = filtered.filter((a) => a.type === filters.type);
  }

  return {
    data: filtered,
    isLoading,
    error: null,
  };
}

/**
 * Get activity statistics
 */
export function useActivityStats() {
  const { data: activities, isLoading } = useRecentActivity(100);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const stats = {
    totalActivities: activities.length,
    searchActivities: activities.filter((a) => a.type === "search").length,
    phoneActionActivities: activities.filter((a) => a.type === "phone_action")
      .length,
    exchangeRequestActivities: activities.filter(
      (a) => a.type === "exchange_request",
    ).length,
    todayActivities: activities.filter((a) => a.timestamp >= todayTimestamp)
      .length,
  };

  return {
    data: stats,
    isLoading,
  };
}

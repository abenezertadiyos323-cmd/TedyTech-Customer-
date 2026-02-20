import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import type { Activity } from "@/types/admin";
import { logQueryDebug } from "@/lib/queryDebug";

function normalizeActivityType(type: unknown): Activity["type"] {
  switch (type) {
    case "product":
    case "order":
    case "exchange":
    case "hotLead":
    case "search":
    case "phone_action":
    case "exchange_request":
      return type;
    default:
      return "order";
  }
}

function mapActivity(activity: any): Activity {
  return {
    id: String(activity._id ?? activity.id),
    type: normalizeActivityType(activity.entityType ?? activity.type),
    description:
      activity.summary ??
      activity.description ??
      `${activity.action ?? "update"} ${activity.entityType ?? "entity"}`,
    timestamp:
      activity.createdAt ??
      activity.timestamp ??
      activity._creationTime ??
      Date.now(),
    metadata: {
      entityId: activity.entityId,
      action: activity.action,
      actor: activity.actor,
      ...(activity.metadata ?? {}),
    },
  };
}

/**
 * Fetch recent admin activity logs.
 */
export function useRecentActivity(limit: number = 20) {
  const { adminToken, isAuthorized } = useAdmin();
  const authArgs = adminToken ? { token: adminToken } : "skip";

  logQueryDebug({
    hook: "useRecentActivity",
    query: "api.activity.adminListActivity",
    adminTokenPresent: Boolean(adminToken),
    args: authArgs,
  });

  const convexActivity = useQuery(
    (api as any).activity.adminListActivity,
    authArgs as any,
  );

  const data = useMemo(() => {
    const items = ((convexActivity ?? []) as any[]).map(mapActivity);
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, limit);
  }, [convexActivity, limit]);

  const error =
    isAuthorized === false
      ? "Unauthorized access."
      : !adminToken && isAuthorized === true
        ? "Admin session unavailable. Reopen the mini app."
        : null;

  return {
    data,
    isLoading: Boolean(adminToken) && convexActivity === undefined,
    error,
  };
}

/**
 * Fetch filtered activities.
 */
export function useFilteredActivity(filters: {
  type?: Activity["type"];
  limit?: number;
}) {
  const { data: allActivities, isLoading, error } = useRecentActivity(
    filters.limit ?? 50,
  );

  let filtered = [...allActivities];
  if (filters.type) {
    filtered = filtered.filter((a) => a.type === filters.type);
  }

  return {
    data: filtered,
    isLoading,
    error,
  };
}

/**
 * Get activity statistics.
 */
export function useActivityStats() {
  const { data: activities, isLoading } = useRecentActivity(100);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const stats = {
    totalActivities: activities.length,
    productActivities: activities.filter((a) => a.type === "product").length,
    orderActivities: activities.filter((a) => a.type === "order").length,
    exchangeActivities: activities.filter((a) => a.type === "exchange").length,
    hotLeadActivities: activities.filter((a) => a.type === "hotLead").length,
    todayActivities: activities.filter((a) => a.timestamp >= todayTimestamp)
      .length,
  };

  return {
    data: stats,
    isLoading,
  };
}

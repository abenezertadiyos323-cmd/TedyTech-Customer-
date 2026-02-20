import { useMutation, useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import type { ExchangeRequest } from "@/types/order";
import { logQueryDebug } from "@/lib/queryDebug";

export type ExchangeStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "rejected"
  | "completed";

export type AdminExchange = ExchangeRequest & {
  customerName?: string;
  customerPhone?: string;
  customerTelegramUserId?: string;
  offeredDevice?: string;
  requestedDevice?: string;
  valuationNote?: string;
  updatedAt?: number;
};

const ALLOWED_STATUSES: ExchangeStatus[] = [
  "pending",
  "reviewing",
  "approved",
  "rejected",
  "completed",
];

const normalizeExchangeStatus = (status: unknown): ExchangeStatus => {
  if (typeof status === "string" && ALLOWED_STATUSES.includes(status as ExchangeStatus)) {
    return status as ExchangeStatus;
  }
  return "pending";
};

const normalizeExchange = (exchange: any): AdminExchange => ({
  _id: exchange._id,
  _creationTime: exchange._creationTime,
  sessionId: exchange.sessionId ?? "",
  desiredPhoneId: exchange.desiredPhoneId ?? "",
  offeredModel: exchange.offeredModel ?? exchange.offeredDevice ?? "",
  offeredStorageGb: exchange.offeredStorageGb ?? 0,
  offeredCondition: exchange.offeredCondition ?? "",
  offeredNotes: exchange.offeredNotes ?? "",
  status: normalizeExchangeStatus(exchange.status) as any,
  createdAt: exchange.createdAt ?? exchange._creationTime ?? Date.now(),
  desiredPhoneName: exchange.desiredPhoneName ?? exchange.requestedDevice,
  desiredPhonePrice: exchange.desiredPhonePrice,
  customerName: exchange.customerName,
  customerPhone: exchange.customerPhone,
  customerTelegramUserId: exchange.customerTelegramUserId,
  offeredDevice: exchange.offeredDevice,
  requestedDevice: exchange.requestedDevice,
  valuationNote: exchange.valuationNote,
  updatedAt: exchange.updatedAt,
});

/**
 * Fetch exchanges and expose update mutation
 */
export function useExchanges() {
  const { adminToken, isAuthorized } = useAdmin();
  const authArgs = adminToken ? { token: adminToken } : "skip";

  logQueryDebug({
    hook: "useExchanges",
    query: "api.exchanges.adminListExchanges",
    adminTokenPresent: Boolean(adminToken),
    args: authArgs,
  });

  const convexExchanges = useQuery((api as any).exchanges.adminListExchanges, authArgs as any);
  const updateExchangeMutation = useMutation((api as any).exchanges.adminUpdateExchange);

  const updateExchange = async (
    exchangeId: string,
    status: ExchangeStatus,
    valuationNote?: string,
  ) => {
    if (!adminToken) {
      throw new Error("Admin session unavailable. Reopen the mini app.");
    }

    await updateExchangeMutation({
      token: adminToken,
      exchangeId: exchangeId as any,
      status,
      valuationNote: valuationNote?.trim() || undefined,
    });
  };

  const error =
    isAuthorized === false
      ? "Unauthorized access."
      : !adminToken && isAuthorized === true
        ? "Admin session unavailable. Reopen the mini app."
        : null;

  return {
    exchanges: ((convexExchanges ?? []) as any[]).map(normalizeExchange),
    isLoading: Boolean(adminToken) && convexExchanges === undefined,
    error,
    updateExchange,
  };
}

/**
 * Fetch all exchange requests
 */
export function useExchangeRequests() {
  const { exchanges, isLoading, error, updateExchange } = useExchanges();

  return {
    data: exchanges as ExchangeRequest[],
    isLoading,
    isMockData: false,
    error,
    updateExchange,
  };
}

/**
 * Fetch filtered exchange requests
 */
export function useFilteredExchangeRequests(filters: {
  status?: string;
  search?: string;
}) {
  const { data: allExchanges, isLoading, isMockData, error } = useExchangeRequests();

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
        e.offeredModel.toLowerCase().includes(searchLower) ||
        (e as any).offeredDevice?.toLowerCase().includes(searchLower) ||
        (e as any).requestedDevice?.toLowerCase().includes(searchLower) ||
        (e as any).customerName?.toLowerCase().includes(searchLower),
    );
  }

  // Sort by most recent
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  return {
    data: filtered,
    isLoading,
    isMockData,
    error,
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
    newExchanges: exchanges.filter((e) => e.status === "reviewing").length,
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

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import {
  AdminHotLead,
  HotLead,
  HotLeadSource,
  HotLeadStatus,
} from "@/types/hotLead";
import { formatWaitTime } from "@/lib/utils";
import { logQueryDebug } from "@/lib/queryDebug";

function normalizeSource(source: unknown): HotLeadSource {
  if (source === "bot" || source === "miniapp" || source === "unknown") {
    return source;
  }
  return "unknown";
}

function normalizeStatus(status: unknown): HotLeadStatus {
  if (status === "new" || status === "contacted") {
    return status;
  }
  return "new";
}

export function useHotLeads(limit: number = 10) {
  const { adminToken, isAuthorized } = useAdmin();
  const authArgs = adminToken ? { token: adminToken } : "skip";

  logQueryDebug({
    hook: "useHotLeads",
    query: "api.hotLeads.adminListHotLeads",
    adminTokenPresent: Boolean(adminToken),
    args: authArgs,
  });

  const convexLeads = useQuery(
    (api as any).hotLeads.adminListHotLeads,
    authArgs as any,
  );
  const updateHotLead = useMutation((api as any).hotLeads.adminUpdateHotLead);

  const leads = useMemo(() => {
    const sourceLeads = (convexLeads ?? []) as any[];
    return sourceLeads.map((lead): AdminHotLead => ({
      _id: lead._id,
      _creationTime: lead._creationTime,
      sellerId: String(lead.sellerId ?? ""),
      createdAt: lead.createdAt ?? lead._creationTime ?? Date.now(),
      updatedAt:
        lead.updatedAt ?? lead.createdAt ?? lead._creationTime ?? Date.now(),
      source: normalizeSource(lead.source),
      customerName: lead.customerName,
      customerPhone: lead.customerPhone,
      telegramUserId: lead.telegramUserId,
      interestSummary: lead.interestSummary,
      message: lead.message,
      status: normalizeStatus(lead.status),
      adminNote: lead.adminNote,
    }));
  }, [convexLeads]);

  const data = useMemo((): HotLead[] => {
    return leads.slice(0, limit).map((lead) => {
      const title =
        lead.customerName || lead.customerPhone || lead.telegramUserId || "Hot Lead";
      const description =
        lead.interestSummary || lead.message || "Customer interest captured";

      return {
        id: lead._id,
        type: "action",
        score: lead.status === "new" ? 2 : 1,
        priority: "",
        title,
        description,
        timestamp: lead.createdAt,
        waitTime: formatWaitTime(lead.createdAt),
        sessionId: lead.telegramUserId || "unknown",
        metadata: {
          status: lead.status,
        },
      };
    });
  }, [leads, limit]);

  const error =
    isAuthorized === false
      ? "Unauthorized access."
      : !adminToken && isAuthorized === true
        ? "Admin session unavailable. Reopen the mini app."
        : null;

  const markContacted = async (leadId: string) => {
    if (!adminToken) {
      throw new Error("Admin session unavailable. Reopen the mini app.");
    }

    await updateHotLead({
      token: adminToken,
      leadId: leadId as any,
      status: "contacted",
    });
  };

  const saveNote = async (leadId: string, note: string) => {
    if (!adminToken) {
      throw new Error("Admin session unavailable. Reopen the mini app.");
    }

    await updateHotLead({
      token: adminToken,
      leadId: leadId as any,
      adminNote: note.trim() || undefined,
    });
  };

  return {
    leads,
    data,
    isLoading: Boolean(adminToken) && convexLeads === undefined,
    error,
    markContacted,
    saveNote,
  };
}

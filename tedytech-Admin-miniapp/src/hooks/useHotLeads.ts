import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "convex_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import { HotLead } from "@/types/hotLead";
import { formatWaitTime, getLeadPriorityIcon } from "@/lib/utils";

export function useHotLeads(limit: number = 10) {
  const { adminToken } = useAdmin();
  const authArgs = adminToken ? { token: adminToken } : "skip";
  const actions = useQuery(api.phoneActions.listAllPhoneActions, authArgs);
  const exchanges = useQuery(api.phoneActions.listAllExchangeRequests, authArgs);

  // Combine and score leads
  const hotLeads: HotLead[] = useMemo(() => {
    if (!actions || !exchanges) return [];

    const allLeads: HotLead[] = [];

    // Process exchanges
    for (const ex of exchanges) {
      const score = calculateScore(ex, "exchange");
      allLeads.push(formatLead(ex, score, "exchange"));
    }

    // Process actions
    for (const act of actions) {
      const score = calculateScore(act, "action");
      allLeads.push(formatLead(act, score, "action"));
    }

    // Sort: score DESC → createdAt DESC
    return allLeads
      .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [actions, exchanges, limit]);

  return {
    data: hotLeads,
    isLoading: !actions || !exchanges,
  };
}

function calculateScore(lead: any, type: "exchange" | "action"): number {
  const now = Date.now();
  const ageMinutes = (now - lead.createdAt) / 60000;
  const budget = type === "exchange" ? lead.desiredPhonePrice : lead.phonePrice;

  // 🔥🔥🔥 Score 3: Exchange + ≥80K ETB
  if (type === "exchange" && budget >= 80000) return 3;

  // 🔥🔥 Score 2: ≥80K ETB OR exchange
  if (budget >= 80000 || type === "exchange") return 2;

  // 🔥 Score 1: Created <30min OR specific model
  if (ageMinutes < 30 || (type === "action" && lead.phoneName)) return 1;

  return 0;
}

function formatLead(
  lead: any,
  score: number,
  type: "exchange" | "action",
): HotLead {
  const priority = getLeadPriorityIcon(score);
  const waitTime = formatWaitTime(lead.createdAt);

  if (type === "exchange") {
    return {
      id: lead._id,
      type,
      score,
      priority,
      title: lead.desiredPhoneName || "Exchange Request",
      description: `Offered: ${lead.offeredModel}`,
      budgetETB: lead.desiredPhonePrice,
      timestamp: lead.createdAt,
      waitTime,
      sessionId: lead.sessionId,
      metadata: {
        offeredModel: lead.offeredModel,
        desiredPhoneName: lead.desiredPhoneName,
        status: lead.status,
      },
    };
  } else {
    return {
      id: lead._id,
      type,
      score,
      priority,
      title: lead.phoneName || "Phone Action",
      description: `Action: ${lead.actionType}`,
      budgetETB: lead.phonePrice,
      timestamp: lead.createdAt,
      waitTime,
      sessionId: lead.sessionId,
      metadata: {
        actionType: lead.actionType,
      },
    };
  }
}

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth/adminAuth";
import { createActivityLog } from "./lib/activityLog";
import { log } from "./lib/logger";

const hotLeadStatusValidator = v.union(v.literal("new"), v.literal("contacted"));

export const adminListHotLeads = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const leads = await ctx.db
      .query("hotLeads")
      .withIndex("by_sellerId", (q: any) => (q as any).eq("sellerId", sellerId))
      .collect();

    const sortedLeads = leads.sort((a, b) => b.createdAt - a.createdAt);
    log("[hotLeads] adminListHotLeads", {
      sellerId: String(sellerId),
      count: sortedLeads.length,
    });

    return sortedLeads;
  },
});

export const adminUpdateHotLead = mutation({
  args: {
    token: v.string(),
    leadId: v.id("hotLeads"),
    status: v.optional(hotLeadStatusValidator),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error("Hot lead not found.");
    }

    if (lead.sellerId !== sellerId) {
      throw new Error("Unauthorized: Hot lead belongs to a different seller.");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    if (args.status !== undefined) {
      updates.status = args.status;
    }
    if (args.adminNote !== undefined) {
      updates.adminNote = args.adminNote;
    }

    await ctx.db.patch(args.leadId, updates);

    const action = args.status !== undefined ? "update_status" : "update_note";
    const summary =
      args.status !== undefined
        ? `Hot lead status ${lead.status} -> ${args.status}`
        : "Hot lead admin note updated";

    await createActivityLog(ctx, {
      sellerId,
      actor: String(sellerId),
      entityType: "hotLead",
      entityId: String(args.leadId),
      action,
      summary,
      metadata: {
        previousStatus: lead.status,
        nextStatus: args.status,
        adminNote: args.adminNote,
      },
    });

    log("[hotLeads] adminUpdateHotLead", {
      sellerId: String(sellerId),
      leadId: String(args.leadId),
      status: args.status ?? "unchanged",
      noteUpdated: args.adminNote !== undefined,
    });

    return args.leadId;
  },
});

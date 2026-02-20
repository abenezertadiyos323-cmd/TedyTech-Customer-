import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth/adminAuth";
import { createActivityLog } from "./lib/activityLog";
import { log } from "./lib/logger";

const exchangeStatusValidator = v.union(
  v.literal("pending"),
  v.literal("reviewing"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("completed"),
);

export const adminListExchanges = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const exchanges = await ctx.db
      .query("exchanges")
      .withIndex("by_sellerId", (q: any) => (q as any).eq("sellerId", sellerId))
      .collect();

    const sortedExchanges = exchanges.sort((a, b) => b.createdAt - a.createdAt);
    log("[exchanges] adminListExchanges", {
      sellerId: String(sellerId),
      count: sortedExchanges.length,
    });

    return sortedExchanges;
  },
});

export const adminUpdateExchange = mutation({
  args: {
    token: v.string(),
    exchangeId: v.id("exchanges"),
    status: exchangeStatusValidator,
    valuationNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const exchange = await ctx.db.get(args.exchangeId);
    if (!exchange) {
      throw new Error("Exchange not found.");
    }

    if (exchange.sellerId !== sellerId) {
      throw new Error("Unauthorized: Exchange belongs to a different seller.");
    }

    const previousStatus = exchange.status;

    await ctx.db.patch(args.exchangeId, {
      status: args.status,
      valuationNote: args.valuationNote,
      updatedAt: Date.now(),
    });

    await createActivityLog(ctx, {
      sellerId,
      actor: String(sellerId),
      entityType: "exchange",
      entityId: String(args.exchangeId),
      action: "update_exchange",
      summary: `Exchange status ${previousStatus} -> ${args.status}`,
      metadata: {
        previousStatus,
        nextStatus: args.status,
        valuationNote: args.valuationNote,
      },
    });

    log("[exchanges] adminUpdateExchange", {
      sellerId: String(sellerId),
      exchangeId: String(args.exchangeId),
      status: args.status,
    });

    return args.exchangeId;
  },
});

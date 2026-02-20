import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth/adminAuth";
import { log } from "./lib/logger";

export const adminListActivity = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_sellerId", (q: any) => (q as any).eq("sellerId", sellerId))
      .collect();

    const sortedLogs = logs.sort((a, b) => b.createdAt - a.createdAt);
    log("[activity] adminListActivity", {
      sellerId: String(sellerId),
      count: sortedLogs.length,
    });

    return sortedLogs;
  },
});

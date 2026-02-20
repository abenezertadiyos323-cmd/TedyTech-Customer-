import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth/adminAuth";
import { createActivityLog } from "./lib/activityLog";
import { log } from "./lib/logger";

const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("delivered"),
  v.literal("cancelled"),
);

export const adminListOrders = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_sellerId", (q: any) => (q as any).eq("sellerId", sellerId))
      .collect();

    const sortedOrders = orders.sort((a, b) => b.createdAt - a.createdAt);
    log("[orders] adminListOrders", {
      sellerId: String(sellerId),
      count: sortedOrders.length,
    });

    return sortedOrders;
  },
});

export const adminUpdateOrderStatus = mutation({
  args: {
    token: v.string(),
    orderId: v.id("orders"),
    status: orderStatusValidator,
  },
  handler: async (ctx, args) => {
    const { sellerId } = await requireAdmin(ctx, args.token);

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.sellerId !== sellerId) {
      throw new Error("Unauthorized: Order belongs to a different seller.");
    }

    const previousStatus = order.status;

    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    await createActivityLog(ctx, {
      sellerId,
      actor: String(sellerId),
      entityType: "order",
      entityId: String(args.orderId),
      action: "update_status",
      summary: `Order status ${previousStatus} -> ${args.status}`,
      metadata: {
        previousStatus,
        nextStatus: args.status,
      },
    });

    log("[orders] adminUpdateOrderStatus", {
      sellerId: String(sellerId),
      orderId: String(args.orderId),
      status: args.status,
    });

    return args.orderId;
  },
});

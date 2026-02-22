import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth/adminAuth";

export const createPhoneActionRequest = mutation({
  args: {
    sessionId: v.string(),
    actionType: v.union(
      v.literal("inquiry"),
      v.literal("exchange"),
      v.literal("call"),
      v.literal("map"),
    ),
    sourceTab: v.union(
      v.literal("home"),
      v.literal("search"),
      v.literal("saved"),
      v.literal("product_detail"),
      v.literal("about"),
    ),
    sourceProductId: v.optional(v.string()),
    timestamp: v.optional(v.number()),
    // Legacy fields kept optional for backward compatibility.
    phoneId: v.optional(v.string()),
    variantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sourceProductId = args.sourceProductId ?? args.phoneId;
    const id = await ctx.db.insert("phoneActions", {
      sessionId: args.sessionId,
      actionType: args.actionType,
      sourceTab: args.sourceTab,
      sourceProductId: sourceProductId ?? undefined,
      timestamp: args.timestamp ?? Date.now(),
      phoneId: args.phoneId ?? sourceProductId ?? undefined,
      variantId: args.variantId ?? undefined,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const createExchangeRequestMiniapp = mutation({
  args: {
    sessionId: v.string(),
    desiredPhoneId: v.string(),
    offeredModel: v.string(),
    offeredStorageGb: v.number(),
    offeredCondition: v.string(),
    offeredNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("exchangeRequests", {
      sessionId: args.sessionId,
      desiredPhoneId: args.desiredPhoneId,
      offeredModel: args.offeredModel,
      offeredStorageGb: args.offeredStorageGb,
      offeredCondition: args.offeredCondition,
      offeredNotes: args.offeredNotes,
      status: "new",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const getExchangeRequestsV2 = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exchangeRequests")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .order("desc")
      .collect();
  },
});

// Admin: list all phone actions with product name/price joined
export const listAllPhoneActions = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Require admin session
    await requireAdmin(ctx, args.token);

    const actions = await ctx.db.query("phoneActions").order("desc").collect();
    const enriched = await Promise.all(
      actions.map(async (a) => {
        let phoneName: string | null = null;
        let phonePrice: number | null = null;
        try {
          const productId = (a.sourceProductId ?? a.phoneId) as any;
          const product = productId ? await ctx.db.get(productId) : null;
          if (product) {
            phoneName = (product as any).name ?? null;
            phonePrice = (product as any).price ?? null;
          }
        } catch {
          // sourceProductId/phoneId may not be a valid product ID
        }
        return { ...a, phoneName, phonePrice };
      }),
    );
    return enriched;
  },
});

// Admin: list all exchange requests with desired phone name/price joined
export const listAllExchangeRequests = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Require admin session
    await requireAdmin(ctx, args.token);

    const requests = await ctx.db
      .query("exchangeRequests")
      .order("desc")
      .collect();
    const enriched = await Promise.all(
      requests.map(async (r) => {
        let desiredPhoneName: string | null = null;
        let desiredPhonePrice: number | null = null;
        try {
          const product = await ctx.db.get(r.desiredPhoneId as any);
          if (product) {
            desiredPhoneName = (product as any).name ?? null;
            desiredPhonePrice = (product as any).price ?? null;
          }
        } catch {
          // desiredPhoneId may not be a valid product ID
        }
        return { ...r, desiredPhoneName, desiredPhonePrice };
      }),
    );
    return enriched;
  },
});

// Admin: update exchange request status
export const updateExchangeStatus = mutation({
  args: {
    token: v.string(),
    requestId: v.id("exchangeRequests"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.requestId, { status: args.status });
  },
});

export const getExchangeDetailV2 = query({
  args: {
    requestId: v.id("exchangeRequests"),
    sessionId: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If token provided, require admin session
    if (args.token) {
      await requireAdmin(ctx, args.token);
    }

    const doc = await ctx.db.get("exchangeRequests", args.requestId);
    if (!doc) return {};

    // If sessionId provided, ensure ownership
    if (args.sessionId) {
      if (doc.sessionId !== args.sessionId) return {};
    }

    return {
      request: doc,
      images: [],
    };
  },
});

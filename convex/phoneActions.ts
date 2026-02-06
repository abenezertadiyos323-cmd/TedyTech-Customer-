import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPhoneActionRequest = mutation({
  args: {
    sessionId: v.string(),
    phoneId: v.string(),
    variantId: v.optional(v.string()),
    actionType: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("phoneActions", {
      sessionId: args.sessionId,
      phoneId: args.phoneId,
      variantId: args.variantId ?? null,
      actionType: args.actionType,
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
      .order("createdAt", "desc")
      .collect();
  },
});

export const getExchangeDetailV2 = query({
  args: { requestId: v.id("exchangeRequests"), sessionId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get("exchangeRequests", args.requestId);
    if (!doc) return {};
    if (doc.sessionId !== args.sessionId) return {};
    return {
      request: doc,
      images: [],
    };
  },
});

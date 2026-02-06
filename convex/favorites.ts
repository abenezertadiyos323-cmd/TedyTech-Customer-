import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getFavorites = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("createdAt", "desc")
      .collect();
  },
});

export const addFavorite = mutation({
  args: {
    userId: v.string(),
    phoneId: v.string(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicates: check for existing favorite
    const existing = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("phoneId"), args.phoneId))
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("favorites", {
      userId: args.userId,
      phoneId: args.phoneId,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const removeFavorite = mutation({
  args: {
    userId: v.string(),
    phoneId: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("phoneId"), args.phoneId))
      .first();

    if (!doc) return { success: false };

    await ctx.db.delete(doc._id);
    return { success: true };
  },
});

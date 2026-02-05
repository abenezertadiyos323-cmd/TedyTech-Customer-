import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Seller queries for custom Convex-based authentication and profile management
 * Primary identity: telegramId (from Telegram)
 */

export const getByTelegramId = query({
  args: { telegramId: v.string() },
  handler: async (ctx, args) => {
    const seller = await ctx.db
      .query("sellers")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .first();

    return seller;
  },
});

export const verifySession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const seller = await ctx.db.get(session.sellerId);
    if (!seller || !seller.isActive) {
      return null;
    }

    return {
      seller: {
        id: seller._id,
        telegramId: seller.telegramId,
        username: seller.username,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        businessName: seller.businessName,
        businessType: seller.businessType,
        role: seller.role,
      },
    };
  },
});

export const getCurrentSeller = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    const seller = await ctx.db.get(session.sellerId);
    if (!seller || !seller.isActive) {
      throw new Error("Unauthorized: Seller account inactive");
    }

    return {
      _id: seller._id,
      telegramId: seller.telegramId,
      username: seller.username,
      firstName: seller.firstName,
      lastName: seller.lastName,
      email: seller.email,
      phone: seller.phone,
      businessName: seller.businessName,
      businessType: seller.businessType,
      businessDescription: seller.businessDescription,
      location: seller.location,
      currency: seller.currency,
      language: seller.language,
      role: seller.role,
      createdAt: seller.createdAt,
      updatedAt: seller.updatedAt,
    };
  },
});

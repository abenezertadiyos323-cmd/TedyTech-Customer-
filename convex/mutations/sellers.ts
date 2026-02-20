import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import {
  generateToken,
  getSessionExpiration,
  requireAdmin,
} from "../lib/auth/adminAuth";

/**
 * Seller mutations for custom Convex-based authentication and session management
 * Primary identity: telegramId (from Telegram)
 *
 * Auth flow:
 * 1. Admin Mini App or Telegram bot (via n8n) calls authenticateWithTelegram
 * 2. Mutation finds seller by telegramId
 * 3. Session created with token
 * 4. Token returned to client for subsequent requests
 */

export const authenticateWithTelegram = mutation({
  args: {
    telegramId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find seller by telegramId
    const seller = await ctx.db
      .query("sellers")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .first();

    let resolvedSeller = seller;
    if (!resolvedSeller) {
      // Allow bootstrap via environment variable ADMIN_CHAT_ID for a single admin
      const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
      if (ADMIN_CHAT_ID && ADMIN_CHAT_ID === args.telegramId) {
        // Create a lightweight admin seller record
        const now = Date.now();
        const newSellerId = await ctx.db.insert("sellers", {
          telegramId: args.telegramId,
          username: args.username,
          firstName: args.firstName,
          lastName: args.lastName,
          businessName: "Admin",
          businessType: "admin",
          isActive: true,
          role: "admin",
          createdAt: now,
          updatedAt: now,
        });
        resolvedSeller = await ctx.db.get(newSellerId);
      } else {
        throw new Error(
          "Seller not found. Contact administrator to create admin account.",
        );
      }
    }

    if (!resolvedSeller.isActive) {
      throw new Error("Seller account is inactive");
    }

    // Update seller profile with latest Telegram info
    await ctx.db.patch(resolvedSeller._id, {
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      updatedAt: Date.now(),
    });

    // Generate session token
    const token = generateToken();
    const expiresAt = getSessionExpiration();

    // Create session
    const sessionId = await ctx.db.insert("admin_sessions", {
      sellerId: resolvedSeller._id,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      token,
      sessionId,
      seller: {
        id: resolvedSeller._id,
        telegramId: resolvedSeller.telegramId,
        businessName: resolvedSeller.businessName,
        businessType: resolvedSeller.businessType,
        role: resolvedSeller.role,
      },
    };
  },
});

export const createSession = mutation({
  args: {
    token: v.string(),
    sellerId: v.id("sellers"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const seller = await ctx.db.get(args.sellerId);
    if (!seller || !seller.isActive) {
      throw new Error("Invalid seller");
    }

    // Generate session token
    const token = generateToken();
    const expiresAt = getSessionExpiration();

    // Create session
    const sessionId = await ctx.db.insert("admin_sessions", {
      sellerId: args.sellerId,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return {
      token,
      sessionId,
    };
  },
});

export const revokeSession = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

export const createSeller = mutation({
  args: {
    token: v.string(),
    telegramId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    businessName: v.string(),
    businessType: v.string(),
    businessDescription: v.optional(v.string()),
    location: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    // Check if telegramId already exists
    const existing = await ctx.db
      .query("sellers")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (existing) {
      throw new Error("Seller with this Telegram ID already exists");
    }

    const now = Date.now();
    const sellerId = await ctx.db.insert("sellers", {
      telegramId: args.telegramId,
      username: args.username,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      businessName: args.businessName,
      businessType: args.businessType,
      businessDescription: args.businessDescription,
      location: args.location,
      currency: args.currency || "ETB",
      language: args.language || "am",
      isActive: true,
      role: args.role || "admin",
      createdAt: now,
      updatedAt: now,
    });

    return sellerId;
  },
});

/**
 * Diagnostic query: returns the current seller record for the authenticated admin.
 * Used for startup diagnostics to verify seller identity and sellerId.
 */
export const getSeller = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { sellerId, role } = await requireAdmin(ctx, args.token);
    const seller = (await ctx.db.get(sellerId)) as any;
    if (!seller) return null;
    return {
      id: String(seller._id),
      telegramId: String(seller.telegramId ?? ""),
      businessName: String(seller.businessName ?? ""),
      businessType: String(seller.businessType ?? ""),
      role: String(role ?? seller.role ?? ""),
      isActive: Boolean(seller.isActive),
      createdAt: Number(seller.createdAt),
    };
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getAffiliateByCustomerId = query({
  args: { customerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const customerId = args.customerId?.trim();
    if (!customerId) return null;

    const a = await ctx.db
      .query("affiliates")
      .withIndex("by_customerId", (q) => q.eq("customerId", customerId))
      .first();
    return a ?? null;
  },
});

export const listAffiliateCommissions = query({
  args: { affiliateId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("affiliateCommissions")
      .withIndex("by_affiliateId", (q) => q.eq("affiliateId", args.affiliateId))
      .collect();
  },
});

// ── PART 2: improved code generation ────────────────────────────────────────

export const createAffiliateIfNotExists = mutation({
  args: {
    customerId: v.string(),
    firstName: v.optional(v.string()),
    telegramId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("affiliates")
      .withIndex("by_customerId", (q) => q.eq("customerId", args.customerId))
      .first();
    if (existing) return existing._id;

    // Deterministic code: first 4 chars of name + last 4 digits of telegramId
    const prefix = args.firstName
      ? args.firstName.substring(0, 4).toUpperCase()
      : "CUST";
    const suffix = args.telegramId
      ? args.telegramId.toString().slice(-4)
      : args.customerId.slice(-4);
    const code = `${prefix}${suffix}`;

    const id = await ctx.db.insert("affiliates", {
      customerId: args.customerId,
      referralCode: code,
      createdAt: Date.now(),
    });

    // Mirror referralCode onto the customers record for fast lookup
    try {
      const customer = await ctx.db.get(args.customerId as Id<"customers">);
      if (customer && !customer.referralCode) {
        await ctx.db.patch(customer._id, { referralCode: code });
      }
    } catch {
      // customerId may not always be a valid customers Id — safe to ignore
    }

    return id;
  },
});

// ── PART 3: called by the Telegram bot /start handler ───────────────────────

export const createReferralIfValid = mutation({
  args: {
    referralCode: v.string(),
    referredTelegramId: v.number(),
    referredName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { referralCode, referredTelegramId } = args;

    // Find referrer's affiliate record by code
    const referrerAffiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
      .first();
    if (!referrerAffiliate) return false;

    // Resolve referrer's Telegram ID
    let referrerTelegramId: number | null = null;
    try {
      const referrerCustomer = await ctx.db.get(
        referrerAffiliate.customerId as Id<"customers">,
      );
      referrerTelegramId = referrerCustomer?.telegramUserId ?? null;
    } catch {
      return false;
    }
    if (!referrerTelegramId) return false;

    // Prevent self-referral
    if (referrerTelegramId === referredTelegramId) return false;

    // Enforce one-referral-per-user (unique constraint)
    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_referredTelegramId", (q) =>
        q.eq("referredTelegramId", referredTelegramId),
      )
      .first();
    if (existing) return false;

    await ctx.db.insert("referrals", {
      referrerTelegramId,
      referredTelegramId,
      referralCode,
      createdAt: Date.now(),
      status: "pending",
      commissionAmount: 0,
    });

    // Mark referred customer as referred (if their customer record already exists)
    const referredCustomer = await ctx.db
      .query("customers")
      .withIndex("by_telegramUserId", (q) =>
        q.eq("telegramUserId", referredTelegramId),
      )
      .first();
    if (referredCustomer && referredCustomer.referredByTelegramId == null) {
      await ctx.db.patch(referredCustomer._id, {
        referredByTelegramId: referrerTelegramId,
      });
    }

    return true;
  },
});

// ── PART 5: earnings stats ───────────────────────────────────────────────────

export const getUserReferralStats = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_telegramUserId", (q) =>
        q.eq("telegramUserId", args.telegramId),
      )
      .first();

    const affiliate = customer
      ? await ctx.db
          .query("affiliates")
          .withIndex("by_customerId", (q) => q.eq("customerId", customer._id))
          .first()
      : null;

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerTelegramId", (q) =>
        q.eq("referrerTelegramId", args.telegramId),
      )
      .order("desc")
      .collect();

    const paid = referrals.filter((r) => r.status === "paid");
    const pending = referrals.filter((r) => r.status === "pending");
    const totalReferredCount = referrals.length;

    return {
      referralCode: affiliate?.referralCode ?? null,
      totalReferredCount,
      // Kept for backward compatibility with older clients.
      referralCount: totalReferredCount,
      totalEarned: paid.reduce((s, r) => s + r.commissionAmount, 0),
      paidAmount: paid.reduce((s, r) => s + r.commissionAmount, 0),
      pendingAmount: pending.reduce((s, r) => s + r.commissionAmount, 0),
      recentReferrals: referrals.slice(0, 5).map((r) => ({
        referredTelegramId: r.referredTelegramId,
        status: r.status,
        createdAt: r.createdAt,
        commissionAmount: r.commissionAmount,
      })),
    };
  },
});

// ── PART 6: mark referral paid after purchase ────────────────────────────────

export const markReferralPaid = mutation({
  args: {
    referredTelegramId: v.number(),
    purchaseAmount: v.number(),
    orderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { referredTelegramId, purchaseAmount, orderId } = args;

    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_referredTelegramId", (q) =>
        q.eq("referredTelegramId", referredTelegramId),
      )
      .first();
    if (!referral) return false;
    if (referral.status === "paid") return false;

    const commission = Math.round(purchaseAmount * 0.05 * 100) / 100;

    await ctx.db.patch(referral._id, {
      status: "paid",
      commissionAmount: commission,
      purchaseOrderId: orderId,
    });

    // Increment referrer's earningsTotal on customers record
    const referrerCustomer = await ctx.db
      .query("customers")
      .withIndex("by_telegramUserId", (q) =>
        q.eq("telegramUserId", referral.referrerTelegramId),
      )
      .first();
    if (referrerCustomer) {
      await ctx.db.patch(referrerCustomer._id, {
        earningsTotal: (referrerCustomer.earningsTotal ?? 0) + commission,
      });
    }

    return true;
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Favorites table: stores a snapshot linking a user to a phone id.
  // Fields use camelCase to match TypeScript conventions.
  favorites: defineTable({
    userId: v.string(),
    phoneId: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  // Products table - searchable product catalog
  products: defineTable({
    // Core fields
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    images: v.optional(v.array(v.string())),
    // Metadata
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.string(), // active, draft, archived
    inStock: v.optional(v.boolean()),
    isFeatured: v.boolean(),
    isNewArrival: v.boolean(),
    isPopular: v.boolean(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["status", "category"],
    }),
  // Searches: records of user search terms for analytics and trending
  searches: defineTable({
    userId: v.optional(v.string()),
    term: v.string(),
    createdAt: v.number(),
  }).index("by_term", ["term"]),
  // Sessions for anonymous users
  sessions: defineTable({
    createdAt: v.number(),
  }),

  // Customer identities authenticated via Telegram Mini App initData
  customers: defineTable({
    telegramUserId: v.number(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_telegramUserId", ["telegramUserId"]),

  // Phone action requests (reserve / ask)
  phoneActions: defineTable({
    sessionId: v.string(),
    phoneId: v.string(),
    variantId: v.optional(v.string()),
    actionType: v.string(),
    createdAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  // Exchange requests submitted from miniapp
  exchangeRequests: defineTable({
    sessionId: v.string(),
    desiredPhoneId: v.string(),
    offeredModel: v.string(),
    offeredStorageGb: v.number(),
    offeredCondition: v.string(),
    offeredNotes: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_sessionId", ["sessionId"]),

  // Orders managed by admin
  orders: defineTable({
    sellerId: v.id("sellers"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerTelegramUserId: v.optional(v.string()),
    itemSummary: v.optional(v.string()),
    itemCount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // Exchanges managed by admin
  exchanges: defineTable({
    sellerId: v.id("sellers"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
    ),
    valuationNote: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerTelegramUserId: v.optional(v.string()),
    offeredDevice: v.optional(v.string()),
    requestedDevice: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_sellerId", ["sellerId"]),

  // Hot leads captured from bot / mini app
  hotLeads: defineTable({
    sellerId: v.id("sellers"),
    createdAt: v.number(),
    updatedAt: v.number(),
    source: v.union(v.literal("bot"), v.literal("miniapp"), v.literal("unknown")),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    telegramUserId: v.optional(v.string()),
    interestSummary: v.optional(v.string()),
    message: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("contacted")),
    adminNote: v.optional(v.string()),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_createdAt", ["sellerId", "createdAt"]),

  // Admin activity logs
  activityLogs: defineTable({
    sellerId: v.id("sellers"),
    createdAt: v.number(),
    actor: v.optional(v.string()),
    entityType: v.union(
      v.literal("product"),
      v.literal("order"),
      v.literal("exchange"),
      v.literal("hotLead"),
    ),
    entityId: v.string(),
    action: v.string(),
    summary: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_createdAt", ["sellerId", "createdAt"]),

  // Affiliates and commissions
  affiliates: defineTable({
    customerId: v.string(),
    referralCode: v.string(),
    createdAt: v.number(),
  }).index("by_customerId", ["customerId"]),

  affiliateCommissions: defineTable({
    affiliateId: v.string(),
    orderId: v.optional(v.string()),
    orderAmount: v.number(),
    commissionPercent: v.number(),
    commissionAmount: v.number(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_affiliateId", ["affiliateId"]),

  // Sellers (admin users)
  sellers: defineTable({
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
    isActive: v.boolean(),
    isVerified: v.optional(v.boolean()),
    role: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_telegramId", ["telegramId"]),

  // Admin sessions for authentication
  admin_sessions: defineTable({
    sellerId: v.id("sellers"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_sellerId", ["sellerId"]),
});

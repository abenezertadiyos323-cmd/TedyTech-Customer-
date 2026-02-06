import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Favorites table: stores a snapshot linking a user to a phone id.
  // Fields use camelCase to match TypeScript conventions.
  favorites: defineTable({
    userId: v.string(),
    phoneId: v.string(),
    createdAt: v.number(),
  }).index("by_userId", (t) => t.index("userId")),
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
    isFeatured: v.boolean(),
    isNewArrival: v.boolean(),
    isPopular: v.boolean(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_status", (t) => t.index("status"))
    .index("by_category", (t) => t.index("category"))
    .index("by_createdAt", (t) => t.index("createdAt"))
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["status", "category"],
    }),
  // Searches: records of user search terms for analytics and trending
  searches: defineTable({
    userId: v.optional(v.string()),
    term: v.string(),
    createdAt: v.number(),
  }).index("by_term", (t) => t.index("term")),
  // Sessions for anonymous users
  sessions: defineTable({
    createdAt: v.number(),
  }),

  // Phone action requests (reserve / ask)
  phoneActions: defineTable({
    sessionId: v.string(),
    phoneId: v.string(),
    variantId: v.optional(v.string()),
    actionType: v.string(),
    createdAt: v.number(),
  }).index("by_sessionId", (t) => t.index("sessionId")),

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
  }).index("by_sessionId", (t) => t.index("sessionId")),

  // Affiliates and commissions
  affiliates: defineTable({
    customerId: v.string(),
    referralCode: v.string(),
    createdAt: v.number(),
  }).index("by_customerId", (t) => t.index("customerId")),

  affiliateCommissions: defineTable({
    affiliateId: v.string(),
    orderId: v.optional(v.string()),
    orderAmount: v.number(),
    commissionPercent: v.number(),
    commissionAmount: v.number(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_affiliateId", (t) => t.index("affiliateId")),
});

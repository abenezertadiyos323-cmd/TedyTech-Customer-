/* eslint-disable */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================
// REUSABLE VALIDATORS
// ============================================

const timestampFields = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

const productAttributeValidator = v.object({
  key: v.string(),
  value: v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.array(v.string()),
    v.null()
  ),
  displayValue: v.optional(v.string()),
});

// ============================================
// MULTI-TENANT SCHEMA
// ============================================

export default defineSchema({
  // ------------------------------------------
  // SELLERS TABLE (Admin/Business accounts)
  // Primary identity: telegramId
  // ------------------------------------------
  sellers: defineTable({
    // Identity (Telegram-based)
    telegramId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),

    // Optional metadata
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Business Profile
    businessName: v.string(),
    businessType: v.string(), // "phone_seller", "general"
    businessDescription: v.optional(v.string()),

    // Contact
    location: v.optional(v.string()),

    // Settings
    currency: v.string(), // "ETB"
    language: v.string(), // "am" | "en"
    isActive: v.boolean(),

    // Role
    role: v.string(), // "admin", "manager", "staff"

    // Verification
    isVerified: v.boolean(),

    // Timestamps
    ...timestampFields,
  })
    .index("by_telegramId", ["telegramId"])
    .index("by_email", ["email"])
    .index("by_isActive", ["isActive"]),

  // ------------------------------------------
  // PRODUCTS TABLE (Multi-tenant)
  // ------------------------------------------
  products: defineTable({
    // Ownership (multi-tenant)
    sellerId: v.id("sellers"),

    // Core Fields
    name: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),

    // Pricing
    price: v.number(),
    compareAtPrice: v.optional(v.number()), // Old price for "was X, now Y"
    currency: v.string(),

    // Media
    images: v.array(v.string()), // URLs

    // Inventory
    stock: v.number(),
    trackInventory: v.boolean(),

    // Status
    status: v.string(), // "active", "draft", "out_of_stock", "archived"

    // Categorization
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // Flexible Attributes (business type specific)
    attributes: v.optional(v.array(productAttributeValidator)),

    // Visibility
    isFeatured: v.boolean(),
    isNewArrival: v.boolean(),
    isPopular: v.boolean(),

    // Timestamps
    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_status", ["sellerId", "status"])
    .index("by_sellerId_category", ["sellerId", "category"])
    .index("by_sellerId_isFeatured", ["sellerId", "isFeatured"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["sellerId", "status"],
    }),

  // ------------------------------------------
  // CATEGORIES TABLE (Multi-tenant)
  // ------------------------------------------
  categories: defineTable({
    sellerId: v.id("sellers"),

    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),

    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
    isActive: v.boolean(),

    productCount: v.optional(v.number()),

    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_slug", ["sellerId", "slug"])
    .index("by_sellerId_isActive", ["sellerId", "isActive"]),

  // ------------------------------------------
  // CUSTOMERS TABLE (Telegram users per seller)
  // ------------------------------------------
  customers: defineTable({
    // Identity (Telegram-based)
    telegramId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),

    // Seller Relationship (multi-tenant)
    sellerId: v.id("sellers"),

    // Engagement
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),

    // Timestamps
    ...timestampFields,
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_sellerId_telegramId", ["sellerId", "telegramId"])
    .index("by_telegramId", ["telegramId"]),

  // ------------------------------------------
  // ADMIN_SESSIONS TABLE (Custom Convex-based auth)
  // ------------------------------------------
  admin_sessions: defineTable({
    sellerId: v.id("sellers"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_sellerId", ["sellerId"]),
});

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Product queries - Accessible by both admin and customer apps
 * Multi-tenant: Always filter by sellerId
 */

export const listProducts = query({
  args: {
    sellerId: v.id("sellers"),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    isNewArrival: v.optional(v.boolean()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Start with sellerId and status filter using index
    let queryBuilder = ctx.db
      .query("products")
      .withIndex("by_sellerId_status", (q) =>
        q.eq("sellerId", args.sellerId).eq("status", args.status || "active")
      );

    let products = await queryBuilder.collect();

    // Apply additional filters
    if (args.category !== undefined) {
      products = products.filter((p) => p.category === args.category);
    }

    if (args.minPrice !== undefined) {
      products = products.filter((p) => p.price >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= args.maxPrice!);
    }

    if (args.isFeatured !== undefined) {
      products = products.filter((p) => p.isFeatured === args.isFeatured);
    }

    if (args.isNewArrival !== undefined) {
      products = products.filter((p) => p.isNewArrival === args.isNewArrival);
    }

    if (args.isPopular !== undefined) {
      products = products.filter((p) => p.isPopular === args.isPopular);
    }

    return products;
  },
});

export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    return product;
  },
});

export const getFeaturedProducts = query({
  args: { sellerId: v.id("sellers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_sellerId_isFeatured", (q) =>
        q.eq("sellerId", args.sellerId).eq("isFeatured", true)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const searchProducts = query({
  args: {
    sellerId: v.id("sellers"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) =>
        q
          .search("name", args.searchQuery)
          .eq("sellerId", args.sellerId)
          .eq("status", "active")
      )
      .collect();
  },
});

export const getProductsByCategory = query({
  args: {
    sellerId: v.id("sellers"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_sellerId_category", (q) =>
        q.eq("sellerId", args.sellerId).eq("category", args.category)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const getTotalProductsCount = query({
  args: { sellerId: v.id("sellers") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .collect();

    return products.length;
  },
});

export const getActiveProductsCount = query({
  args: { sellerId: v.id("sellers") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId_status", (q) =>
        q.eq("sellerId", args.sellerId).eq("status", "active")
      )
      .collect();

    return products.length;
  },
});

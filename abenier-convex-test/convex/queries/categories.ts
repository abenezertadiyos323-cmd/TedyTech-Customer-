import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Category queries - Accessible by both admin and customer apps
 * Multi-tenant: Always filter by sellerId
 */

export const listCategories = query({
  args: {
    sellerId: v.id("sellers"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db
      .query("categories")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId));

    let categories = await queryBuilder.collect();

    // Filter by isActive if provided
    if (args.isActive !== undefined) {
      categories = categories.filter((c) => c.isActive === args.isActive);
    }

    // Sort by sortOrder
    categories.sort((a, b) => a.sortOrder - b.sortOrder);

    return categories;
  },
});

export const getCategoryBySlug = query({
  args: {
    sellerId: v.id("sellers"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_sellerId_slug", (q) =>
        q.eq("sellerId", args.sellerId).eq("slug", args.slug)
      )
      .first();

    return category;
  },
});

export const getCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.categoryId);
    return category;
  },
});

export const getCategoriesWithProductCount = query({
  args: { sellerId: v.id("sellers") },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sellerId_isActive", (q) =>
        q.eq("sellerId", args.sellerId).eq("isActive", true)
      )
      .collect();

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const products = await ctx.db
          .query("products")
          .withIndex("by_sellerId_category", (q) =>
            q.eq("sellerId", args.sellerId).eq("category", category.slug)
          )
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        return {
          ...category,
          productCount: products.length,
        };
      })
    );

    // Sort by sortOrder
    categoriesWithCounts.sort((a, b) => a.sortOrder - b.sortOrder);

    return categoriesWithCounts;
  },
});

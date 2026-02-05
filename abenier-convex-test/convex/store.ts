import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const listProducts = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query("products");

    if (args.isActive !== undefined) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("isActive"), args.isActive),
      );
    }

    return await queryBuilder.collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      createdAt: Date.now(),
    });
    return categoryId;
  },
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    images: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      price: args.price,
      categoryId: args.categoryId,
      images: args.images,
      isActive: args.isActive,
      createdAt: Date.now(),
    });
    return productId;
  },
});

// Server-side count helpers for admin dashboard
export const totalPhonesCount = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const phonesCategory = categories.find((c: any) => c.slug === "phones");
    if (!phonesCategory) return 0;
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("categoryId"), phonesCategory._id))
      .collect();
    return products.length;
  },
});

export const accessoriesCount = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const phonesCategory = categories.find((c: any) => c.slug === "phones");
    const phonesCategoryId = phonesCategory?._id;
    const products = await ctx.db.query("products").collect();
    const accessories = products.filter(
      (p: any) => p.isActive && p.categoryId !== phonesCategoryId,
    );
    return accessories.length;
  },
});

export const activeDepositsCount = query({
  handler: async (ctx) => {
    const deposits = await ctx.db
      .query("deposit_holds")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending_receipt"),
          q.eq(q.field("status"), "active"),
        ),
      )
      .collect();
    return deposits.length;
  },
});

export const newExchangeCount = query({
  handler: async (ctx) => {
    const exchanges = await ctx.db
      .query("exchange_requests")
      .filter((q) => q.eq(q.field("status"), "new"))
      .collect();
    return exchanges.length;
  },
});

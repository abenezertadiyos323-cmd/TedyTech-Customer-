import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireOwnership } from "../lib/auth/adminAuth";

/**
 * Category mutations - Admin-only
 * Multi-tenant: Requires admin authentication and ownership verification
 */

export const createCategory = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Check if slug already exists for this seller
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_sellerId_slug", (q) =>
        q.eq("sellerId", sellerId).eq("slug", args.slug)
      )
      .first();

    if (existing) {
      throw new Error("Category with this slug already exists");
    }

    // If parentId is provided, verify ownership
    if (args.parentId) {
      await requireOwnership(ctx, args.parentId, sellerId);
    }

    const now = Date.now();
    const categoryId = await ctx.db.insert("categories", {
      sellerId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      imageUrl: args.imageUrl,
      parentId: args.parentId,
      sortOrder: args.sortOrder || 0,
      isActive: args.isActive !== undefined ? args.isActive : true,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

export const updateCategory = mutation({
  args: {
    token: v.string(),
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Verify ownership
    await requireOwnership(ctx, args.categoryId, sellerId);

    // If slug is being updated, check for conflicts
    if (args.slug !== undefined) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_sellerId_slug", (q) =>
          q.eq("sellerId", sellerId).eq("slug", args.slug)
        )
        .first();

      if (existing && existing._id !== args.categoryId) {
        throw new Error("Category with this slug already exists");
      }
    }

    // If parentId is provided, verify ownership
    if (args.parentId) {
      await requireOwnership(ctx, args.parentId, sellerId);
    }

    // Build update object
    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
    if (args.parentId !== undefined) updates.parentId = args.parentId;
    if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.categoryId, updates);

    return args.categoryId;
  },
});

export const deleteCategory = mutation({
  args: {
    token: v.string(),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Verify ownership
    const category = await requireOwnership(ctx, args.categoryId, sellerId);

    // Check if any products are using this category
    const products = await ctx.db
      .query("products")
      .withIndex("by_sellerId_category", (q) =>
        q.eq("sellerId", sellerId).eq("category", category.slug)
      )
      .collect();

    if (products.length > 0) {
      throw new Error(
        "Cannot delete category with associated products. Please reassign or delete products first."
      );
    }

    // Check if any child categories exist
    const children = await ctx.db
      .query("categories")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", sellerId))
      .filter((q) => q.eq(q.field("parentId"), args.categoryId))
      .collect();

    if (children.length > 0) {
      throw new Error(
        "Cannot delete category with child categories. Please delete or reassign child categories first."
      );
    }

    await ctx.db.delete(args.categoryId);

    return { success: true };
  },
});

export const reorderCategories = mutation({
  args: {
    token: v.string(),
    categoryOrders: v.array(
      v.object({
        categoryId: v.id("categories"),
        sortOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Update sort order for each category
    for (const item of args.categoryOrders) {
      // Verify ownership
      await requireOwnership(ctx, item.categoryId, sellerId);

      await ctx.db.patch(item.categoryId, {
        sortOrder: item.sortOrder,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

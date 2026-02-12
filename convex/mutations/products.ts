import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireOwnership } from "../lib/auth/adminAuth";
import { productAttributeArrayValidator } from "../lib/validators";

/**
 * Product mutations - Admin-only
 * Multi-tenant: Requires admin authentication and ownership verification
 */

export const createProduct = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    description: v.string(),
    shortDescription: v.optional(v.string()),
    price: v.number(),
    compareAtPrice: v.optional(v.number()),
    stock: v.number(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    images: v.array(v.string()),
    attributes: v.optional(productAttributeArrayValidator),
    isFeatured: v.optional(v.boolean()),
    isNewArrival: v.optional(v.boolean()),
    isPopular: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    const now = Date.now();
    const productId = await ctx.db.insert("products", {
      sellerId,
      name: args.name,
      description: args.description,
      shortDescription: args.shortDescription,
      price: args.price,
      compareAtPrice: args.compareAtPrice,
      currency: "ETB",
      stock: args.stock,
      category: args.category,
      tags: args.tags,
      images: args.images,
      attributes: args.attributes,
      status: args.status || "active",
      trackInventory: true,
      isFeatured: args.isFeatured || false,
      isNewArrival: args.isNewArrival !== undefined ? args.isNewArrival : true,
      isPopular: args.isPopular || false,
      createdAt: now,
      updatedAt: now,
    });

    return productId;
  },
});

export const updateProduct = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    price: v.optional(v.number()),
    compareAtPrice: v.optional(v.number()),
    stock: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    attributes: v.optional(productAttributeArrayValidator),
    isFeatured: v.optional(v.boolean()),
    isNewArrival: v.optional(v.boolean()),
    isPopular: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Verify ownership
    await requireOwnership(ctx, args.productId, sellerId);

    // Build update object (only include provided fields)
    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.shortDescription !== undefined)
      updates.shortDescription = args.shortDescription;
    if (args.price !== undefined) updates.price = args.price;
    if (args.compareAtPrice !== undefined)
      updates.compareAtPrice = args.compareAtPrice;
    if (args.stock !== undefined) updates.stock = args.stock;
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.images !== undefined) updates.images = args.images;
    if (args.attributes !== undefined) updates.attributes = args.attributes;
    if (args.isFeatured !== undefined) updates.isFeatured = args.isFeatured;
    if (args.isNewArrival !== undefined)
      updates.isNewArrival = args.isNewArrival;
    if (args.isPopular !== undefined) updates.isPopular = args.isPopular;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.productId, updates);

    return args.productId;
  },
});

export const updateProductStatus = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Verify ownership
    await requireOwnership(ctx, args.productId, sellerId);

    await ctx.db.patch(args.productId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.productId;
  },
});

export const deleteProduct = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Verify ownership
    await requireOwnership(ctx, args.productId, sellerId);

    await ctx.db.delete(args.productId);

    return { success: true };
  },
});

export const updateProductStock = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify admin authentication
    const { sellerId } = await requireAdmin(ctx, args.token);

    // Verify ownership
    const product = await requireOwnership(ctx, args.productId, sellerId);

    // Update stock and status if needed
    const newStatus =
      args.stock === 0 ? "out_of_stock" : product.status === "out_of_stock" ? "active" : product.status;

    await ctx.db.patch(args.productId, {
      stock: args.stock,
      status: newStatus,
      updatedAt: Date.now(),
    });

    return args.productId;
  },
});
